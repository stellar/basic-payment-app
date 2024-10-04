import { describe, it, expect, vi } from 'vitest';
import { fetchAccount, fetchAccountBalances } from '../stellar/horizonQueries'; 
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
            balances: [],   
          }),
        }),
      }),
    })),
    StrKey: {
      isValidEd25519PublicKey: vi.fn().mockReturnValue(true), 
    },
  };
});

describe('fetchAccount', () => {
    it('should return account info for a valid public key', async () => {
      const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB'; 
      const accountInfo = await fetchAccount(publicKey);
  
      expect(accountInfo).toHaveProperty('id');
      expect(accountInfo.id).toBe(publicKey);   
    });
  
    it('should throw an error for an invalid public key', async () => {
      const spy = vi.spyOn(StrKey, 'isValidEd25519PublicKey').mockReturnValue(false);
  
      const invalidPublicKey = 'INVALID_KEY'; 
  
      try {
        await fetchAccount(invalidPublicKey);
      } catch (err) {
        // @ts-ignore
        if (err && typeof err === 'object' && err.body && typeof err.body.message === 'string') {
          // @ts-ignore
          expect(err.body.message).toBe('invalid public key');
        } else {
          throw new Error('Error structure does not match the expected format');
        }
      }
      spy.mockRestore();
    });
  
    it('should throw a general error when the server responds with a non-404 error', async () => {
      const spy = vi.spyOn(StrKey, 'isValidEd25519PublicKey').mockReturnValue(true);
  
      const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';
  
        vi.mocked(Server).mockImplementation(() => ({
            accounts: () => ({
            // @ts-ignore
            accountId: () => ({
                call: vi.fn().mockRejectedValue({
                response: {
                    status: 500,
                    title: 'Internal Server Error',
                    detail: 'Something went wrong',
                },
                }),
            }),
            }),
        }));

      try {
        await fetchAccount(publicKey);
      } catch (err) {
        // @ts-ignore
        expect(err.body.message).toBe('Internal Server Error - Something went wrong');
      }
  
      spy.mockRestore();
    });
});

describe('fetchRecentPayments', () => {
  it('should return an array of recent payments for a valid public key', async () => {
    const publicKey = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';
    const limit = 5;

    const strKeyMock = vi.spyOn(StrKey, 'isValidEd25519PublicKey').mockReturnValue(true);

    const callMock = vi.fn().mockResolvedValue({
      records: [
        // Simulamos registros de pagos
        { id: '1', type: 'payment', amount: '100' },
        { id: '2', type: 'payment', amount: '200' },
      ],
    });
    const orderMock = vi.fn(() => ({ call: callMock }));
    const limitMock = vi.fn(() => ({ order: orderMock }));
    const forAccountMock = vi.fn(() => ({ limit: limitMock }));
    const paymentsMock = vi.fn(() => ({ forAccount: forAccountMock }));

    const serverMock = {
      payments: paymentsMock,
    };

    vi.mock('../stellar/horizonQueries', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...(typeof actual === 'object' && actual !== null ? actual : {}),
        server: serverMock,
      };
    });

    const { fetchRecentPayments } = await import('../stellar/horizonQueries');

    const payments = await fetchRecentPayments(publicKey, limit);

    expect(payments).toEqual([
      { id: '1', type: 'payment', amount: '100' },
      { id: '2', type: 'payment', amount: '200' },
    ]);

    expect(paymentsMock).toHaveBeenCalled();
    expect(forAccountMock).toHaveBeenCalledWith(publicKey);
    expect(limitMock).toHaveBeenCalledWith(limit);
    expect(orderMock).toHaveBeenCalledWith('desc');
    expect(callMock).toHaveBeenCalled();

    strKeyMock.mockRestore();
    vi.restoreAllMocks();
  });
});