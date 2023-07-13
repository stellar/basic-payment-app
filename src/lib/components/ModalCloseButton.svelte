<script>
    import { XIcon } from 'svelte-feather-icons'
    export let onClose
</script>

<button class="btn-square btn absolute right-6 top-3 z-10 bg-base-300" on:click={onClose}>
    <XIcon />
</button>
