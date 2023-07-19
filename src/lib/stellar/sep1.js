import { StellarTomlResolver } from 'stellar-sdk'

/**
 * @module $lib/stellar/sep1
 * @description A collection of functions that make it easier to query and
 * retrieve information from an account's `home_domain`. This is often used by
 * anchors to communicate details about their own infrastructure.
 */
/**
 * We'll import the type definition that already exists within the `stellar-sdk` package for StellarToml, so our functions will know what to expect.
 * @typedef {StellarTomlResolver.StellarToml} StellarToml
 */

/**
 * Fetches and returns the stellar.toml file hosted by a provided domain.
 * @async
 * @function fetchStellarToml
 * @param {string} domain Domain to get the `stellar.toml` file for
 * @returns {Promise<StellarToml>} A `Promise` that resolves to the parsed `stellar.toml` object
 */
export async function fetchStellarToml(domain) {
    let stellarToml = await StellarTomlResolver.resolve(domain)
    return stellarToml
}

/**
 * Fetches and returns the network passphrase to use with domain's infrastructure.
 * @async
 * @function getNetworkPassphrase
 * @param {string} domain Domain to get the network passphrase for
 * @returns {Promise<string|undefined>} The passphrase for the specific Stellar network this infrastructure operates on
 */
export async function getNetworkPassphrase(domain) {
    let { NETWORK_PASSPHRASE } = await fetchStellarToml(domain)
    return NETWORK_PASSPHRASE
}

/**
 * Fetches and returns the endpoint for resolving SEP-2 federation protocol requests.
 * @async
 * @function getFederationServer
 * @param {string} domain Domain to get the federation server for
 * @returns {Promise<string|undefined>} The endpoint for clients to resolve stellar addresses for users on domain via SEP-2 federation protocol
 */
export async function getFederationServer(domain) {
    let { FEDERATION_SERVER } = await fetchStellarToml(domain)
    return FEDERATION_SERVER
}

/**
 * Fetches and returns the endpoint used for SEP-6 transfer interactions.
 * @async
 * @function getTransferServerSep6
 * @param {string} domain Domain to get the SEP-6 transfer server for
 * @returns {Promise<string|undefined>} The endpoint used for SEP-6 Anchor/Client interoperability
 */
export async function getTransferServerSep6(domain) {
    let { TRANSFER_SERVER } = await fetchStellarToml(domain)
    return TRANSFER_SERVER
}

/**
 * Fetches and returns the endpoint used for SEP-24 transfer interactions.
 * @async
 * @function getTransferServerSep24
 * @param {string} domain Domain to get the SEP-24 transfer server for
 * @returns {Promise<string|undefined>} The endpoint used for SEP-24 Anchor/Client interoperability
 */
export async function getTransferServerSep24(domain) {
    let { TRANSFER_SERVER_SEP0024 } = await fetchStellarToml(domain)
    return TRANSFER_SERVER_SEP0024
}

/**
 * Fetches and returns the endpoint used for SEP-12 KYC interactions.
 * @async
 * @function getKycServer
 * @param {string} domain Domain to get the KYC server for
 * @returns {Promise<string|undefined>} The endpoint used for KYC customer info transfer
 */
export async function getKycServer(domain) {
    let { KYC_SERVER, TRANSFER_SERVER } = await fetchStellarToml(domain)
    // If `KYC_SERVER` is undefined in the domain's TOML file, `TRANSFER_SERVER`
    // will be used
    return KYC_SERVER ?? TRANSFER_SERVER
}

/**
 * Fetches and returns the endpoint used for SEP-10 authentication interactions.
 * @async
 * @function getWebAuthEndpoint
 * @param {string} domain Domain to get the web authentication endpoint for
 * @returns {Promise<string|undefined>} The endpoint used for SEP-10 Web Authentication
 */
export async function getWebAuthEndpoint(domain) {
    let { WEB_AUTH_ENDPOINT } = await fetchStellarToml(domain)
    return WEB_AUTH_ENDPOINT
}

/**
 * Fetches and returns the signing key the server will use for SEP-10 authentication.
 * @async
 * @function getServerSigningKey
 * @param {string} domain Domain to get the signing key for
 * @returns {Promise<string|undefined>} The public key of the keypair used for SEP-10 authentication
 */
export async function getServerSigningKey(domain) {
    let { SIGNING_KEY } = await fetchStellarToml(domain)
    return SIGNING_KEY
}
