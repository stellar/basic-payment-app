<script>
    import { XCircleIcon } from "svelte-feather-icons"
    import { errorMessage } from "$lib/stores/alertsStore"
</script>

{#if $errorMessage}
    <div class="alert alert-error dark:prose-invert">
        <XCircleIcon />
        <span>Error: {$errorMessage}</span>
        <button class="btn btn-sm btn-neutral" on:click={() => errorMessage.set('')}>Dismiss</button>
    </div>
{/if}
