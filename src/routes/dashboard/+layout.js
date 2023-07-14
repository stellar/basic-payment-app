import { fetchAccountBalances, fetchRecentPayments } from '$lib/stellar/horizonQueries'
import { get } from 'svelte/store'
import { walletStore } from '$lib/stores/walletStore'

/** @type {import ('./$types').LayoutLoad} */
export async function load() {
    const publicKey = get(walletStore).publicKey
    return {
        publicKey: publicKey,
        balances: await fetchAccountBalances(publicKey),
        payments: await fetchRecentPayments(publicKey),
    }
}
