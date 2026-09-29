<!--
@component

The `/dashboard/send` page allows the user to send payments to other Stellar
addresses. They can select from a dropdown containing their contact list names,
or they could enter their own "Other..." public key. The following additional
features have been implemented:

- If the destination address is _not_ a funded account, the user is informed
  they will be using a `createAccount` operation, and must send at least 1 XLM.
- The user can select to send/receive different assets, and paths are queried
  from horizon depending on:
  1. if they want to strict send or strict receive,
  2. the source/destination assets they have selected,
  3. the source/destination accounts, and
  4. the amount entered for the send/receive value.
- An optional memo field is available for text-only memos.
-->

<script lang="ts">
    // `export let data` allows us to pull in any parent load data for use here.

    // We import any Svelte components we will need
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'

    // We import any stores we will need to read and/or write
    import { isHttpError } from '@sveltejs/kit'
    import { alert } from '$lib/state/Alert.svelte'
    import { contacts } from '$lib/state/Contacts.svelte'
    import { wallet } from '$lib/state/Wallet.svelte'

    // We import some of our `$lib` functions
    import {
        fetchAccount,
        submit,
        fetchAccountBalances,
        findStrictSendPaths,
        findStrictReceivePaths,
    } from '$lib/stellar/horizonQueries'
    import {
        createCreateAccountTransaction,
        createPathPaymentStrictReceiveTransaction,
        createPathPaymentStrictSendTransaction,
        createPaymentTransaction,
        createContractTransferTransaction,
    } from '$lib/stellar/transactions'

    // The `open` Svelte context is used to open the confirmation modal
    import { getContext } from 'svelte'
    import type { ModalContext } from '$lib/types'
    const { open } = getContext<ModalContext>('simple-modal')

    import type { PageProps } from './$types'
    import type { Horizon } from '@stellar/stellar-sdk'
    let { data }: PageProps = $props()

    // Define some component variables that will be used throughout the page
    let destination = $state('')
    let otherDestination = $derived(destination === 'other')
    let otherPublicKey = $state('')
    let sendAsset = $state('native')
    let sendAmount = $state('')
    let receiveAsset = $state('')
    let receiveAmount = $state('')
    let memo = $state('')
    let createAccount: boolean | null = $state(null)
    let pathPayment = $state(false)
    let availablePaths: Horizon.ServerApi.PaymentPathRecord[] = $state([])
    let strictReceive = $state(false)
    let paymentXDR = ''
    let paymentNetwork = ''

    /**
     * Check whether or not the account exists and is funded on the Stellar network.
     * @async
     * @function checkDestination
     * @param {string} publicKey Public Stellar address to check on the network
     */
    let checkDestination = async (publicKey: string) => {
        // Only do this if the `publicKey` is not "other". This check lets us
        // use the same function for both the select dropdown, and the
        // `otherPublicKey` input element.
        if (publicKey !== 'other') {
            try {
                // If the account returns successfully, ensure we're not using a
                // `createAccount` operation
                await fetchAccount(publicKey)
                // Clear the "Account Not Funded" notice from a previous check
                if (createAccount) alert.clear()
                createAccount = false
            } catch (err) {
                // A 404 means the account doesn't exist yet, so we inform the
                // user about what will take place
                if (isHttpError(err) && err.status === 404) {
                    createAccount = true
                    sendAsset = 'native'
                    alert.setAlert({
                        type: 'info',
                        title: 'Account Not Funded',
                        message:
                            'You are sending a payment to an account that does not yet exist on the Stellar ledger. Your payment will take the form of a createAccount operation, and the amount you send must be at least 1 XLM.',
                    })
                }
            }
        }
    }

    /**
     * Query Horizon for available paths between a combination of source and destination assets and accounts.
     * @async
     * @function findPaths
     */
    const findPaths = async () => {
        // Query the paths from Horizon
        let paths = strictReceive
            ? await findStrictReceivePaths({
                  sourcePublicKey: data.publicKey,
                  destinationAsset: receiveAsset,
                  destinationAmount: receiveAmount,
              })
            : await findStrictSendPaths({
                  sourceAsset: sendAsset,
                  sourceAmount: sendAmount,
                  destinationPublicKey: otherDestination ? otherPublicKey : destination,
              })
        // Fill the component variable `availablPaths` with our returned paths
        availablePaths = paths
        // If both send and receive assets have been selected re-select the path
        // to update the relevant amount
        if (receiveAsset && sendAsset) {
            selectPath()
        }
    }

    /**
     * Select a path for use in the path payment operation, and set the component variables accordingly.
     * @function selectPath
     */
    const selectPath = () => {
        if (strictReceive) {
            // Set the `sendAmount` variable to the chosen path amount. The
            // filtering we do checks if the asset_type matches because that
            // will give us our 'native' XLM asset, otherwise we match on the
            // asset_code.
            sendAmount = availablePaths.filter(
                (path) =>
                    path.source_asset_type === sendAsset ||
                    sendAsset.startsWith(path.source_asset_code),
            )[0].source_amount
        } else {
            // Set the `receiveAmount` variable to the chosen path amount. The
            // filtering we do checks if the asset_type matches because that
            // will give us our 'native' XLM asset, otherwise we match on the
            // asset_code.
            receiveAmount = availablePaths.filter(
                (path) =>
                    path.destination_asset_type === receiveAsset ||
                    receiveAsset.startsWith(path.destination_asset_code),
            )[0].destination_amount
        }
    }

    /**
     * Takes an action after the pincode has been confirmed by the user.
     * @async
     * @function onConfirm
     * @param pincode Pincode that was confirmed by the modal window (wallet users don't have one) */
    const onConfirm = async (pincode?: string) => {
        // Use the wallet to sign the transaction
        let signedTransaction = await wallet.sign({
            transactionXDR: paymentXDR,
            network: paymentNetwork,
            pincode: pincode,
        })
        // Submit the transaction to the Stellar network
        await submit(signedTransaction)
    }

    /**
     * Create a payment transaction depending on user selections, and present it to the user for approval or rejection.
     * @async
     * @function previewPaymentTransaction
     */
    const previewPaymentTransaction = async () => {
        const destinationAddress = otherDestination ? otherPublicKey : destination
        let { transaction, network_passphrase } = createAccount
            ? await createCreateAccountTransaction({
                  source: data.publicKey,
                  destination: destinationAddress,
                  amount: sendAmount,
                  memo: memo,
              })
            : contacts.isContractAddress(destinationAddress)
              ? await createContractTransferTransaction({
                    source: data.publicKey,
                    destination: destinationAddress,
                    asset: sendAsset,
                    amount: sendAmount,
                })
              : pathPayment && strictReceive
                ? await createPathPaymentStrictReceiveTransaction({
                      source: data.publicKey,
                      sourceAsset: sendAsset,
                      sourceAmount: sendAmount,
                      destination: destinationAddress,
                      destinationAsset: receiveAsset,
                      destinationAmount: receiveAmount,
                      memo: memo,
                  })
                : pathPayment && !strictReceive
                  ? await createPathPaymentStrictSendTransaction({
                        source: data.publicKey,
                        sourceAsset: sendAsset,
                        sourceAmount: sendAmount,
                        destination: destinationAddress,
                        destinationAsset: receiveAsset,
                        destinationAmount: receiveAmount,
                        memo: memo,
                    })
                  : await createPaymentTransaction({
                        source: data.publicKey,
                        destination: destinationAddress,
                        asset: sendAsset,
                        amount: sendAmount,
                        memo: memo,
                    })

        // Set the component variables to hold the transaction details
        paymentXDR = transaction
        paymentNetwork = network_passphrase

        // Open the confirmation modal for the user to confirm or reject the
        // transaction. We provide our customized `onConfirm` function, but we
        // have no need to customize and pass an `onReject` function.
        open(ConfirmationModal, {
            transactionXDR: paymentXDR,
            transactionNetwork: paymentNetwork,
            onConfirm: onConfirm,
        })
    }
