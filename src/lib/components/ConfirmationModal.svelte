<!--
@component

The `ConfirmationModal.svelte` component implements a reusable "popup dialog"
that will prompt the user to enter their chosen 6-digit pincode to confirm their
intent for a particular action to take place. This confirmation flow takes place
on the following occasions:

1. On signup, when the user has entered their desired pincode (and
   **before** the keypair is encrypted with the pincode), we ask them to
   confirm the same pincode to make sure they know what they entered the
   first time.
2. Before any Stellar transaction (payment, changeTrust, etc.) is signed
   and submitted to the network, we prompt for this pincode, which will
   allow the app to decrypt the keypair in order to sign the transaction.
3. When authenticating with an anchor server, the SEP-10 challenge
   transaction is shown to the user in this modal for them to approve and
   sign, before it is sent back to the authentication server.
-->

<script lang="ts">
    // We import various UI elements from either packages or other components
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'
    import { isHttpError } from '@sveltejs/kit'
    import { alert } from '$lib/state/Alert.svelte'
    import Alert from './Alert.svelte'

    // We will use the `wallet.confirmPincode` to ensure the user knows the
    // encryption password to the keypair before we attempt to sign anything
    import { wallet } from '$lib/state/Wallet.svelte'

    // We need a couple things from the stellar-sdk to reconstruct the
    // Transaction object from the XDR string, when the time comes
    import { Networks, TransactionBuilder, type Transaction, type Memo } from '@stellar/stellar-sdk'

    // A Svelte "context" is used to control when to `open` and `close` a given
    // modal from within other components
    import { getContext } from 'svelte'
    import type { ModalContext } from '$lib/types'
    const { close } = getContext<ModalContext>('simple-modal')

    // `onConfirm` is a dummy function that will be overridden from the

    // `_onConfirm` is actually run when the user clicks the modal's "confirm"
    // button, and calls (in-turn) the supplied `onConfirm` function
    const _onConfirm = async () => {
        // We set an `isWaiting` variable to track whether or not the confirm
        // function is still running
        isWaiting = true

        try {
            if (!wallet.isWalletUser) {
                // Only verify pincode for non-wallet users
                await wallet.confirmPincode({
                    pincode: pincode,
                    firstPincode: firstPincode,
                    signup: firstPincode ? true : false,
                })
            }

            // We call the `onConfirm` function that was given to the modal by
            // the outside component. This method allows each page that needs to
            // display a modal to independently customize the behavior that
            // should take place when the pincode is confirmed. (i.e., submit
            // the transaction to the network, login to the app, etc.)
            // Pass pincode only for non-wallet users
            await onConfirm(wallet.isWalletUser ? undefined : pincode)

            // Now we can close the modal window
            close()
        } catch (err: unknown) {
            // If there was an error, we set our alert
            console.error('error in confirmation modal', err)
            alert.setAlert({
                message: isHttpError(err)
                    ? err.body.message
                    : err instanceof Error
                      ? err.message
                      : 'Transaction failed',
                type: 'error',
            })
        }
        isWaiting = false
    }

    // Just like above, `onReject` is a dummy function that will be overridden

    // Just like above, `_onReject` is actually run when the user clicks the
    // modal's "reject" button, and calls (if provided) the supplied `onReject`
    // function
    const _onReject = () => {
        // We call the `onReject` function that was given to the modal by the
        // outside component. This allows each page that needs to display a
        // modal to independently customize the behavior that should take place
        // when the pincode is rejected
        onReject()
        close()
    }

    // You can think of this `export let variableName = 'something'` syntax as
    // Svelte's way of exposing props of a component. Each of the variables here
    // are available to set (and bind to) by outside components when they are
    // launching this modal. We are using this here to provide some default
    // variables for our modal which can be modified to suit the launching component's needs.

    interface Props {
        onConfirm?: (pincode: undefined | string) => Promise<void>
        onReject?: () => void
        title?: string
        body?: string
        confirmButton?: string
        rejectButton?: string
        hasPincodeForm?: boolean
        transactionXDR?: string
        transactionNetwork?: string
        /** Only used during user signup */
        firstPincode?: string
    }

    let {
        onConfirm = async () => {},
        onReject = () => {},
        title = 'Transaction Preview',
        body = 'Please confirm the transaction below in order to sign and submit it to the network.',
        confirmButton = 'Confirm',
        rejectButton = 'Reject',
        hasPincodeForm = true,
        transactionXDR = '',
        transactionNetwork = '',
        firstPincode = '',
    }: Props = $props()

    // All variable assignment declarations are automatically reactive. If
    // `isWaiting = true` is executed elsewhere in the code, any dependent
    // components would be updated accordingly.
    let isWaiting = $state(false)
    let pincode = $state('')

    // Wallet users sign with their wallet, so they don't need to enter a pincode
    let isWalletUser = $derived(wallet.isWalletUser)

    // The `$: variableName` syntax marks the output of some **expression** (as
    // opposed to an assignment) as _reactive_. In this case, every time
    // `transactionXDR` or `transactionNetwork` changes, `transaction` will be
    // recomputed and any dependent components would be updated accordingly.
    let transaction = $derived(
        transactionXDR
            ? (TransactionBuilder.fromXdr(
                  transactionXDR,
                  transactionNetwork || Networks.TESTNET,
              ) as Transaction)
            : null,
    )

    // Memos decoded from XDR hold raw bytes (a `Uint8Array`), so we decode text
    // memos as UTF-8, and display hash and return memos as base64
    const formatMemo = ({ type, value }: Memo) => {
        if (value === null || typeof value === 'string') return value
        if (type === 'text') return new TextDecoder().decode(value)
        return btoa(String.fromCharCode(...value))
    }

    // Some operation fields (like a `manageData` value) are raw bytes too. We show
    // them as text when they are valid UTF-8, and as base64 otherwise.
    const formatValue = (value: unknown) => {
        if (!(value instanceof Uint8Array)) return value
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(value)
        } catch {
            return btoa(String.fromCharCode(...value))
        }
    }
