import { describe, it, expect, vi } from 'vitest'
import type { Transaction } from '@stellar/stellar-sdk'
import { submit, server } from '../stellar/horizonQueries'

describe('submit', () => {
    it('should submit the transaction successfully', async () => {
        // `submit()` hands the transaction straight to Horizon (which we mock
        // below), so a stand-in object is enough here
        const transaction = {
            toXdr: () => 'transactionXDR',
        } as unknown as Transaction

        const submitTransactionMock = vi.spyOn(server, 'submitTransaction').mockResolvedValue({
            hash: 'fakeTransactionHash',
            ledger: 123456,
            successful: false,
            envelope_xdr: '',
            result_xdr: '',
            result_meta_xdr: '',
            paging_token: '',
        })

        await expect(submit(transaction)).resolves.not.toThrow()

        expect(submitTransactionMock).toHaveBeenCalledWith(transaction)

        submitTransactionMock.mockRestore()
    })
})
