<!--
@component

The `TransferHistory` component will display a listing of details concerning any
transfers the user has initiated with an anchor.
-->

<script lang="ts">
    import { resolve } from '$app/paths'
    // We import any stores we will need to read and/or write
    import { page } from '$app/state'
    import { transfers, type TransferProtocol } from '$lib/state/Transfers.svelte'
    import { webAuth } from '$lib/state/WebAuth.svelte'

    // We import some of our `$lib` functions
    import { queryTransfers24 } from '$lib/stellar/sep24'
    import { queryTransfers6 } from '$lib/stellar/sep6'
    import type { AnchorTransaction } from '$lib/stellar/anchorTransactions'

    /** A transfer from an anchor's history, along with the asset and protocol it used */
    type TransferRecord = AnchorTransaction & { asset_code: string; protocol: TransferProtocol }

    let expiredToken = $state(false)
    // Anchors we couldn't get transfers from (e.g., their server had an error)
    let unavailableAnchors: string[] = $state([])
    const protocolBadgeClasses = {
        sep6: 'badge badge-secondary',
        sep24: 'badge badge-accent',
    }

    /**
     * Asks an anchor for the user's transfers of one asset, using one protocol.
     * @param protocol Which protocol the transfers were made with
     * @param assetCode Asset code of the transfers
     * @param homeDomain Home domain of the anchor
     */
    const query = async (
        protocol: TransferProtocol,
        assetCode: string,
        homeDomain: string,
    ): Promise<TransferRecord[]> => {
        const { transactions } =
            protocol === 'sep6'
                ? await queryTransfers6({
                      authToken: webAuth.requireToken(homeDomain),
                      assetCode: assetCode,
                      publicKey: page.data.publicKey,
                      homeDomain: homeDomain,
                  })
                : await queryTransfers24({
                      authToken: webAuth.requireToken(homeDomain),
                      assetCode: assetCode,
                      homeDomain: homeDomain,
                  })
        return transactions.map((item) => {
            return { ...item, asset_code: assetCode, protocol: protocol }
        })
    }

    const transfersPromise = async () => {
        let requests: { homeDomain: string; transfers: Promise<TransferRecord[]> }[] = []
        for (let homeDomain in transfers.all) {
            if (webAuth.getToken(homeDomain) && !webAuth.isTokenExpired(homeDomain)) {
                for (const protocol of ['sep6', 'sep24'] as const) {
                    const entries = transfers.all[homeDomain][protocol] ?? []
                    const uniqueAssets = [...new Set(entries.map((item) => item.asset_code))]
                    for (const assetCode of uniqueAssets) {
                        requests.push({
                            homeDomain,
                            transfers: query(protocol, assetCode, homeDomain),
                        })
                    }
                }
            } else {
                expiredToken = true
            }
        }
        // If one anchor has a problem, we still show the transfers from the others
        const results = await Promise.allSettled(requests.map((request) => request.transfers))
        let allTransfers: TransferRecord[] = []
        results.forEach((result, i) => {
            if (result.status === 'fulfilled') {
                allTransfers.push(...result.value)
            } else {
                const { homeDomain } = requests[i]
                console.error(`Could not get transfers from ${homeDomain}`, result.reason)
                if (!unavailableAnchors.includes(homeDomain)) unavailableAnchors.push(homeDomain)
            }
        })
        // Show the most recent transfers first
        return allTransfers.sort((a, b) => {
            return new Date(b.started_at ?? 0).getTime() - new Date(a.started_at ?? 0).getTime()
        })
    }
</script>

{#if transfers.all}
    <h3>Transfer History</h3>
    {#await transfersPromise() then allTransfers}
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Amount</th>
                    <th>Asset</th>
                    <th>Direction</th>
                    <th>Protocol</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>More Info</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each allTransfers as transfer (transfer.id)}
                    <tr>
                        <th>{transfer.amount_in}</th>
                        <td>{transfer.asset_code}</td>
                        <td>{transfer.kind}</td>
                        <td
                            ><div class={`${protocolBadgeClasses[transfer.protocol]}`}>
                                {transfer.protocol}
                            </div></td
                        >
                        <td>{transfer.status}</td>
                        <td>{new Date(transfer.started_at ?? 0).toLocaleString()}</td>
                        <td>
                            {#if transfer.status === 'completed'}
                                <a
                                    target="_blank"
                                    href={`https://stellar.expert/explorer/testnet/tx/${transfer.stellar_transaction_id}`}
                                    >View Stellar transaction</a
                                >
                            {:else if 'more_info_url' in transfer}
                                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- this links to the anchor's site, not a page in our app -->
                                <a target="_blank" href={transfer.more_info_url}>View more info</a>
                            {/if}
                        </td>
                        <td>
                            {#if transfer.kind === 'withdrawal' && transfer.status === 'pending_user_transfer_start'}
                                Start a Payment
                            {:else}
                                Nevermind
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
        {#if unavailableAnchors.length}
            <p>
                We couldn't load your transfers from {unavailableAnchors.join(', ')} right now. Please
                try again later.
            </p>
        {/if}
        {#if expiredToken}
            <p>
                It looks like there may be a problem with some of your anchor authentication. Head
                over to the <a href={resolve('/dashboard/transfers')}>Transfers Page</a> to check that
                out.
            </p>
        {/if}
    {/await}
{/if}
