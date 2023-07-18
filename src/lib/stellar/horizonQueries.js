import { error } from '@sveltejs/kit'
import { Server, TransactionBuilder, Networks, StrKey, Asset } from 'stellar-sdk'

const horizonUrl = 'https://horizon-testnet.stellar.org'
const server = new Server(horizonUrl)

/** @module $lib/stellar/horizonQueries */
/** @typedef {import('stellar-sdk').ServerApi.AccountRecord} AccountRecord */
/** @typedef {import('stellar-sdk').ServerApi.PaymentOperationRecord} PaymentOperationRecord */
/** @typedef {import('stellar-sdk').Horizon.BalanceLine} BalanceLine */
/** @typedef {import('stellar-sdk').Horizon.BalanceLineAsset} BalanceLineAsset */
/** @typedef {import('stellar-sdk').Transaction} Transaction */
/** @typedef {import('stellar-sdk').ServerApi.PaymentPathRecord} PaymentPathRecord */

/**
 * Fetches and returns details about an account on the Stellar network.
 * @param {string} publicKey Public Stellar address to query information about
 * @returns {Promise<AccountRecord>} Object containing whether or not the account is funded, and (if it is) account details
 * @throws {error} Will throw an error if the account is not funded on the Stellar network.
 */
export async function fetchAccount(publicKey) {
    if (StrKey.isValidEd25519PublicKey(publicKey)) {
        try {
            let account = await server.accounts().accountId(publicKey).call()
            return account
        } catch (err) {
            if (err.response?.status === 404) {
                throw error(404, 'account not funded on network')
            } else {
                throw error(
                    err.response?.status ?? 400,
                    `${err.response?.title} - ${err.response?.detail}`
                )
            }
        }
    } else {
        throw error(400, { message: 'invalid public key' })
    }
}

/**
 * Fetches and returns balance details for an account on the Stellar network.
 * @param {string} publicKey Public Stellar address holding balances to query
 * @returns {Promise<BalanceLine[]>} Array containing balance information for each asset the account holds
 */
export async function fetchAccountBalances(publicKey) {
    const { balances } = await fetchAccount(publicKey)
    return balances
}

/**
 * Fetches and returns recent `payment`, `createAccount` operations that had an effect on this account.
 * @param {string} publicKey Public Stellar address to query recent payment operations to/from
 * @param {number} limit Number of operations to request from the server
 * @returns {Promise<PaymentOperationRecord[]>} Array containing details for each recent payment
 */
export async function fetchRecentPayments(publicKey, limit = 10) {
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
 * @param {string} publicKey Public Stellar address which should be funded using the Testnet Friendbot
 */
export async function fundWithFriendbot(publicKey) {
    console.log(`i am requesting a friendbot funding for ${publicKey}`)
    await server.friendbot(publicKey).call()
}

/**
 * Begin a transaction with typical settings
 * @param {string} sourcePublicKey Public Stellar address which will be the source account for the created transaction
 * @returns {Promise<TransactionBuilder>}
 */
export async function startTransaction(sourcePublicKey) {
    let source = await server.loadAccount(sourcePublicKey)
    const transaction = new TransactionBuilder(source, {
        networkPassphrase: Networks.TESTNET,
        fee: '100000',
    })

    return transaction
}

/**
 * Submits a Stellar transaction to the network for inclusion in the ledger.
 * @param {Transaction} transaction - Built transaction to submit to the network
 * @throws - Will throw an error if the transaction is not submitted successfully.
 */
export async function submit(transaction) {
    try {
        await server.submitTransaction(transaction)
    } catch (err) {
        throw error(400, {
            message: err.response.data.title,
            result_codes: err.response.data.extras.result_codes,
        })
    }
}

/**
 * Fetches `home_domain` from asset issuer accounts on the Stellar network and returns an array of balances
 * @param {BalanceLine[]} balances Array of balances to query issuer accounts of
 * @returns {Promise<BalanceLine[]>} Array of balance details for assets that do have a `home_domain` setting
 */
export async function fetchAssetsWithHomeDomains(balances) {
    let homeDomains = await Promise.all(
        balances.map(async (asset) => {
            if (asset.asset_type !== 'native') {
                let account = await fetchAccount(asset.asset_issuer)
                if ('home_domain' in account) {
                    return {
                        ...asset,
                        home_domain: account.home_domain,
                    }
                }
            }
        })
    )

    return homeDomains.filter((balance) => balance)
}

/**
 * Fetches available paths on the Stellar network betweeen the destination account, and the asset sent by the source account.
 * @param {Object} opts Options object
 * @param {string} opts.sourceAsset Stellar asset which will be sent from the source account
 * @param {string|number} opts.sourceAmount Amount of the Stellar asset that should be debited from the srouce account
 * @param {string} opts.destinationPublicKey Public Stellar address that will receive the destination asset
 * @returns {Promise<PaymentPathRecord[]>} Array of payment paths that can be selected for the transaction
 * @throws Will throw an error if there is a problem fetching payment paths.
 */
export async function findStrictSendPaths({ sourceAsset, sourceAmount, destinationPublicKey }) {
    try {
        let asset = new Asset(sourceAsset.split(':')[0], sourceAsset.split(':')[1])
        let response = await server
            .strictSendPaths(asset, sourceAmount.toString(), destinationPublicKey)
            .call()
        console.log('here are the paths', response)
        return response.records
    } catch (err) {
        console.error('error finding strictSend payment paths', err)
        throw error(400, err)
    }
}

/**
 * Fetches available paths on the Stellar network between the source account, and the asset to be received by the destination.
 * @param {Object} opts Options object
 * @param {string} opts.sourcePublicKey Public Stellar address that will be the source of the payment operation
 * @param {string} opts.destinationAsset Stellar asset which should be received in the destination account
 * @param {string|number} opts.destinationAmount Amount of the Stellar asset that should be credited to the destination account
 * @returns {Promise<PaymentPathRecord[]>} Array of payment paths that can be selected for the transaction
 * @throws Will throw an error if there is a problem fetching payment paths.
 */
export async function findStrictReceivePaths({
    sourcePublicKey,
    destinationAsset,
    destinationAmount,
}) {
    try {
        let asset = new Asset(destinationAsset.split(':')[0], destinationAsset.split(':')[1])
        let response = await server
            .strictReceivePaths(sourcePublicKey, asset, destinationAmount.toString())
            .call()
        console.log('here are the strict receive paths', response)
        return response.records
    } catch (err) {
        console.error('error finding strictReceive payment paths', err)
        throw error(400, err)
    }
}
