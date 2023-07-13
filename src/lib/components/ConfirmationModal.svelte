<script>
    import { copy } from 'svelte-copy'
    import { CopyIcon } from 'svelte-feather-icons'
    import ErrorAlert from "./ErrorAlert.svelte"
    import { confirmCorrectPincode } from "$lib/stores/walletStore"
    import { errorMessage } from "$lib/stores/alertsStore"
    import { getContext } from "svelte"
    import { error } from "@sveltejs/kit"
    import { Networks, TransactionBuilder } from "stellar-sdk"
    const { close } = getContext('simple-modal')

    export let title = 'Transaction Preview'
    export let body = 'Please confirm the transaction below in order to sign and submit it to the network.'
    export let confirmButton = 'Confirm'
    export let rejectButton = 'Reject'
    export let hasPincodeForm = true
    export let transactionXDR = ''
    export let transactionNetwork = ''
    $: transaction = transactionXDR
        ? TransactionBuilder.fromXDR(transactionXDR, transactionNetwork || Networks.TESTNET)
        : null
    export let firstPincode = ''
    export let publicKey = ''

    let pincode = ''
    const confirm = async () => {
        try {
            if (firstPincode) {
                confirmCorrectPincode({
                    pincode,
                    firstPincode,
                    signup: true,
                })
            }
        } catch (err) {
            errorMessage.set(`${err.body.message}. ${err.body.result_codes ? `extra result_codes: <code>${JSON.stringify(err.body.result_codes)}</code>` : ""}`)
        }
    }

    const reject = () => {
        errorMessage.set('')
        close()
    }
</script>

<div class="prose p-3">
    <h1>{title}</h1>
    <ErrorAlert />
    <p>{body}</p>

    {#if transaction}
        <!-- General, transaction-level information -->
        <h2>Transaction Details</h2>
        <p>Network: <code>{transaction.networkPassphrase}</code></p>
        <p>Source: <code>{transaction.source}</code></p>
        <p>Sequence Number: <code>{transaction.sequence}</code></p>
        <p>Fee: <code>{transaction.fee}</code></p>
        {#if 'memo' in transaction}
            <p>Memo ({transaction.memo.type}): <code>{
                transaction.memo.type === 'text'
                ? transaction.memo.value.toString('utf-8')
                : transaction.memo.type === 'hash'
                ? transaction.memo.value.toString('base64')
                : transaction.memo.value
            }</code></p>
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
        <p>Below, the entire (unsigned) transaction is displayed in XDR format. You can confirm the deatils of it by checking the "View XDR" page of the <a href="https://laboratory.stellar.org/#xdr-viewer?type=TransactionEnvelope&network=test" target="_blank" rel="noopener, noreferrer">Stellar Laboratory</a>.</p>
        <div class="relative">
            <pre class="whitespace-normal break-words">{transactionXDR}</pre>
            <button class="absolute bottom-1 right-1 btn-ghost btn-square btn-sm btn" use:copy={transactionXDR}>
                <CopyIcon size="16" />
            </button>
        </div>
    {/if}

    {#if hasPincodeForm}
        <form>
            <div class="form-control">
                <label class="label" for="pincode">
                    <span class="label-text">Confirm Pincode</span>
                </label>
                <input type="password" id="pincode" class="input-bordered input" bind:value={pincode} />
            </div>
            <div class="flex justify-end gap-3 my-6">
                <button on:click|preventDefault={confirm} class="btn btn-success">{confirmButton}</button>
                <button on:click|preventDefault={reject} class="btn btn-error">{rejectButton}</button>
            </div>
        </form>
    {/if}
</div>
