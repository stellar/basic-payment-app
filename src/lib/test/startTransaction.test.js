import { describe, it, expect, vi } from 'vitest';
import { startTransaction, server } from '../stellar/horizonQueries';
import { Networks } from 'stellar-sdk';

vi.mock('stellar-sdk', async () => {

  const actual = await vi.importActual('stellar-sdk');

  const addOperationMock = vi.fn().mockReturnThis();
  const addMemoMock = vi.fn().mockReturnThis();
  const setTimeoutMock = vi.fn().mockReturnThis();
  const buildMock = vi.fn().mockReturnThis();

  const transactionBuilderMock = vi.fn().mockImplementation(() => ({
    addOperation: addOperationMock,
    addMemo: addMemoMock,
    setTimeout: setTimeoutMock,
    build: buildMock,
  }));

  return {
    ...actual,
    TransactionBuilder: transactionBuilderMock,
  };
});

describe('startTransaction', () => {
  it('should initialize a transaction with the correct settings', async () => {
    const sourcePublicKey =
      'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';

    const loadAccountMock = vi.fn().mockResolvedValue({
      accountId: sourcePublicKey,
      sequence: '1', 
    });

    vi.spyOn(server, 'loadAccount').mockImplementation(loadAccountMock);

    const transaction = await startTransaction(sourcePublicKey);

    expect(loadAccountMock).toHaveBeenCalledWith(sourcePublicKey);

    const { TransactionBuilder } = await import('stellar-sdk');
    expect(TransactionBuilder).toHaveBeenCalledWith(
      { accountId: sourcePublicKey, sequence: '1' },
      {
        networkPassphrase: Networks.TESTNET,
        fee: '100000',
      }
    );

    expect(transaction.addOperation).not.toHaveBeenCalled(); 
    expect(transaction.addMemo).not.toHaveBeenCalled(); 
    expect(transaction.setTimeout).not.toHaveBeenCalled(); 
    expect(transaction.build).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