</script>

<h1>Send a Payment</h1>
<p>
    The <code>/dashboard/send</code> page allows the user to send payments to other Stellar addresses.
    They can select from a dropdown containing their contact list names, or they could enter their own
    "Other..." public key.
</p>
<p>Please complete the fields below to send a payment on the Stellar network.</p>

<!-- Destination -->
<fieldset class="my-5 fieldset">
    <label for="destination" class="label">Destination</label>
    <select
        bind:value={destination}
        onchange={() => checkDestination(destination)}
        id="destination"
        name="destination"
        class="select"
    >
        <option value="" disabled selected>Select Recipient</option>
        {#each contacts.list as contact (contact.id)}
            <option value={contact.address}>{contact.name}</option>
        {/each}
        <option value="other">Other...</option>
    </select>
</fieldset>
<!-- /Destination -->

<!-- OtherDestination -->
{#if otherDestination}
    <fieldset class="my-5 fieldset">
        <label for="otherPublicKey" class="label">Destination Public Key</label>
        <input
            bind:value={otherPublicKey}
            onchange={() => checkDestination(otherPublicKey)}
            id="otherPublicKey"
            name="otherPublicKey"
            type="text"
            placeholder="G..."
            class="input"
        />
    </fieldset>
{/if}
<!-- /OtherDestination -->

{#if createAccount !== null && !createAccount}
    <fieldset class="my-1 fieldset">
        <label class="label">
            <input type="checkbox" class="toggle toggle-accent" bind:checked={pathPayment} />
            Send and Receive different assets?
        </label>
    </fieldset>
{/if}

<!-- PathPayment -->
{#if pathPayment}
    <div class="flex w-full">
        <div class="grid w-5/12">
            <h3>Sending</h3>
            <fieldset class="fieldset w-full">
                <label for="sendAmount" class="label">
                    You send... {strictReceive ? '(estimated)' : ''}
                </label>
                <div class="join">
                    <input
                        bind:value={sendAmount}
                        onchange={findPaths}
                        id="sendAmount"
                        name="sendAmount"
                        placeholder="0.01"
                        type="text"
                        class="input join-item grow"
                        disabled={strictReceive}
                    />
                    <select class="select join-item" bind:value={sendAsset} onchange={selectPath}>
                        <option value="" disabled>Select asset</option>
                        {#if strictReceive && availablePaths}
                            {#each availablePaths as path (path)}
                                {#if path.source_asset_type === 'native'}
                                    <option value="native">XLM</option>
                                {:else}
                                    {@const assetString = `${path.source_asset_code}:${path.source_asset_issuer}`}
                                    <option value={assetString}>{path.source_asset_code}</option>
                                {/if}
                            {/each}
                        {:else if !strictReceive}
                            <option value="native">XLM</option>
                            {#each data.balances as balance (balance)}
                                {#if 'asset_code' in balance}
                                    {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                                    <option value={assetString}>{balance.asset_code}</option>
                                {/if}
                            {/each}
                        {/if}
                    </select>
                </div>
            </fieldset>
        </div>
        <div class="divider mx-5 divider-horizontal w-1/6">
            Strict {strictReceive ? 'Receive' : 'Send'}
            <input bind:checked={strictReceive} type="checkbox" class="toggle" />
        </div>
        <div class="grid w-5/12">
            <h3>Receiving</h3>
            <fieldset class="fieldset w-full">
                <label for="receiveAmount" class="label">
                    They receive... {!strictReceive ? '(estimated)' : ''}
                </label>
                <div class="join">
                    <input
                        bind:value={receiveAmount}
                        onchange={findPaths}
                        id="receiveAmount"
                        name="receiveAmount"
                        type="text"
                        placeholder="0.01"
                        class="input join-item grow"
                        disabled={!strictReceive}
                    />
                    <select
                        bind:value={receiveAsset}
                        onchange={selectPath}
                        class="select join-item"
                    >
                        <option value="" disabled>Select asset</option>
                        {#if !strictReceive && availablePaths}
                            {#each availablePaths as path (path)}
                                {#if path.destination_asset_type === 'native'}
                                    <option value="native">XLM</option>
                                {:else}
                                    {@const assetString = `${path.destination_asset_code}:${path.destination_asset_issuer}`}
                                    <option value={assetString}
                                        >{path.destination_asset_code}</option
                                    >
                                {/if}
                            {/each}
                        {:else if strictReceive}
                            <option value="native">XLM</option>
                            {#if otherPublicKey || destination}
                                {#await fetchAccountBalances(otherPublicKey || destination) then balances}
                                    {#each balances as balance (balance)}
                                        {#if 'asset_code' in balance}
                                            {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                                            <option value={assetString}>{balance.asset_code}</option
                                            >
                                        {/if}
                                    {/each}
                                {/await}
                            {/if}
                        {/if}
                    </select>
                </div>
            </fieldset>
        </div>
    </div>
{:else}
    <!-- Amount -->
    <fieldset class="my-5 fieldset max-w-full">
        <label for="amount" class="label">Amount</label>
        <div class="join max-w-md">
            <input
                id="amount"
                name="amount"
                class="input join-item grow"
                type="text"
                placeholder="0.01"
                bind:value={sendAmount}
            />
            <select
                id="asset"
                name="asset"
                class="select join-item"
                bind:value={sendAsset}
                disabled={createAccount}
            >
                <option value="" disabled>Select Asset</option>
                <option value="native">XLM</option>
                {#each data.balances as balance (balance)}
                    {#if 'asset_code' in balance}
                        {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                        <option value={assetString}>{balance.asset_code}</option>
                    {/if}
                {/each}
            </select>
        </div>
    </fieldset>
    <!-- /Amount -->
{/if}
<!-- /PathPayment -->

<!-- Memo -->
<fieldset class="my-5 fieldset">
    <label for="memo" class="label">Text Memo (optional)</label>
    <input
        id="memo"
        name="memo"
        type="text"
        class="input"
        placeholder="Maximum 28 characters"
        maxlength="28"
        bind:value={memo}
    />
</fieldset>
<!-- /Memo -->

<!-- Button -->
<div class="my-5">
    <button class="btn btn-primary" onclick={previewPaymentTransaction}>Preview Transaction</button>
</div>
<!-- /Button -->
