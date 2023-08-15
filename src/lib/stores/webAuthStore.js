import { get } from 'svelte/store'
import { persisted } from 'svelte-local-storage-store'
import { Buffer } from 'buffer'

/**
 * @module $lib/stores/webAuthStore
 * @description A Svelte store that stores SEP-10 authentication tokens for any
 * anchor the user has authenticated with, and keeps them in the browser's
 * localStorage for use when interacting with asset anchors.
 */

/**
 * @typedef {Object.<string, string>} WebAuthStore
 * @property {string} homeDomain Home domain the authentication token was issued by.
 */

function createWebAuthStore() {
    /** @type {import('svelte/store').Writable<WebAuthStore>} */
    const { subscribe, update } = persisted('bpa:webAuthStore', {})

    return {
        subscribe,

        /**
         * Stores a JWT authentication token associated with a home domain server.
         * @param {string} homeDomain Home domain to store a JWT authentication token for
         * @param {string} token JSON web token used for authenticating requests with this asset anchor
         */
        setAuth: (homeDomain, token) =>
            update((store) => {
                return {
                    ...store,
                    [homeDomain]: token,
                }
            }),

        /**
         * Determine whether or not a JSON web token has an expiration date in the future or in the past.
         * @param {string} homeDomain Home domain to check a JWT authentication token for
         * @returns {boolean|undefined} True if the token is expired, false if it is still valid
         */
        isTokenExpired: (homeDomain) => {
            let token = get(webAuthStore)[homeDomain]
            if (token) {
                // Compare the token's expiration timestamp with the current
                // timestamp, returning `true` if expiration is in the past or
                // `false` if expiration is in the future
                let payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
                let timestamp = Math.floor(Date.now() / 1000)
                return timestamp > payload.exp
            } else {
                // Return `undefined` if no token exists for the specified home
                // domain
                return undefined
            }
        },
    }
}

export const webAuthStore = createWebAuthStore()
