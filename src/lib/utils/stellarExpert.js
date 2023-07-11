const network = 'testnet'
const baseUrl = `https://api.stellar.expert/explorer/${network}`

/**
 * Fetches and returns the most highly rated assets, according to the Stellar.Expert calculations.
 * @returns {Promise<Object[]>} - An array of objects containing details for each asset
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
