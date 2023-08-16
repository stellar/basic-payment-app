<!--
@component

The `WarningAlert.svelte` component is used to alert the user that something has
gone wrong, but not "catastrophically" so. They can continue with whatever they
were doing, but they should know about whatever happened.
-->

<script>
    // We import things from external packages that will be needed
    import { AlertTriangleIcon } from 'svelte-feather-icons'

    // We import any stores we will need to read and/or write
    import { warningMessage } from '$lib/stores/alertsStore'

    // The `dismissible` prop will be used to determin if the alert can be
    // closed by the user
    export let dismissible = true
</script>

{#if $warningMessage}
    <div class="alert alert-warning dark:prose-invert">
        <AlertTriangleIcon />
        <span>Warning: {$warningMessage}</span>
        {#if dismissible}
            <button class="btn-neutral btn-sm btn" on:click={() => warningMessage.set('')}>
                Dismiss
            </button>
        {/if}
    </div>
{/if}
