<script>
    import { page } from '$app/stores'

    import { deleteSep12Customer, getSep12Fields } from '$lib/stellar/sep12'
    import { kycStore } from '$lib/stores/kycStore'
    import { webAuthStore } from '$lib/stores/webAuthStore'

    export let homeDomain = ''
    /** @type {string[]} */
    export let sep12Fields = []

    const startSep12 = async () => {
        let json = await getSep12Fields({
            authToken: $webAuthStore[homeDomain],
            homeDomain: homeDomain,
        })
        if (json.fields) {
            for (let field in json.fields) {
                sep12Fields.push(field)
            }
        }
        return json
    }
</script>

<p>
    Next, we've checked with the anchor to see what KYC information is needed from you to make the
    deposit successful.
</p>

{#await startSep12()}
    <p>loading...</p>
{:then json}
    {#if json.provided_fields}
        <div class="collapse bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
                You have already submitted the following KYC information to this anchor: (click to
                expand)
            </div>
            <div class="collapse-content">
                {#each Object.entries(json.provided_fields) as [field, details]}
                    <div class="form-control">
                        <label class="label" for={field}>
                            <span class="label-text">{details.description}</span>
                            {#if details.optional}
                                <span class="label-text-alt">Optional</span>
                            {/if}
                        </label>
                        {#if details.type === 'binary'}
                            <input type="file" class="file-input-bordered file-input" disabled />
                        {:else}
                            <input
                                bind:value={$kycStore[field]}
                                class="input-bordered input"
                                type="text"
                                name={field}
                                id={field}
                                required={!details.optional}
                                disabled
                            />
                        {/if}
                    </div>
                {/each}
                <button
                    class="btn-error btn"
                    on:click={deleteSep12Customer({
                        authToken: $webAuthStore[homeDomain],
                        publicKey: $page.data.publicKey,
                        homeDomain: homeDomain,
                    })}>Delete Customer Data</button
                >
            </div>
        </div>
    {/if}

    {#each Object.entries(json.fields) as [field, details]}
        <div class="form-control">
            <label class="label" for="field">
                <span class="label-text">{details.description}</span>
                {#if details.optional}
                    <span class="label-text-alt">Optional</span>
                {/if}
            </label>
            {#if details.type === 'binary'}
                <input type="file" class="file-input-bordered file-input my-1" />
            {:else}
                <input
                    bind:value={$kycStore[field]}
                    class="input-bordered input my-1"
                    type="text"
                    name={field}
                    id={field}
                    required={!details.optional}
                />
            {/if}
        </div>
    {/each}
{/await}
