<script>
    import { InfoIcon } from 'svelte-feather-icons'
    import { infoMessage } from '$lib/stores/alertsStore'
</script>

{#if $infoMessage}
    <div class="alert alert-info dark:prose-invert">
        <InfoIcon />
        <span>{@html $infoMessage}</span>
        <button class="btn-neutral btn-sm btn" on:click={() => infoMessage.set('')}>Dismiss</button>
    </div>
{/if}
