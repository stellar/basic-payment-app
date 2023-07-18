<script>
    import { XCircleIcon } from 'svelte-feather-icons'
    import { errorMessage } from '$lib/stores/alertsStore'

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
