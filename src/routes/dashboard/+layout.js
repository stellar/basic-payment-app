import { fetchAccountBalances, fetchRecentPayments } from '$lib/stellar/horizonQueries'
import { get } from 'svelte/store'
import { walletStore } from '$lib/stores/walletStore'
import { goto } from '$app/navigation'

/** @type {import ('./$types').LayoutLoad} */
export async function load() {
    const wallet = get(walletStore)
    if (!wallet) {
        goto('/signup')
    } else {
        const publicKey = wallet.publicKey
        return {
            publicKey: publicKey,
            balances: await fetchAccountBalances(publicKey),
            payments: await fetchRecentPayments(publicKey),
        }
    }
}
