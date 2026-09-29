<!--
@component

The `TruncatedKey.svelte` component accepts a Stellar key (either public key or
secret key) and displays a shortened version of it, like `GAZ7G...XCWJP`. The
full key is shown when hovering over it, and a copy button lets the user easily
copy/paste the value of `keyText`.
-->

<script lang="ts">
    // We import things from external packages that will be needed
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'

    // We import any stores we will need to read and/or write
    import { contacts } from '$lib/state/Contacts.svelte'

    interface Props {
        /** The key to display */
        keyText: string
        /** Whether to show the contact's name (if we have one) instead of the key */
        lookupName?: boolean
        /** How many characters to show from the start of the key */
        startChars?: number
        /** How many characters to show from the end of the key */
        endChars?: number
    }
    let { keyText = '', lookupName = true, startChars = 5, endChars = 5 }: Props = $props()

    // Since we have contact names mapped to addresses, it would be nice to
    // display the contact names, when possible
    let contactName = $derived(lookupName ? contacts.lookup(keyText) : false)

    // We show the first and last few characters of the key, so it fits in
    // tables and other small spaces. A key that's already short is shown as-is.
    let shortKey = $derived(
        keyText.length > startChars + endChars
            ? `${keyText.slice(0, startChars)}...${keyText.slice(-endChars)}`
            : keyText,
    )
</script>

<div class="flex items-center gap-2">
    <div class="tooltip">
        <!-- A key is one long "word", so we let it wrap anywhere to fit the tooltip -->
        <div class="tooltip-content font-mono break-all">{keyText}</div>
        <span class="font-mono">{contactName || shortKey}</span>
    </div>
    <button
        type="button"
        class="btn btn-square btn-ghost btn-sm"
        aria-label="Copy to clipboard"
        use:copy={keyText}
    >
        <CopyIcon size="16" />
    </button>
</div>
