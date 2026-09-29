<!--
@component

The `FavoriteContacts` component implements a very simple table to display the
subset of a user's contact who have the `favorite` flag set as `true` on their
contact entry. This is displayed to the user on the `/dashboard` page.
-->

<script lang="ts">
    // We import any Svelte components we will need
    import TruncatedKey from '$lib/components/TruncatedKey.svelte'

    // We import any stores we will need to read and/or write
    import { contacts } from '$lib/state/Contacts.svelte'

    // The `favoriteContacts` variable will be _reactive_ and update any time
    // a contact is either marked or unmarked as a favorite
    let favoriteContacts = $derived(contacts.list.filter((contact) => contact.favorite))
</script>

<h3>Favorite Contacts</h3>
<!-- The `prose` styles around this table line cells up by their text baseline, which
     pushes text down next to the avatars, so we center the cells with `align-middle` -->
<table class="table">
    <thead>
        <tr>
            <th>Favorite</th>
            <th>Name</th>
            <th>Address</th>
            <th></th>
        </tr>
    </thead>
    {#if favoriteContacts}
        <tbody>
            {#each favoriteContacts as contact (contact.id)}
                <tr>
                    <th>
                        <input
                            type="checkbox"
                            class="checkbox checkbox-sm checkbox-accent"
                            checked={contact.favorite}
                            onclick={() => contacts.favorite(contact.id)}
                        />
                    </th>
                    <td class="align-middle">
                        <div class="flex items-center space-x-3">
                            <div class="avatar">
                                <!-- <div class="not-prose w-10 rounded-full"> -->
                                <div class="not-prose mask h-10 w-10 mask-circle">
                                    <img
                                        src="https://id.lobstr.co/{contact.address}.png"
                                        alt={`Stellar Identicon for ${contact.address}`}
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
                    <th>
                        <a
                            href={`https://stellar.expert/explorer/testnet/account/${contact.address}`}
                            class="btn btn-ghost btn-xs"
                            target="_blank">Stellar.Expert</a
                        >
                    </th>
                </tr>
            {/each}
        </tbody>
    {/if}
</table>
