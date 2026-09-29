import { describe, it, expect, vi } from 'vitest'
import { findStrictReceivePaths, server } from '../stellar/horizonQueries'

vi.restoreAllMocks()

vi.mock('@stellar/stellar-sdk', async () => {
    const actual = await vi.importActual('@stellar/stellar-sdk')

    return {
        ...actual,
    }
})

const mockStrictReceivePaths = vi.fn()
server.strictReceivePaths = mockStrictReceivePaths

describe('findStrictReceivePaths', () => {
    it('should return valid payment paths if available', async () => {
        const mockResponse = {
            records: [
                {
                    source_amount: '100',
                    destination_amount: '10',
                    destination_asset: 'native',
                },
            ],
        }

        mockStrictReceivePaths.mockReturnValue({
            call: vi.fn().mockResolvedValue(mockResponse),
        })

        const result = await findStrictReceivePaths({
            sourcePublicKey: 'GXXXXXXXXXXXXX',
            destinationAsset: 'native',
            destinationAmount: 10,
        })

        expect(result).toEqual(mockResponse.records)
    })

    it('should throw an error if no payment paths are available', async () => {
        mockStrictReceivePaths.mockReturnValue({
            call: vi.fn().mockResolvedValue({ records: [] }),
        })

        await expect(
            findStrictReceivePaths({
                sourcePublicKey: 'GXXXXXXXXXXXXX',
                destinationAsset: 'native',
                destinationAmount: 10,
            }),
        ).rejects.toMatchObject({
            status: 400,
            body: { message: 'no strict receive paths available' },
        })
    })
})
