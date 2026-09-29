import { error } from '@sveltejs/kit'
import {
    TransactionBuilder,
    Networks,
    StrKey,
    Asset,
    Horizon,
    type NetworkError,
    type Transaction,
} from '@stellar/stellar-sdk'

const horizonUrl = 'https://horizon-testnet.stellar.org'
export const server = new Horizon.Server(horizonUrl)

/**
 * @module $lib/stellar/horizonQueries
 * @description A collection of function that helps query various information
 * from the [Horizon
 * API](https://developers.stellar.org/docs/data/apis/horizon). This allows us
 * to abstract and simplify some interactions so we don't have to have
 * _everything_ contained within our `*.svelte` files.
 */

// We'll import some type definitions that already exists within the
// `@stellar/stellar-sdk` package, so our functions will know what to expect.
type BalanceLine = Horizon.HorizonApi.BalanceLine
type BalanceLineAsset = Horizon.HorizonApi.BalanceLineAsset

/**
 * Fetches and returns details about an account on the Stellar network.
 * @async
 * @function fetchAccount
 * @param {string} publicKey Public Stellar address to query information about
 * @returns {Promise<AccountRecord>} Object containing whether or not the account is funded, and (if it is) account details
 * @throws {error} Will throw an error if the account is not funded on the Stellar network, or if an invalid public key was provided.
 */
export async function fetchAccount(publicKey: string) {
    if (StrKey.isValidEd25519PublicKey(publicKey)) {
        try {
            const account = await server.accounts().accountId(publicKey).call()
            return account
        } catch (err) {
            // When Horizon can't find the account, the SDK puts Horizon's error
            // details (`status`, `title`, and `detail`) in `err.response`
            const problem = (
                err as { response?: { status?: number; title?: string; detail?: string } }
            ).response
            // A 404 here means the account isn't funded yet. We pass the status
            // along, so the send page can offer a `createAccount` operation.
            throw error(problem?.status ?? 400, {
                message: `${problem?.title} - ${problem?.detail}`,
            })
        }
    } else {
        throw error(400, { message: 'invalid public key' })
    }
}

/**
 * Fetches and returns balance details for an account on the Stellar network.
 * @async
 * @function fetchAccountBalances
 * @param {string} publicKey Public Stellar address holding balances to query
 * @returns {Promise<BalanceLine[]>} Array containing balance information for each asset the account holds
 */
export async function fetchAccountBalances(publicKey: string) {
    const { balances } = await fetchAccount(publicKey)
    return balances
}

/**
 * Fetches and returns recent `payment`, `createAccount` operations that had an effect on this account.
 * @async
 * @function fetchRecentPayments
 * @param {string} publicKey Public Stellar address to query recent payment operations to/from
 * @param {number} [limit] Number of operations to request from the server
 * @returns {Promise<PaymentOperationRecord[]>} Array containing details for each recent payment
 */
export async function fetchRecentPayments(publicKey: string, limit = 10) {
    const { records } = await server
        .payments()
        .forAccount(publicKey)
        .limit(limit)
        .order('desc')
        .call()
    return records
}

/**
 * Fund an account using the Friendbot utility on the Testnet.
 * @async
 * @function fundWithFriendbot
 * @param {string} publicKey Public Stellar address which should be funded using the Testnet Friendbot
 */
export async function fundWithFriendbot(publicKey: string) {
    console.log(`i am requesting a friendbot funding for ${publicKey}`)
    await server.friendbot(publicKey).call()
}

/**
 * Begin a transaction with typical settings
 * @async
 * @function startTransaction
 * @param {string} sourcePublicKey Public Stellar address which will be the source account for the created transaction
 * @returns {Promise<TransactionBuilder>}
 */
export async function startTransaction(sourcePublicKey: string) {
    const source = await server.loadAccount(sourcePublicKey)
    const transaction = new TransactionBuilder(source, {
        networkPassphrase: Networks.TESTNET,
        fee: '100000',
    })

    return transaction
}

/**
 * Submits a Stellar transaction to the network for inclusion in the ledger.
 * @async
 * @function submit
 * @param {Transaction} transaction Built transaction to submit to the network
 * @throws Will throw an error if the transaction is not submitted successfully.
 */
