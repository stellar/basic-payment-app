<script>
    export const ssr = false
    export const prerender = false
    import { contacts } from '$lib/stores/contactsStore'
    // console.log('routes/dashboard/components/FavoriteContacts.svelte $contacts', $contacts)
    $: favoriteContacts = $contacts?.filter((contact) => contact.favorite)
    // console.log('routes/dashboard/components/FavoriteContacts.svelte favoriteContacts', favoriteContacts)
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
                                <div class="w-10 rounded-full not-prose">
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
                    <td>{contact.address}</td>
                    <th>
                        <button class="btn-ghost btn-xs btn">Stellar.Expert</button>
                    </th>
                </tr>
            {/each}
        </tbody>
    {/if}
</table>
