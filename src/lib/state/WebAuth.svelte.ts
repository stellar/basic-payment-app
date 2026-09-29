import { error } from '@sveltejs/kit'
import { LocalStorage } from '$lib/state/localStorage.svelte'

/**
 * @module $lib/state/WebAuth
 * @description Reactive state that holds SEP-10 authentication tokens for any
 * anchor the user has authenticated with, and keeps them in the browser's
 * localStorage for use when interacting with asset anchors.
 * @see {@link https://stellar.org/protocol/sep-10}
 */

class WebAuth {
    /** JWT authentication tokens, keyed by the home domain that issued them */
    #tokens = new LocalStorage<Record<string, string>>('bpa:webAuthStore', {})

    /**
     * Returns the JWT authentication token issued by a home domain, if there is one.
     * @param homeDomain Home domain the token was issued by
     */
    getToken(homeDomain: string): string | undefined {
        return this.#tokens.current[homeDomain]
    }

    /**
     * Returns the JWT authentication token issued by a home domain, for
     * requests that can't be made without one.
     * @param homeDomain Home domain the token was issued by
     * @throws Will throw an error if the user hasn't authenticated with this home domain
     */
    requireToken(homeDomain: string): string {
        const token = this.getToken(homeDomain)
        if (!token) {
            error(401, { message: `Please authenticate with ${homeDomain} first` })
        }
        return token
    }

    /**
     * Stores a JWT authentication token associated with a home domain server.
     * @param homeDomain Home domain to store a JWT authentication token for
     * @param token JSON web token used for authenticating requests with this asset anchor
     */
    setAuth(homeDomain: string, token: string) {
        this.#tokens.current[homeDomain] = token
    }

    /**
     * Determine whether or not a JSON web token has an expiration date in the future or in the past.
     * @param homeDomain Home domain to check a JWT authentication token for
     * @returns True if the token is expired, false if it is still valid, or undefined if there is no token
     */
    isTokenExpired(homeDomain: string): boolean | undefined {
        const token = this.getToken(homeDomain)
        if (!token) return undefined

        // A JWT's payload is base64url-encoded JSON, which `atob` can decode
        // once it's been converted back to regular base64
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        // Compare the token's expiration timestamp with the current timestamp
        return Math.floor(Date.now() / 1000) > payload.exp
    }
}

export const webAuth = new WebAuth()
