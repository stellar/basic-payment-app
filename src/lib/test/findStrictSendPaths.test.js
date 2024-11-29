import { describe, it, expect, vi } from 'vitest';
import { findStrictSendPaths, server } from '../stellar/horizonQueries';
import { Asset } from '@stellar/stellar-sdk';

const mockServer = {
    strictSendPaths: vi.fn().mockReturnThis(),
    call: vi.fn(),
};

mockServer.strictSendPaths.mockImplementation(() => ({
    call: mockServer.call
}));

server.strictSendPaths = mockServer.strictSendPaths;

describe('findStrictSendPaths', () => {
    it('should return valid payment paths when available', async () => {
        const mockResponse = {
            records: [
                { id: 1, path: 'path1' },
                { id: 2, path: 'path2' }
            ]
        };

        mockServer.call.mockResolvedValue(mockResponse);

        const sourceAsset = 'native';
        const sourceAmount = 100;
        const destinationPublicKey = 'GD6OW23WYT...';

        const result = await findStrictSendPaths({
            sourceAsset,
            sourceAmount,
            destinationPublicKey
        });

        expect(result).toEqual(mockResponse.records);
        expect(mockServer.strictSendPaths).toHaveBeenCalledWith(Asset.native(), sourceAmount.toString(), destinationPublicKey);
        expect(mockServer.call).toHaveBeenCalled();
    });
});
