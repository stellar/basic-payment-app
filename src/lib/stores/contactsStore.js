import { v4 as uuidv4 } from 'uuid'
import { persisted } from 'svelte-local-storage-store'
import { StrKey } from 'stellar-sdk'
import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'

/**
 * @module $lib/stores/contactsStore
 * @description A Svelte store that duplicates all entries in the contacts list
 * into the browser's localStorage. Functions are provided to empty the list,
 * add to the list, remove an entry, and favorite a given entry.
 */

/**
 * @description When we are creating a contact entry, these three fields are
 * required: `favorite`, `address`, and `name`. When this data is passed to the
 * `contactsStore.add()` function, it will validate the address as Stellar
 * public key, and assign it a unique ID (if one is not supplied).
 * @typedef {Object} ContactEntry
 * @property {boolean} favorite Whether or not the contact is marked as a "favorite"
 * @property {string} address Public Stellar address associated with this contact
 * @property {string} name Human-readable name to identify this contact with
 * @property {string} id Unique identifier for this contact entry
 */

function createContactsStore() {
    /** @type {import('svelte/store').Writable<ContactEntry[]>} */
    const { subscribe, set, update } = persisted('bpa:contactList', [])

    return {
        subscribe,

        /**
         * Erases all contact entries from the list and creates a new, empty contact list.
         */
        empty: () => set([]),

        /**
         * Removes the specified contact entry from the list.
         * @param {string} id Unique identifier of the contact to be removed from the list
         */
        remove: (id) => update((list) => list.filter((contact) => contact.id !== id)),

        /**
         * Adds a new contact entry to the list with the provided details.
         * @function add
         * @param {ContactEntry} contact Details of new contact entry to add to the list
         * @throws Will throw an error if the new contact entry contains an invalid public key in the `address` field
         */
        add: (contact) =>
            update((list) => {
                if (StrKey.isValidEd25519PublicKey(contact.address)) {
                    return [...list, { ...contact, id: uuidv4() }]
                } else {
                    throw error(400, { message: 'invalid public key' })
                }
            }),

        /**
         * Toggles the "favorite" field on the specified contact.
         * @param {string} id Unique identifier of the contact to be favorited or unfavorited
         */
        favorite: (id) =>
            update((list) => {
                const i = list.findIndex((contact) => contact.id === id)
                if (i >= 0) {
                    list[i].favorite = !list[i].favorite
                }
                return list
            }),

        /**
         * Searches the contact list for an entry with the specified address.
         * @param {string} address Public Stellar address to lookup in the contact list
         * @returns {string|false} Returns the `name` field of the found contact entry, false if there is none
         */
        lookup: (address) => {
            let list = get(contacts)
            let i = list.findIndex((contact) => contact.address === address)
            if (i >= 0) {
                return list[i].name
            } else {
                return false
            }
        },
    }
}

export const contacts = createContactsStore()
