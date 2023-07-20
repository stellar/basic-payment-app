<script>
    /**
     * @description The `ErrorAlert.svelte` component displays when an error has
     * been detected. It is displayed in the form of a (optionally) dismissable
     * alert within the greater structure of the page layout. The errors are
     * caught and handled in `/src/routes/+layout.svelte`.
     */

    import { XCircleIcon } from 'svelte-feather-icons'
    import { errorMessage } from '$lib/stores/alertsStore'

    // The `dismissable` prop will be used to determin if the alert can be
    // closed by the user
    export let dismissable = true
</script>

{#if $errorMessage}
    <div class="alert alert-error dark:prose-invert">
        <XCircleIcon />
        <span>Error: {$errorMessage}</span>
        {#if dismissable}
            <button class="btn-neutral btn-sm btn" on:click={() => errorMessage.set('')}
                >Dismiss</button
            >
        {/if}
    </div>
{/if}
