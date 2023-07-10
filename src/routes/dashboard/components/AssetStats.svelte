<script>
    import { page } from '$app/stores'
    console.log('routes/dashboard/components/AssetStates.svelte page', $page)
</script>

<h3>Assets Overview</h3>
<div class="stats stats-vertical lg:stats-horizontal w-full bg-primary text-primary-content shadow">
    {#each $page.data.balances as balance}
        <div class="stat">
            <div class="stat-title">{balance.asset_code ?? 'XLM'} Balance</div>
            <div class="stat-value">
                {parseFloat(balance.balance).toFixed(2)}
                {balance.asset_code ?? 'XLM'}
            </div>
        </div>
    {/each}
    <div class="stat">
        <div class="stat-title">USDC Balance</div>
        <div class="stat-value">$123.45</div>
    </div>
</div>
