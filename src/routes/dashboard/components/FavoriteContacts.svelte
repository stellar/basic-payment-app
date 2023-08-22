<!--
@component

The `FavoriteContacts` component implements a very simple table to display the
subset of a user's contact who have the `favorite` flag set as `true` on their
contact entry. This is displayed to the user on the `/dashboard` page.
-->

<script>
    // We import any Svelte components we will need
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { contacts } from '$lib/stores/contactsStore'

    // The `favoriteContacts` variable will be _reactive_ and update any time
    // a contact is either marked or unmarked as a favorite
    $: favoriteContacts = $contacts?.filter((contact) => contact.favorite)
</script>

<h3>Favorite Contacts</h3>
<table class="table w-full">
    <thead>
        <tr>
            <th>Favorite</th>
            <th>Name</th>
            <th>Address</th>
        </tr>
    </thead>
    {#if favoriteContacts}
        <tbody>
            {#each favoriteContacts as contact (contact.id)}
                <tr>
                    <th>
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
                        <TruncatedKey keyText={contact.address} lookupName={false} />
                    </td>
                    <th>
                        <button class="btn-ghost btn-xs btn">Stellar.Expert</button>
                    </th>
                </tr>
            {/each}
        </tbody>
    {/if}
</table>
