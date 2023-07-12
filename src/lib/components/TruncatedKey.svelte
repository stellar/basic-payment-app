<script>
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'

    export let keyText = 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR'
</script>

<div class="flex items-center gap-2">
    <div class="flex flex-shrink min-w-0">
        <span class="font-mono truncate">{keyText.slice(0, -3)}</span>
        <span class="font-mono">{keyText.slice(-3)}</span>
    </div>
    <button class="btn btn-square btn-sm btn-ghost" use:copy={keyText}>
        <CopyIcon size="16" />
    </button>
</div>
