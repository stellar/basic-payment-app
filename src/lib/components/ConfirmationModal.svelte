<script>
    /**
     * The `ConfirmationModal.svelte` component implements a reusable "popup
     * dialog" that will prompt the user to enter their chosen 6-digit pincode
     * to confirm their intent for a particular action to take place. This
     * confirmation flow takes place on the following occassions:
     * 1. On signup, when the user has entered their desire pincode (and
     *    **before** the keypair is encrypted with the pincode), we ask them to
     *    confirm the same pincode to make sure they know what they entered the
     *    first time.
     * 2. Before any Stellar transaction (payment, changeTrust, etc.) is signed
     *    and submitted to the network, we prompt for this pincode, which will
     *    allow the app to decrypt the keypair in order to sign the transaction.
     * 3. When authenticating with an anchor server, the SEP-10 challenge
     *    transaction is shown to the user in this modal for them to approve and
     *    sign, before it is sent back to the authentication server.
     * @summary A component that will allow the user to confirm, with their pincode, that they approve an action taking place.
     */

    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'
    import ErrorAlert from './ErrorAlert.svelte'
    import { confirmCorrectPincode, walletStore } from '$lib/stores/walletStore'
    import { errorMessage } from '$lib/stores/alertsStore'
    import { getContext } from 'svelte'
    import { Networks, TransactionBuilder } from 'stellar-sdk'
    const { close } = getContext('simple-modal')

    export let title = 'Transaction Preview'
    export let body =
        'Please confirm the transaction below in order to sign and submit it to the network.'
    export let confirmButton = 'Confirm'
    export let rejectButton = 'Reject'
    export let hasPincodeForm = true
    export let transactionXDR = ''
    export let transactionNetwork = ''
    $: transaction = transactionXDR
        ? TransactionBuilder.fromXDR(transactionXDR, transactionNetwork || Networks.TESTNET)
        : null
    export let firstPincode = ''

    export let onConfirm = async (pincode) => {}
    const _onConfirm = async () => {
        isWaiting = true
        try {
            await confirmCorrectPincode({
                pincode: pincode,
                firstPincode: firstPincode,
                signup: firstPincode ? true : false,
            })
            await onConfirm(pincode)
            close()
        } catch (err) {
            errorMessage.set(err.body.message)
        }
        isWaiting = false
    }

    export let onReject = () => {}
    const _onReject = () => {
        onReject()
        close()
    }

    let isWaiting = false
    let pincode = ''
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
                        ? transaction.memo.value.toString('utf-8')
                        : transaction.memo.type === 'hash'
                        ? transaction.memo.value.toString('base64')
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

    <ErrorAlert />
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
