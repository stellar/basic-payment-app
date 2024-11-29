import { describe, it, expect, vi } from 'vitest';

const addOperationMock = vi.fn().mockReturnThis();
const addMemoMock = vi.fn().mockReturnThis();
const setTimeoutMock = vi.fn().mockReturnThis();
const buildMock = vi.fn().mockReturnThis();
const loadAccountMock = vi.fn().mockResolvedValue({
  accountId: 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB',
  sequence: '1',
});

vi.mock('@stellar/stellar-sdk', () => {
  return {
    TransactionBuilder: vi.fn().mockImplementation(() => ({
      addOperation: addOperationMock,
      addMemo: addMemoMock,
      setTimeout: setTimeoutMock,
      build: buildMock,
    })),
    Horizon: {
      Server: vi.fn().mockImplementation(() => ({
        loadAccount: loadAccountMock,
      })),
    },
    Networks: {
      TESTNET: 'Test SDF Network ; September 2015',
    },
  };
});

describe('startTransaction', () => {
  it('should initialize a transaction with the correct settings', async () => {
    const { startTransaction } = await import('../stellar/horizonQueries');

    const sourcePublicKey =
      'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';

    const transaction = await startTransaction(sourcePublicKey);

    expect(loadAccountMock).toHaveBeenCalledWith(sourcePublicKey);

    const { TransactionBuilder } = await import('@stellar/stellar-sdk');
    expect(TransactionBuilder).toHaveBeenCalledWith(
      { accountId: sourcePublicKey, sequence: '1' },
      {
        networkPassphrase: 'Test SDF Network ; September 2015',
        fee: '100000',
      }
    );

    expect(transaction.addOperation).not.toHaveBeenCalled();
    expect(transaction.addMemo).not.toHaveBeenCalled();
    expect(transaction.setTimeout).not.toHaveBeenCalled();
    expect(transaction.build).not.toHaveBeenCalled();
  });
});
