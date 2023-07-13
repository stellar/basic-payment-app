<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/transfers/+page.svelte data', data)

    import { LogInIcon, LogOutIcon } from 'svelte-feather-icons'
    import { fetchAssetsWithHomeDomains } from '$lib/stellar/horizonQueries'
    import { fetchStellarToml } from '$lib/stellar/sep1'
</script>

<h1>Transfers</h1>
<p>
    Use the Stellar network's rails to existing financial infrastructure to move assets between the
    ledger and traditional banking accounts.
</p>

<h2>Initiate a Transfer</h2>
<p>
    Below, are listed all your trusted assets with the required infrastructure to facilitate deposit
    and/or withdrawals. We have implemented both <a
        href="https://www.stellar.org/protocol/sep-1"
        target="_blank"><code>SEP-6</code></a
    >
    and <a href="https://www.stellar.org/protocol/sep-24" target="_blank"><code>SEP-24</code></a> transfer
    protocols. These SEPs define the standard way for anchors and wallets to interact on behalf of users.
    This improves user experience by allowing wallets and other clients to interact with anchors directly
    without the user needing to leave the wallet to go to the anchor's site.
</p>
<p>
    <strong>SEP-6</strong> provides a <em>programmatic</em> method of interacting with the anchor
    server. The entire flow to initiate a transfer is handled here, in <em>BasicPay</em>.
</p>
<p>
    <strong>SEP-24</strong> provides an <em>interactive</em> method of utilizing the anchor server.
    The flow begins here in <em>BasicPay</em>, but the user is handed over to the anchor server for
    most of the transfer initiation.
</p>

{#await fetchAssetsWithHomeDomains(data.balances) then homeDomainAssets}
    {#each homeDomainAssets as asset}
        {#await fetchStellarToml(asset.home_domain) then stellarToml}
            {#if 'WEB_AUTH_ENDPOINT' in stellarToml || 'TRANSFER_SERVER' in stellarToml}
                <h3 class="card-title">{asset.asset_code} <small>({asset.home_domain})</small></h3>
                {@const thisAsset = stellarToml.CURRENCIES?.filter(
                    ({ code }) => code === asset.asset_code
                )[0]}
                <p>{thisAsset.desc}</p>
                <div class="flex w-full flex-col lg:flex-row">
                    {#if 'TRANSFER_SERVER' in stellarToml}
                        <div class="card rounded-box grid flex-grow place-items-center bg-base-300">
                            <div class="card-body w-full">
                                <h4>SEP-6 Transfers</h4>
                                <div class="join join-vertical lg:join-horizontal w-full">
                                    <button class="btn w-1/2 join-item btn-accent">
                                        <LogInIcon />
                                        Deposit
                                    </button>
                                    <button class="btn w-1/2 join-item btn-secondary">
                                        Withdraw
                                        <LogOutIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
                    {#if 'TRANSFER_SERVER' in stellarToml && 'TRANSFER_SERVER_SEP0024' in stellarToml}
                        <div class="divider lg:divider-horizontal" />
                    {/if}
                    {#if 'TRANSFER_SERVER_SEP0024' in stellarToml}
                        <div class="card rounded-box grid flex-grow place-items-center bg-base-300">
                            <div class="card-body w-full">
                                <h4>SEP-24 Transfers</h4>
                                <div class="join join-vertical lg:join-horizontal w-full">
                                    <button class="btn w-1/2 join-item btn-accent">
                                        <LogInIcon />
                                        Deposit
                                    </button>
                                    <button class="btn w-1/2 join-item btn-secondary">
                                        Withdraw
                                        <LogOutIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            {/if}
        {/await}
    {/each}
{/await}
