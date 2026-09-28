<script lang="ts">
    import { deleteSep12Customer, getSep12Fields } from '$lib/stellar/sep12'
    import { kyc } from '$lib/state/Kyc.svelte'
    import { wallet } from '$lib/state/Wallet.svelte'
    import { webAuth } from '$lib/state/WebAuth.svelte'

    interface Props {
        homeDomain?: string
        sep12Fields?: string[]
        /** When set, ask for the information the anchor needs for this specific transfer */
        transactionId?: string
    }

    let { homeDomain = '', sep12Fields = [], transactionId }: Props = $props()

    const startSep12 = async () => {
        let json = await getSep12Fields({
            authToken: webAuth.requireToken(homeDomain),
            homeDomain: homeDomain,
            transactionId: transactionId,
            // SEP-12 asks us to say what kind of customer this is, when asking
            // about a specific transfer. These are SEP-6 transfers.
            type: 'sep6',
        })
        // Start the list fresh, so revisiting this step doesn't add duplicates
        sep12Fields.length = 0
        if (json.fields) {
            for (let field in json.fields) {
                sep12Fields.push(field)
            }
        }
        return json
    }

    // We keep the request in state, so we can re-check the anchor after the
    // customer's data has been deleted
    let sep12Request = $state(startSep12())

    const deleteCustomer = async () => {
        await deleteSep12Customer({
            authToken: webAuth.requireToken(homeDomain),
            publicKey: wallet.publicKey,
            homeDomain: homeDomain,
        })
        sep12Request = startSep12()
    }
</script>

<p>
    Next, we've checked with the anchor to see what KYC information is needed from you to make the
    deposit successful.
</p>

{#await sep12Request}
    <p>loading...</p>
{:then json}
    {#if Object.keys(json.provided_fields ?? {}).length}
        <div class="collapse bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">
                You have already submitted the following KYC information to this anchor: (click to
                expand)
            </div>
            <div class="collapse-content">
                {#each Object.entries(json.provided_fields ?? {}) as [field, details] (field)}
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
                                bind:value={kyc.fields[field]}
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
                <button type="button" class="btn btn-error" onclick={deleteCustomer}
                    >Delete Customer Data</button
                >
            </div>
        </div>
    {/if}

    {#each Object.entries(json.fields ?? {}) as [field, details] (field)}
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
                    bind:value={kyc.fields[field]}
                    class="input-bordered input my-1"
                    type="text"
                    name={field}
                    id={field}
                    required={!details.optional}
                />
            {/if}
        </div>
    {/each}
{:catch err}
    <p class="text-error">
        We couldn't get the KYC requirements from the anchor: {err.body?.message ?? err.message}
    </p>
{/await}
