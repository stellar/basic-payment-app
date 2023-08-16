<!--
@component

The `InfoAlert.svelte` is used for more benign informational alerts that present
the user with some added knowledge or context. For example, this alert is
displayed if a "payment" the user is sending must take the form of a
`createAccount` operation because the destination address does not exist on the
Stellar network (yet.)
-->

<script>
    // We import things from external packages that will be needed
    import { InfoIcon } from 'svelte-feather-icons'

    // We import any stores we will need to read and/or write
    import { infoMessage } from '$lib/stores/alertsStore'

    // The `dismissible` prop will be used to determine if the alert can be
    // closed by the user
    export let dismissible = true

    // Sometimes, the use of `@html` inside a Svelte tag could open users up to
    // XSS attacks. The Svelte compiler will remind us of that. We are only ever
    // populating this `infoAlert` with our own text, so we will choose to
    // ignore the eslint error in this instance.
    /* eslint 'svelte/no-at-html-tags': "off" */
</script>

{#if $infoMessage}
    <div class="alert alert-info dark:prose-invert">
        <InfoIcon />
        <span>{@html $infoMessage}</span>
        {#if dismissible}
            <button class="btn-neutral btn-sm btn" on:click={() => infoMessage.set('')}
                >Dismiss</button
            >
        {/if}
    </div>
{/if}
