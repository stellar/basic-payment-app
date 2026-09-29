import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { wallet } from '../state/Wallet.svelte'
import { webAuth } from '../state/WebAuth.svelte'
import { transfers } from '../state/Transfers.svelte'
import { kyc } from '../state/Kyc.svelte'

// A minimal, in-memory stand-in for the browser's `localStorage`
function createFakeStorage() {
    const items = new Map<string, string>()
    return {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => items.set(key, String(value)),
        removeItem: (key: string) => items.delete(key),
    }
}

// Builds an (unsigned) JWT whose payload is base64url-encoded, like real ones
function fakeJwt(payload: object) {
    const base64url = (s: string) =>
        btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return `${base64url('{"alg":"none"}')}.${base64url(JSON.stringify(payload))}.`
}

let storage: ReturnType<typeof createFakeStorage>

beforeEach(() => {
    storage = createFakeStorage()
    vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('wallet', () => {
    it('is not a wallet user before anyone has signed up', () => {
        expect(wallet.publicKey).toBe('')
        expect(wallet.isWalletUser).toBe(false)
    })

    it('treats a connected wallet as a wallet user', () => {
        wallet.connectWallet({ publicKey: 'GABC' })
        expect(wallet.publicKey).toBe('GABC')
        expect(wallet.isWalletUser).toBe(true)
        expect(JSON.parse(storage.getItem('bpa:walletStore')!)).toEqual({
            keyId: 'GABC',
            publicKey: 'GABC',
        })
    })

    it('does not treat a stored keypair as a wallet user', () => {
        storage.setItem(
            'bpa:walletStore',
            JSON.stringify({ keyId: 'some-key-id', publicKey: 'GABC' }),
        )
        expect(wallet.isWalletUser).toBe(false)
    })

    it('rejects mismatched pincodes during signup', async () => {
        await expect(
            wallet.confirmPincode({ pincode: '123456', firstPincode: '654321', signup: true }),
        ).rejects.toMatchObject({ body: { message: 'pincode mismatch' } })
        await expect(
            wallet.confirmPincode({ pincode: '123456', firstPincode: '123456', signup: true }),
        ).resolves.toBeUndefined()
    })
})

describe('webAuth', () => {
    it('stores a token per home domain', () => {
        webAuth.setAuth('anchor.example', 'token-a')
        expect(webAuth.getToken('anchor.example')).toBe('token-a')
        expect(JSON.parse(storage.getItem('bpa:webAuthStore')!)).toEqual({
            'anchor.example': 'token-a',
        })
    })

    it('throws a helpful error when a required token is missing', () => {
        expect(() => webAuth.requireToken('anchor.example')).toThrow()
        try {
            webAuth.requireToken('anchor.example')
        } catch (err) {
            expect(err).toMatchObject({
                body: { message: 'Please authenticate with anchor.example first' },
            })
        }
    })

    it('detects expired and unexpired tokens', () => {
        const now = Math.floor(Date.now() / 1000)
        webAuth.setAuth('expired.example', fakeJwt({ exp: now - 60 }))
        webAuth.setAuth('valid.example', fakeJwt({ exp: now + 3600 }))

        expect(webAuth.isTokenExpired('expired.example')).toBe(true)
        expect(webAuth.isTokenExpired('valid.example')).toBe(false)
        expect(webAuth.isTokenExpired('unknown.example')).toBeUndefined()
    })

    it('decodes base64url characters in the token payload', () => {
        // This payload encodes to base64 containing `+` and `/`, which JWTs
        // replace with `-` and `_`
        const exp = Math.floor(Date.now() / 1000) + 3600
        const token = fakeJwt({ exp, sub: '??>>??>>' })
        expect(token.split('.')[1]).toMatch(/[-_]/)

        webAuth.setAuth('anchor.example', token)
        expect(webAuth.isTokenExpired('anchor.example')).toBe(false)
    })
})

describe('transfers', () => {
    it('groups transfers by home domain and protocol', () => {
        transfers.addTransfer({
            homeDomain: 'anchor.example',
            protocol: 'sep24',
            assetCode: 'USDC',
            transferID: '1',
        })
        transfers.addTransfer({
            homeDomain: 'anchor.example',
            protocol: 'sep24',
            assetCode: 'USDC',
            transferID: '2',
        })
        transfers.addTransfer({
            homeDomain: 'anchor.example',
            protocol: 'sep6',
            assetCode: 'SRT',
            transferID: '3',
        })

        expect(JSON.parse(storage.getItem('bpa:transfersStore')!)).toEqual({
            'anchor.example': {
                sep24: [
                    { id: '1', asset_code: 'USDC' },
                    { id: '2', asset_code: 'USDC' },
                ],
                sep6: [{ id: '3', asset_code: 'SRT' }],
            },
        })
    })
})

describe('kyc', () => {
    it('persists changes to individual fields', () => {
        kyc.fields.first_name = 'Ada'
        expect(JSON.parse(storage.getItem('bpa:kycStore')!).first_name).toBe('Ada')
        expect(kyc.fields.last_name).toBe('')
    })
})
