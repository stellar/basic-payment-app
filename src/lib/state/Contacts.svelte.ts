import { v4 as uuidv4 } from 'uuid'
import { StrKey } from '@stellar/stellar-sdk'
import { error } from '@sveltejs/kit'
import { LocalStorage } from '$lib/state/localStorage.svelte'

/**
 * @module $lib/state/Contacts
 * @description Reactive state holding the user's contacts list, which is
 * persisted in the browser's localStorage. Methods are provided to empty the
 * list, add to the list, remove an entry, and favorite a given entry.
 */

/**
 * When we are creating a contact entry, these three fields are required:
 * `favorite`, `address`, and `name`. When this data is passed to the
 * `contacts.add()` method, it will validate the address as a Stellar public key
 * (or contract address), and assign it a unique ID.
 */
export interface ContactEntry {
    /** Unique identifier for this contact entry */
    id: string
    /** Public Stellar address associated with this contact */
    address: string
    /** Human-readable name to identify this contact with */
    name: string
    /** Whether or not the contact is marked as a "favorite" */
    favorite: boolean
}

class Contacts {
    #list = new LocalStorage<ContactEntry[]>('bpa:contactList', [])

    /** All of the user's contact entries */
    get list() {
        return this.#list.current
    }

    /**
     * Erases all contact entries from the list and creates a new, empty contact list.
     */
    empty() {
        this.#list.current = []
    }

    /**
     * Removes the specified contact entry from the list.
     * @param id Unique identifier of the contact to be removed from the list
     */
    remove(id: string) {
        this.#list.current = this.list.filter((contact) => contact.id !== id)
    }

    /**
     * Adds a new contact entry to the list with the provided details.
     * @param contact Details of new contact entry to add to the list
     * @throws Will throw an error if the new contact entry contains an invalid public key or contract address in the `address` field
     */
    add(contact: Omit<ContactEntry, 'id'> & { id?: string }) {
        if (
            StrKey.isValidEd25519PublicKey(contact.address) ||
            StrKey.isValidContract(contact.address)
        ) {
            this.list.push({ ...contact, id: uuidv4() })
        } else {
            error(400, { message: 'invalid public key or contract address' })
        }
    }

    /**
     * Toggles the "favorite" field on the specified contact.
     * @param id Unique identifier of the contact to be favorited or unfavorited
     */
    favorite(id: string) {
        const contact = this.list.find((contact) => contact.id === id)
        if (contact) {
            contact.favorite = !contact.favorite
        }
    }

    /**
     * Searches the contact list for an entry with the specified address.
     * @param address Public Stellar address to lookup in the contact list
     * @returns The `name` field of the found contact entry, false if there is none
     */
    lookup(address: string) {
        return this.list.find((contact) => contact.address === address)?.name ?? false
    }

    /**
     * Checks if the given address is a contract address
     * @param address Address to check
     * @returns True if the address is a contract address, false otherwise
     */
    isContractAddress(address: string) {
        return StrKey.isValidContract(address)
    }
}

export const contacts = new Contacts()
