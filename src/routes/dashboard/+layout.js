/**
 * @description If a directory contained within `/src/routes/` contains a
 * `+layout.js` file, you can use it to load data which will then be available
 * to thes sibling `+layout.svelte` and `+page.svelte` files, as well as any
 * other layout files nested further down the directory tree.
 * @see {@link https://kit.svelte.dev/docs/load#layout-data}
 */

import { get } from 'svelte/store'
import { goto } from '$app/navigation'

import { fetchAccountBalances, fetchRecentPayments } from '$lib/stellar/horizonQueries'
import { walletStore } from '$lib/stores/walletStore'

/** @type {import ('./$types').LayoutLoad} */
export async function load() {
    // We check that a wallet's `publicKey` has been stored in the browser, and
    // if it isn't there, we redirect to `/signup`. Since we define this
    // behavior in the top-most dashboard `+layout.js` file, it will have the
    // same affect on any nested pages visited.
    const { publicKey } = get(walletStore)
    if (!publicKey) {
        goto('/signup')
    }

    // We return the `balances` and `payments` using await to avoid
    // waterfalls and additional loading time
    return {
        publicKey: publicKey,
        balances: await fetchAccountBalances(publicKey),
        payments: await fetchRecentPayments(publicKey),
    }
}
