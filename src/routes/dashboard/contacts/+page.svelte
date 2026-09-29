<!--
@component

The `/dashboard/contacts` page will allow the user to collect and manage a list
of contact entries that stores the contact's name and Stellar address. The
contact can also be flagged/unflagged as a "favorite" contact to be displayed on
the main `/dashboard` page.
-->

<script>
    // We import things from external packages that will be needed
    import { Trash2Icon, UserPlusIcon } from 'svelte-feather-icons'

    // We import any Svelte components we will need
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { contacts } from '$lib/state/Contacts.svelte'

    // We declare a _reactive_ component variable that will hold information for
    // a user-created contact entry, which can be added to the contacts store.
    let newContact = $state({
        name: '',
        address: '',
        favorite: false,
        id: '',
    })
</script>

<h1>Contacts</h1>
<p>
    The <code>/dashboard/contacts</code> page will allow the user to collect and manage a list of contact
    entries that stores the contact's name and Stellar address. The contact can also be flagged/unflagged
    as a "favorite" contact to be displayed on the main `/dashboard` page.
</p>

<h3>All contacts</h3>

<!-- The `prose` styles around this table line cells up by their text baseline, which
     pushes text down next to the avatars, so we center the cells with `align-middle` -->
<table class="table w-full">
    <thead>
        <tr>
            <th class="w-1/12 text-center">Favorite</th>
            <th>Name</th>
            <th>Address</th>
            <th class="w-1/12 text-center">Action</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th class="text-center">
                <input
                    bind:checked={newContact.favorite}
                    id="favorite"
                    name="favorite"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-accent"
                />
            </th>
            <td class="align-middle">
                <label for="name" class="sr-only">Name</label>
                <input
                    bind:value={newContact.name}
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Name"
                    class="input w-full input-sm"
                />
            </td>
            <td class="align-middle">
                <label for="address" class="sr-only">Address</label>
                <input
                    bind:value={newContact.address}
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Address"
                    class="input w-full input-sm"
                />
            </td>
            <td class="text-center align-middle">
                <button
                    onclick={() => contacts.add(newContact)}
                    id="addContactButton"
                    name="addContactButton"
                    type="submit"
                    class="btn btn-square btn-sm btn-success"
                >
                    <UserPlusIcon size="16" />
                </button>
            </td>
        </tr>
        {#each contacts.list as contact (contact.id)}
            <tr>
                <th class="text-center">
                    <input
                        onclick={() => contacts.favorite(contact.id)}
                        id={`favoriteCheckbox${contact.id}`}
                        name={`favoriteCheckbox${contact.id}`}
                        type="checkbox"
                        checked={contact.favorite}
                        class="checkbox checkbox-sm checkbox-accent"
                    />
                </th>
                <td class="align-middle">
                    <div class="flex items-center space-x-3">
                        <div class="avatar">
                            <div class="not-prose w-10 rounded-full">
                                <img
                                    src="https://id.lobstr.co/{contact.address}.png"
                                    alt="Avatar Tailwind CSS Component"
                                />
                            </div>
                        </div>
                        <div>
                            <div class="font-bold">{contact.name}</div>
                        </div>
                    </div>
                </td>
                <td class="align-middle">
                    <TruncatedKey keyText={contact.address} lookupName={false} />
                </td>
                <td class="text-center align-middle">
                    <button
                        onclick={() => contacts.remove(contact.id)}
                        id={`removeContact${contact.id}`}
                        name={`removeContact${contact.id}`}
                        class="btn btn-square btn-error btn-sm"
                    >
                        <Trash2Icon size="16" />
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>
