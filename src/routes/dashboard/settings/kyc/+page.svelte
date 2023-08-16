<!--
@component

The `/dashboard/settings/kyc` allows the user to view and modify the locally
saved KYC information they have submitted through various SEP-6 anchors. Changes
made here will be submitted to the KYC server the next time a SEP-6 transfer is
initiated.
-->

<script>
    // We import any stores we will need to read and/or write
    import { kycStore } from '$lib/stores/kycStore'
</script>

<h1>KYC Information</h1>
<p>
    The <code>/dashboard/settings/kyc</code> allows the user to view and modify the locally saved KYC
    information they have submitted through various SEP-6 anchors. Changes made here will be submitted
    to the KYC server the next time a SEP-6 transfer is initiated.
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
