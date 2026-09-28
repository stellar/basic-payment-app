import { describe, it, expect } from 'vitest'
import { buildMemo } from '../stellar/transactions'

describe('buildMemo', () => {
    it('builds an id memo, like testanchor asks for on withdrawals', () => {
        const memo = buildMemo('9139243641329173254', 'id')
        expect(memo.type).toBe('id')
        expect(memo.value).toBe('9139243641329173254')
    })

    it('builds a hash memo from a base64-encoded value', () => {
        const bytes = new Uint8Array(32).map((_, i) => i)
        const memo = buildMemo(btoa(String.fromCharCode(...bytes)), 'hash')
        expect(memo.type).toBe('hash')
        expect(memo.value).toEqual(bytes)
    })

    it('builds a text memo by default', () => {
        const memo = buildMemo('hello')
        expect(memo.type).toBe('text')
        expect(memo.value).toBe('hello')
    })

    it('rejects an id memo that is not a number', () => {
        expect(() => buildMemo('not-a-number', 'id')).toThrow()
    })
})
