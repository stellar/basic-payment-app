import { describe, it, expect, vi } from 'vitest';
import { fetchAccountBalances } from '../stellar/horizonQueries';
// @ts-ignore
import { Server, StrKey } from 'stellar-sdk';

vi.mock('stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...(typeof actual === 'object' && actual !== null ? actual : {}),
    Server: vi.fn().mockImplementation(() => ({
      accounts: () => ({
        accountId: () => ({
          call: vi.fn().mockResolvedValue({
            id: 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB',
            balances: [
              { asset_type: 'native', balance: '1000.0000000' },
              { asset_type: 'credit_alphanum4', asset_code: 'USD', balance: '500.0000000' }
            ]
          }),
        }),
      }),
    })),
    StrKey: {
      isValidEd25519PublicKey: vi.fn().mockReturnValue(true),
    },
  };
});

describe('fetchAccountBalances', () => {
  it('should return account balances for a valid public key', async () => {
    const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';
    
    const expectedBalances = [
      { asset_type: 'native', balance: '1000.0000000' },
      { asset_type: 'credit_alphanum4', asset_code: 'USD', balance: '500.0000000' }
    ];

    const result = await fetchAccountBalances(publicKey);
    expect(result).toEqual(expectedBalances);
  });
});