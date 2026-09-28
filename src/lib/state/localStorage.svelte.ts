import { createSubscriber } from 'svelte/reactivity'
import { on } from 'svelte/events'

/**
 * @module $lib/state/localStorage
 * @description Reactive state that is persisted in the browser's localStorage.
 * Read and write it through `.current`, and any component reading it will
 * update when it changes, including when it's changed from another tab.
 *
 * Nested changes are persisted, too:
 *
 * ```ts
 * const contacts = new LocalStorage<ContactEntry[]>('bpa:contactList', [])
 * contacts.current.push(newContact) // saved to localStorage
 * contacts.current[0].favorite = true // also saved
 * ```
 *
 * Values are stored as JSON, so only store plain objects, arrays, and
 * primitives. Each read of `.current` returns a fresh copy from storage, so
 * read it again after a change rather than holding on to an old value.
 */
export class LocalStorage<T> {
    #key: string
    #initial: T
    #subscribe: () => void
    #update: (() => void) | undefined

    /**
     * @param key The localStorage key the value is stored under
     * @param initial The value to use when nothing is stored under `key` yet
     */
    constructor(key: string, initial: T) {
        this.#key = key
        this.#initial = initial

        // `createSubscriber` only runs this function while something (like a
        // component) is reading `.current`, and cleans up once nothing is. The
        // `storage` event only fires for changes made in *other* tabs.
        this.#subscribe = createSubscriber((update) => {
            this.#update = update
            const off = on(window, 'storage', (event) => {
                if (event.storageArea === localStorage && event.key === this.#key) update()
            })

            return () => {
                off()
                this.#update = undefined
            }
        })
    }

    get current(): T {
        this.#subscribe()
        const root = this.#read()
        return this.#proxy(root, root, new WeakMap()) as T
    }

    set current(value: T) {
        this.#write(value)
        this.#update?.()
    }

    #read(): T {
        const stored = globalThis.localStorage?.getItem(this.#key) ?? null
        if (stored !== null) {
            try {
                return JSON.parse(stored)
            } catch (err) {
                console.error(`Could not parse the stored value for "${this.#key}"`, err)
            }
        }
        // Copy the initial value, so changes to it don't change `#initial` itself
        return structuredClone(this.#initial)
    }

    #write(value: T) {
        if (value === undefined) {
            globalThis.localStorage?.removeItem(this.#key)
        } else {
            globalThis.localStorage?.setItem(this.#key, JSON.stringify(value))
        }
    }

    // Wraps objects and arrays so that changing them (at any depth) saves the
    // whole value back to localStorage
    #proxy(value: unknown, root: T, proxies: WeakMap<object, unknown>): unknown {
        if (typeof value !== 'object' || value === null) return value

        // Leave anything that isn't a plain object or array (like a `Date`) alone
        const proto = Object.getPrototypeOf(value)
        if (proto !== Object.prototype && proto !== null && !Array.isArray(value)) return value

        let proxied = proxies.get(value)
        if (!proxied) {
            const save = () => {
                this.#write(root)
                this.#update?.()
            }

            proxied = new Proxy(value, {
                get: (target, property) => {
                    this.#subscribe()
                    return this.#proxy(Reflect.get(target, property), root, proxies)
                },
                set: (target, property, newValue) => {
                    Reflect.set(target, property, newValue)
                    save()
                    return true
                },
                deleteProperty: (target, property) => {
                    Reflect.deleteProperty(target, property)
                    save()
                    return true
                },
            })
            proxies.set(value, proxied)
        }

        return proxied
    }
}
