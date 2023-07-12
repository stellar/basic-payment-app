<script>
    import { page } from '$app/stores'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    console.log('routes/dashboard/components/RecentPayments.svelte page', $page)
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
        {#each $page.data.payments as payment}
            <tr>
                <th>
                    {#if payment.amount}
                        {parseFloat(payment.amount).toFixed(2)}
                    {:else if payment.starting_balance}
                        {parseFloat(payment.starting_balance).toFixed(2)}
                    {:else if payment.type === 'account_merge'}
                        {#await payment.effects() then effects}
                            {#each effects.records.filter((e) => e.type === 'account_credited') as effect}
                                {parseFloat(effect.amount).toFixed(2)}
                            {/each}
                        {/await}
                    {/if}
                </th>
                <td>
                    {#if payment.type === 'create_account' || payment.asset_type === 'native' || payment.type === 'account_merge'}
                        XLM
                    {:else}
                        {payment.asset_code}
                    {/if}
                </td>
                <td>
                    {#if payment.to === $page.data.publicKey || ('funder' in payment && payment.funder !== $page.data.publicKey) || ('into' in payment && payment.into === $page.data.publicKey)}
                        Received
                    {:else}
                        Sent
                    {/if}
                </td>
                <td>
                    {#if 'to' in payment}
                        {#if payment.to === $page.data.publicKey}
                            <TruncatedKey keyText={payment.from} />
                        {:else}
                            <TruncatedKey keyText={payment.to} />
                        {/if}
                    {:else if 'funder' in payment}
                        {#if payment.funder === $page.data.publicKey}
                            <TruncatedKey keyText={payment.account} />
                        {:else}
                            <TruncatedKey keyText={payment.funder} />
                        {/if}
                    {:else if 'into' in payment}
                        {#if payment.into === $page.data.publicKey}
                            <TruncatedKey keyText={payment.account} />
                        {:else}
                            <TruncatedKey keyText={payment.into} />
                        {/if}
                    {/if}
                </td>
            </tr>
        {/each}
    </tbody>
</table>
