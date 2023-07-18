<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('dashboard/dev/+page.svelte data', data)

    import { addContacts } from '$lib/utils/devHelpers'
    import { contacts } from '$lib/stores/contactsStore'
    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import { walletStore } from '$lib/stores/walletStore'

    let addContactsOpts = {
        numContacts: 1,
        fundContacts: false,
        addTrustlines: false,
    }

    function makeTheModal() {
        open(ConfirmationModal)
    }
</script>

<h1>Dev Helpers</h1>
<p>Some useful tools to help flesh out some features of BasicPay as you get used to it.</p>

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
    <dt><strong>Secret Key</strong></dt>
    <dd>
        <TruncatedKey keyText={$walletStore.devInfo.secretKey} />
    </dd>
</dl>

<h2>Make Friends</h2>
<p>Populate the contact list with new contact entries.</p>
<div class="join">
    <div>
        <div>
            <input
                class="input-bordered input join-item"
                type="number"
                placeholder="numContacts"
                bind:value={addContactsOpts.numContacts}
            />
        </div>
    </div>
    <input
        class="btn-outline join-item btn"
        type="checkbox"
        aria-label="Fund New Contacts"
        bind:checked={addContactsOpts.fundContacts}
    />
    <input
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
<button class="btn-warning btn" on:click={contacts.empty}>Empty Contacts List</button>

<h2>Get Rich</h2>
<p>Get another round of funding into your account from Friendbot.</p>
<button class="btn-success btn">I need a friend!</button>

<h2>Launch Modal Rocket</h2>
<p>Test the modal thing to see what comes up... I guess?</p>
<button class="btn-primary btn" on:click={makeTheModal}>svelte-simple-modal</button>
<!-- Open the modal using ID.showModal() method -->
<button class="btn-accent btn" onclick="my_modal_5.showModal()">daisyui modal</button>
<dialog id="my_modal_5" class="modal modal-bottom sm:modal-middle">
    <form method="dialog" class="modal-box">
        <h3 class="text-lg font-bold">Hello!</h3>
        <p class="py-4">Press ESC key or click the button below to close</p>
        <div class="modal-action">
            <!-- if there is a button in form, it will close the modal -->
            <button class="btn">Close</button>
        </div>
    </form>
</dialog>

<h2>Throw it On the Ground!</h2>
<p>Tired of your BasicPay setup? Nuke the whole gosh-darn thing!</p>
<button class="btn-error btn" on:click={() => localStorage.clear()}
    >You can't buy me hot dog man!</button
>
