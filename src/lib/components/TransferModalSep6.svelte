<script>
    import { page } from '$app/stores'
    import { Buffer } from 'buffer'
    import StepsBar from '$lib/components/StepsBar.svelte'
    import TransferField from '$lib/components/TransferField.svelte';

    export let endpoint = ''
    export let assetCode = ''
    export let title = 'Initiate SEP-6 Transfer'
    export let body = 'Please follow the steps to begin a transfer with your chosen anchor.'
    export let homeDomain = ''
    export let sep6Info = {}

    export let transferData = {
        endpoint: '',
        customer_id: '',
        transfer_id: '',
        transfer_submitted: false,
    }
    export let formData = {
        account: $page.publicKey,
        asset_code: '',
        type: '',
    }

    let steps = ['Transfer Details', 'KYC Information', 'Submit Transfer', 'Confirmation']
    let currentActive = 1
    let stepsBar
    $: activeStep = steps[currentActive - 1]

    const handleStep = (stepIncrement) => {
        console.log('here i am')
        stepsBar.handleStep(stepIncrement)
    }
</script>

<div class="prose p-3">
    <h1>{title}</h1>
    <p>{body}</p>
    <StepsBar steps={steps} bind:currentActive={currentActive} bind:this={stepsBar} />
    <form>
        {#if activeStep === 'Transfer Details'}
            <p>Let's begin by deciding what kind of transfer you want to make.</p>
            <div class="form-control w-full">
                <label class="label" for="endpoint-select">
                    <span class="label-text">What kind of transfer would you like to make?</span
                    >
                </label>
                <select
                    class="select-bordered select"
                    id="endpoint-select"
                    name="endpoint-select"
                    bind:value={transferData.endpoint}
                >
                    <option value="" disabled selected>Select one</option>
                    {#each Object.entries(sep6Info) as [endpoint, details]}
                        {#if endpoint === 'deposit' || endpoint === 'withdraw'}
                            <option value={endpoint}>{endpoint}</option>
                        {/if}
                    {/each}
                </select>
                <label class="label" for="endpoint-select">
                    <span class="label-text-alt"
                        >Only transfer types supported by this anchor are listed.</span
                    >
                </label>
            </div>
            {#if transferData.endpoint}
                <div class="form-control w-full">
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
                        {#each Object.entries(sep6Info[transferData.endpoint]) as [asset, details]}
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
                            <TransferField
                                field={field}
                                fieldInfo={fieldInfo}
                                bind:value={formData[field]}
                            />
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
                <div class="form-control w-full">
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
        {:else if activeStep === 'KYC Information'}
            <p>Next, we've checked with the anchor to see what KYC information is needed from you to make the deposit successful.</p>
        {/if}
    </form>

    <button class="btn" on:click={() => handleStep(-1)} disabled={currentActive === 1}>Prev</button>
    <button class="btn" on:click={() => handleStep(1)} disabled={currentActive === steps.length}>Next</button>
</div>
