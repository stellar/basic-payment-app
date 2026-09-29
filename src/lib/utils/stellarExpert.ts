const network = 'testnet'
const baseUrl = `https://api.stellar.expert/explorer/${network}`

/**
 * An asset object that has been returned by our query to Stellar.Expert
 * @see {@link https://stellar.expert/openapi.html#tag/Asset-Info-API/operation/getAllAssets}
 */
export interface RankedAsset {
    /** Asset identifier */
    asset: string
    /** Total traded amount (in stroops) */
    traded_amount: number
    /** Total payments amount (in stroops) */
    payments_amount: number
    /** Timestamp of the first recorder operation with asset */
    created: number
    /** Total issued asset supply */
    supply: number
    /** Trustlines established to an asset */
    trustlines: object
    /** Total number of trades */
    trades: number
    /** Total number of payments */
    payments: number
    /** Associated `home_domain` */
    domain: string
    /** Asset information from stellar.toml file */
    tomlInfo: object
    /** Composite asset rating */
    rating: object
    /** Paging token */
    paging_token: number
}

/**
 * Fetches and returns the most highly rated assets, according to the Stellar.Expert calculations.
 * @async
 * @function fetchAssets
 * @returns {Promise<RankedAsset[]>} Array of objects containing details for each asset
 */
export async function fetchAssets(): Promise<RankedAsset[]> {
    let res = await fetch(
        `${baseUrl}/asset?${new URLSearchParams({
            // these are all the defaults, but you could customize them if needed
            search: '',
            sort: 'rating',
            order: 'desc',
            limit: '10',
            cursor: '0',
        })}`,
    )
    let json = await res.json()

    let records = json._embedded.records
    return records
}
