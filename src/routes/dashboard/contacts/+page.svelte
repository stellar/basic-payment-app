<script>
    // /** @type {import('./$types').PageData} */
    // export let data;
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'
    import { contacts } from '$lib/stores/contactsStore'
    import { Trash2Icon, UserPlusIcon } from 'svelte-feather-icons'

    $: newContact = {
        name: '',
        address: '',
        favorite: false,
    }
</script>

<h1>Contacts</h1>
<p>We'll manage our contacts here</p>

<h3>All contacts</h3>

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
                    type="checkbox"
                    class="checkbox-accent checkbox checkbox-sm"
                    bind:checked={newContact.favorite}
                />
            </th>
            <td>
                <label for="name">
                    <span class="label-text hidden">Name</span>
                </label>
                <input
                    bind:value={newContact.name}
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Name"
                    class="input-bordered input input-sm w-full"
                />
            </td>
            <td>
                <label for="address">
                    <span class="label-text hidden">Address</span>
                </label>
                <input
                    bind:value={newContact.address}
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Address"
                    class="input-bordered input input-sm w-full"
                />
            </td>
            <td class="text-center">
                <button
                    type="submit"
                    class="btn-success btn-sm btn-square btn"
                    on:click={() => contacts.add(newContact)}
                >
                    <UserPlusIcon size="16" />
                </button>
            </td>
        </tr>
        {#each $contacts as contact (contact.id)}
            <tr>
                <th class="text-center">
                    <input
                        type="checkbox"
                        class="checkbox-accent checkbox checkbox-sm"
                        checked={contact.favorite}
                        on:click={() => contacts.favorite(contact.id)}
                    />
                </th>
                <td>
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
                <td>
                    <TruncatedKey keyText={contact.address} />
                </td>
                <td class="text-center">
                    <button
                        class="btn-error btn-sm btn-square btn"
                        on:click={() => contacts.remove(contact.id)}
                    >
                        <Trash2Icon size="16" />
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>
