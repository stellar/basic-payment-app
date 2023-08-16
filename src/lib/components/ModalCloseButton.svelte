<!--
@component

The `ModalCloseButton.svelte` component is a simple, customized close button
that is used in the confirmation modal component. The _only_ reason we've
implemented this is for stylistic consistency of the UI.
-->

<script>
    // We import things from external packages that will be needed
    import { XIcon } from 'svelte-feather-icons'

    // `onClose` is a dummy function that will be overridden by the
    // `svelte-simple-modal` package to close the modal window when the button
    // is clicked
    export let onClose = () => {}
</script>

<button class="btn-square btn absolute right-6 top-3 z-10 bg-base-300" on:click={onClose}>
    <XIcon />
</button>
