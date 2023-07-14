<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/send/+page.svelte data', data)

    import { contacts } from '$lib/stores/contactsStore'
    import { infoMessage } from '$lib/stores/alertsStore'
    import {
        createCreateAccountTransaction,
        createPaymentTransaction,
    } from '$lib/stellar/transactions'
    import { fetchAccount, submit } from '$lib/stellar/horizonQueries'
    import { getContext } from 'svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import InfoAlert from '$lib/components/InfoAlert.svelte'
    import { walletStore } from '$lib/stores/walletStore'
    const { open } = getContext('simple-modal')

    let destination = ''
    $: otherDestination = destination === 'other'
    let otherPublicKey = ''
    let amount = ''
    let asset = 'native'
    let memo = ''
    let createAccount = false
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
                    asset = 'native'
                    infoMessage.set(
                        'Account Not Funded: You are sending a payment to an account that does not yet exist on the Stellar ledger. Your payment will take the form of a <code>creatAccount</code> operation, and the amount you send must be at least 1 XLM.'
                    )
                }
            }
        }
    }

    /**
     * @param {string} pincode Pincode that was confirmed by the modal window
     */
    const onConfirm = async (pincode) => {
        console.log('routes/dashboard/send/+page.svelte onConfirm has been triggered')
        let signedTransaction = await walletStore.sign({
            transactionXDR: paymentXDR,
            network: paymentNetwork,
            pincode: pincode,
        })
        await submit(signedTransaction)
        console.log('I guess I did it?')
    }

    const previewPaymentTransaction = async () => {
        let { transaction, network_passphrase } = createAccount
            ? await createCreateAccountTransaction({
                  source: data.publicKey,
                  destination: otherDestination ? otherPublicKey : destination,
                  amount: amount,
                  memo: memo,
              })
            : await createPaymentTransaction({
                  source: data.publicKey,
                  destination: otherDestination ? otherPublicKey : destination,
                  asset: asset,
                  amount: amount,
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

<!-- Ammount -->
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
                    bind:value={amount}
                />
            </div>
        </div>
        <select
            id="asset"
            name="asset"
            class="select-bordered select join-item"
            bind:value={asset}
            disabled={createAccount}
        >
            <option value="" disabled>Select Asset</option>
            <option value="native">XLM</option>
            {#each data.balances as balance}
                {#if 'asset_code' in balance}
                    <option value={`${balance.asset_code}:${balance.asset_issuer}`}
                        >{balance.asset_code}</option
                    >
                {/if}
            {/each}
        </select>
    </div>
</div>
<!-- /Amount -->

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
