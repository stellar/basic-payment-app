<script>
    import StepsBar from '$lib/components/StepsBar.svelte'
    import TransferDetails from './TransferDetails.svelte'
    import KycInformation from './KYCInformation.svelte'
    import KycStatus from './KYCStatus.svelte'
    import Confirmation from './Confirmation.svelte'

    export let title = 'Initiate SEP-6 Transfer'
    export let body = 'Please follow the steps to begin a transfer with your chosen anchor.'
    export let homeDomain = ''
    export let sep6Info = {}
    export let assetIssuer = ''

    export let transferData = {
        endpoint: '',
        customer_id: '',
        transfer_id: '',
        transfer_submitted: false,
    }
    export let formData = {
        asset_code: '',
        amount: '',
    }

    /** @type {string[]} */
    let sep12Fields = []
    let transferJson = {}
    /** @param {Object} [opts] Options object */
    export let submitPayment = async (opts) => {}
    let steps = ['Transfer Details', 'KYC Information', 'KYC Status', 'Submit Transfer']
    let currentActive = 1
    /** @type {StepsBar} */
    let stepsBar
    $: activeStep = steps[currentActive - 1]

    /** @param {number} stepIncrement */
    const handleStep = (stepIncrement) => {
        stepsBar.handleStep(stepIncrement)
    }
</script>

<div class="prose p-3">
    <h1>{title}</h1>
    <p>{body}</p>
    <StepsBar steps={steps} bind:currentActive={currentActive} bind:this={stepsBar} />
    <form>
        {#if activeStep === 'Transfer Details'}
            <TransferDetails
                bind:transferData={transferData}
                bind:formData={formData}
                bind:sep6Info={sep6Info}
            />
        {:else if activeStep === 'KYC Information'}
            <KycInformation bind:homeDomain={homeDomain} bind:sep12Fields={sep12Fields} />
        {:else if activeStep === 'KYC Status'}
            <KycStatus
                bind:homeDomain={homeDomain}
                bind:sep12Fields={sep12Fields}
                bind:transferData={transferData}
            />
        {:else if activeStep === 'Submit Transfer'}
            <Confirmation
                bind:transferData={transferData}
                bind:homeDomain={homeDomain}
                bind:formData={formData}
                bind:transferJson={transferJson}
            />
            {#if transferData.endpoint === 'withdraw'}
                <button
                    class="btn-primary btn my-1"
                    on:click={() =>
                        submitPayment({
                            withdrawDetails: transferJson,
                            assetCode: formData.asset_code,
                            assetIssuer: assetIssuer,
                            amount: formData.amount,
                        })}>Send Stellar Payment</button
                >
            {/if}
        {/if}
    </form>

    <div class="my-4">
        <button class="btn" on:click={() => handleStep(-1)} disabled={currentActive === 1}
            >Prev</button
        >
        <button class="btn" on:click={() => handleStep(1)} disabled={currentActive === steps.length}
            >Next</button
        >
    </div>
</div>
