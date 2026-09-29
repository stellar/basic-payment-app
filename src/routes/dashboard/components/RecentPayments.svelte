<!--
@component

The `RecentPayments` component will display to the user relevant information
about any recent payments that have been made to or from their account.

The data is loaded in the dashboard's `+layout.ts` load function, using
`fetchRecentPayments` from `$lib/stellar/horizonQueries`. That function queries
Horizon's `/payments` endpoint and turns each record (regular payments, path
payments, account creations and merges, and smart contract transfers) into a
simple row for this table.
-->

<script lang="ts">
    // We import any Svelte components we will need
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { page } from '$app/state'
</script>

<h3>Recent Payments</h3>
<table class="table">
    <thead>
        <tr>
            <th>Amount</th>
            <th>Asset</th>
            <th>Direction</th>
            <th>Address</th>
        </tr>
    </thead>
    <tbody>
        {#each page.data.payments as payment (payment.id)}
            <tr>
                <th class="align-middle">{parseFloat(payment.amount).toFixed(2)}</th>
                <td class="align-middle">{payment.asset}</td>
                <td class="align-middle">{payment.direction}</td>
                <td class="align-middle"><TruncatedKey keyText={payment.address} /></td>
            </tr>
        {/each}
    </tbody>
</table>
