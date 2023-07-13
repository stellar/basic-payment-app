<script>
    import { XIcon } from "svelte-feather-icons"
    export let onClose
</script>

<button class="absolute top-3 right-6 z-10 btn btn-square bg-base-300" on:click={onClose}>
    <XIcon />
</button>
