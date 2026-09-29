<script lang="ts">
    import StepsBar from '$lib/components/StepsBar.svelte'
    import TransferDetails from './TransferDetails.svelte'
    import KycInformation from './KYCInformation.svelte'
    import KycStatus from './KYCStatus.svelte'
    import Confirmation from './Confirmation.svelte'
    import type { AnchorTransaction } from '$lib/stellar/anchorTransactions'

    let sep12Fields: string[] = $state([])

    interface Props {
        title?: string
        body?: string
        homeDomain?: string
        sep6Info?: Record<string, object>
        assetIssuer?: string
        transferData?: {
            endpoint: string
            customer_id: string
            transfer_id: string
            transfer_submitted: boolean
        }
        formData?: {
            asset_code: string
            amount: string
        }
        payAnchor?: (opts: {
            transaction: AnchorTransaction
            assetCode: string
            assetIssuer: string
        }) => Promise<void>
    }

    let {
        title = 'Initiate SEP-6 Transfer',
        body = 'Please follow the steps to begin a transfer with your chosen anchor.',
        homeDomain = $bindable(''),
        sep6Info = {},
        assetIssuer = '',
        transferData = $bindable(),
        formData = $bindable(),
        payAnchor = async () => {},
    }: Props = $props()
    let steps = ['Transfer Details', 'KYC Information', 'KYC Status', 'Submit Transfer']
    let currentActive = $state(1)
    let stepsBar: StepsBar | null = $state(null)
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
                sep6Info={sep6Info}
            />
        {:else if activeStep === 'KYC Information'}
            <KycInformation homeDomain={homeDomain} sep12Fields={sep12Fields} />
        {:else if activeStep === 'KYC Status'}
            <KycStatus
                homeDomain={homeDomain}
                sep12Fields={sep12Fields}
                bind:transferData={transferData}
            />
        {:else if activeStep === 'Submit Transfer'}
            <Confirmation
                bind:transferData={transferData}
                homeDomain={homeDomain}
                formData={formData}
                assetIssuer={assetIssuer}
                payAnchor={payAnchor}
            />
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
