import { fetchAccount, fetchAccountBalances, fetchRecentPayments } from '$lib/stellar/horizonQueries'

/** @type {import ('./$types').LayoutLoad} */
export async function load() {
    const publicKey = 'GAXQIC2BSZ5HZP3BD6RZQSD3LB66TB6A2TA5W3LZX2VDFMBAKHC4B62J'
    return {
        publicKey,
        balances: await fetchAccountBalances(publicKey),
        payments: await fetchRecentPayments(publicKey),
    }
}
