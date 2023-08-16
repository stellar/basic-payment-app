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

<script>
    // We import various UI elements from either packages or other components
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'
    import { errorMessage } from '$lib/stores/alertsStore'
    import ErrorAlert from './ErrorAlert.svelte'

    // We will use the `walletStore.confirmPincode` to ensure the user knows the
    // encryption password to the keypair before we attempt to sign anything
    import { walletStore } from '$lib/stores/walletStore'

    // We need a couple things from the stellar-sdk to reconstruct the
    // Transaction object from the XDR string, when the time comes
    import { Networks, TransactionBuilder } from 'stellar-sdk'

    // A Svelte "context" is used to control when to `open` and `close` a given
    // modal from within other components
    import { getContext } from 'svelte'
    const { close } = getContext('simple-modal')

    // `onConfirm` is a dummy function that will be overridden from the
    // component that launches the modal
    export let onConfirm = async () => {}
    // `_onConfirm` is actually run when the user clicks the modal's "confirm"
    // button, and calls (in-turn) the supplied `onConfirm` function
    const _onConfirm = async () => {
        // We set an `isWaiting` variable to track whether or not the confirm
        // function is still running
        isWaiting = true

        try {
            // We make sure the user has supplied the correct pincode
            await walletStore.confirmPincode({
                pincode: pincode,
                firstPincode: firstPincode,
                signup: firstPincode ? true : false,
            })

            // We call the `onConfirm` function that was given to the modal by
            // the outside component. This method allows each page that needs to
            // display a modal to independantly customize the behavior that
            // should take place when the pincode is confirmed. (i.e., submit
            // the transaction to the network, login to the app, etc.)
            // @ts-ignore
            await onConfirm(pincode)

            // Now we can close the modal window
            close()
        } catch (err) {
            // If there was an error, we set our `errorMessage` alert
            // @ts-ignore
            errorMessage.set(err.body.message)
        }
        isWaiting = false
    }

    // Just like above, `onReject` is a dummy function that will be overridden
    // from the component that launches the modal
    export let onReject = () => {}
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
    // variables for our modal which can be modified to suit the launching
    // component's needs.
    export let title = 'Transaction Preview'
    export let body =
        'Please confirm the transaction below in order to sign and submit it to the network.'
    export let confirmButton = 'Confirm'
    export let rejectButton = 'Reject'
    export let hasPincodeForm = true
    export let transactionXDR = ''
    export let transactionNetwork = ''
    // The `firstPincode` is only used during the signup process
    export let firstPincode = ''

    // All variable assignment declarations are automatically reactive. If
    // `isWaiting = true` is executed elsewhere in the code, any dependent
    // components would be updated accordingly.
    let isWaiting = false
    let pincode = ''

    // The `$: variableName` syntax marks the output of some **expression** (as
    // opposed to an assignment) as _reactive_. In this case, every time
    // `transactionXDR` or `transactionNetwork` changes, `transaction` will be
    // recomputed and any dependent components would be updated accordingly.
    /** @type {import('stellar-sdk').Transaction}*/
    // @ts-ignore
    $: transaction = transactionXDR
        ? TransactionBuilder.fromXDR(transactionXDR, transactionNetwork || Networks.TESTNET)
        : null
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
                <code
                    >{transaction.memo.type === 'text'
                        ? transaction.memo?.value?.toString('utf-8')
                        : transaction.memo.type === 'hash'
                        ? transaction.memo?.value?.toString('base64')
                        : transaction.memo.value}</code
                >
            </p>
        {/if}

        <!-- Specifics about the operation(s) present in the transaction -->
        <h2>Operations</h2>
        <ol start="0">
            {#each transaction.operations as operation, i}
                <li>Operation {i}</li>
                <ul>
                    {#each Object.entries(operation) as [key, value]}
                        <li>{key}: <code>{value}</code></li>
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
            <pre class="whitespace-normal break-words">{transactionXDR}</pre>
            <button
                class="btn-ghost btn-square btn-sm btn absolute bottom-1 right-1"
                use:copy={transactionXDR}
            >
                <CopyIcon size="16" />
            </button>
        </div>
    {/if}

    <!-- ErrorAlert will be displayed whenever the errorMessage is truthy -->
    <ErrorAlert />

    <!-- Display the pincode form: the input element, and the "confirm" and "reject" buttons -->
    {#if hasPincodeForm}
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
                <button
                    on:click|preventDefault={_onConfirm}
                    class="btn-success btn"
                    disabled={isWaiting}
                >
                    {#if isWaiting}<span class="loading loading-spinner loading-sm" />{/if}
                    {confirmButton}
                </button>
                <button
                    on:click|preventDefault={_onReject}
                    class="btn-error btn"
                    disabled={isWaiting}
                >
                    {rejectButton}
                </button>
            </div>
        </form>
    {/if}
</div>
