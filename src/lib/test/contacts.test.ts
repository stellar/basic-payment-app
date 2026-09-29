import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Keypair } from '@stellar/stellar-sdk'
import { contacts } from '../state/Contacts.svelte'

// A minimal, in-memory stand-in for the browser's `localStorage`
function createFakeStorage() {
    const items = new Map<string, string>()
    return {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => items.set(key, String(value)),
        removeItem: (key: string) => items.delete(key),
    }
}

const stored = (storage: ReturnType<typeof createFakeStorage>) =>
    JSON.parse(storage.getItem('bpa:contactList') ?? 'null')

describe('contacts', () => {
    let storage: ReturnType<typeof createFakeStorage>

    beforeEach(() => {
        storage = createFakeStorage()
        vi.stubGlobal('localStorage', storage)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('starts with an empty list', () => {
        expect(contacts.list).toEqual([])
    })

    it('reads contacts saved under the existing localStorage key', () => {
        const existing = [{ id: '1', name: 'Alice', address: 'GABC', favorite: true }]
        storage.setItem('bpa:contactList', JSON.stringify(existing))
        expect(contacts.list).toEqual(existing)
    })

    it('adds a contact with a new id, and persists it', () => {
        const address = Keypair.random().publicKey()
        contacts.add({ name: 'Alice', address, favorite: false, id: '' })

        expect(contacts.list).toHaveLength(1)
        expect(contacts.list[0]).toMatchObject({ name: 'Alice', address, favorite: false })
        expect(contacts.list[0].id).not.toBe('')
        expect(stored(storage)).toEqual(contacts.list)
    })

    it('throws when adding a contact with an invalid address', () => {
        expect(() =>
            contacts.add({ name: 'Bob', address: 'not-an-address', favorite: false }),
        ).toThrow()
        expect(contacts.list).toEqual([])
    })

    it('toggles a contact as a favorite', () => {
        contacts.add({ name: 'Alice', address: Keypair.random().publicKey(), favorite: false })
        const { id } = contacts.list[0]

        contacts.favorite(id)
        expect(stored(storage)[0].favorite).toBe(true)
        contacts.favorite(id)
        expect(stored(storage)[0].favorite).toBe(false)
    })

    it('removes a contact', () => {
        contacts.add({ name: 'Alice', address: Keypair.random().publicKey(), favorite: false })
        contacts.add({ name: 'Bob', address: Keypair.random().publicKey(), favorite: false })
        contacts.remove(contacts.list[0].id)

        expect(stored(storage).map((c: { name: string }) => c.name)).toEqual(['Bob'])
    })

    it('empties the list', () => {
        contacts.add({ name: 'Alice', address: Keypair.random().publicKey(), favorite: false })
        contacts.empty()
        expect(stored(storage)).toEqual([])
    })

    it('looks up a contact name by address', () => {
        const address = Keypair.random().publicKey()
        contacts.add({ name: 'Alice', address, favorite: false })

        expect(contacts.lookup(address)).toBe('Alice')
        expect(contacts.lookup(Keypair.random().publicKey())).toBe(false)
    })
})