</script>

<div class="prose p-3">
    <h1>{title}</h1>
    <p>{body}</p>

    {#if transaction}
        <!-- General, transaction-level information -->
        <h2>Transaction Details</h2>
        <p>Network: <code>{transaction.networkPassphrase}</code></p>
        <p>Source: <code>{transaction.source}</code></p>
        <p>Sequence Number: <code>{transaction.sequence}</code></p>
        <p>Fee: <code>{transaction.fee}</code></p>
        {#if 'memo' in transaction}
            <p>
                Memo ({transaction.memo.type}):
                <code>{formatMemo(transaction.memo)}</code>
            </p>
        {/if}

        <!-- Specifics about the operation(s) present in the transaction -->
        <h2>Operations</h2>
        <ol start="0">
            {#each transaction.operations as operation, i (operation)}
                <li>Operation {i}</li>
                <ul>
                    {#each Object.entries(operation) as [key, value] (key)}
                        <li>{key}: <code>{formatValue(value)}</code></li>
                    {/each}
                </ul>
            {/each}
        </ol>

        <!-- The transaction in XDR format, just because it's helpful to have sometimes -->
        <h2>Transaction XDR</h2>
        <p>
            Below, the entire (unsigned) transaction is displayed in XDR format. You can confirm the
            deatils of it by checking the "View XDR" page of the <a
                href="https://laboratory.stellar.org/#xdr-viewer?type=TransactionEnvelope&network=test"
                target="_blank"
                rel="noopener, noreferrer">Stellar Laboratory</a
            >.
        </p>
        <div class="relative">
            <pre class="break-words whitespace-normal">{transactionXDR}</pre>
            <button
                class="btn absolute right-1 bottom-1 btn-square btn-ghost btn-sm"
                use:copy={transactionXDR}
            >
                <CopyIcon size="16" />
            </button>
        </div>
    {/if}

    <Alert />

    <!-- Display the pincode form: the input element, and the "confirm" and "reject" buttons -->
    {#if hasPincodeForm && !isWalletUser}
        <form>
            <div class="form-control">
                <label class="label" for="pincode">
                    <span class="label-text">Confirm Pincode</span>
                </label>
                <input
                    type="password"
                    id="pincode"
                    class="input-bordered input"
                    bind:value={pincode}
                />
            </div>
            <div class="my-6 flex justify-end gap-3">
                <button onclick={_onConfirm} class="btn btn-success" disabled={isWaiting}>
                    {#if isWaiting}<span class="loading loading-sm loading-spinner"></span>{/if}
                    {confirmButton}
                </button>
                <button onclick={_onReject} class="btn btn-error" disabled={isWaiting}>
                    {rejectButton}
                </button>
            </div>
        </form>
    {:else if isWalletUser}
        <!-- Wallet user confirmation UI -->
        <div class="my-6 flex justify-end gap-3">
            <button onclick={_onConfirm} class="btn btn-success" disabled={isWaiting}>
                {#if isWaiting}<span class="loading loading-sm loading-spinner"></span>{/if}
                Confirm in Wallet
            </button>
            <button onclick={_onReject} class="btn btn-error" disabled={isWaiting}>
                {rejectButton}
            </button>
        </div>
    {/if}
</div>
