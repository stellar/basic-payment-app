<!--
@component

The `/dashboard/assets` page will allow the user to manage the Stellar assets
their account carries trustlines to. On this page, they can select from several
pre-suggested or highly ranked assets, or they could specify their own asset to
trust using an asset code and issuer public key. They can also remove trustlines
that already exist on their account.
-->

<script>
    // `export let data` allows us to pull in any parent load data for use here.
    /** @type {import('./$types').PageData} */
    export let data
    $: balances = data.balances ?? []

    // We import things from external packages that will be needed
    import { Trash2Icon } from 'svelte-feather-icons'

    // We import any Svelte components we will need
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { walletStore } from '$lib/stores/walletStore'
    import { invalidateAll } from '$app/navigation'

    // We import some of our `$lib` functions
    import { submit } from '$lib/stellar/horizonQueries'
    import { createChangeTrustTransaction } from '$lib/stellar/transactions'
    import { fetchAssets } from '$lib/utils/stellarExpert'

    // The `open` Svelte context is used to open the confirmation modal
    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')

    // Define some component variables that will be used throughout the page
    let addAsset = ''
    let customAssetCode = ''
    let customAssetIssuer = ''
    let changeTrustXDR = ''
    let changeTrustNetwork = ''
    $: asset = addAsset !== 'custom' ? addAsset : `${customAssetCode}:${customAssetIssuer}`

    /**
     * Takes an action after the pincode has been confirmed by the user.
     * @async
     * @function onConfirm
     * @param {string} pincode Pincode that was confirmed by the modal window
     */
    const onConfirm = async (pincode) => {
        // Use the walletStore to sign the transaction
        let signedTransaction = await walletStore.sign({
            transactionXDR: changeTrustXDR,
            network: changeTrustNetwork,
            pincode: pincode,
        })
        // Submit the transaction to the Stellar network
        await submit(signedTransaction)
        // `invalidateAll` will tell SvelteKit that it should re-run any `load`
        // functions. Since we have a new (or newly deleted) trustline, this
        // results in re-querying the network to get updated account balances.
        invalidateAll()
    }

    /**
     * Builds and presents to the user for confirmation a Stellar transaction that will add/modify/remove a trustline on their account.
     * @param {boolean} addingAsset True we are adding an asset with the default limit, or false if removing an asset
     * @param {string|undefined} removeAsset Asset trustline to be removed (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
     */
    const previewChangeTrustTransaction = async (addingAsset = true, removeAsset = undefined) => {
        // Generate the transaction, expecting back the XDR string
        let { transaction, network_passphrase } = await createChangeTrustTransaction({
            source: data.publicKey,
            asset: removeAsset ?? asset,
            limit: addingAsset ? undefined : '0',
        })

        // Set the component variables to hold the transaction details
        changeTrustXDR = transaction
        changeTrustNetwork = network_passphrase

        // Open the confirmation modal for the user to confirm or reject the
        // transaction. We provide our customized `onConfirm` function, but we
        // have no need to customize and pass an `onReject` function.
        open(ConfirmationModal, {
            transactionXDR: changeTrustXDR,
            transactionNetwork: changeTrustNetwork,
            onConfirm: onConfirm,
        })
    }
</script>

<h1>Assets</h1>
<p>
    The <code>/dashboard/assets</code> page will allow the user to manage the Stellar assets their account
    carries trustlines to. On this page, they can select from several pre-suggested or highly ranked
    assets, or they could specify their own asset to trust using an asset code and issuer public key.
    They can also remove trustlines that already exist on their account.
</p>

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
<button class="btn-primary btn-block btn my-2" on:click={() => previewChangeTrustTransaction()}
    >Add Asset</button
>

<h2>Existing Balances</h2>
<p>View or remove asset trustlines on your Stellar account.</p>

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
            {#each balances as balance}
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
                        {/if}
                    </td>
                    <td>
                        {#if 'asset_code' in balance}
                            {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                            <button
                                class="btn-error btn-square btn-sm btn"
                                on:click={() => previewChangeTrustTransaction(false, assetString)}
                                ><Trash2Icon size="16" /></button
                            >
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
