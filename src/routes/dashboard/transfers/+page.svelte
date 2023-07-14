<script>
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/transfers/+page.svelte data', data)

    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')
    import { LogInIcon, LogOutIcon } from 'svelte-feather-icons'
    import { fetchAssetsWithHomeDomains } from '$lib/stellar/horizonQueries'
    import { fetchStellarToml } from '$lib/stellar/sep1'
    import { getSep6Info } from '$lib/stellar/sep6'
    import { getSep24Info, initiateTransfer24 } from '$lib/stellar/sep24'
    import TransferModalSep6 from '$lib/components/TransferModalSep6.svelte'
    import { isTokenExpired, webAuthStore } from '$lib/stores/webAuthStore'
    import { getChallengeTransaction, submitChallengeTransaction } from '$lib/stellar/sep10'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'
    import { walletStore } from '$lib/stores/walletStore'

    let challengeXDR = ''
    let challengeNetwork = ''
    let challengeHomeDomain = ''

    const transferButtonClasses = {
        deposit: 'btn lg:w-1/2 join-item btn-accent',
        withdraw: 'btn lg:w-1/2 join-item btn-secondary',
    }

    const authStatusClasses = {
        unauthenticated: 'badge badge-error',
        auth_expired: 'badge badge-warning',
        auth_valid: 'badge badge-success',
    }

    /** @param {string} homeDomain Domain to examine current authentication status for */
    const getAuthStatus = (homeDomain) => {
        if ($webAuthStore[homeDomain]) {
            let token = $webAuthStore[homeDomain]
            if (isTokenExpired(token)) {
                return 'auth_expired'
            } else {
                return 'auth_valid'
            }
        } else {
            return 'unauthenticated'
        }
    }

    /** @param {string} pincode Pincode that was confirmed by the modal window */
    const onAuthConfirm = async (pincode) => {
        let signedTransaction = await walletStore.sign({
            transactionXDR: challengeXDR,
            network: challengeNetwork,
            pincode: pincode,
        })
        let token = await submitChallengeTransaction({
            transactionXDR: signedTransaction.toXDR(),
            homeDomain: challengeHomeDomain,
        })
        webAuthStore.setAuth(challengeHomeDomain, token)
    }

    /** @param {string} homeDomain Domain to authenticate with via SEP-10 protocol */
    const auth = async (homeDomain) => {
        let { transaction, network_passphrase } = await getChallengeTransaction({
            publicKey: data.publicKey,
            domain: homeDomain,
        })

        challengeXDR = transaction,
        challengeNetwork = network_passphrase
        challengeHomeDomain = homeDomain

        open(ConfirmationModal, {
            title: 'SEP-10 Challenge Transaction',
            body: 'Please confirm your ownership of this account by signing this challenge transaction. This transaction has already been checked and verified and everything looks good from what we can tell. Feel free to double-check that everything lines up with the SEP-10 specification yourself, though.',
            transactionXDR: challengeXDR,
            transactionNetwork: challengeNetwork,
            onConfirm: onAuthConfirm
        })
    }

    /**
     * Launch the SEP-6 modal to begin the transfer process and gather information from the user
     * @param {Object} opts Options object
     * @param {string} opts.homeDomain Domain of the anchor that is handling the transfer
     * @param {string} opts.assetCode Stellar asset code that will be transferred using the anchor
     * @param {('deposit'|'withdraw')} opts.endpoint Endpoint of the transfer server to interact with (e.g., `deposit` or `withdraw`)
     */
    const launchTransferModalSep6 = ({ homeDomain, assetCode, endpoint }) => {
        open(TransferModalSep6, {
            homeDomain: homeDomain,
            assetCode: assetCode,
            endpoint: endpoint,
        })
    }

    /**
     * Launch the interactive SEP-24 popup window for the user to interact directly with the anchor to begin a transfer.
     * @param {Object} opts Options object
     * @param {string} opts.homeDomain Domain of the anchor that is handling the transfer
     * @param {string} opts.assetCode Stellar asset code that will be transferred using the anchor
     * @param {('deposit'|'withdraw')} opts.endpoint Endpoint of the transfer server to interact with (e.g., `deposit` or `withdraw`)
     */
    const launchTransferWindowSep24 = async ({ homeDomain, assetCode, endpoint }) => {
        let { id, type, url } = await initiateTransfer24({
            authToken: $webAuthStore[homeDomain],
            endpoint: endpoint,
            homeDomain: homeDomain,
            urlFields: {
                asset_code: assetCode,
                account: data.publicKey,
            },
        })

        let interactiveUrl = `${url}&callback=postMessage`
        let popup = window.open(interactiveUrl, 'bpaTransfer24Window', 'popup')
        window.addEventListener('message', async (event) => {
            console.log('here is the event i heard from the popup window', event)
            popup?.close()
        })
    }
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
                {@const authStatus = getAuthStatus(asset.home_domain)}
                <h3 class="card-title">
                    {asset.asset_code} <small>({asset.home_domain})</small>
                    <div class={authStatusClasses[authStatus]}>{authStatus}</div>
                </h3>
                {@const thisAsset = stellarToml.CURRENCIES?.filter(
                    ({ code }) => code === asset.asset_code
                )[0]}
                <p>{thisAsset.desc}</p>
                {#if authStatus !== 'auth_valid'}
                    <button id={`authButton${asset.asset_code}`} name={`authButton${asset.asset_code}`} class="btn btn-primary" on:click={auth(asset.home_domain)}>Authenticate with Anchor</button>
                    <div class="form-control">
                        <label class="label" for={`authButton${asset.asset_code}`}>
                            <span class="label-text">Please authenticate before attempting any transfers.</span>
                        </label>
                    </div>
                {:else}
                    <div class="flex w-full flex-col lg:flex-row">
                        {#if 'TRANSFER_SERVER' in stellarToml}
                            {#await getSep6Info(asset.home_domain) then sep6Info}
                                <div
                                    class="card rounded-box grid flex-grow place-items-center bg-base-300"
                                >
                                    <div class="card-body w-full">
                                        <h4>SEP-6 Transfers</h4>
                                        <div class="join-vertical join w-full lg:join-horizontal">
                                            {#each Object.entries(sep6Info) as [endpoint, details]}
                                                {#if (endpoint === 'deposit' || endpoint === 'withdraw') && asset.asset_code in details}
                                                    <button
                                                        class={transferButtonClasses[endpoint]}
                                                        disabled={authStatus !== 'auth_valid'}
                                                        on:click={launchTransferModalSep6({
                                                            homeDomain: asset.home_domain,
                                                            assetCode: asset.asset_code,
                                                            endpoint: endpoint,
                                                        })}
                                                    >
                                                        {#if endpoint === 'deposit'}
                                                            <LogInIcon />
                                                            Deposit
                                                        {:else}
                                                            Withdraw
                                                            <LogOutIcon />
                                                        {/if}
                                                    </button>
                                                {/if}
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            {/await}
                        {/if}
                        {#if 'TRANSFER_SERVER' in stellarToml && 'TRANSFER_SERVER_SEP0024' in stellarToml}
                            <div class="divider lg:divider-horizontal" />
                        {/if}
                        {#if 'TRANSFER_SERVER_SEP0024' in stellarToml}
                            {#await getSep24Info(asset.home_domain) then sep24Info}
                                <div
                                    class="card rounded-box grid flex-grow place-items-center bg-base-300"
                                >
                                    <div class="card-body w-full">
                                        <h4>SEP-24 Transfers</h4>
                                        <div class="join-vertical join w-full lg:join-horizontal">
                                            {#each Object.entries(sep24Info) as [endpoint, details]}
                                                {#if (endpoint === 'deposit' || endpoint === 'withdraw') && asset.asset_code in details}
                                                    <button
                                                        class={transferButtonClasses[endpoint]}
                                                        disabled={authStatus !== 'auth_valid'}
                                                        on:click={launchTransferWindowSep24({
                                                            homeDomain: asset.home_domain,
                                                            assetCode: asset.asset_code,
                                                            endpoint: endpoint,
                                                        })}
                                                    >
                                                        {#if endpoint === 'deposit'}
                                                            <LogInIcon />
                                                            Deposit
                                                        {:else}
                                                            Withdraw
                                                            <LogOutIcon />
                                                        {/if}
                                                    </button>
                                                {/if}
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            {/await}
                        {/if}
                    </div>
                {/if}
            {/if}
        {/await}
    {/each}
{/await}
