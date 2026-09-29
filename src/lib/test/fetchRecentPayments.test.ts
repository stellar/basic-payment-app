import { describe, it, expect, vi } from 'vitest'
import { fetchRecentPayments } from '../stellar/horizonQueries'

const ME = 'GA3D5NJZSHR2F7MFXO2QZ4QNNIWMY6KLY2MNZVEWEBCMBQ4Y2JRGK2JB'
const FRIEND = 'GABCKCYPAGDDQMSCTMSBO7C2L34NU3XXCW7LR4VVSWCCXMAJY3B4YCZP'
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

// One record of each kind Horizon's `/payments` endpoint can return
const callMock = vi.fn().mockResolvedValue({
    records: [
        {
            id: '1',
            type: 'payment',
            asset_type: 'native',
            amount: '100.0000000',
            from: ME,
            to: FRIEND,
        },
        {
            id: '2',
            type: 'path_payment_strict_send',
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            amount: '5.0000000',
            from: FRIEND,
            to: ME,
        },
        {
            id: '3',
            type: 'create_account',
            starting_balance: '10000.0000000',
            funder: FRIEND,
            account: ME,
        },
        {
            id: '4',
            type: 'account_merge',
            source_account: FRIEND,
            into: ME,
            effects: async () => ({
                records: [
                    { type: 'account_debited', amount: '1.0000000' },
                    { type: 'account_credited', amount: '9999.0000000' },
                ],
            }),
        },
        // An anchor paying out a deposit through USDC's Stellar Asset Contract
        {
            id: '5',
            type: 'invoke_host_function',
            asset_balance_changes: [
                {
                    asset_type: 'credit_alphanum4',
                    asset_code: 'USDC',
                    asset_issuer: USDC_ISSUER,
                    type: 'transfer',
                    from: FRIEND,
                    to: ME,
                    amount: '6.2800004',
                },
            ],
        },
        // A contract call that moved assets between two other accounts
        {
            id: '6',
            type: 'invoke_host_function',
            asset_balance_changes: [
                {
                    asset_type: 'native',
                    type: 'transfer',
                    from: FRIEND,
                    to: USDC_ISSUER,
                    amount: '1.0000000',
                },
            ],
        },
    ],
})

vi.mock('@stellar/stellar-sdk', () => {
    const Server = vi.fn().mockImplementation(function () {
        return {
            payments: () => ({
                forAccount: () => ({
                    limit: () => ({
                        order: () => ({
                            call: callMock,
                        }),
                    }),
                }),
            }),
        }
    })

    return {
        Horizon: { Server },
        StrKey: {
            isValidEd25519PublicKey: vi.fn().mockReturnValue(true),
        },
    }
})

describe('fetchRecentPayments', () => {
    it('turns each kind of payment record into a row for this account', async () => {
        const payments = await fetchRecentPayments(ME, 5)

        expect(payments).toEqual([
            { id: '1', amount: '100.0000000', asset: 'XLM', direction: 'Sent', address: FRIEND },
            { id: '2', amount: '5.0000000', asset: 'USDC', direction: 'Received', address: FRIEND },
            {
                id: '3',
                amount: '10000.0000000',
                asset: 'XLM',
                direction: 'Received',
                address: FRIEND,
            },
            {
                id: '4',
                amount: '9999.0000000',
                asset: 'XLM',
                direction: 'Received',
                address: FRIEND,
            },
            {
                id: '5-0',
                amount: '6.2800004',
                asset: 'USDC',
                direction: 'Received',
                address: FRIEND,
            },
        ])

        expect(callMock).toHaveBeenCalled()
    })
})
