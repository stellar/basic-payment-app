import { describe, it, expect, vi } from 'vitest';
import { fetchRecentPayments } from '../stellar/horizonQueries';

const callMock = vi.fn().mockResolvedValue({
  records: [
    { id: '1', type: 'payment', amount: '100' },
    { id: '2', type: 'payment', amount: '200' },
  ],
});

vi.mock('@stellar/stellar-sdk', () => {
  const Server = vi.fn().mockImplementation(() => ({
    payments: () => ({
      forAccount: () => ({
        limit: () => ({
          order: () => ({
            call: callMock,
          }),
        }),
      }),
    }),
  }));

  return {
    Horizon: { Server }, 
    StrKey: {
      isValidEd25519PublicKey: vi.fn().mockReturnValue(true),
    },
  };
});

describe('fetchRecentPayments', () => {
  it('should return an array of recent payments for a valid public key', async () => {
    const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';
    const limit = 5;

    const payments = await fetchRecentPayments(publicKey, limit);

    expect(payments).toEqual([
      { id: '1', type: 'payment', amount: '100' },
      { id: '2', type: 'payment', amount: '200' },
    ]);

    expect(callMock).toHaveBeenCalled();
  });
});
