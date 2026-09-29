<!--
@component
Here's some documentation for this component. It will show up on hover.
-->

<script lang="ts">
    import TransferField from './TransferField.svelte'
    import type { Sep6Info } from '$lib/stellar/sep6'

    interface Props {
        formData?: Record<string, string>
        transferData?: { endpoint?: 'deposit' | 'withdraw' }
        sep6Info?: Sep6Info
    }

    let {
        formData = $bindable({}),
        transferData = $bindable({}),
        sep6Info = { deposit: {}, withdraw: {} },
    }: Props = $props()
</script>

<p>Let's begin by deciding what kind of transfer you want to make.</p>
<fieldset class="my-1 fieldset">
    <label class="label" for="endpoint-select">What kind of transfer would you like to make?</label>
    <select
        class="select"
        id="endpoint-select"
        name="endpoint-select"
        bind:value={transferData.endpoint}
    >
        <option value="" disabled selected>Select one</option>
        {#each Object.keys(sep6Info) as endpoint (endpoint)}
            {#if endpoint === 'deposit' || endpoint === 'withdraw'}
                <option value={endpoint}>{endpoint}</option>
            {/if}
        {/each}
    </select>
    <p class="label">Only transfer types supported by this anchor are listed.</p>
</fieldset>
{#if transferData.endpoint}
    <fieldset class="my-1 fieldset">
        <label class="label" for="asset-select">Please choose an asset</label>
        <select
            class="select"
            id="asset-select"
            name="asset-select"
            bind:value={formData.asset_code}
        >
            <option value="" disabled selected>Select one</option>
            {#each Object.keys(sep6Info[transferData.endpoint]) as asset (asset)}
                <option value={asset}>{asset}</option>
            {/each}
        </select>
        <p class="label">Only transferrable assets supported by this anchor are listed.</p>
    </fieldset>
{/if}
{#if formData.asset_code}
    <h4>Transfer Fields</h4>
    <p>The anchor has requested the following information about your transfer</p>
    {#if transferData.endpoint === 'deposit'}
        {#each Object.entries(sep6Info.deposit[formData.asset_code]?.fields ?? {}) as [field, fieldInfo] (field)}
            <TransferField field={field} fieldInfo={fieldInfo} bind:value={formData[field]} />
        {/each}
    {:else if transferData.endpoint === 'withdraw'}
        <fieldset class="fieldset w-full max-w-xs">
            <label class="label" for="transfer-type">Transfer Type</label>
            <select
                name="transfer-type"
                id="transfer-type"
                class="select"
                bind:value={formData.type}
            >
                <option value="" disabled selected>Select one</option>
                {#each Object.keys(sep6Info.withdraw[formData.asset_code]?.types ?? {}) as transferType (transferType)}
                    <option>{transferType}</option>
                {/each}
            </select>
        </fieldset>
        {#if formData.type}
            {#each Object.entries(sep6Info.withdraw[formData.asset_code]?.types?.[formData.type]?.fields ?? {}) as [field, fieldInfo] (field)}
                <TransferField field={field} fieldInfo={fieldInfo} bind:value={formData[field]} />
            {/each}
        {/if}
    {/if}
    <fieldset class="my-1 fieldset">
        <label class="label" for="amount">Amount</label>
        <input
            bind:value={formData.amount}
            class="input"
            type="text"
            name="amount"
            id="amount"
            required
        />
    </fieldset>
{/if}
