import { v4 as uuidv4 } from 'uuid'
import { persisted } from 'svelte-local-storage-store'
import { StrKey } from 'stellar-sdk'
import { error, fail } from '@sveltejs/kit'

/**
 * @typedef {Object} ContactEntry
 * @property {string} [id] - Unique identifier for each contact
 * @property {boolean} favorite - Whether or not the contact is marked as a "favorite"
 * @property {string} address - Public Stellar address associated with this contact
 * @property {string} name - Human-readable name to identify this contact with
*/

function createContacts() {
    const { subscribe, set, update } = persisted('bpa:contactList', [])

    return {
        subscribe,

        /**
         * Erases all contact entries from the list and creates a new, empty contact list.
         */
        empty: () => set([]),

        /**
         * Removes the specified contact entry from the list.
         * @param {string} id - Unique identifier of the contact to be removed from the list
         */
        remove: (id) => update((list) => list.filter((contact) => contact.id !== id)),

        /**
         * Adds a new contact entry to the list with the provided details.
         * @param {ContactEntry} contact - Details of new contact entry to add to the list
         * @throws Will throw an error if the new contact entry contains an invalid public key in the `address` field
         */
        add: (contact) =>
            update((list) => {
                let id = contact.id ?? uuidv4()
                if (StrKey.isValidEd25519PublicKey(contact.address)) {
                    return [...list, { id, ...contact }]
                } else {
                    throw error(400, { message: 'invalid public key' })
                }
            }),

        /**
         * Toggles the "favorite" field on the specified contact.
         * @param {string} id - Unique identifier of the contact to be favorited or unfavorited
         */
        favorite: (id) =>
            update((list) => {
                const i = list.findIndex((contact) => contact.id === id)
                if (i >= 0) list[i].favorite = !list[i].favorite
                return list
            }),
    }
}

export const contacts = createContacts()
