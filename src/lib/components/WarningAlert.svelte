<script>
    /**
     * @description The `WarningAlert.svelte` component is used to alert the
     * user that something has gone wrong, but not "catastrophically" so. They
     * can continue with whatever they were doing, but they should know about
     * whatever happened.
     */

    import { AlertTriangleIcon } from 'svelte-feather-icons'
    import { warningMessage } from '$lib/stores/alertsStore'

    // The `dismissable` prop will be used to determin if the alert can be
    // closed by the user
    export let dismissable = true
</script>

{#if $warningMessage}
    <div class="alert alert-warning dark:prose-invert">
        <AlertTriangleIcon />
        <span>Warning: {$warningMessage}</span>
        {#if dismissable}
            <button class="btn-neutral btn-sm btn" on:click={() => warningMessage.set('')}>
                Dismiss
            </button>
        {/if}
    </div>
{/if}
