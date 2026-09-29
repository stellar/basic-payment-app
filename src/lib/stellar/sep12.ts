import { getKycServer } from '$lib/stellar/sep1'
import { error } from '@sveltejs/kit'

/**
 * @module $lib/stellar/sep12
 * @description A collection of functions to make it easier to work with SEP-12
 * KYC servers. When required, our application can communicate this information
 * directly to the KYC server on behalf of our users, without requiring any
 * intervention from the user.
 */

/**
 * A KYC field, as described by the KYC server
 * @see {@link https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#fields}
 */
export interface Sep12Field {
    /** The data type of the field (e.g., `string`, `binary`, `number`, or `date`) */
    type: string
    /** A human-readable description of this field */
    description: string
    /** Whether or not this field is required to proceed */
    optional?: boolean
    /** A list of the values the field may take */
    choices?: string[]
    /** For fields already provided, whether the server has accepted them */
    status?: string
}

/** The KYC server's record of a customer, and what it still needs from them */
export interface Sep12Customer {
    /** ID of the customer, if the server has a record for them */
    id?: string
    /** The customer's KYC status (e.g., `ACCEPTED`, `PROCESSING`, `NEEDS_INFO`, or `REJECTED`) */
    status?: string
    /** Fields the server still needs from the customer */
    fields?: Record<string, Sep12Field>
    /** Fields the customer has already provided */
    provided_fields?: Record<string, Sep12Field>
    /** A human-readable message about the customer's status */
    message?: string
}

/**
 * Reads the JSON body of a KYC server response, throwing the server's error
 * message if the request failed. Some responses (like a successful `DELETE`)
 * have an empty body, so we return an empty object for those.
 * @param res Response from the KYC server
 * @returns The parsed JSON body
 * @throws Will throw an error if the server response is not `ok`.
 */
async function readResponse<T>(res: Response): Promise<T> {
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    if (!res.ok) {
        error(res.status, { message: json.error ?? `KYC server responded with ${res.status}` })
    }
    return json
}

/**
 * Sends a `GET` request to query KYC status for a customer, returns current status of KYC submission
 * @async
 * @function getSep12Fields
 * @param {Object} opts Options object
 * @param {string} opts.authToken JSON web token used to authenticate the user with the KYC server (obtained through SEP-10)
 * @param {string} opts.homeDomain Domain to query users's KYC status from
 * @param {string} [opts.transactionId] Ask about the information the anchor needs for this specific transfer
 * @param {string} [opts.type] What kind of customer this is (required with `transactionId`, e.g. `sep6`)
 * @returns {Promise<Object>} Returns the response from the server
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function getSep12Fields({
    authToken,
    homeDomain,
    transactionId,
    type,
}: {
    authToken: string
    homeDomain: string
    transactionId?: string
    type?: string
}): Promise<Sep12Customer> {
    const kycServer = await getKycServer(homeDomain)

    // Some information depends on the transfer (e.g., more may be needed for
    // larger amounts), so we can ask about a specific transfer
    let url = `${kycServer}/customer`
    if (transactionId && type) {
        url += `?${new URLSearchParams({ transaction_id: transactionId, type: type })}`
    }

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    })
    const json = await readResponse<Sep12Customer>(res)
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
 * @param {string} [opts.transactionId] Submit information the anchor needs for this specific transfer
 * @param {string} [opts.type] What kind of customer this is (required with `transactionId`, e.g. `sep6`)
 * @returns {Promise<Object>} Returns the response from the server
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function putSep12Fields({
    authToken,
    fields,
    homeDomain,
    transactionId,
    type,
}: {
    authToken: string
    fields: object
    homeDomain: string
    transactionId?: string
    type?: string
}): Promise<{ id: string }> {
    // When the information is for a specific transfer, we say which one
    if (transactionId && type) {
        fields = { ...fields, transaction_id: transactionId, type: type }
    }
    const kycServer = await getKycServer(homeDomain)

    const res = await fetch(`${kycServer}/customer`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(fields),
    })
    const json = await readResponse<{ id: string }>(res)
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
 * @throws Will throw an error if the server response is not `ok`.
 */
export async function deleteSep12Customer({
    authToken,
    publicKey,
    homeDomain,
}: {
    authToken: string
    publicKey: string
    homeDomain: string
}): Promise<void> {
    const kycServer = await getKycServer(homeDomain)

    const res = await fetch(`${kycServer}/customer/${publicKey}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    })
    // A successful `DELETE` has no response body, so there's nothing to return
    await readResponse(res)
}
