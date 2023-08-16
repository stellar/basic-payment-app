<!--
@component

The `/dashboard/settings/dev` page will allow developer to quickly get their
"profile" into a useable state for experimenting with BasicPay and with the
testnet. Utilities are available to access their Stellar public/secret keys,
populate the contacts list (optionally funding the accounts and adding various
trustlines to them), empty the contacts list, receive more testnet funding from
friendbot, and completely erase all the `localStorage` we have for BasicPay and
start fresh.
-->

<script>
    // We import any Svelte components we will need
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { walletStore } from '$lib/stores/walletStore'

    // We import some of our `$lib` functions
    import {
        addContacts,
        emptyContacts,
        mergeFriendbotAccount,
        nukeLocalStorage,
    } from '$lib/utils/devHelpers'

    // The `open` Svelte context is used to open the confirmation modal
    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')

    // Define some component variables that will be used throughout the page
    let addContactsOpts = {
        numContacts: 1,
        fundContacts: false,
        addTrustlines: false,
    }

    /**
     * Display a modal. Use this to play around with settings, props, and such.
     * @function displayModal
     */
    function displayModal() {
        open(ConfirmationModal)
    }
</script>

<h1>Dev Helpers</h1>
<p>
    The <code>/dashboard/settings/dev</code> page will allow developer to quickly get their "profile"
    into a useable state for experimenting with BasicPay and with the testnet. Utilities are available
    to access their Stellar public/secret keys, populate the contacts list (optionally funding the accounts
    and adding various trustlines to them), empty the contacts list, receive more testnet funding from
    friendbot, and completely erase all the `localStorage` we have for BasicPay and start fresh.
</p>

<h2>Keypair Information</h2>
<p>
    These can be helpful to know in case you need to manually create some transactions that we
    aren't setup to do.
</p>
<dl>
    <dt><strong>Public Key</strong></dt>
    <dd>
        <TruncatedKey keyText={$walletStore.publicKey} />
    </dd>
    {#if $walletStore.devInfo}
        <dt><strong>Secret Key</strong></dt>
        <dd>
            <TruncatedKey keyText={$walletStore.devInfo.secretKey} />
        </dd>
    {/if}
</dl>

<h2>Make Friends</h2>
<p>Populate the contact list with new contact entries.</p>
<div class="join">
    <div>
        <div>
            <input
                id="numContacts"
                name="numContacts"
                class="input-bordered input join-item"
                type="number"
                placeholder="Number of contacts to add"
                bind:value={addContactsOpts.numContacts}
            />
        </div>
    </div>
    <input
        id="fundContacts"
        name="fundContacts"
        class="btn-outline join-item btn"
        type="checkbox"
        aria-label="Fund New Contacts"
        bind:checked={addContactsOpts.fundContacts}
    />
    <input
        id="addContactTrustlines"
        name="addContactTrustlines"
        class="btn-outline join-item btn"
        type="checkbox"
        aria-label="Add Trustlines"
        bind:checked={addContactsOpts.addTrustlines}
        disabled={!addContactsOpts.fundContacts}
    />
    <button
        class="btn-primary btn-accent join-item btn"
        on:click={() => addContacts(addContactsOpts)}>Add Contacts</button
    >
</div>

<h2>Burn Bridges</h2>
<p>Clear out everyone from the contacts list and start fresh</p>
<button class="btn-warning btn" on:click={emptyContacts}>Empty Contacts List</button>

<h2>Get Rich</h2>
<p>Get another round of funding into your account from Friendbot.</p>
<button class="btn-success btn" on:click={() => mergeFriendbotAccount($walletStore.publicKey)}
    >I need a friend!</button
>

<h2>Launch Modal Rocket</h2>
<p>Test the modal thing to see what comes up... I guess?</p>
<button class="btn-primary btn" on:click={displayModal}>svelte-simple-modal</button>

<h2>Throw it On the Ground!</h2>
<p>Tired of your BasicPay setup? Nuke the whole gosh-darn thing!</p>
<button class="btn-error btn" on:click={nukeLocalStorage}>You can't buy me hot dog man!</button>
