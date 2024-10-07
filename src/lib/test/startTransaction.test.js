import { describe, it, expect, vi } from 'vitest';

// Step 1: Mock 'stellar-sdk' before importing 'horizonQueries.js'
vi.mock('stellar-sdk', async () => {
  // Import the actual module to retain other exports
  const actual = await vi.importActual('stellar-sdk');

  // Step 2: Define the mock for TransactionBuilder
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

// Now import 'startTransaction' after mocking 'stellar-sdk'
import { startTransaction, server } from '../stellar/horizonQueries';
import { Networks } from 'stellar-sdk';

describe('startTransaction', () => {
  it('should initialize a transaction with the correct settings', async () => {
    const sourcePublicKey =
      'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB';

    // Mock 'server.loadAccount'
    const loadAccountMock = vi.fn().mockResolvedValue({
      accountId: sourcePublicKey,
      sequence: '1', // Simulate a simple sequence
    });

    vi.spyOn(server, 'loadAccount').mockImplementation(loadAccountMock);

    // Call the function under test
    const transaction = await startTransaction(sourcePublicKey);

    // Verify that 'loadAccount' was called with the correct publicKey
    expect(loadAccountMock).toHaveBeenCalledWith(sourcePublicKey);

    // Verify that 'TransactionBuilder' was called with correct arguments
    const { TransactionBuilder } = await import('stellar-sdk');
    expect(TransactionBuilder).toHaveBeenCalledWith(
      { accountId: sourcePublicKey, sequence: '1' },
      {
        networkPassphrase: Networks.TESTNET,
        fee: '100000',
      }
    );

    // Verify that the chained methods were called
    expect(transaction.addOperation).not.toHaveBeenCalled(); // Assuming no operations added yet
    expect(transaction.addMemo).not.toHaveBeenCalled(); // Assuming no memo added yet
    expect(transaction.setTimeout).not.toHaveBeenCalled(); // Assuming setTimeout not called yet
    expect(transaction.build).not.toHaveBeenCalled(); // Assuming build not called yet

    // Clean up mocks after the test
    vi.restoreAllMocks();
  });
});
