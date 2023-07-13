import { writable } from 'svelte/store'

export let errorMessage = writable('')
export let warningMessage = writable('')
export let infoMessage = writable('')