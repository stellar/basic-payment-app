<!--
@component

The `AssetStats` component implements a chunk of statistics that we can display
to the user on the `/dashboard` page. We are showing the user the asset balances
for each asset they hold a trustline to.
-->

<script>
    // We import the `page` store into this component so we can access the
    // loaded data the `+page.svelte` file has access to without having to pass
    // props to this component
    import { page } from '$app/stores'
</script>

<h3>Assets Overview</h3>
<div class="stats stats-vertical w-full bg-primary text-primary-content shadow lg:stats-horizontal">
    {#each $page.data.balances as balance}
        <div class="stat">
            <div class="stat-title">{balance.asset_code ?? 'XLM'} Balance</div>
            <div class="stat-value">
                {parseFloat(balance.balance).toFixed(2)}
                {balance.asset_code ?? 'XLM'}
            </div>
        </div>
    {/each}
</div>
