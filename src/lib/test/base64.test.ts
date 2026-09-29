import { describe, it, expect } from 'vitest'
import { Memo } from '@stellar/stellar-sdk'
import { base64ToBytes } from '../utils/base64'

describe('base64ToBytes', () => {
    it('decodes base64 into the original bytes', () => {
        expect(base64ToBytes('AAEC/w==')).toEqual(new Uint8Array([0, 1, 2, 255]))
    })

    it('turns an anchor-provided hash memo into a matching Memo.hash', () => {
        // Anchors give withdraw memos as base64-encoded 32-byte hashes
        const bytes = new Uint8Array(32).map((_, i) => (i * 37) % 256)
        const anchorMemo = btoa(String.fromCharCode(...bytes))

        const memo = Memo.hash(base64ToBytes(anchorMemo))

        expect(memo.type).toBe('hash')
        expect(memo.value).toEqual(bytes)
    })
})
