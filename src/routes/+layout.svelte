<script lang="ts">
    import './layout.css'
    import { writable } from 'svelte/store'
    import type { ComponentProps } from 'svelte'
    import { isHttpError } from '@sveltejs/kit'
    import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
    import { SwkAppDarkTheme, Networks } from '@creit.tech/stellar-wallets-kit/types'
    import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
    import ModalCloseButton from '$lib/components/ModalCloseButton.svelte'
    import Modal from 'svelte-simple-modal'
    import { alert } from '$lib/state/Alert.svelte'

    import type { LayoutProps } from './$types'
    let { children }: LayoutProps = $props()

    const modal = writable(null)

    // `svelte-simple-modal` renders Svelte 5 components just fine, but its types
    // predate them, so we tell TypeScript this is the component it expects
    const closeButton = ModalCloseButton as unknown as ComponentProps<Modal>['closeButton']

    // The wallets kit keeps the selected wallet and address in localStorage,
    // but the list of wallet modules only lives in memory. Initializing it here
    // (rather than on the login/signup pages) means wallet users can still sign
    // transactions after a page reload.
    StellarWalletsKit.init({
        modules: defaultModules(),
        network: Networks.TESTNET,
        theme: SwkAppDarkTheme,
    })

    // Errors that aren't caught closer to where they happen (for example, an
    // invalid contact address) end up here, and are displayed to the user in
    // the `<Alert />` component.
    const showError = (err: unknown) => {
        console.error('unhandled error', err)
        alert.setAlert({
            type: 'error',
            message: isHttpError(err)
                ? err.body.message
                : err instanceof Error
                  ? err.message
                  : 'Something went wrong',
        })
    }

    const handleError = (event: Event) => {
        if (!(event instanceof ErrorEvent)) return
        if (event.message.includes('ResizeObserver loop')) return
        showError(event.error)
    }

    const handleRejection = (event: PromiseRejectionEvent) => showError(event.reason)
</script>

<svelte:window onerror={handleError} onunhandledrejection={handleRejection} />

<Modal show={$modal} classContent="rounded bg-base-100" closeButton={closeButton}
    >{@render children()}</Modal
>