export async function submit(transaction: Transaction) {
    try {
        await server.submitTransaction(transaction)
    } catch (err) {
        // Horizon's response body lives in `err.response.data`, and failed
        // transactions include result codes explaining what went wrong
        const { response, message } = err as NetworkError
        const data = response?.data
        if (data && 'extras' in data) {
            const codes = data.extras.result_codes
            throw error(400, {
                message: `${data.title} - ${[codes.transaction, ...(codes.operations ?? [])].join(', ')}`,
            })
        }
        throw error(400, { message: message })
    }
}

interface HomeDomainObject {
    home_domain: string
}

/** A trusted asset's balance, along with the home domain of the anchor that handles its transfers */
export type HomeDomainBalanceLine = BalanceLineAsset & HomeDomainObject

/**
 * Fetches `home_domain` from asset issuer accounts on the Stellar network and returns an array of balances.
 * @async
 * @function fetchAssetsWithHomeDomains
 * @param balances Array of balances to query issuer accounts of
 * @returns Array of balance details for assets that do have a `home_domain` setting
 */
export async function fetchAssetsWithHomeDomains(
    balances: BalanceLine[],
): Promise<HomeDomainBalanceLine[]> {
    const homeDomains = await Promise.all(
        balances.map(async (asset) => {
            // We are only interested in issued assets (i.e., not LPs and not XLM)
            if ('asset_issuer' in asset) {
                // Fetch the issuer's account from the network, and add its
                // `home_domain` (if it has one) to the balance details
                const account = await fetchAccount(asset.asset_issuer)
                if (account.home_domain) {
                    return {
                        ...asset,
                        home_domain: account.home_domain,
                    }
                }
            }
            return undefined
        }),
    )

    // Filter out the balances we skipped (the `undefined` entries)
    return homeDomains.filter((balance): balance is HomeDomainBalanceLine => balance !== undefined)
}

/**
 * Fetches available paths on the Stellar network between the destination account, and the asset sent by the source account.
 * @async
 * @function findStrictSendPaths
 * @param {Object} opts Options object
 * @param {string} opts.sourceAsset Stellar asset which will be sent from the source account
 * @param {string|number} opts.sourceAmount Amount of the Stellar asset that should be debited from the srouce account
 * @param {string} opts.destinationPublicKey Public Stellar address that will receive the destination asset
 * @returns {Promise<PaymentPathRecord[]>} Array of payment paths that can be selected for the transaction
 * @throws Will throw an error if there are no available payment paths.
 */
export async function findStrictSendPaths({
    sourceAsset,
    sourceAmount,
    destinationPublicKey,
}: {
    sourceAsset: string
    sourceAmount: string | number
    destinationPublicKey: string
}) {
    const asset =
        sourceAsset === 'native'
            ? Asset.native()
            : new Asset(sourceAsset.split(':')[0], sourceAsset.split(':')[1])
    const response = await server
        .strictSendPaths(asset, sourceAmount.toString(), destinationPublicKey)
        .call()
    if (response.records.length > 0) {
        return response.records
    } else {
        throw error(400, { message: 'no strict send paths available' })
    }
}

/**
 * Fetches available paths on the Stellar network between the source account, and the asset to be received by the destination.
 * @async
 * @function findStrictReceivePaths
 * @param {Object} opts Options object
 * @param {string} opts.sourcePublicKey Public Stellar address that will be the source of the payment operation
 * @param {string} opts.destinationAsset Stellar asset which should be received in the destination account
 * @param {string|number} opts.destinationAmount Amount of the Stellar asset that should be credited to the destination account
 * @returns {Promise<PaymentPathRecord[]>} Array of payment paths that can be selected for the transaction
 * @throws Will throw an error if there are no available payment paths.
 */
export async function findStrictReceivePaths({
    sourcePublicKey,
    destinationAsset,
    destinationAmount,
}: {
    sourcePublicKey: string
    destinationAsset: string
    destinationAmount: string | number
}) {
    const asset =
        destinationAsset === 'native'
            ? Asset.native()
            : new Asset(destinationAsset.split(':')[0], destinationAsset.split(':')[1])
    const response = await server
        .strictReceivePaths(sourcePublicKey, asset, destinationAmount.toString())
        .call()
    if (response.records.length > 0) {
        return response.records
    } else {
        throw error(400, { message: 'no strict receive paths available' })
    }
}
