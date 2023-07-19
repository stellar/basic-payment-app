<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/settings/kyc/+page.svelte data', data)

    import { kycStore } from '$lib/stores/kycStore'
    console.log('kycStore', $kycStore)
</script>

<h1>KYC Information</h1>
<p>
    Here is all the KYC Information we have saved, as you've initiated transfers with various anchor
    servers. Changing it here will allow us to update the anchors during your next transfer.
</p>
<p><small>(Changes are automatically saved.)</small></p>
{#each Object.keys($kycStore) as key}
    <div class="form-control my-1">
        <label for={`kyc-field-${key}`} class="label">
            <span class="label-text uppercase">{key.replaceAll('_', ' ')}</span>
        </label>
        <input
            name={`kyc-field-${key}`}
            id={`kyc-field-${key}`}
            type="text"
            class="input-bordered input"
            bind:value={$kycStore[key]}
        />
    </div>
{/each}
