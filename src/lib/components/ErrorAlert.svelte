<!--
@component

The `ErrorAlert.svelte` component displays when an error has been detected. It
is displayed in the form of a (optionally) dismissible alert within the greater
structure of the page layout. The errors are caught and handled in
`/src/routes/+layout.svelte`.
-->

<script>
    // We import things from external packages that will be needed
    import { XCircleIcon } from 'svelte-feather-icons'

    // We import any stores we will need to read and/or write
    import { errorMessage } from '$lib/stores/alertsStore'

    // The `dismissible` prop will be used to determine if the alert can be
    // closed by the user
    export let dismissible = true
</script>

{#if $errorMessage}
    <div class="alert alert-error dark:prose-invert">
        <XCircleIcon />
        <span>Error: {$errorMessage}</span>
        {#if dismissible}
            <button class="btn-neutral btn-sm btn" on:click={() => errorMessage.set('')}
                >Dismiss</button
            >
        {/if}
    </div>
{/if}
