import type { PageLoad } from './$types'
import { fetchAssetsWithHomeDomains, type HomeDomainBalanceLine } from '$lib/stellar/horizonQueries'
import { fetchStellarToml } from '$lib/stellar/sep1'

/**
 * Anchors we always show on this page, whether or not an asset's issuer points
 * to them. SDF's testanchor supports SRT and USDC on testnet, but neither
 * issuer sets its `home_domain` to testanchor.stellar.org, so we'd never find
 * it the usual way. Instead, we read the anchor's own `stellar.toml` to see
 * which assets it supports.
 */
const ALWAYS_SHOWN_ANCHORS = ['testanchor.stellar.org']

/** An asset one of those anchors supports, which the user doesn't trust yet */
interface MissingTrustline {
    homeDomain: string
    assetCode: string
    assetIssuer: string
}

export const load: PageLoad = async ({ parent }) => {
    const { balances } = await parent()

    // Most anchors are found through the `home_domain` of each asset's issuer
    const homeDomainBalances: HomeDomainBalanceLine[] = await fetchAssetsWithHomeDomains(balances)
    const missingTrustlines: MissingTrustline[] = []

    for (const homeDomain of ALWAYS_SHOWN_ANCHORS) {
        let stellarToml
        try {
            stellarToml = await fetchStellarToml(homeDomain)
        } catch (err) {
            // If the anchor can't be reached, we still show everything else
            console.error(`Could not load the stellar.toml for ${homeDomain}`, err)
            continue
        }

        for (const { code, issuer } of stellarToml.CURRENCIES ?? []) {
            // Skip the network's native asset (XLM), which anchors may also list
            if (!code || !issuer) continue

            const balance = balances.find(
                (balance) =>
                    'asset_issuer' in balance &&
                    balance.asset_code === code &&
                    balance.asset_issuer === issuer,
            )
            const alreadyListed = homeDomainBalances.some(
                (listed) =>
                    listed.home_domain === homeDomain &&
                    listed.asset_code === code &&
                    listed.asset_issuer === issuer,
            )

            if (!balance) {
                // The user can't transfer an asset they don't trust yet
                missingTrustlines.push({ homeDomain, assetCode: code, assetIssuer: issuer })
            } else if ('asset_issuer' in balance && !alreadyListed) {
                homeDomainBalances.push({ ...balance, home_domain: homeDomain })
            }
        }
    }

    return {
        homeDomainBalances,
        missingTrustlines,
    }
}
