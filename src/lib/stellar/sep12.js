import { getKycServer } from '$lib/stellar/sep1'

/**
 * @module $lib/stellar/sep12
 * @description A collection of functions to make it easier to work with SEP-12
 * KYC servers. When required, our application can communicate this information
 * directly to the KYC server on behalf of our users, without requiring any
 * intervention from the user.
 */

/**
 * Sends a `GET` request to query KYC status for a customer, returns current status of KYC submission
 * @async
 * @function getSep12Fields
 * @param {Object} opts Options object
 * @param {string} opts.authToken JSON web token used to authenticate the user with the KYC server (obtained through SEP-10)
 * @param {string} opts.homeDomain Domain to query users's KYC status from
 * @returns {Promise<Object>} Returns the response from the server
 */
export async function getSep12Fields({ authToken, homeDomain }) {
    let kycServer = await getKycServer(homeDomain)

    let res = await fetch(`${kycServer}/customer`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    })
    let json = await res.json()
    console.log('getSep12Fields json', json)

    return json
}

/**
 * Sends a `PUT` request to the KYC server, submitting the supplied fields for the customer's record.
 * @async
 * @function putSep12Fields
 * @param {Object} opts Options object
 * @param {string} opts.authToken JSON web token used to authenticate the user with the KYC server (obtained through SEP-10)
 * @param {Object} opts.fields Object containing key/value pairs of supported SEP-9 fields to submit to the KYC server
 * @param {string} opts.homeDomain Domain to submit users's KYC information to
 * @returns {Promise<Object>} Returns the response from the server
 */
export async function putSep12Fields({ authToken, fields, homeDomain }) {
    let kycServer = await getKycServer(homeDomain)

    let res = await fetch(`${kycServer}/customer`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(fields),
    })
    let json = await res.json()
    console.log('putSep12Fields json', json)

    return json
}

/**
 * Sends a `DELETE` request to the KYC server to remove customer information from the server's records.
 * @async
 * @function deleteSep12Customer
 * @param {Object} opts Options object
 * @param {string} opts.authToken JSON web token used to authenticate the user with the KYC server (obtained through SEP-10)
 * @param {string} opts.publicKey Public Stellar address associated with the customer information to be deleted
 * @param {string} opts.homeDomain Domain to submit users's KYC information to
 * @returns {Promise<Object>} Returns the response from the server
 */
export async function deleteSep12Customer({ authToken, publicKey, homeDomain }) {
    let kycServer = await getKycServer(homeDomain)

    let res = await fetch(`${kycServer}/customer/${publicKey}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
    })
    let json = await res.json()
    console.log('deleteSep12Customer json', json)

    return json
}
