<script>
    import { AlertTriangleIcon } from 'svelte-feather-icons'
    import { warningMessage } from '$lib/stores/alertsStore'
</script>

{#if $warningMessage}
    <div class="alert alert-warning dark:prose-invert">
        <AlertTriangleIcon />
        <span>Error: {$warningMessage}</span>
        <button class="btn-neutral btn-sm btn" on:click={() => warningMessage.set('')}
            >Dismiss</button
        >
    </div>
{/if}
