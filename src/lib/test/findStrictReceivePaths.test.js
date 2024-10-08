import { findStrictReceivePaths, server } from '../stellar/horizonQueries'
import { describe, it, expect, vi } from 'vitest'

// Mock server responses
const mockStrictReceivePaths = vi.fn()

server.strictReceivePaths = mockStrictReceivePaths

describe('findStrictReceivePaths', () => {
    it('should return valid payment paths if available', async () => {
        // Mock the Stellar SDK call
        const mockResponse = {
            records: [
                {
                    source_amount: "100",
                    destination_amount: "10",
                    destination_asset: "native"
                },
            ],
        }

        mockStrictReceivePaths.mockReturnValue({
            call: vi.fn().mockResolvedValue(mockResponse),
        })

        const result = await findStrictReceivePaths({
            sourcePublicKey: 'GXXXXXXXXXXXXX',  // Reemplaza con un valor de prueba
            destinationAsset: 'native',
            destinationAmount: 10,
        })

        expect(result).toEqual(mockResponse.records)
    })

    it('should throw an error if no payment paths are available', async () => {
        mockStrictReceivePaths.mockReturnValue({
            call: vi.fn().mockResolvedValue({ records: [] }),
        })
    
        await expect(findStrictReceivePaths({
            sourcePublicKey: 'GXXXXXXXXXXXXX',
            destinationAsset: 'native',
            destinationAmount: 10,
        })).rejects.toThrow('no strict receive paths available')
    })
    
})
