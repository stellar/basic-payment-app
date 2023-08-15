import { writable } from 'svelte/store'

/**
 * @module $lib/stores/alertsStore
 * @description A Svelte store that can be used to set a message to display as a
 * warning, error, or informational message. Each store is exported separately,
 * and when the store is set, it will be displayed in the appropriate area of
 * the application.
 */

/** @type {import('svelte/store').Writable<string>} */
export let errorMessage = writable('')

/** @type {import('svelte/store').Writable<string>} */
export let warningMessage = writable('')

/** @type {import('svelte/store').Writable<string>} */
export let infoMessage = writable('')
