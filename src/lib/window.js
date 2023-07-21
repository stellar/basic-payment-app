// @ts-nocheck

import { browser } from '$app/environment'
import { Buffer } from 'buffer'

if (browser) {
    window.Buffer = Buffer
} else {
    globalThis.Buffer = Buffer
    globalThis.window = {}
}
export default globalThis
