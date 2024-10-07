import { describe, it, expect, vi } from 'vitest';
import { submit, server } from '../stellar/horizonQueries'; // Adjust the path as necessary

describe('submit', () => {
  it('should submit the transaction successfully', async () => {
    // Create a mock transaction object
    const transaction = {
      // Add necessary properties if required by your implementation
      toXDR: () => 'transactionXDR',
    };

    // Mock server.submitTransaction to resolve successfully
    const submitTransactionMock = vi
      .spyOn(server, 'submitTransaction')
      .mockResolvedValue({
          // Simulate a successful response (you can adjust the values)
          hash: 'fakeTransactionHash',
          ledger: 123456,
          successful: false,
          envelope_xdr: '',
          result_xdr: '',
          result_meta_xdr: ''
      });

    // Call the function under test and ensure it doesn't throw
    // @ts-ignore
    await expect(submit(transaction)).resolves.not.toThrow();

    // Verify that server.submitTransaction was called with the correct transaction
    expect(submitTransactionMock).toHaveBeenCalledWith(transaction);

    // Clean up mocks
    submitTransactionMock.mockRestore();
  });
});