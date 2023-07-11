<script>
    /** @type {import('./$types').PageData} */
    export let data;
    console.log('dashboard/dev/+page.svelte data', data)

    import { addContacts } from '$lib/utils/devHelpers'
    let addContactsOpts = {
        numContacts: 1,
        fundContacts: false,
        addTrustlines: false,
    }
</script>

<h1>Dev Helpers</h1>
<h2>Make Friends</h2>
<p>Populate the contact list with new contact entries.</p>

<div class="join w-full">
    <div class="grow">
        <div class="w-full">
            <input class="join-item input input-bordered w-full" type="number" placeholder="numContacts" bind:value={addContactsOpts.numContacts} />
        </div>
    </div>
    <input class="join-item btn w-fit" type="checkbox" aria-label="Fund New Contacts" bind:checked={addContactsOpts.fundContacts} />
    <input class="join-item btn w-fit" type="checkbox" aria-label="Add Trustlines" bind:checked={addContactsOpts.addTrustlines} disabled={!addContactsOpts.fundContacts} />
    <button class="btn btn-accent join-item" on:click={() => addContacts(addContactsOpts)}>Add Contacts</button>
</div>
