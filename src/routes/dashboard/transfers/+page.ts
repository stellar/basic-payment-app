import type { PageLoad } from './$types'
import { fetchAssetsWithHomeDomains } from '$lib/stellar/horizonQueries'

export const load: PageLoad = async ({ parent }) => {
    const { balances } = await parent()
    return {
        homeDomainBalances: await fetchAssetsWithHomeDomains(balances),
    }
}
