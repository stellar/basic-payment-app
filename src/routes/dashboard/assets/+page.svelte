<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/assets/+page.svelte data', data)

    import { fetchAssets } from '$lib/utils/stellarExpert'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import { Trash2Icon } from 'svelte-feather-icons'

    let addAsset = ''
    let customAssetCode = ''
    let customAssetIssuer = ''
    $: assetCode = addAsset ? addAsset.split('-')[0] : customAssetCode ?? ''
    $: assetIssuer = addAsset ? addAsset.split('-')[1] : customAssetIssuer ?? ''
</script>

<h1>Assets</h1>
<p>Here we will manage our assets!</p>

<h3>Add Trusted Assets</h3>
<p>Add a trustline on your account, allowing you to hold the specified asset.</p>

<select class="select-bordered select my-2 w-full" bind:value={addAsset}>
    <option disabled selected value="">Select Asset</option>
    <option disabled
        >These two assets are issued by the SDF testanchor, and are great for using in tests</option
    >
    <option value="SRT-GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B"
        >testanchor SRT-GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B</option
    >
    <option value="USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
        >testanchor USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5</option
    >
    {#await fetchAssets() then assets}
        <option disabled
            >The following assets have been ranked by Stellar.Expert to be high-quality</option
        >
        {#each assets as { asset }}
            <option value={asset}>{asset}</option>
        {/each}
    {/await}
    <option disabled>Need something else?</option>
    <option value="custom">Custom asset...</option>
</select>
{#if addAsset === 'custom'}
    <div class="join my-2 w-full flex-wrap">
        <input
            type="text"
            class="input-bordered input join-item grow"
            placeholder="Asset Code"
            bind:value={customAssetCode}
        />
        <input
            type="text"
            class="input-bordered input join-item grow"
            placeholder="Asset Issuer"
            bind:value={customAssetIssuer}
        />
    </div>
{/if}
<button class="btn-primary btn-block btn my-2">Add Asset</button>

<h3>Existing Balances</h3>
<p>View, edit, or remove asset trustlines on your Stellar account.</p>

<div class="flex items-center">
    <table class="table table-auto">
        <thead>
            <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th class="w-xs">Issuer</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each data.balances as balance}
                <tr>
                    <th>
                        {#if 'asset_code' in balance}
                            {balance.asset_code}
                        {:else}
                            XLM
                        {/if}
                    </th>
                    <td>{balance.balance}</td>
                    <td>
                        {#if 'asset_issuer' in balance}
                            <TruncatedKey keyText={balance.asset_issuer} />
                        {:else}
                            n/a
                        {/if}
                    </td>
                    <td>
                        {#if balance.asset_type !== 'native'}
                            <button class="btn btn-error btn-sm btn-square"><Trash2Icon size="16" /></button>
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
