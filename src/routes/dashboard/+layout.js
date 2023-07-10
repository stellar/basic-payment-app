import { fetchAccount, getAccountBalances } from '$lib/stellar/horizonQueries'

/** @type {import ('./$types').LayoutLoad} */
export async function load() {
    return {
        balances: await getAccountBalances('GAXQIC2BSZ5HZP3BD6RZQSD3LB66TB6A2TA5W3LZX2VDFMBAKHC4B62J')
    }
}
