import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAccount } from '../stellar/horizonQueries';

vi.mock('@sveltejs/kit', () => {
  return {
    // @ts-ignore
    error: (status, { message }) => {
      const err = new Error(message);
      // @ts-ignore
      err.status = status;
      // @ts-ignore
      err.body = { message };
      return err;
    },
  };
});

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
  };

  const Horizon = {
    Server: vi.fn(() => mockServerInstance),
  };

  return {
    Horizon,
    StrKey: {
      isValidEd25519PublicKey: vi.fn().mockReturnValue(true),
    },
  };
});

describe('fetchAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return account info for a valid public key', async () => {
    const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';
    const mockServerResponse = {
      id: publicKey,
      balances: [],
    };

    const { Horizon } = await import('@stellar/stellar-sdk');
    // @ts-ignore
    Horizon.Server.mockImplementation(() => ({
      accounts: () => ({
        accountId: () => ({
          call: vi.fn().mockResolvedValue(mockServerResponse),
        }),
      }),
    }));

    const accountInfo = await fetchAccount(publicKey);
    expect(accountInfo).toEqual(mockServerResponse);
  });

  it('should throw an error for an invalid public key', async () => {
    const invalidPublicKey = 'INVALID_KEY';

    const { StrKey } = await import('@stellar/stellar-sdk');
    // @ts-ignore
    StrKey.isValidEd25519PublicKey.mockReturnValue(false);

    await expect(fetchAccount(invalidPublicKey)).rejects.toThrow('invalid public key');
  });
});
