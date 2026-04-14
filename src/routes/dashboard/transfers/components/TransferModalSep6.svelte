<script lang="ts">
    import StepsBar from '$lib/components/StepsBar.svelte'
    import TransferDetails from './TransferDetails.svelte'
    import KycInformation from './KYCInformation.svelte'
    import KycStatus from './KYCStatus.svelte'
    import Confirmation from './Confirmation.svelte'

    let sep12Fields: string[] = $state([])
    let transferJson = $state({})

    interface Props {
        title?: string
        body?: string
        homeDomain?: string
        sep6Info?: any
        assetIssuer?: string
        transferData?: {
            endpoint: string;
            customer_id: string;
            transfer_id: string;
            transfer_submitted: boolean;
        }
        formData?: {
            asset_code: string;
            amount: string;
        }
        submitPayment?: (opts: object) => Promise<void>
    }

    let {
        title = 'Initiate SEP-6 Transfer',
        body = 'Please follow the steps to begin a transfer with your chosen anchor.',
        homeDomain = $bindable(''),
        sep6Info = $bindable({}),
        assetIssuer = '',
        transferData = $bindable(),
        formData = $bindable(),
        submitPayment = async (opts) => {},
    }: Props = $props()
    let steps = ['Transfer Details', 'KYC Information', 'KYC Status', 'Submit Transfer']
    let currentActive = $state(1)
    let stepsBar: StepsBar|null = $state(null)
    let activeStep = $derived(steps[currentActive - 1])

    const handleStep = (stepIncrement: number) => {
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
