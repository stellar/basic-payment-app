<!--
@component

The `/dashboard/settings/kyc` allows the user to view and modify the locally
saved KYC information they have submitted through various SEP-6 anchors. Changes
made here will be submitted to the KYC server the next time a SEP-6 transfer is
initiated.
-->

<script>
    // We import any stores we will need to read and/or write
    import { kyc } from '$lib/state/Kyc.svelte'
</script>

<h1>KYC Information</h1>
<p>
    The <code>/dashboard/settings/kyc</code> allows the user to view and modify the locally saved KYC
    information they have submitted through various SEP-6 anchors. Changes made here will be submitted
    to the KYC server the next time a SEP-6 transfer is initiated.
</p>
<p><small>(Changes are automatically saved.)</small></p>
{#each Object.keys(kyc.fields) as key (key)}
    <fieldset class="my-1 fieldset">
        <label for={`kyc-field-${key}`} class="label uppercase">{key.replaceAll('_', ' ')}</label>
        <input
            name={`kyc-field-${key}`}
            id={`kyc-field-${key}`}
            type="text"
            class="input"
            bind:value={kyc.fields[key]}
        />
    </fieldset>
{/each}
