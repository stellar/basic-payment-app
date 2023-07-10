import { error } from '@sveltejs/kit'
import { Server } from 'stellar-sdk'

const server = new Server('https://horizon-testnet.stellar.org')

/** @module $lib/stellar/horizonQueries */
/** @typedef {import('stellar-sdk').ServerApi.AccountRecord} AccountRecord */
/** @typedef {import('stellar-sdk').Horizon.BalanceLine} BalanceLine */

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
            // @ts-ignore
            throw error(err.response?.status ?? 400, `${err.response?.title} - ${err.response?.detail}`
            )
        }
    }
}

/**
 * Fetches and returns balance details for an account on the Stellar network.
 * @param {string} publicKey - Public Stellar address holding balances to query
 * @returns {Promise<Array.<BalanceLine>>} - Object containing balance information for each asset the account holds
 */
export async function getAccountBalances(publicKey) {
    const { balances } = await fetchAccount(publicKey)
    return balances
}
