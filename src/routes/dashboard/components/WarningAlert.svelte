<script>
    import { AlertTriangleIcon } from "svelte-feather-icons"
    import { warningMessage } from "$lib/stores/alertsStore"
</script>

{#if $warningMessage}
    <div class="alert alert-error dark:prose-invert">
        <AlertTriangleIcon />
        <span>Error: {$warningMessage}</span>
        <button class="btn btn-sm btn-neutral" on:click={() => warningMessage.set('')}>Dismiss</button>
    </div>
{/if}
