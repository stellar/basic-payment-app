import { v4 as uuidv4 } from 'uuid'
import { persisted } from 'svelte-local-storage-store'
import { StrKey } from 'stellar-sdk'
import { error } from '@sveltejs/kit'

/**
 * @module $lib/stores/contactsStore
 * @description A Svelte store that duplicates all entries in the contacts list
 * into the browser's localStorage. Functions are provided to empty the list,
 * add to the list, remove an entry, and favorite a given entry.
 */

/**
 * @description When we are creating a contact entry, these three fields are
 * required: `favorite`, `address`, and `name`. When this data is passed to the
 * `contactsStore.add()` function, it will validate the address as being valid,
 * and assign it a unique ID.
 * @typedef {Object} ContactEntry
 * @property {boolean} favorite Whether or not the contact is marked as a "favorite"
 * @property {string} address Public Stellar address associated with this contact
 * @property {string} name Human-readable name to identify this contact with
 */

function createContactsStore() {
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
        remove: (id) => update((list) => list.filter((contact) => contact['id'] !== id)),

        /**
         * Adds a new contact entry to the list with the provided details.
         * @function add
         * @param {ContactEntry} contact Details of new contact entry to add to the list
         * @throws Will throw an error if the new contact entry contains an invalid public key in the `address` field
         */
        add: (contact) =>
            update((list) => {
                if (StrKey.isValidEd25519PublicKey(contact.address)) {
                    return [...list, { id: uuidv4(), ...contact }]
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
                const i = list.findIndex((contact) => contact['id'] === id)
                if (i >= 0) {
                    list[i]['favorite'] = !list[i]['favorite']
                }
                return list
            }),
    }
}

export const contacts = createContactsStore()
