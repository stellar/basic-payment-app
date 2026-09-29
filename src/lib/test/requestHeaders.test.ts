import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initiateTransfer6, getTransferStatus6, queryTransfers6 } from '../stellar/sep6'
import { getSep12Fields, deleteSep12Customer } from '../stellar/sep12'
import { queryTransfers24 } from '../stellar/sep24'

// Point every anchor lookup at a made-up server, instead of fetching a real
// stellar.toml
vi.mock('$lib/stellar/sep1', () => ({
    getTransferServerSep6: async () => 'https://anchor.example/sep6',
    getTransferServerSep24: async () => 'https://anchor.example/sep24',
    getKycServer: async () => 'https://anchor.example/sep12',
}))

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
    fetchMock = vi.fn(
        async () => new Response(JSON.stringify({ transactions: [], transaction: {} })),
    )
    vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
    vi.unstubAllGlobals()
})

// `Content-Type` describes a request's body. Some anchors reject a request
// that has the header but no body (testanchor's SEP-24 server responds with
// "Your request body is wrong in some way.")
describe('requests without a body', () => {
    const authToken = 'token'
    const requests = {
        initiateTransfer6: () =>
            initiateTransfer6({
                authToken,
                endpoint: 'withdraw',
                formData: { asset_code: 'SRT' },
                domain: 'anchor.example',
            }),
        getTransferStatus6: () =>
            getTransferStatus6({ authToken, transferId: '1', domain: 'anchor.example' }),
        queryTransfers6: () =>
            queryTransfers6({
                authToken,
                assetCode: 'SRT',
                publicKey: 'GABC',
                homeDomain: 'anchor.example',
            }),
        getSep12Fields: () => getSep12Fields({ authToken, homeDomain: 'anchor.example' }),
        deleteSep12Customer: () =>
            deleteSep12Customer({ authToken, publicKey: 'GABC', homeDomain: 'anchor.example' }),
        queryTransfers24: () =>
            queryTransfers24({ authToken, assetCode: 'SRT', homeDomain: 'anchor.example' }),
    }

    for (const [name, request] of Object.entries(requests)) {
        it(`${name} does not send a Content-Type header`, async () => {
            await request()
            const init: RequestInit = fetchMock.mock.calls[0][1]
            const headers = new Headers(init.headers)
            expect(init.body).toBeUndefined()
            expect(headers.has('Content-Type')).toBe(false)
            expect(headers.get('Authorization')).toBe('Bearer token')
        })
    }
})
