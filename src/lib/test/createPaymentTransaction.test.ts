import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPaymentTransaction } from '../stellar/transactions'
import { Asset, Claimant, Operation } from '@stellar/stellar-sdk'

// Spy on Operation methods
vi.spyOn(Operation, 'createClaimableBalance')
vi.spyOn(Operation, 'payment')

// Mock server and TransactionBuilder
const addOperationMock = vi.fn().mockReturnThis()
const addMemoMock = vi.fn().mockReturnThis()
const setTimeoutMock = vi.fn().mockReturnThis()
const buildMock = vi.fn().mockReturnValue({
    toXdr: () => 'mock-xdr-base64',
})

const mockSourceAccount = {
    accountId: 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB',
    sequenceNumber: () => '1',
    incrementSequenceNumber: () => {},
}

const loadAccountMock = vi.fn()

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@stellar/stellar-sdk')>()
    return {
        ...actual,
        TransactionBuilder: vi.fn().mockImplementation(function () {
            return {
                addOperation: addOperationMock,
                addMemo: addMemoMock,
                setTimeout: setTimeoutMock,
                build: buildMock,
            }
        }),
        Horizon: {
            ...actual.Horizon,
            Server: vi.fn().mockImplementation(function () {
                return {
                    loadAccount: loadAccountMock,
                }
            }),
        },
    }
})

describe('createPaymentTransaction - claimable balance fallback', () => {
    const source = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB'
    const destination = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    const nonNativeAsset = 'USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
    const amount = '25'

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('creates claimable balance when destination account does not exist (404 error)', async () => {
        loadAccountMock.mockImplementation((id: string) => {
            if (id === source) return Promise.resolve(mockSourceAccount)
            return Promise.reject({ response: { status: 404 } })
        })

        const result = await createPaymentTransaction({
            source,
            destination,
            asset: nonNativeAsset,
            amount,
        })

        expect(Operation.createClaimableBalance).toHaveBeenCalledTimes(1)
        expect(Operation.createClaimableBalance).toHaveBeenCalledWith({
            asset: expect.any(Asset),
            amount: '25',
            claimants: [new Claimant(destination, Claimant.predicateUnconditional())],
        })
        expect(Operation.payment).not.toHaveBeenCalled()
        expect(addOperationMock).toHaveBeenCalledTimes(1)
        expect(result.transaction).toBe('mock-xdr-base64')
    })

    it('creates claimable balance when destination exists but lacks trustline for asset', async () => {
        loadAccountMock.mockImplementation((id: string) => {
            if (id === source) return Promise.resolve(mockSourceAccount)
            return Promise.resolve({
                accountId: destination,
                balances: [{ asset_type: 'native', balance: '100.0000000' }],
            })
        })

        const result = await createPaymentTransaction({
            source,
            destination,
            asset: nonNativeAsset,
            amount,
        })

        expect(Operation.createClaimableBalance).toHaveBeenCalledTimes(1)
        expect(Operation.payment).not.toHaveBeenCalled()
        expect(addOperationMock).toHaveBeenCalledTimes(1)
        expect(result.transaction).toBe('mock-xdr-base64')
    })

    it('creates standard payment operation when destination has a valid trustline', async () => {
        loadAccountMock.mockImplementation((id: string) => {
            if (id === source) return Promise.resolve(mockSourceAccount)
            return Promise.resolve({
                accountId: destination,
                balances: [
                    {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USDC',
                        asset_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
                        balance: '50.0000000',
                    },
                ],
            })
        })

        const result = await createPaymentTransaction({
            source,
            destination,
            asset: nonNativeAsset,
            amount,
        })

        expect(Operation.payment).toHaveBeenCalledTimes(1)
        expect(Operation.payment).toHaveBeenCalledWith({
            destination,
            amount: '25',
            asset: expect.any(Asset),
        })
        expect(Operation.createClaimableBalance).not.toHaveBeenCalled()
        expect(addOperationMock).toHaveBeenCalledTimes(1)
        expect(result.transaction).toBe('mock-xdr-base64')
    })

    it('rethrows non-404 network or server errors', async () => {
        const networkError = { response: { status: 500 }, message: 'Horizon Internal Server Error' }
        loadAccountMock.mockImplementation((id: string) => {
            if (id === source) return Promise.resolve(mockSourceAccount)
            return Promise.reject(networkError)
        })

        await expect(
            createPaymentTransaction({
                source,
                destination,
                asset: nonNativeAsset,
                amount,
            }),
        ).rejects.toEqual(networkError)

        expect(Operation.createClaimableBalance).not.toHaveBeenCalled()
        expect(Operation.payment).not.toHaveBeenCalled()
    })
})
