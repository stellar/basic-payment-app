import { walletStore } from '$lib/stores/walletStore'
import { get } from 'svelte/store'
import { goto } from '$app/navigation'

/** @type {import('./$types').PageLoad} */
export function load() {
    const wallet = get(walletStore)
    if (!wallet) {
        goto('/signup')
    } else {
        return {
            keyId: wallet.keyId,
            publicKey: wallet.publicKey,
        }
    }
}
