import { getTransferServerSep24 } from '$lib/stellar/sep1'
import { error } from '@sveltejs/kit'

/** @module $lib/stellar/sep24 */

/**
 * Fetches and returns basic information about what the SEP-24 transfer server supports.
 * @param {string} domain Domain to get the SEP-24 info for
 * @returns {Promise<Object>} SEP-24 info published by the domain
 */
export async function getSep24Info(domain) {
    let transferServerSep24 = await getTransferServerSep24(domain)

    let res = await fetch(`${transferServerSep24}/info`)
    let json = await res.json()

    return json
}

/**
 * Initiates a transfer using the SEP-24 protocol.
 * @param {Object} opts Options object
 * @param {string} opts.authToken Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {('deposit'|'withdraw')} opts.endpoint URL endpoint to be requested, also indicates which direction the transfer is moving (e.g., `deposit` or `withdraw`)
 * @param {string} opts.homeDomain Domain of the anchor that is handling the transfer
 * @param {Object} [opts.urlFields] urlFields that do... something? (I'll have to remember this soon.)
 */
export async function initiateTransfer24({ authToken, endpoint, homeDomain, urlFields = {} }) {
    let transferServerSep24 = await getTransferServerSep24(homeDomain)

    let res = await fetch(`${transferServerSep24}/transactions/${endpoint}/interactive`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(urlFields),
    })
    let json = await res.json()

    return json
}

/**
 * Queries and returns information about all SEP-24 transfers for a given address and asset.
 * @param {Object} opts Options object
 * @param {string} opts.authToken Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} opts.assetCode Asset code returned transfers must include\
 * @param {string} opts.homeDomain Domain of the anchor to query for transfer records
 * @returns {Promise<Object>} JSON response from the server
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function queryTransfers24({ authToken, assetCode, homeDomain }) {
    let transferServerSep24 = await getTransferServerSep24(homeDomain)

    let res = await fetch(
        `${transferServerSep24}/transactions?${new URLSearchParams({
            asset_code: assetCode,
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
    if (!res.ok) {
        throw error(res.status, {
            message: json.error,
        })
    } else {
        return json
    }
}
