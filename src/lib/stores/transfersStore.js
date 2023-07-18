import { persisted } from 'svelte-local-storage-store'

function createTransfersStore() {
    const { subscribe, set, update } = persisted('bpa:transfersStore', {})

    return {
        subscribe,

        /**
         * Adds a new transfer ID to the list of tracked anchor transfers.
         * @param {string} homeDomain Home domain of the anchor server facilitating the transfer
         * @param {('sep6'|'sep24')} protocol Which standard was used for this transfer (SEP-6 or SEP-24)
         * @param {string} transferID Transfer details to add to the list of
         */
        addTransfer: (homeDomain, protocol, transferID) =>
            update((store) => {
                let newStore = { ...store }
                if (homeDomain in newStore) {
                    if (protocol in newStore[homeDomain]) {
                        newStore[homeDomain][protocol].push(transferID)
                    } else {
                        newStore[homeDomain][protocol] = [transferID]
                    }
                } else {
                    newStore[homeDomain] = {
                        [protocol]: [transferID],
                    }
                }
                return newStore
            }),
    }
}

export const transfers = createTransfersStore()
