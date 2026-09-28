<script lang="ts">
    import { kyc } from '$lib/state/Kyc.svelte'
    import { webAuth } from '$lib/state/WebAuth.svelte'
    import { putSep12Fields, getSep12Fields } from '$lib/stellar/sep12'

    interface Props {
        sep12Fields?: any
        homeDomain?: string
        transferData?: any
    }

    /** @type {Props} */
    let { sep12Fields = [], homeDomain = '', transferData = $bindable({}) } = $props()

    const putCustomerFields = async () => {
        let submittedCustomerFields = sep12Fields.reduce((fields, item) => {
            if (kyc.fields[item]) fields[item] = kyc.fields[item]
            return fields
        }, {})
        let json = await putSep12Fields({
            authToken: webAuth.requireToken(homeDomain),
            fields: submittedCustomerFields,
            homeDomain: homeDomain,
        })
        transferData.customer_id = json.id

        return await getStatus()
    }

    const getStatus = async () => {
        let { status } = await getSep12Fields({
            authToken: webAuth.requireToken(homeDomain),
            homeDomain: homeDomain,
        })
        return status
    }

    // We keep the request in state, so the "Refresh status" button can re-check
    let statusRequest = $state(putCustomerFields())
</script>

<p>
    We have now submitted your KYC details to the anchor, and are waiting for their server to let us
    know a status.
</p>
{#await statusRequest}
    <p>loading...</p>
{:then status}
    {#if status === 'ACCEPTED'}
        <p>
            Your KYC information has been <strong><code>{status}</code></strong> by the anchor. Please
            proceed with the rest of the transfer. When you click the "Next" button, the transfer will
            be submitted to the anchor server.
        </p>
    {:else}
        <p>
            Your current KYC status with the anchor is <strong><code>{status}</code></strong>.
            Please wait a moment and try again.
        </p>
        <button type="button" class="btn btn-primary" onclick={() => (statusRequest = getStatus())}
            >Refresh status</button
        >
    {/if}
{:catch err}
    <p class="text-error">
        The anchor didn't accept your KYC information: <strong
            >{err.body?.message ?? err.message}</strong
        >. Please go back to the previous step, correct it, and try again.
    </p>
{/await}
