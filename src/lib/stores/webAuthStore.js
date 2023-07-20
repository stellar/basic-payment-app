import { persisted } from 'svelte-local-storage-store'
import { Buffer } from 'buffer'

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
    }
}

export const webAuthStore = createWebAuthStore()

/**
 * Determine whether or not a JSON web token has an expiration date in the future or in the past.
 * @param {string} token JSON web token to be parsed and checked for an expiration time in the future
 * @returns {boolean} True if the token is expired, false if it is still valid
 */
export function isTokenExpired(token) {
    let tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    let timestamp = Math.floor(Date.now() / 1000)
    return timestamp > tokenPayload.exp
}
