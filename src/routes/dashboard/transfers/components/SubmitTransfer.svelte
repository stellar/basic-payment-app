<script>
    import { kycStore } from '$lib/stores/kycStore'
    import { webAuthStore } from '$lib/stores/webAuthStore'
    import { putSep12Fields, getSep12Fields } from '$lib/stellar/sep12'

    export let sep12Fields = []
    export let homeDomain = ''
    export let transferData = {}

    const putCustomerFields = async () => {
        let submittedCustomerFields = sep12Fields.reduce((fields, item) => {
            if ($kycStore[item]) fields[item] = $kycStore[item]
            return fields
        }, {})
        let json = await putSep12Fields({
            authToken: $webAuthStore[homeDomain],
            fields: submittedCustomerFields,
            homeDomain: homeDomain,
        })
        transferData.customer_id = json.id

        let { status } = await getSep12Fields({
            authToken: $webAuthStore[homeDomain],
            homeDomain: homeDomain,
        })
        return status
    }
</script>

<p>
    We have now submitted your KYC details to the anchor, and are waiting for their server to let us
    know a status.
</p>
{#await putCustomerFields()}
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
        <button
            class="btn-primary btn"
            on:click={getSep12Fields({
                authToken: $webAuthStore[homeDomain],
                homeDomain: homeDomain,
            })}>Refresh status</button
        >
    {/if}
{/await}
