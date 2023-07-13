import { persisted } from 'svelte-local-storage-store'

function createWebAuthStore() {
    const { subscribe, set, update } = persisted('bpa:webAuthStore', {})

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
