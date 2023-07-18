import { persisted } from 'svelte-local-storage-store'

function createTransfersStore() {
    const { subscribe, set, update } = persisted('bpa:transfersStore', {})

    return {
        subscribe,

        /**
         * Adds a new transfer ID to the list of tracked anchor transfers.
         * @param {Object} opts Options object
         * @param {string} opts.homeDomain Home domain of the anchor server facilitating the transfer
         * @param {('sep6'|'sep24')} opts.protocol Which standard was used for this transfer (SEP-6 or SEP-24)
         * @param {string} opts.assetCode Asset code involved in the transfer
         * @param {string} opts.transferID Transfer details to add to the list of
         */
        addTransfer: ({ homeDomain, protocol, assetCode, transferID }) =>
            update((store) => {
                let newStore = { ...store }
                if (homeDomain in newStore) {
                    if (protocol in newStore[homeDomain]) {
                        newStore[homeDomain][protocol].push({
                            id: transferID,
                            asset_code: assetCode,
                        })
                    } else {
                        newStore[homeDomain][protocol] = [{ id: transferID, asset_code: assetCode }]
                    }
                } else {
                    newStore[homeDomain] = {
                        [protocol]: [{ id: transferID, asset_code: assetCode }],
                    }
                }
                return newStore
            }),
    }
}

export const transfers = createTransfersStore()
