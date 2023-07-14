<script>
    import '../app.postcss'

    import { errorMessage } from '$lib/stores/alertsStore'
    import Modal from 'svelte-simple-modal'
    import { writable } from 'svelte/store'
    import ModalCloseButton from '$lib/components/ModalCloseButton.svelte'
    const modal = writable(null)

    /** @param {Event} err */
    const handleError = (err) => {
        if (err.message !== 'ResizeObserver loop limit exceeded') {
            console.log('here is the handleError err', err)
            errorMessage.set(err.error.body.message)
        }
    }
</script>

<svelte:window on:error={handleError} />

<Modal show={$modal} classContent="rounded bg-base-100" closeButton={ModalCloseButton}>
    <slot />
</Modal>
