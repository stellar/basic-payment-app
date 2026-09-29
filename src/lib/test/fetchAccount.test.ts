import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAccount } from '../stellar/horizonQueries'

vi.mock('@stellar/stellar-sdk', () => {
    const mockServerInstance = {
        accounts: () => ({
            accountId: () => ({
                call: vi.fn().mockResolvedValue({
                    id: 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB',
                    balances: [],
                }),
            }),
        }),
    }

    const Horizon = {
        Server: vi.fn(function () {
            return mockServerInstance
        }),
    }

    return {
        Horizon,
        StrKey: {
            isValidEd25519PublicKey: vi.fn().mockReturnValue(true),
        },
    }
})

describe('fetchAccount', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return account info for a valid public key', async () => {
        // The mocked Horizon server (above) returns this account
        const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB'

        const accountInfo = await fetchAccount(publicKey)
        expect(accountInfo).toEqual({ id: publicKey, balances: [] })
    })

    it('should throw an error for an invalid public key', async () => {
        const invalidPublicKey = 'INVALID_KEY'

        const { StrKey } = await import('@stellar/stellar-sdk')
        vi.mocked(StrKey.isValidEd25519PublicKey).mockReturnValue(false)

        await expect(fetchAccount(invalidPublicKey)).rejects.toMatchObject({
            status: 400,
            body: { message: 'invalid public key' },
        })
    })
})
