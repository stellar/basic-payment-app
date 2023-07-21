import { fetchAssetsWithHomeDomains } from '$lib/stellar/horizonQueries'

/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
    const { balances } = await parent()
    return {
        /** @type {import('$lib/stellar/horizonQueries').HomeDomainBalanceLine[]} */
        homeDomainBalances: await fetchAssetsWithHomeDomains(balances),
    }
}
