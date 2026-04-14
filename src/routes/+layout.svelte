<script lang="ts">
    import './layout.css'
    import { writable } from 'svelte/store'
    import { errorMessage } from '$lib/stores/alertsStore'
    import ModalCloseButton from '$lib/components/ModalCloseButton.svelte'
    import Modal from 'svelte-simple-modal'

    import type { LayoutProps } from './$types';
    let { children }: LayoutProps = $props()

    const modal = writable(null)

    // @ts-ignore
    const handleError = (err) => {
        if (err.message !== 'ResizeObserver loop limit exceeded') {
            console.log('here is the handleError err', err)
            errorMessage.set(err.error.body.message)
        }
    }
</script>

<svelte:window onerror={handleError} />

<Modal show={$modal} classContent="rounded bg-base-100" closeButton={true}
    >{@render children()}</Modal
>
