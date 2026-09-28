/**
 * @module $lib/utils/base64
 * @description Browser-friendly base64 helpers. Node's `Buffer` isn't available
 * in the browser, so we decode with the built-in `atob` function instead.
 */

/**
 * Decodes a base64 string (like a hash memo from an anchor) into raw bytes.
 * @param base64 A base64-encoded string
 * @returns The decoded bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}
