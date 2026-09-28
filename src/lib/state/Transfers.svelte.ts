import { LocalStorage } from '$lib/state/localStorage.svelte'

/**
 * @module $lib/state/Transfers
 * @description Reactive state that keeps track of minimal information about
 * transfers the user has initiated with various anchors. This isn't technically
 * required, since any anchor can be queried for a list of a user's transfers.
 * However, this will be useful to keep track of _which_ anchors should be
 * queried.
 */

export type TransferProtocol = 'sep6' | 'sep24'

export interface TransferEntry {
    /** Unique identifier for this transfer */
    id: string
    /** Asset code involved in the transfer */
    asset_code: string
}

/** Transfers the user has initiated, grouped by anchor home domain, then by protocol */
export type TransfersByDomain = Record<string, Partial<Record<TransferProtocol, TransferEntry[]>>>

class Transfers {
    #transfers = new LocalStorage<TransfersByDomain>('bpa:transfersStore', {})

    /** All tracked transfers, grouped by anchor home domain, then by protocol */
    get all() {
        return this.#transfers.current
    }

    /**
     * Adds a new transfer ID to the list of tracked anchor transfers.
     * @param opts Options object
     * @param opts.homeDomain Home domain of the anchor server facilitating the transfer
     * @param opts.protocol Which standard was used for this transfer (SEP-6 or SEP-24)
     * @param opts.assetCode Asset code involved in the transfer
     * @param opts.transferID Unique identifier for this transfer
     */
    addTransfer({
        homeDomain,
        protocol,
        assetCode,
        transferID,
    }: {
        homeDomain: string
        protocol: TransferProtocol
        assetCode: string
        transferID: string
    }) {
        const all = this.all
        all[homeDomain] ??= {}
        all[homeDomain][protocol] ??= []
        all[homeDomain][protocol].push({ id: transferID, asset_code: assetCode })
    }
}

export const transfers = new Transfers()
