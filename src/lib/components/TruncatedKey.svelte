<script>
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'

    /** @param {string} keyText - Stellar `StrKey` to display in a truncated manner with a copy button */
    export let keyText = ''
</script>

<div class="flex max-w-full items-center gap-2">
    <div class="relative flex min-w-0 flex-shrink">
        <span class="truncate font-mono">{keyText.slice(0, -3)}</span>
        <span class="font-mono">{keyText.slice(-3)}</span>
    </div>
    <button class="btn-ghost btn-square btn-sm btn" use:copy={keyText}>
        <CopyIcon size="16" />
    </button>
</div>
