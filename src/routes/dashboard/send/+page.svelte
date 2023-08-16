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

<script>
    // `export let data` allows us to pull in any parent load data for use here.
    /** @type {import('./$types').PageData} */
    export let data

    // We import any Svelte components we will need
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import InfoAlert from '$lib/components/InfoAlert.svelte'

    // We import any stores we will need to read and/or write
    import { infoMessage } from '$lib/stores/alertsStore'
    import { contacts } from '$lib/stores/contactsStore'
    import { walletStore } from '$lib/stores/walletStore'

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
    } from '$lib/stellar/transactions'

    // The `open` Svelte context is used to open the confirmation modal
    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')

    // Define some component variables that will be used throughout the page
    let destination = ''
    $: otherDestination = destination === 'other'
    let otherPublicKey = ''
    let sendAsset = 'native'
    let sendAmount = ''
    let receiveAsset = ''
    let receiveAmount = ''
    let memo = ''
    /** @type {boolean|null} */
    let createAccount = null
    let pathPayment = false
    /** @type {import('stellar-sdk').ServerApi.PaymentPathRecord[]} */
    let availablePaths = []
    let strictReceive = false
    let paymentXDR = ''
    let paymentNetwork = ''

    /**
     * Check whether or not the account exists and is funded on the Stellar network.
     * @async
     * @function checkDestination
     * @param {string} publicKey Public Stellar address to check on the network
     */
    let checkDestination = async (publicKey) => {
        // Only do this if the `publicKey` is not "other". This check lets us
        // use the same function for both the select dropdown, and the
        // `otherPublicKey` input element.
        if (publicKey !== 'other') {
            try {
                // If the account returns successfully, ensure we're not using a
                // `createAccount` operation
                await fetchAccount(publicKey)
                createAccount = false
            } catch (err) {
                // Otherwise, inform the user about what will take place
                // @ts-ignore
                if (err.status === 404) {
                    createAccount = true
                    sendAsset = 'native'
                    infoMessage.set(
                        'Account Not Funded: You are sending a payment to an account that does not yet exist on the Stellar ledger. Your payment will take the form of a <code>creatAccount</code> operation, and the amount you send must be at least 1 XLM.'
                    )
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
                    sendAsset.startsWith(path.source_asset_code)
            )[0].source_amount
        } else {
            // Set the `receiveAmount` variable to the chosen path amount. The
            // filtering we do checks if the asset_type matches because that
            // will give us our 'native' XLM asset, otherwise we match on the
            // asset_code.
            receiveAmount = availablePaths.filter(
                (path) =>
                    path.destination_asset_type === receiveAsset ||
                    receiveAsset.startsWith(path.destination_asset_code)
            )[0].destination_amount
        }
    }

    /**
     * Takes an action after the pincode has been confirmed by the user.
     * @async
     * @function onConfirm
     * @param {string} pincode Pincode that was confirmed by the modal window */
    const onConfirm = async (pincode) => {
        // Use the walletStore to sign the transaction
        let signedTransaction = await walletStore.sign({
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
        let { transaction, network_passphrase } = createAccount
            ? await createCreateAccountTransaction({
                  source: data.publicKey,
                  destination: otherDestination ? otherPublicKey : destination,
                  amount: sendAmount,
                  memo: memo,
              })
            : pathPayment && strictReceive
            ? await createPathPaymentStrictReceiveTransaction({
                  source: data.publicKey,
                  sourceAsset: sendAsset,
                  sourceAmount: sendAmount,
                  destination: otherDestination ? otherPublicKey : destination,
                  destinationAsset: receiveAsset,
                  destinationAmount: receiveAmount,
                  memo: memo,
              })
            : pathPayment && !strictReceive
            ? await createPathPaymentStrictSendTransaction({
                  source: data.publicKey,
                  sourceAsset: sendAsset,
                  sourceAmount: sendAmount,
                  destination: otherDestination ? otherPublicKey : destination,
                  destinationAsset: receiveAsset,
                  destinationAmount: receiveAmount,
                  memo: memo,
              })
            : await createPaymentTransaction({
                  source: data.publicKey,
                  destination: otherDestination ? otherPublicKey : destination,
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
<div class="form-control my-5">
    <label for="destination" class="label">
        <span class="label-text">Destination</span>
    </label>
    <select
        bind:value={destination}
        on:change={() => checkDestination(destination)}
        id="destination"
        name="destination"
        class="select-bordered select"
    >
        <option value="" disabled selected>Select Recipient</option>
        {#each $contacts as contact (contact.id)}
            <option value={contact.address}>{contact.name}</option>
        {/each}
        <option value="other">Other...</option>
    </select>
</div>
<!-- /Destination -->

<!-- OtherDestination -->
{#if otherDestination}
    <div class="form-control my-5">
        <label for="otherPublicKey" class="label">
            <span class="label-text">Destination Public Key</span>
        </label>
        <input
            bind:value={otherPublicKey}
            on:change={() => checkDestination(otherPublicKey)}
            id="otherPublicKey"
            name="otherPublicKey"
            type="text"
            placeholder="G..."
            class="input-bordered input"
        />
    </div>
{/if}
<!-- /OtherDestination -->

<!-- InfoAlert -->
{#if createAccount}
    <InfoAlert />
{/if}
<!-- /InfoAlert -->

{#if createAccount !== null && !createAccount}
    <div class="form-control my-1">
        <label class="label cursor-pointer">
            <span class="label-text">Send and Receive different assets?</span>
            <input type="checkbox" class="toggle-accent toggle" bind:checked={pathPayment} />
        </label>
    </div>
{/if}

<!-- PathPayment -->
{#if pathPayment}
    <div class="flex w-full">
        <div class="grid w-5/12">
            <h3>Sending</h3>
            <div class="form-control w-full">
                <label for="sendAmount" class="label">
                    <span class="label-text">You send... {strictReceive ? '(estimated)' : ''}</span>
                </label>
                <div class="join">
                    <div class="grow">
                        <div>
                            <input
                                bind:value={sendAmount}
                                on:change={findPaths}
                                id="sendAmount"
                                name="sendAmount"
                                placeholder="0.01"
                                type="text"
                                class="input-bordered input join-item w-full"
                                disabled={strictReceive}
                            />
                        </div>
                    </div>
                    <select
                        class="select-bordered select join-item"
                        bind:value={sendAsset}
                        on:change={selectPath}
                    >
                        <option value="" disabled>Select asset</option>
                        {#if strictReceive && availablePaths}
                            {#each availablePaths as path}
                                {#if path.source_asset_type === 'native'}
                                    <option value="native">XLM</option>
                                {:else}
                                    {@const assetString = `${path.source_asset_code}:${path.source_asset_issuer}`}
                                    <option value={assetString}>{path.source_asset_code}</option>
                                {/if}
                            {/each}
                        {:else if !strictReceive}
                            <option value="native">XLM</option>
                            {#each data.balances as balance}
                                {#if 'asset_code' in balance}
                                    {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                                    <option value={assetString}>{balance.asset_code}</option>
                                {/if}
                            {/each}
                        {/if}
                    </select>
                </div>
            </div>
        </div>
        <div class="divider divider-horizontal mx-5 w-1/6">
            Strict {strictReceive ? 'Receive' : 'Send'}
            <input bind:checked={strictReceive} type="checkbox" class="toggle" />
        </div>
        <div class="grid w-5/12">
            <h3>Receiving</h3>
            <div class="form-control w-full">
                <label for="receiveAmount" class="label">
                    <span class="label-text"
                        >They receive... {!strictReceive ? '(estimated)' : ''}</span
                    >
                </label>
                <div class="join">
                    <div class="grow">
                        <div>
                            <input
                                bind:value={receiveAmount}
                                on:change={findPaths}
                                id="receiveAmount"
                                name="receiveAmount"
                                type="text"
                                placeholder="0.01"
                                class="input-bordered input join-item w-full"
                                disabled={!strictReceive}
                            />
                        </div>
                    </div>
                    <select
                        bind:value={receiveAsset}
                        on:change={selectPath}
                        class="select-bordered select join-item"
                    >
                        <option value="" disabled>Select asset</option>
                        {#if !strictReceive && availablePaths}
                            {#each availablePaths as path}
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
                                    {#each balances as balance}
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
            </div>
        </div>
    </div>
{:else}
    <!-- Amount -->
    <div class="form-control my-5 max-w-full">
        <label for="amount" class="label">
            <span class="label-text">Amount</span>
        </label>
        <div class="join">
            <div class="grow">
                <div>
                    <input
                        id="amount"
                        name="amount"
                        class="input-bordered input join-item w-full"
                        type="text"
                        placeholder="0.01"
                        bind:value={sendAmount}
                    />
                </div>
            </div>
            <select
                id="asset"
                name="asset"
                class="select-bordered select join-item"
                bind:value={sendAsset}
                disabled={createAccount}
            >
                <option value="" disabled>Select Asset</option>
                <option value="native">XLM</option>
                {#each data.balances as balance}
                    {#if 'asset_code' in balance}
                        {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                        <option value={assetString}>{balance.asset_code}</option>
                    {/if}
                {/each}
            </select>
        </div>
    </div>
    <!-- /Amount -->
{/if}
<!-- /PathPayment -->

<!-- Memo -->
<div class="form-control my-5">
    <label for="memo" class="label">
        <span class="label-text">Text Memo</span>
        <span class="label-text-alt">Optional</span>
    </label>
    <input
        id="memo"
        name="memo"
        type="text"
        class="input-bordered input"
        placeholder="Maximum 28 characters"
        maxlength="28"
        bind:value={memo}
    />
</div>
<!-- /Memo -->

<!-- Button -->
<div class="form-control my-5">
    <button class="btn-primary btn" on:click={previewPaymentTransaction}>Preview Transaction</button
    >
</div>
<!-- /Button -->
