<script>
    import { page } from '$app/stores'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import { initiateTransfer6, getTransferStatus6 } from '$lib/stellar/sep6'
    import { createPaymentTransaction } from '$lib/stellar/transactions'
    import { walletStore } from '$lib/stores/walletStore'
    import { webAuthStore } from '$lib/stores/webAuthStore'
    import { getContext } from 'svelte'
    const { open, close } = getContext('simple-modal')

    export let transferData = {}
    export let formData = {}
    export let homeDomain = ''
    export let transferJson = {}

    const submitTransfer = async () => {
        if (transferData.transfer_submitted) {
            let transaction = await getTransferStatus6({
                authToken: $webAuthStore[homeDomain],
                transferId: transferData.transfer_id,
                domain: homeDomain,
            })
            return transaction
        } else {
            let json = await initiateTransfer6({
                authToken: $webAuthStore[homeDomain],
                endpoint: transferData.endpoint,
                formData: formData,
                domain: homeDomain,
            })
            console.log('submitTransfer json', json)
            if (json.id) {
                transferData.transfer_submitted = true
                transferData.transfer_id = json.id
            }
            transferJson = json
            return json
        }
    }
</script>

<p>
    <em>You may not be finished yet.</em> We have submitted your transfer to the anchor, and any further
    details and/or instructions are listed below. You may need to initiate a transfer to/from your bank.
</p>
{#await submitTransfer()}
    <p>loading...</p>
{:then json}
    <div class="overflow-x-auto">
        <table class="table">
            <tbody>
                {#each Object.keys(json) as key}
                    <tr>
                        <th>{key}</th>
                        <td>{key === 'extra_info' ? json[key].message : json[key]}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/await}
