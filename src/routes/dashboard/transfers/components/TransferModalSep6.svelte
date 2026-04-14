<script>
    import StepsBar from '$lib/components/StepsBar.svelte'
    import TransferDetails from './TransferDetails.svelte'
    import KycInformation from './KYCInformation.svelte'
    import KycStatus from './KYCStatus.svelte'
    import Confirmation from './Confirmation.svelte'

    /** @type {string[]} */
    let sep12Fields = $state([])
    let transferJson = $state({})

    /**
     * @typedef {Object} Props
     * @property {string} [title]
     * @property {string} [body]
     * @property {string} [homeDomain]
     * @property {any} [sep6Info]
     * @property {string} [assetIssuer]
     * @property {any} [transferData]
     * @property {any} [formData]
     * @property {any} [submitPayment]
     */

    /** @type {Props} */
    let {
        title = 'Initiate SEP-6 Transfer',
        body = 'Please follow the steps to begin a transfer with your chosen anchor.',
        homeDomain = $bindable(''),
        sep6Info = $bindable({}),
        assetIssuer = '',
        transferData = $bindable({
            endpoint: '',
            customer_id: '',
            transfer_id: '',
            transfer_submitted: false,
        }),
        formData = $bindable({
            asset_code: '',
            amount: '',
        }),
        submitPayment = async (opts) => {},
    } = $props()
    let steps = ['Transfer Details', 'KYC Information', 'KYC Status', 'Submit Transfer']
    let currentActive = $state(1)
    /** @type {StepsBar} */
    let stepsBar = $state()
    let activeStep = $derived(steps[currentActive - 1])

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
                    class="btn btn-primary my-1"
                    onclick={() =>
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
        <button class="btn" onclick={() => handleStep(-1)} disabled={currentActive === 1}
            >Prev</button
        >
        <button class="btn" onclick={() => handleStep(1)} disabled={currentActive === steps.length}
            >Next</button
        >
    </div>
</div>
