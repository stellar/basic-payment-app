<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/assets/+page.svelte data', data)

    import { fetchAssets } from '$lib/utils/stellarExpert'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import { Trash2Icon } from 'svelte-feather-icons'

    import { createChangeTrustTransaction } from '$lib/stellar/transactions'
    import { getContext } from 'svelte'
    import { walletStore } from '$lib/stores/walletStore'
    import { submit } from '$lib/stellar/horizonQueries'
    const { open } = getContext('simple-modal')

    let addAsset = ''
    let customAssetCode = ''
    let customAssetIssuer = ''
    let asset = ''
    $: asset = addAsset !== 'custom' ? addAsset : `${customAssetCode}:${customAssetIssuer}`
    let changeTrustXDR = ''
    let changeTrustNetwork = ''

    /** @param {string} pincode Pincode that was confirmed by the modal window */
    const onConfirm = async (pincode) => {
        let signedTransaction = await walletStore.sign({
            transactionXDR: changeTrustXDR,
            network: changeTrustNetwork,
            pincode: pincode,
        })
        await submit(signedTransaction)
    }

    const previewChangeTrustTransaction = async (addingAsset = true, removeAsset = null) => {
        let txOpts = {}
        txOpts.source = data.publicKey
        txOpts.asset = removeAsset ?? asset

        if (!addingAsset) {
            txOpts.limit = '0'
        }

        let { transaction, network_passphrase } = await createChangeTrustTransaction({
            ...txOpts,
        })

        changeTrustXDR = transaction
        changeTrustNetwork = network_passphrase

        open(ConfirmationModal, {
            transactionXDR: transaction,
            transactionNetwork: network_passphrase,
            onConfirm: onConfirm,
        })
    }
</script>

<h1>Assets</h1>

<h2>Add Trusted Assets</h2>
<p>Add a trustline on your account, allowing you to hold the specified asset.</p>

<select class="select-bordered select my-2 w-full" bind:value={addAsset}>
    <option disabled selected value="">Select Asset</option>
    <option disabled
        >These two assets are issued by the SDF testanchor, and are great for using in tests</option
    >
    <option value="SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B"
        >testanchor SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B</option
    >
    <option value="USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
        >testanchor USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5</option
    >
    {#await fetchAssets() then assets}
        <option disabled
            >The following assets have been ranked by Stellar.Expert to be high-quality</option
        >
        {#each assets as { asset }}
            {#if asset !== 'XLM'}
                {@const assetString = `${asset.split('-')[0]}:${asset.split('-')[1]}`}
                <option value={assetString}>{assetString}</option>
            {/if}
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
<button class="btn-primary btn-block btn my-2" on:click={previewChangeTrustTransaction}
    >Add Asset</button
>

<h2>Existing Balances</h2>
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
                            <button
                                class="btn-error btn-square btn-sm btn"
                                on:click={previewChangeTrustTransaction(
                                    false,
                                    `${balance.asset_code}:${balance.asset_issuer}`
                                )}><Trash2Icon size="16" /></button
                            >
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
