import { error } from '@sveltejs/kit'
import { Server, TransactionBuilder, Networks } from 'stellar-sdk'

const server = new Server('https://horizon-testnet.stellar.org')

/** @module $lib/stellar/horizonQueries */
/** @typedef {import('stellar-sdk').ServerApi.AccountRecord} AccountRecord */
/** @typedef {import('stellar-sdk').ServerApi.PaymentOperationRecord} PaymentOperationRecord */
/** @typedef {import('stellar-sdk').Horizon.BalanceLine} BalanceLine */
/** @typedef {import('stellar-sdk').Transaction} Transaction */

/**
 * Fetches and returns details about an account on the Stellar network.
 * @param {string} publicKey - Public Stellar address to query information about
 * @returns {Promise<AccountRecord>} - Object containing whether or not the account is funded, and (if it is) account details
 * @throws {error} Will throw an error if the account is not funded on the Stellar network.
 */
export async function fetchAccount(publicKey) {
    try {
        let account = await server.accounts().accountId(publicKey).call()
        return account
    } catch (err) {
        // @ts-ignore
        if (err.response?.status === 404) {
            throw error(404, 'account not funded on network')
        } else {
            throw error(
                // @ts-ignore
                err.response?.status ?? 400,
                // @ts-ignore
                `${err.response?.title} - ${err.response?.detail}`
            )
        }
    }
}

/**
 * Fetches and returns balance details for an account on the Stellar network.
 * @param {string} publicKey - Public Stellar address holding balances to query
 * @returns {Promise<Array.<BalanceLine>>} - Array containing balance information for each asset the account holds
 */
export async function fetchAccountBalances(publicKey) {
    const { balances } = await fetchAccount(publicKey)
    return balances
}

/**
 * Fetches and returns recent `payment`, `createAccount` operations that had an effect on this account.
 * @param {string} publicKey - Public Stellar address to query recent payment operations to/from
 * @param {number} limit - Number of operations to request from the server
 * @returns {Promise<PaymentOperationRecord[]>} - Array containing details for each recent payment
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
 * @param {string} publicKey - Public Stellar address which should be funded using the Testnet Friendbot
 */
export async function fundWithFriendbot(publicKey) {
    await server.friendbot(publicKey).call()
}

/**
 * Begin a transaction with typical settings
 * @param {string} sourcePublicKey - Public Stellar address which will be the source account for the created transaction
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
            result_codes: err.response.data.extras.result_codes
        })
    }
}
