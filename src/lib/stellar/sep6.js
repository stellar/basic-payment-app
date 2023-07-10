import { getTransferServerSep6 } from "$lib/stellar/sep1"

/** @module $lib/stellar/sep6 */

/**
 * Fetches and returns basic information about what the transfer server suppports.
 * @param {string} domain - Domain to get the SEP-6 info for
 * @returns {Promise<Object>} - SEP-6 info published by the domain
 */
export async function getSep6Info(domain) {
    let transferServer = await getTransferServerSep6(domain)

    let res = await fetch(`${transferServer}/info`)
    let json = await res.json()
    return json
}

/**
 * Initiates a transfer using the SEP-6 protocol.
 * @param {string} authToken - Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} endpoint - URL endpoint to be requested, also indicates which direction the transfer is moving
 * @param {Object} formData - Big ol' object that should be done better, but it's pretty much ALL the
 * @param {string} domain - Domain of the anchor that is handling the transfer
 * @returns {Promise<Object>} - JSON response from the server
 */
export async function initiateTransfer6(
    authToken,
    endpoint,
    formData,
    domain
) {
    let transferServer = await getTransferServerSep6(domain)

    let searchParams = new URLSearchParams(formData)

    let res = await fetch(`${transferServer}/${endpoint}?${searchParams}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    })

    let json = await res.json()
    return json
}

/**
 * Queries and returns information about an individual transfer.
 * @param {Object} opts - Options object
 * @param {string} opts.authToken - Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} opts.transferId - Unique ID of the transfer we want to know more about
 * @param {string} opts.domain - Domain of the anchor to query for transfer details
 * @returns {Promise<Object>} - JSON object with information about the transfer
 */
export async function getTransferStatus6(opts) {
    let transferServer = await getTransferServerSep6(opts.domain)

    let res = await fetch(
        `${transferServer}/transaction?${new URLSearchParams({
            id: opts.transferId,
        })}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${opts.authToken}`,
            },
        }
    )

    let { transaction } = await res.json()
    return transaction
}

/**
 * Queries and returns information about all transfers for a given address and asset.
 * @param {string} authToken - Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} assetCode - Asset code returned transfers must include
 * @param {string} publicKey - Public Stellar address of the account which initiated the transfers
 * @param {string} domain - Domain of the anchor to query for transfer records
 * @returns {Promise<Object>} - JSON response from the server
 */
export async function queryTransfers6(
    authToken,
    assetCode,
    publicKey,
    domain
) {
    let transferServer = await getTransferServerSep6(domain)

    let res = await fetch(
        `${transferServer}/transactions?${new URLSearchParams({
            asset_code: assetCode,
            account: publicKey,
        })}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
        }
    )
    let json = await res.json()
    return json
}
