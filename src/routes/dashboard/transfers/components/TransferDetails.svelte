<!--
@component
Here's some documentation for this component. It will show up on hover.
-->

<script>
    import TransferField from './TransferField.svelte'

    /** @type {Object.<string, string>} */
    export let formData = {}

    /**
     * @type {import('./TransferModalSep6.svelte')}
     */
    export let transferData = {}
    /** @type {Object.<string, Object>} */
    export let sep6Info = {}
</script>

<p>Let's begin by deciding what kind of transfer you want to make.</p>
<div class="form-control my-1">
    <label class="label" for="endpoint-select">
        <span class="label-text">What kind of transfer would you like to make?</span>
    </label>
    <select
        class="select-bordered select"
        id="endpoint-select"
        name="endpoint-select"
        bind:value={transferData.endpoint}
    >
        <option value="" disabled selected>Select one</option>
        {#each Object.keys(sep6Info) as endpoint}
            {#if endpoint === 'deposit' || endpoint === 'withdraw'}
                <option value={endpoint}>{endpoint}</option>
            {/if}
        {/each}
    </select>
    <label class="label" for="endpoint-select">
        <span class="label-text-alt">Only transfer types supported by this anchor are listed.</span>
    </label>
</div>
{#if transferData.endpoint}
    <div class="form-control my-1">
        <label class="label" for="asset-select">
            <span class="label-text">Please choose an asset</span>
        </label>
        <select
            class="select-bordered select"
            id="asset-select"
            name="asset-select"
            bind:value={formData.asset_code}
        >
            <option value="" disabled selected>Select one</option>
            {#each Object.keys(sep6Info[transferData.endpoint]) as asset}
                <option value={asset}>{asset}</option>
            {/each}
        </select>
        <label class="label" for="asset-select">
            <span class="label-text-alt"
                >Only transferrable assets supported by this anchor are listed.</span
            >
        </label>
    </div>
{/if}
{#if formData.asset_code}
    <h4>Transfer Fields</h4>
    <p>The anchor has requested the following information about your transfer</p>
    {#each Object.entries(sep6Info) as [endpoint, details]}
        {#if transferData.endpoint === 'deposit' && endpoint === 'deposit'}
            {#each Object.entries(details[formData.asset_code].fields) as [field, fieldInfo]}
                <TransferField field={field} fieldInfo={fieldInfo} bind:value={formData[field]} />
            {/each}
        {:else if transferData.endpoint === 'withdraw' && endpoint === 'withdraw'}
            <div class="form-control w-full max-w-xs">
                <label class="label" for="transfer-type">
                    <span class="label-text">Transfer Type</span>
                </label>
                <select
                    name="transfer-type"
                    id="transfer-type"
                    class="select-bordered select"
                    bind:value={formData.type}
                >
                    <option value="" disabled selected>Select one</option>
                    {#each Object.keys(details[formData.asset_code].types) as transferType}
                        <option>{transferType}</option>
                    {/each}
                </select>
            </div>
            {#if formData.type}
                {#each Object.entries(details[formData.asset_code].types[formData.type].fields) as [field, fieldInfo]}
                    <TransferField
                        field={field}
                        fieldInfo={fieldInfo}
                        bind:value={formData[field]}
                    />
                {/each}
            {/if}
        {/if}
    {/each}
    <div class="form-control my-1">
        <label class="label" for="amount">
            <span class="label-text">Amount</span>
        </label>
        <input
            bind:value={formData.amount}
            class="input-bordered input"
            type="text"
            name="amount"
            id="amount"
            required
        />
    </div>
{/if}
