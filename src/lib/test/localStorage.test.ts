import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocalStorage } from '../state/localStorage.svelte'

// A minimal, in-memory stand-in for the browser's `localStorage`
function createFakeStorage() {
    const items = new Map<string, string>()
    return {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => items.set(key, String(value)),
        removeItem: (key: string) => items.delete(key),
        clear: () => items.clear(),
    }
}

describe('LocalStorage', () => {
    let storage: ReturnType<typeof createFakeStorage>

    beforeEach(() => {
        storage = createFakeStorage()
        vi.stubGlobal('localStorage', storage)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('returns the initial value when nothing is stored', () => {
        const state = new LocalStorage('test:key', { count: 0 })
        expect(state.current).toEqual({ count: 0 })
    })

    it('does not write anything to storage until the value changes', () => {
        new LocalStorage('test:key', { count: 0 })
        expect(storage.getItem('test:key')).toBeNull()
    })

    it('reads a value that is already stored', () => {
        storage.setItem('test:key', JSON.stringify({ count: 5 }))
        const state = new LocalStorage('test:key', { count: 0 })
        expect(state.current).toEqual({ count: 5 })
    })

    it('persists a value assigned to `current`', () => {
        const state = new LocalStorage('test:key', { count: 0 })
        state.current = { count: 1 }
        expect(JSON.parse(storage.getItem('test:key')!)).toEqual({ count: 1 })
        expect(state.current).toEqual({ count: 1 })
    })

    it('persists nested changes to objects and arrays', () => {
        const state = new LocalStorage('test:contacts', [{ id: '1', favorite: false }])
        state.current[0].favorite = true
        state.current.push({ id: '2', favorite: false })

        expect(JSON.parse(storage.getItem('test:contacts')!)).toEqual([
            { id: '1', favorite: true },
            { id: '2', favorite: false },
        ])
    })

    it('persists deleted properties', () => {
        const state = new LocalStorage<Record<string, string>>('test:auth', {
            'a.example': 'token-a',
            'b.example': 'token-b',
        })
        delete state.current['a.example']
        expect(JSON.parse(storage.getItem('test:auth')!)).toEqual({ 'b.example': 'token-b' })
    })

    it('does not change the initial value when the state is changed', () => {
        const initial = { count: 0 }
        const state = new LocalStorage('test:key', initial)
        state.current.count = 10
        expect(initial).toEqual({ count: 0 })
    })

    it('falls back to the initial value after the key is removed', () => {
        const state = new LocalStorage('test:key', { publicKey: '' })
        state.current = { publicKey: 'GABC' }
        storage.removeItem('test:key')
        expect(state.current).toEqual({ publicKey: '' })
    })

    it('falls back to the initial value when the stored JSON is invalid', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        storage.setItem('test:key', '{not json')
        const state = new LocalStorage('test:key', { count: 0 })

        expect(state.current).toEqual({ count: 0 })
        expect(consoleError).toHaveBeenCalled()
        consoleError.mockRestore()
    })

    it('removes the key when `current` is set to undefined', () => {
        const state = new LocalStorage<string | undefined>('test:key', undefined)
        state.current = 'hello'
        state.current = undefined
        expect(storage.getItem('test:key')).toBeNull()
        expect(state.current).toBeUndefined()
    })
})
