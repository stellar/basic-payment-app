import { describe, it, expect, vi } from 'vitest';
import { submit, server } from '../stellar/horizonQueries'; 

describe('submit', () => {
  it('should submit the transaction successfully', async () => {

    const transaction = {

      toXDR: () => 'transactionXDR',
    };

    const submitTransactionMock = vi
      .spyOn(server, 'submitTransaction')
      .mockResolvedValue({
        hash: 'fakeTransactionHash',
        ledger: 123456,
        successful: false,
        envelope_xdr: '',
        result_xdr: '',
        result_meta_xdr: '',
        paging_token: ''
      });

    // @ts-ignore
    await expect(submit(transaction)).resolves.not.toThrow();

    expect(submitTransactionMock).toHaveBeenCalledWith(transaction);

    submitTransactionMock.mockRestore();
  });
});