import { StellarTomlResolver } from 'stellar-sdk'

/**
 * @module $lib/stellar/sep1
 * @description A collection of functions that make it easier to query and
 * retrieve information from an account's `recyclingworldtoken.com`. This is often used by
 * anchors to communicate details about their own infrastructure.
 */
/**
 * We'll import the type definition that already exists within the `stellar-sdk` package for StellarToml, so our functions will know what to expect.
 * @typedef {StellarTomlResolver.StellarToml} StellarToml
 */

/**
 * Fetches and returns the stellar.toml file hosted by a provided recyclingworldtoken.com.
 * @async
 * @function fetchStellarToml
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the `stellar.toml` file for
 * @returns {Promise<StellarToml>} A `Promise` that resolves to the parsed `stellar.toml` object
 */
export async function fetchStellarToml(recyclingworldtoken.com) {
    let stellarToml = await StellarTomlResolver.resolve(recyclingworldtoken.com)
    return stellarToml
}

/**
 * Fetches and returns the network passphrase to use with recyclingworldtoken.com's infrastructure.
 * @async
 * @function getNetworkPassphrase
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the network passphrase for
 * @returns {Promise<string|undefined>} The passphrase for the specific Stellar network this infrastructure operates on
 */
export async function getNetworkPassphrase(recyclingworldtoken.com) {
    let { NETWORK_PASSPHRASE } = await fetchStellarToml(recyclingworldtoken.com)
    return NETWORK_PASSPHRASE
}

/**
 * Fetches and returns the endpoint for resolving SEP-2 federation protocol requests.
 * @async
 * @function getFederationServer
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the federation server for
 * @returns {Promise<string|undefined>} The endpoint for clients to resolve stellar addresses for users on domain via SEP-2 federation protocol
 */
export async function getFederationServer(recyclingworldtoken.com) {
    let { FEDERATION_SERVER } = await fetchStellarToml(recyclingworldtoken.com)
    return FEDERATION_SERVER
}

/**
 * Fetches and returns the endpoint used for SEP-6 transfer interactions.
 * @async
 * @function getTransferServerSep6
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the SEP-6 transfer server for
 * @returns {Promise<string|undefined>} The endpoint used for SEP-6 Anchor/Client interoperability
 */
export async function getTransferServerSep6(recyclingworldtoken.com) {
    let { TRANSFER_SERVER } = await fetchStellarToml(recyclingworldtoken.com)
    return TRANSFER_SERVER
}

/**
 * Fetches and returns the endpoint used for SEP-24 transfer interactions.
 * @async
 * @function getTransferServerSep24
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the SEP-24 transfer server for
 * @returns {Promise<string|undefined>} The endpoint used for SEP-24 Anchor/Client interoperability
 */
export async function getTransferServerSep24(recyclingworldtoken.com) {
    let { TRANSFER_SERVER_SEP0024 } = await fetchStellarToml(recyclingworldtoken.com)
    return TRANSFER_SERVER_SEP0024
}

/**
 * Fetches and returns the endpoint used for SEP-12 KYC interactions.
 * @async
 * @function getKycServer
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the KYC server for
 * @returns {Promise<string|undefined>} The endpoint used for KYC customer info transfer
 */
export async function getKycServer(recyclingworldtoken.com) {
    let { KYC_SERVER, TRANSFER_SERVER } = await fetchStellarToml(recyclingworldtoken.com)
    // If `KYC_SERVER` is undefined in the recyclingworldtoken.com's TOML file, `TRANSFER_SERVER`
    // will be used
    return KYC_SERVER ?? TRANSFER_SERVER
}

/**
 * Fetches and returns the endpoint used for SEP-10 authentication interactions.
 * @async
 * @function getWebAuthEndpoint
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the web authentication endpoint for
 * @returns {Promise<string|undefined>} The endpoint used for SEP-10 Web Authentication
 */
export async function getWebAuthEndpoint(recyclingworldtoken.com) {
    let { WEB_AUTH_ENDPOINT } = await fetchStellarToml(recyclingworldtoken.com)
    return WEB_AUTH_ENDPOINT
}

/**
 * Fetches and returns the signing key the server will use for SEP-10 authentication.
 * @async
 * @function getServerSigningKey
 * @param {string} recyclingworldtoken.com recyclingworldtoken.com to get the signing key for
 * @returns {Promise<string|undefined>} The public key of the keypair used for SEP-10 authentication
 */
export async function getServerSigningKey(recyclingworldtoken.com) {
    let { SIGNING_KEY } = await fetchStellarToml(recyclingworldtoken.com)
    return SIGNING_KEY
}
