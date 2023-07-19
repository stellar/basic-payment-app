<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/send/+page.svelte data', data)

    import { contacts } from '$lib/stores/contactsStore'
    import { infoMessage } from '$lib/stores/alertsStore'
    import {
        createCreateAccountTransaction,
        createPathPaymentStrictReceiveTransaction,
        createPathPaymentStrictSendTransaction,
        createPaymentTransaction,
    } from '$lib/stellar/transactions'
    import {
        fetchAccount,
        submit,
        fetchAccountBalances,
        findStrictSendPaths,
        findStrictReceivePaths,
    } from '$lib/stellar/horizonQueries'
    import { getContext } from 'svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import InfoAlert from '$lib/components/InfoAlert.svelte'
    import { walletStore } from '$lib/stores/walletStore'
    const { open } = getContext('simple-modal')

    let destination = ''
    $: otherDestination = destination === 'other'
    let otherPublicKey = ''
    let sendAsset = 'native'
    let sendAmount = ''
    let receiveAsset = ''
    let receiveAmount = ''
    let memo = ''
    let createAccount = null
    let pathPayment = true
    let availablePaths = []
    let strictReceive = false
    let paymentXDR = ''
    let paymentNetwork = ''

    /**
     * Check whether or not the account exists and is funded on the Stellar network.
     * @param {string} publicKey Public Stellar address to check on the network
     */
    let checkDestination = async (publicKey) => {
        if (publicKey !== 'other') {
            try {
                await fetchAccount(publicKey)
                createAccount = false
            } catch (err) {
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

    const findPaths = async () => {
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
        availablePaths = paths
        console.log('here are the known availablePaths', availablePaths)
    }

    const selectPath = () => {
        if (strictReceive) {
            let chosenPath = availablePaths.filter(
                (path) =>
                    path.source_asset_type === sendAsset ||
                    sendAsset.startsWith(path.source_asset_code)
            )
            console.log('the chosen path is:', chosenPath)
            sendAmount = chosenPath[0].source_amount
        } else {
            receiveAmount = availablePaths.filter(
                (path) =>
                    path.destination_asset_type === receiveAsset ||
                    receiveAsset.startsWith(path.destination_asset_code)
            )[0].destination_amount
        }
    }

    /** @param {string} pincode Pincode that was confirmed by the modal window */
    const onConfirm = async (pincode) => {
        let signedTransaction = await walletStore.sign({
            transactionXDR: paymentXDR,
            network: paymentNetwork,
            pincode: pincode,
        })
        await submit(signedTransaction)
    }

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

        paymentXDR = transaction
        paymentNetwork = network_passphrase

        open(ConfirmationModal, {
            transactionXDR: transaction,
            transactionNetwork: network_passphrase,
            onConfirm: onConfirm,
        })
    }
</script>

<h1>Send a Payment</h1>
<p>Please complete the fields below to send a payment on the Stellar network.</p>

<!-- Destination -->
<div class="form-control my-5">
    <label for="destination" class="label">
        <span class="label-text">Destination</span>
    </label>
    <select
        id="destination"
        name="destination"
        class="select-bordered select"
        bind:value={destination}
        on:change={checkDestination(destination)}
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
            id="otherPublicKey"
            name="otherPublicKey"
            type="text"
            placeholder="G..."
            class="input-bordered input"
            bind:value={otherPublicKey}
            on:change={checkDestination(otherPublicKey)}
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
    <!-- PathPayment -->
    {#if pathPayment}
        <div class="flex w-full">
            <div class="grid w-5/12">
                <h3>Sending</h3>
                <div class="form-control w-full">
                    <label for="sendAmount" class="label">
                        <span class="label-text"
                            >You send... {strictReceive ? '(estimated)' : ''}</span
                        >
                    </label>
                    <div class="join">
                        <div class="grow">
                            <div>
                                <input
                                    disabled={strictReceive}
                                    id="sendAmount"
                                    name="sendAmount"
                                    class="input-bordered input join-item w-full"
                                    placeholder="0.01"
                                    type="text"
                                    bind:value={sendAmount}
                                    on:change={findPaths}
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
                                        <option value={assetString}>{path.source_asset_code}</option
                                        >
                                    {/if}
                                {/each}
                            {:else if !strictReceive}
                                <option value="native">XLM</option>
                                {#each data.balances as balance}
                                    {#if balance.asset_type !== 'native'}
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
                <input type="checkbox" class="toggle" bind:checked={strictReceive} />
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
                                    disabled={!strictReceive}
                                    id="receiveAmount"
                                    name="receiveAmount"
                                    class="input-bordered input join-item w-full"
                                    placeholder="0.01"
                                    type="text"
                                    on:change={findPaths}
                                    bind:value={receiveAmount}
                                />
                            </div>
                        </div>
                        <select
                            class="select-bordered select join-item"
                            bind:value={receiveAsset}
                            on:change={selectPath}
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
                                            {#if balance.asset_type !== 'native'}
                                                {@const assetString = `${balance.asset_code}:${balance.asset_issuer}`}
                                                <option value={assetString}
                                                    >{balance.asset_code}</option
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
{/if}

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
