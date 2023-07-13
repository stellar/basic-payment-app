const network = 'testnet'
const baseUrl = `https://api.stellar.expert/explorer/${network}`

/**
 * An asset object that has been returned by our query to Stellar.Expert [More information at SE's openapi spec](https://stellar.expert/openapi.html#tag/Asset-Info-API/operation/getAllAssets)
 * @typedef {Object} RankedAsset
 * @property {string} asset Asset identifier
 * @property {number} traded_amount Total traded amount (in stroops)
 * @property {number} payments_amount Total payments amount (in stroops)
 * @property {number} created Timestampe of the first recorder operation with asset
 * @property {number} supply Total issued asset supply
 * @property {Object} trustlines Turstlines established to an asset
 * @property {number} trades Total number of trades
 * @property {number} payments Total number of payments
 * @property {string} domain Associated `home_domain`
 * @property {Object} tomlInfo Asset information from stellar.toml file
 * @property {Object} rating Composite asset rating
 * @property {number} paging_token Paging token
 *
 */

/**
 * Fetches and returns the most highly rated assets, according to the Stellar.Expert calculations.
 * @returns {Promise<RankedAsset[]>} - An array of objects containing details for each asset
 */
export async function fetchAssets() {
    let res = await fetch(
        `${baseUrl}/asset?${new URLSearchParams({
            // these are all the defaults, but you could customize them if needed
            search: '',
            sort: 'rating',
            order: 'desc',
            limit: '10',
            cursor: '0',
        })}`
    )

    let json = await res.json()
    console.log('$lib/utils/stellarExpert fetchAssets', json._embedded.records)
    return json._embedded.records
}
