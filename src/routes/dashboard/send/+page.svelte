<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/send/+page.svelte data', data)

    import { contacts } from '$lib/stores/contactsStore'
    import { createPaymentTransaction } from '$lib/stellar/transactions'
    import { getContext } from 'svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    const { open } = getContext('simple-modal')

    let destination = ''
    let amount = ''
    let asset = 'native'
    let memo = ''

    const previewPaymentTransaction = async () => {
        let { transaction, network_passphrase } = await createPaymentTransaction({
            source: data.publicKey,
            destination: destination,
            asset: asset,
            amount: amount,
            memo: memo,
        })

        open(
            ConfirmationModal,
            {
                transactionXDR: transaction,
                transactionNetwork: network_passphrase
            }
        )
    }
</script>

<h1>Send a Payment</h1>
<p>Please complete the fields below to send a payment on the Stellar network.</p>

<!-- Destination -->
<div class="form-control my-5">
    <label for="destination" class="label">
        <span class="label-text">Destination</span>
    </label>
    <select id="destination" name="destination" class="select-bordered select" bind:value={destination}>
        <option value="" disabled selected>Select Recipient</option>
        {#each $contacts as contact (contact.id)}
            <option value={contact.address}>{contact.name}</option>
        {/each}
        <option value="other">Other...</option>
    </select>
</div>
<!-- /Destination -->

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
        <select id="asset" name="asset" class="select-bordered select join-item" bind:value={asset}>
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
    <button class="btn-primary btn" on:click={previewPaymentTransaction}>Preview Transaction</button>
</div>
<!-- /Button -->
