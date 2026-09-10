<!--
@component

The `TruncatedKey.svelte` component accepts a Stellar key (either public key or
secret key) and returns a truncated version of it, designed to flexibly fit its
parent container. It also includes a copy button to let the user easily
copy/paste the value of `keyText`.
-->

<script>
    // We import things from external packages that will be needed
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'

    // We import any stores we will need to read and/or write
    import { contacts } from '$lib/stores/contactsStore'

    // Since we have contact names mapped to addresses, it would be nice to
    // display the contact names, when possible. This `export let` property
    // allows us to determine if the TruncatedKey component should bother with

    /**
     * @typedef {Object} Props
     * @property {string} [keyText]
     * @property {boolean} [lookupName] - that or not.
     */

    /** @type {Props} */
    let { keyText = '', lookupName = true } = $props()

    // The `contactName` variable will be _reactive_ to any changes to the
    // `lookupName` or `keyText` variables.
    let contactName = $derived(lookupName ? contacts.lookup(keyText) : false)
</script>

<div class="flex max-w-full items-center gap-2">
    <div class="relative flex min-w-0 flex-shrink">
        {#if lookupName && contactName}
            <div class="tooltip" data-tip={keyText}>
                <span class="font-mono">{contactName}</span>
            </div>
        {:else}
            <span class="truncate font-mono">{keyText.slice(0, -3)}</span>
            <span class="font-mono">{keyText.slice(-3)}</span>
        {/if}
    </div>
    <button class="btn btn-square btn-ghost btn-sm" use:copy={keyText}>
        <CopyIcon size="16" />
    </button>
</div>

<style lang="postcss">
    .tooltip:before {
        @apply max-w-min;
    }
</style>
