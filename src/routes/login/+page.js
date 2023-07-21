/**
 * @description If a directory contained within `/src/routes/` contains a
 * `+page.js` file, you can use it to load data which will then be available to
 * thes sibling `+page.svelte`file. This is useful for loading data before a
 * page starts to render.
 * @see {@link https://kit.svelte.dev/docs/routing#page-page-js}
 */

// The `get` function allows us to read the value of a Svelte store from outside
// a `*.svelte` file.
import { get } from 'svelte/store'

// The `goto` function from SvelteKit's navigation store allows us to redirect a
// user from the client-side.
import { goto } from '$app/navigation'

// We import our `walletStore` to ensure the user has actually registered.
import { walletStore } from '$lib/stores/walletStore'

/** @type {import('./$types').PageLoad} */
export function load() {
    const wallet = get(walletStore)
    // If neither a valid public key, nor a keyId pointing to an encrypted
    // keypair, are present in the wallet store, we redirect the user to the
    // signup page.
    if (!wallet.publicKey || !wallet.keyId) {
        goto('/signup')
    }

    // Return to the `+page.svelte` file
    return {
        keyId: wallet.keyId,
        publicKey: wallet.publicKey,
    }
}
