<script>
    /**
     * @description The `InfoAlert.svelte` is used for more benign informational
     * alerts that present the user with some added knowledge or context. For
     * example, this alert is displayed if a "payment" the user is sending must
     * take the form of a `createAccount` operation because the destination
     * address does not exist on the Stellar network (yet.)
     */

    import { InfoIcon } from 'svelte-feather-icons'
    import { infoMessage } from '$lib/stores/alertsStore'

    // The `dismissable` prop will be used to determin if the alert can be
    // closed by the user
    export let dismissable = true
</script>

{#if $infoMessage}
    <div class="alert alert-info dark:prose-invert">
        <InfoIcon />
        <span>{$infoMessage}</span>
        {#if dismissable}
            <button class="btn-neutral btn-sm btn" on:click={() => infoMessage.set('')}
                >Dismiss</button
            >
        {/if}
    </div>
{/if}
