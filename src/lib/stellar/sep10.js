import { Utils } from 'stellar-sdk'
import { fetchStellarToml, getWebAuthEndpoint } from '$lib/stellar/sep1'
import { error } from '@sveltejs/kit'

/**
 * Requests, validates, and returns a SEP-10 challenge transaction from an anchor server.
 * @param {Object} opts Options object
 * @param {string} opts.publicKey Public Stellar address the challenge transaction will be generated for
 * @param {string} [opts.domain=testanchor.stellar.org] Domain to request a challenge transaction from
 */
export async function getChallengeTransaction({ publicKey, domain }) {
    if (!domain) {
        domain = 'testanchor.stellar.org'
    }

    let { WEB_AUTH_ENDPOINT, TRANSFER_SERVER, SIGNING_KEY } = await fetchStellarToml(domain)

    let res = await fetch(
        `${WEB_AUTH_ENDPOINT || TRANSFER_SERVER}?${new URLSearchParams({
            // Possible parameters are `account`, `memo`, `home_domain`, and
            // `client_domain`. For our purposes, we only supply `account`.
            account: publicKey,
        })}`
    )
    let json = await res.json()

    validateChallengeTransaction({
        transactionXDR: json.transaction,
        serverSigningKey: SIGNING_KEY,
        network: json.network_passphrase,
        clientPublicKey: publicKey,
        homeDomain: domain,
    })
    return json
}

/**
 * Validates the correct structure and information in a SEP-10 challenge transaction.
 * @param {Object} opts Options object
 * @param {string} opts.transactionXDR Challenge transaction encoded in base64 XDR format
 * @param {string} opts.serverSigningKey Public Stellar address the anchor should use to sign the challenge transaction
 * @param {string} opts.network Network passphrase the challenge transaction is expected to be built for
 * @param {string} opts.clientPublicKey Public Stellar address of the client authenticating with the anchor
 * @param {string} opts.homeDomain Domain of the anchor that generated the challenge transaction
 * @param {string} [opts.clientDomain=opts.homeDomain] Used for client domain verification in the SEP-10 authentication flow
 * @throws {error} Will throw an error if any part of the challenge transaction doesn't match the SEP-10 specification
 */
function validateChallengeTransaction({
    transactionXDR,
    serverSigningKey,
    network,
    clientPublicKey,
    homeDomain,
    clientDomain,
}) {
    if (!clientDomain) {
        clientDomain = homeDomain
    }

    try {
        let results = Utils.readChallengeTx(
            transactionXDR,
            serverSigningKey,
            network,
            homeDomain,
            clientDomain
        )
        if (results.clientAccountID === clientPublicKey) {
            return
        } else {
            throw error(400, { message: 'clientAccountID does not match challenge transaction' })
        }
    } catch (err) {
        throw error(400, err)
    }
}

/**
 * Submits a SEP-10 challenge transaction to an authentication server and returns the SEP-10 token.
 * @param {Object} opts Options object
 * @param {string} opts.transactionXDR Signed SEP-10 challenge transaction to be submitted to the authentication server
 * @param {string} opts.homeDomain Domain that handles SEP-10 authentication for this anchor
 * @returns {Promise<string>} JSON web token which can be used to authenticate with this anchor server
 * @throws Will throw an error if the server responds with one.
 */
export async function submitChallengeTransaction({ transactionXDR, homeDomain }) {
    let webAuthEndpoint = await getWebAuthEndpoint(homeDomain)
    let res = await fetch(webAuthEndpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: transactionXDR }),
    })
    let json = await res.json()

    if (!res.ok) {
        throw error(400, { message: json.error })
    }
    return json.token
}
