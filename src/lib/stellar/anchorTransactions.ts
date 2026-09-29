import type { MemoType } from '$lib/stellar/transactions'

/**
 * @module $lib/stellar/anchorTransactions
 * @description SEP-6 and SEP-24 both describe a transfer with the same
 * transaction object. Wallets keep checking that transaction (through the
 * anchor's `/transaction` endpoint) to find out what happens next.
 * @see {@link https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#guidance-for-wallets-completing-an-interactive-withdrawal}
 * @see {@link https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#guidance-for-wallets-completing-a-transaction}
 */

/** The parts of an anchor's transaction object that we use */
export interface AnchorTransaction {
    /** The anchor's unique identifier for this transfer */
    id: string
    /** Whether this is a `deposit` or `withdrawal` (SEP-6 may also use `deposit-exchange` or `withdrawal-exchange`) */
    kind: string
    /** Where the transfer is at (e.g., `incomplete`, `pending_user_transfer_start`, or `completed`) */
    status: string
    /** A human-readable explanation of the transfer's status */
    message?: string
    /** When the transfer was started (an ISO 8601 date string) */
    started_at?: string
    /** Hash of the Stellar transaction that moved the funds, once there is one */
    stellar_transaction_id?: string
    /** A page where the user can learn more about their transfer */
    more_info_url?: string
    /** Amount received by the anchor */
    amount_in?: string
    /** Amount sent by the anchor to the user */
    amount_out?: string
    /** Amount of fees the anchor charged */
    amount_fee?: string
    /** The (possibly masked) external account the funds are going to */
    to?: string
    /** The bank or store name the funds are going to */
    external_extra_text?: string
    /** For withdrawals, the Stellar account the user should pay */
    withdraw_anchor_account?: string
    /** For withdrawals, the memo the user should attach to their payment */
    withdraw_memo?: string
    /** For withdrawals, what kind of memo `withdraw_memo` is */
    withdraw_memo_type?: MemoType
    /** For SEP-6 deposits, how the user should send the anchor their funds */
    instructions?: Record<string, { value: string; description: string }>
}

/** Statuses after which nothing else will happen to a transfer */
export const FINAL_STATUSES = [
    'completed',
    'refunded',
    'expired',
    'error',
    'no_market',
    'too_small',
    'too_large',
]
