import { getTransferServerSep6 } from '$lib/stellar/sep1'
import { error } from '@sveltejs/kit'

/**
 * @module $lib/stellar/sep6
 * @description A collection of functions that make it easier to work with SEP-6
 * transfer servers. These transfers are intended to be _programmatic_, meaning
 * the user never has to directly interact with the anchor server. Everything is
 * done inside our own BasicPay application.
 */

/**
 * Fetches and returns basic information about what the SEP-6 transfer server suppports.
 * @async
 * @function getSep6Info
 * @param {string} domain Domain to get the SEP-6 info for
 * @returns {Promise<Object>} SEP-6 info published by the domain
 */
export async function getSep6Info(domain) {
    let transferServer = await getTransferServerSep6(domain)
    let res = await fetch(`${transferServer}/info`)
    let json = await res.json()
    return json
}

/**
 * Initiates a transfer using the SEP-6 protocol.
 * @async
 * @function initiateTransfer6
 * @param {Object} opts Options object
 * @param {string} opts.authToken Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} opts.endpoint URL endpoint to be requested, also indicates which direction the transfer is moving
 * @param {Object<string,string>} opts.formData Big ol' object that should be done better, but it's pretty much ALL the information we gather from the user
 * @param {string} opts.domain Domain of the anchor that is handling the transfer
 * @returns {Promise<Object>} JSON response from the server
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function initiateTransfer6({ authToken, endpoint, formData, domain }) {
    let transferServer = await getTransferServerSep6(domain)
    console.log('here is all the formData', formData)
    let searchParams = new URLSearchParams(formData)

    let res = await fetch(`${transferServer}/${endpoint}?${searchParams}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    })
    let json = await res.json()

    if (!res.ok) {
        throw error(res.status, {
            message: json.error,
        })
    } else {
        return json
    }
}

/**
 * Queries and returns information about an individual transfer.
 * @async
 * @function getTransferStatus6
 * @param {Object} opts Options object
 * @param {string} opts.authToken Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} opts.transferId Unique ID of the transfer we want to know more about
 * @param {string} opts.domain Domain of the anchor to query for transfer details
 * @returns {Promise<Object>} JSON object with information about the transfer
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function getTransferStatus6({ authToken, transferId, domain }) {
    let transferServer = await getTransferServerSep6(domain)

    let res = await fetch(
        `${transferServer}/transaction?${new URLSearchParams({
            id: transferId,
        })}`,
        {
            method: 'GET',
            mode: 'cors',
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
        let { transaction } = json
        return transaction
    }
}

/**
 * Queries and returns information about all SEP-6 transfers for a given address and asset.
 * @async
 * @function queryTransfers6
 * @param {Object} opts Options object
 * @param {string} opts.authToken Authentication token for a Stellar account received through SEP-10 web authentication
 * @param {string} opts.assetCode Asset code returned transfers must include
 * @param {string} opts.publicKey Public Stellar address of the account which initiated the transfers
 * @param {string} opts.homeDomain Domain of the anchor to query for transfer records
 * @returns {Promise<Object>} JSON response from the server
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function queryTransfers6({ authToken, assetCode, publicKey, homeDomain }) {
    let transferServer = await getTransferServerSep6(homeDomain)

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
    if (!res.ok) {
        throw error(res.status, {
            message: json.error,
        })
    } else {
        return json
    }
}
