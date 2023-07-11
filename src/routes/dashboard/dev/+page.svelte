<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('dashboard/dev/+page.svelte data', data)

    import { addContacts } from '$lib/utils/devHelpers'
    import { contacts } from '$lib/stores/contactsStore'

    let addContactsOpts = {
        numContacts: 1,
        fundContacts: false,
        addTrustlines: false,
    }
</script>

<h1>Dev Helpers</h1>
<p>Some useful tools to help flesh out some features of BasicPay as you get used to it.</p>

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
        class="join-item btn w-fit"
        type="checkbox"
        aria-label="Fund New Contacts"
        bind:checked={addContactsOpts.fundContacts}
    />
    <input
        class="join-item btn w-fit"
        type="checkbox"
        aria-label="Add Trustlines"
        bind:checked={addContactsOpts.addTrustlines}
        disabled={!addContactsOpts.fundContacts}
    />
    <button class="btn-primary join-item btn" on:click={() => addContacts(addContactsOpts)}
        >Add Contacts</button
    >
</div>

<h2>Burn Bridges</h2>
<p>Clear out everyone from the contacts list and start fresh</p>
<button class="btn-error btn" on:click={contacts.empty}>Empty Contacts List</button>

<h2>Get Rich</h2>
<p>Get another round of funding into your account from Friendbot.</p>
<button class="btn-success btn">I need a friend!</button>
