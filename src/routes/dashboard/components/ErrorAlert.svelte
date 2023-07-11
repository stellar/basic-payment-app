<script>
    import { XCircleIcon } from 'svelte-feather-icons'
    import { errorMessage } from '$lib/stores/alertsStore'
</script>

{#if $errorMessage}
    <div class="alert alert-error dark:prose-invert">
        <XCircleIcon />
        <span>Error: {$errorMessage}</span>
        <button class="btn-neutral btn-sm btn" on:click={() => errorMessage.set('')}>Dismiss</button
        >
    </div>
{/if}
