<!--
@component

The `TransferHistory` component will display a listing of details concerning any
transfers the user has initiated with an anchor.
-->

<script>
    // We import any stores we will need to read and/or write
    import { page } from '$app/stores'
    import { transfers } from '$lib/stores/transfersStore'
    import { webAuthStore } from '$lib/stores/webAuthStore'

    // We import some of our `$lib` functions
    import { queryTransfers24 } from '$lib/stellar/sep24'
    import { queryTransfers6 } from '$lib/stellar/sep6'

    let expiredToken = false
    const protocolBadgeClasses = {
        sep6: 'badge badge-secondary',
        sep24: 'badge badge-accent',
    }

    /**
     * @typedef {Object} Sep6Transaction
     * @property {string} id
     * @property {('deposit'|'withdrawal')} kind
     * @property {string} status
     */

    const query = (protocol, assetCode, homeDomain) =>
        new Promise((resolve) => {
            protocol === 'sep6'
                ? queryTransfers6({
                      authToken: $webAuthStore[homeDomain],
                      assetCode: assetCode,
                      publicKey: $page.data.publicKey,
                      homeDomain: homeDomain,
                  }).then(({ transactions }) =>
                      resolve(
                          transactions.map((item) => {
                              return { ...item, asset_code: assetCode, protocol: protocol }
                          })
                      )
                  )
                : queryTransfers24({
                      authToken: $webAuthStore[homeDomain],
                      assetCode: assetCode,
                      homeDomain: homeDomain,
                  }).then(({ transactions }) =>
                      resolve(
                          transactions.map((item) => {
                              return { ...item, asset_code: assetCode, protocol: protocol }
                          })
                      )
                  )
        })

    const transfersPromise = async () => {
        /** @type {Promise<Object>[]}*/
        let transfersPromises = []
        if ($transfers) {
            for (let homeDomain in $transfers) {
                if ($webAuthStore[homeDomain] && !webAuthStore.isTokenExpired(homeDomain)) {
                    for (let protocol in $transfers[homeDomain]) {
                        let uniqueAssets = [
                            ...new Set(
                                $transfers[homeDomain][protocol].map((item) => item.asset_code)
                            ),
                        ]
                        uniqueAssets.forEach(async (assetcode) => {
                            transfersPromises.push(query(protocol, assetcode, homeDomain))
                        })
                    }
                } else {
                    expiredToken = true
                }
            }
        }
        let allTransfers = await Promise.all(transfersPromises)
        return allTransfers.flat().sort((a, b) => {
            return new Date(b.started_at) - new Date(a.started_at)
        })
    }
</script>

{#if $transfers}
<h3>Transfer History</h3>
{#await transfersPromise() then allTransfers}
    <table class="table-compact table">
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
                    <td>{new Date(Date.parse(transfer.started_at)).toLocaleString()}</td>
                    <td>
                        {#if transfer.status === 'completed'}
                            <a
                                target="_blank"
                                href={`https://stellar.expert/explorer/testnet/tx/${transfer.stellar_transaction_id}`}
                                >View Stellar transaction</a
                            >
                        {:else if 'more_info_url' in transfer}
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
    {#if expiredToken}
        <p>
            It looks like there may be a problem with some of your anchor authentication. Head over
            to the <a href="/dashboard/transfers">Transfers Page</a> to check that out.
        </p>
    {/if}
{/await}
{/if}
