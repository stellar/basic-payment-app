<!--
@component

The `/dashboard/transfers` page will allow the user to view assets they hold
trustlines for, which have infrastructure available to utilize for asset
transfers. A few series of server queries find out which assets the user can
transfer, which protocols are available for those transfers (SEP-6 and SEP-24
currently), check the authentication status of the user with the relevant
anchor, and present them with buttons that will allow them to initiate a
transfer with the anchor.

Heads-up this page has _a lot_ going on, and it can be easy to get lost or mixed
up. We'll try to comment things in a sensible way, but you may need to take a
couple read-throughs to understand everything.
-->

<script>
    // `export let data` allows us to pull in any parent load data for use here.
    /** @type {import('./$types').PageData} */
    export let data
    console.log('routes/dashboard/transfers/+page.svelte data', data)

    // We import things from external packages that will be needed
    import { Buffer } from 'buffer'
    import { LogInIcon, LogOutIcon } from 'svelte-feather-icons'

    // We import any Svelte components we will need
    import TransferModalSep6 from './components/TransferModalSep6.svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'

    // We import any stores we will need to read and/or write
    import { invalidateAll } from '$app/navigation'
    import { transfers } from '$lib/stores/transfersStore'
    import { walletStore } from '$lib/stores/walletStore'
    import { webAuthStore } from '$lib/stores/webAuthStore'

    // We import some of our `$lib` functions
    import { submit } from '$lib/stellar/horizonQueries'
    import { fetchStellarToml } from '$lib/stellar/sep1'
    import { getSep6Info } from '$lib/stellar/sep6'
    import { getChallengeTransaction, submitChallengeTransaction } from '$lib/stellar/sep10'
    import { getSep24Info, initiateTransfer24 } from '$lib/stellar/sep24'
    import { createPaymentTransaction } from '$lib/stellar/transactions'

    // The `open` Svelte context is used to open the confirmation modal
    import { getContext } from 'svelte'
    const { open } = getContext('simple-modal')

    // Define some component variables that will be used throughout the page
    let challengeXDR = ''
    let challengeNetwork = ''
    let challengeHomeDomain = ''
    let paymentXDR = ''
    let paymentNetwork = ''

    // An object to easily and consistently class buttons based on the type of
    // transfer that will take place.
    const transferButtonClasses = {
        deposit: 'btn lg:w-1/2 join-item btn-accent',
        withdraw: 'btn lg:w-1/2 join-item btn-secondary',
    }

    // An object to easily and consistently class badges based on the status of
    // a user's authentication token for a given anchor.
    const authStatusClasses = {
        unauthenticated: 'badge badge-error',
        auth_expired: 'badge badge-warning',
        auth_valid: 'badge badge-success',
    }

    /**
     * A simple function that checks whether a user has a SEP-10 authentication token stored for an anchor, and if it is expired or not.
     * @function getAuthStatus
     * @param {string} homeDomain Domain to examine current authentication status for
     */
    const getAuthStatus = (homeDomain) => {
        if ($webAuthStore[homeDomain]) {
            if (webAuthStore.isTokenExpired(homeDomain)) {
                return 'auth_expired'
            } else {
                return 'auth_valid'
            }
        } else {
            return 'unauthenticated'
        }
    }

    /**
     * Takes an action after the pincode has been confirmed by the user on a SEP-10 challenge transaction.
     * @function onAuthConfirm
     * @param {string} pincode Pincode that was confirmed by the modal window
     */
    const onAuthConfirm = async (pincode) => {
        // Sign the transaction with the user's keypair
        let signedTransaction = await walletStore.sign({
            transactionXDR: challengeXDR,
            network: challengeNetwork,
            pincode: pincode,
        })
        // Submit the signed tx to the SEP-10 server, and get the JWT token back
        let token = await submitChallengeTransaction({
            transactionXDR: signedTransaction.toXDR(),
            homeDomain: challengeHomeDomain,
        })
        // Add the token to our store
        webAuthStore.setAuth(challengeHomeDomain, token)
        // Reload any relevant `load()` functions (i.e., refresh the page)
        invalidateAll()
    }

    /**
     * Requests a challenge transaction from a SEP-10 server, and presents it to the user for pincode verification
     * @async
     * @function auth
     * @param {string} homeDomain Domain to authenticate with via SEP-10 protocol
     */
    const auth = async (homeDomain) => {
        // Request the challenge transaction, expecting back the XDR string
        let { transaction, network_passphrase } = await getChallengeTransaction({
            publicKey: data.publicKey,
            homeDomain: homeDomain,
        })

        // Set the component variables to hold the transaction details
        challengeXDR = transaction
        challengeNetwork = network_passphrase
        challengeHomeDomain = homeDomain

        // Open the confirmation modal for the user to confirm or reject the
        // challenge transaction. We provide our customized `onAuthConfirm`
        // function to be called as part of the modal's confirming process.
        open(ConfirmationModal, {
            title: 'SEP-10 Challenge Transaction',
            body: 'Please confirm your ownership of this account by signing this challenge transaction. This transaction has already been checked and verified and everything looks good from what we can tell. Feel free to double-check that everything lines up with the SEP-10 specification yourself, though.',
            transactionXDR: challengeXDR,
            transactionNetwork: challengeNetwork,
            onConfirm: onAuthConfirm,
        })
    }

    /**
     * Launch the SEP-6 modal to begin the transfer process and gather information from the user.
     * @function launchtransferModalSep6
     * @param {Object} opts Options object
     * @param {string} opts.homeDomain Domain of the anchor that is handling the transfer
     * @param {string} opts.assetCode Stellar asset code that will be transferred using the anchor
     * @param {string} opts.assetIssuer Public Stellar address that issues the asset being transferred
     * @param {Object} opts.sep6Info Info published by the anchor detailing what assets and/or transfer methods are available
     * @param {('deposit'|'withdraw')} opts.endpoint Endpoint of the transfer server to interact with (e.g., `deposit` or `withdraw`)
     */
    const launchTransferModalSep6 = ({
        homeDomain,
        assetCode,
        assetIssuer,
        endpoint,
        sep6Info,
    }) => {
        // Open the SEP-6 transfer modal, supplying the relevant props for our
        // desired type of transfer.
        open(TransferModalSep6, {
            homeDomain: homeDomain,
            assetIssuer: assetIssuer,
            transferData: {
                endpoint: endpoint,
            },
            formData: {
                account: data.publicKey,
                asset_code: assetCode,
            },
            sep6Info: sep6Info,
            submitPayment: submitPayment,
        })
    }

    /**
     * After a withdraw transaction has been presented to the user, and they've confirmed with the correct pincode, sign and submit the transaction to the Stellar network.
     * @async
     * @function onPaymentConfirm
     * @param {string} pincode The 6-digit pincode the user has confirmed that will decrypt the Stellar secret key for signing
     */
    const onPaymentConfirm = async (pincode) => {
        // Use the walletStore to sign the transaction
        let signedTransaction = await walletStore.sign({
            transactionXDR: paymentXDR,
            network: paymentNetwork,
            pincode: pincode,
        })
        // Submit the transaction to the Stellar network
        await submit(signedTransaction)
    }

    /**
     * Builds a Stellar payment to present to the user which will complete a transfer to the Anchor.
     * @param {Object} opts Options object
     * @param {Object} opts.withdrawDetails Object containing details about how a withdraw should proceed
     * @param {string} opts.assetCode Stellar asset code to be transferred in the payment transaction
     * @param {string} opts.assetIssuer Public Stellar address that issues the asset
     * @param {string|number} opts.amount Amount of the asset to send in the payment
     */
    let submitPayment = async ({ withdrawDetails, assetCode, assetIssuer, amount }) => {
        let { transaction, network_passphrase } = await createPaymentTransaction({
            source: data.publicKey,
            // @ts-ignore
            destination: withdrawDetails.account_id,
            asset: `${assetCode}:${assetIssuer}`,
            amount: amount,
            // @ts-ignore
            memo: withdrawDetails.memo ? Buffer.from(withdrawDetails.memo, 'base64') : undefined,
        })

        // Set the component variables to hold the transaction details
        paymentXDR = transaction
        paymentNetwork = network_passphrase

        // We close the SEP-6 modal, and open the regular confirmation modal
        close()
        open(ConfirmationModal, {
            transactionXDR: paymentXDR,
            transactionNetwork: paymentNetwork,
            onConfirm: onPaymentConfirm,
        })
    }

    /**
     * Launch the interactive SEP-24 popup window for the user to interact directly with the anchor to begin a transfer.
     * @function launchTransferWindowSep24
     * @param {Object} opts Options object
     * @param {string} opts.homeDomain Domain of the anchor that is handling the transfer
     * @param {string} opts.assetCode Stellar asset code that will be transferred using the anchor
     * @param {string} opts.assetIssuer Public Stellar address that issues the asset
     * @param {('deposit'|'withdraw')} opts.endpoint Endpoint of the transfer server to interact with (i.e., `deposit` or `withdraw`)
     */
    const launchTransferWindowSep24 = async ({ homeDomain, assetCode, assetIssuer, endpoint }) => {
        // We initiate the transfer from the SEP-24 server, and get the
        // interactive URL back from it
        // @ts-ignore
        let { url } = await initiateTransfer24({
            authToken: $webAuthStore[homeDomain],
            endpoint: endpoint,
            homeDomain: homeDomain,
            urlFields: {
                asset_code: assetCode,
                account: data.publicKey,
            },
        })

        // We add our callback method to the end of the URL and launch the popup
        // window for the user to interact with
        let interactiveUrl = `${url}&callback=postMessage`
        let popup = window.open(interactiveUrl, 'bpaTransfer24Window', 'popup')

        // We listen for the callback `message` from the popup window
        window.addEventListener('message', async (event) => {
            console.log('here is the event i heard from the popup window', event)
            popup?.close()

            // Store the transfer in the browser's localStorage
            transfers.addTransfer({
                homeDomain: homeDomain,
                protocol: 'sep24',
                assetCode: assetCode,
                transferID: event.data.transaction.id,
            })

            // If the user has requested a withdraw with the anchor, they will
            // need to submit a Stellar transaction that sends the asset from
            // the user's account to an account controlled by the anchor.
            if (event.data.transaction.kind === 'withdrawal') {
                // Generate a transaction with the necessary details to complete
                // the transfer
                let { transaction, network_passphrase } = await createPaymentTransaction({
                    source: data.publicKey,
                    destination: event.data.transaction.withdraw_anchor_account,
                    asset: `${assetCode}:${assetIssuer}`,
                    amount: event.data.transaction.amount_in,
                    memo: Buffer.from(event.data.transaction.withdraw_memo, 'base64'),
                })

                // Set the component variables to hold the transaction details
                paymentXDR = transaction
                paymentNetwork = network_passphrase

                // Open the confirmation modal for the user to confirm or reject
                // the Stellar payment transaction. We provide our customized
                // `onPaymentConfirm` function to be called as part of the
                // modal's confirming process.
                open(ConfirmationModal, {
                    transactionXDR: paymentXDR,
                    transactionNetwork: paymentNetwork,
                    onConfirm: onPaymentConfirm,
                })
            }
        })
    }
</script>

<h1>Transfers</h1>
<p>
    The <code>/dashboard/transfers</code> page will allow the user to view assets they hold trustlines
    for, which have infrastructure available to utilize for asset transfers. A few series of server queries
    find out which assets the user can transfer, which protocols are available for those transfers (SEP-6
    and SEP-24 currently), check the authentication status of the user with the relevant anchor, and
    present them with buttons that will allow them to initiate a transfer with the anchor.
</p>
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

{#each data.homeDomainBalances as asset}
    {#await fetchStellarToml(asset.home_domain) then stellarToml}
        {#if 'WEB_AUTH_ENDPOINT' in stellarToml || 'TRANSFER_SERVER' in stellarToml}
            {@const authStatus = getAuthStatus(asset.home_domain)}
            <h3 class="card-title">
                {asset.asset_code} <small>({asset.home_domain})</small>
                <div class={authStatusClasses[authStatus]}>{authStatus}</div>
            </h3>
            {@const assetDescription = stellarToml.CURRENCIES?.filter(
                ({ code }) => code === asset.asset_code
            )[0].desc}
            {#if assetDescription}
                <p>{assetDescription}</p>
            {/if}
            {#if authStatus !== 'auth_valid'}
                <button
                    id={`authButton${asset.asset_code}`}
                    name={`authButton${asset.asset_code}`}
                    class="btn-primary btn"
                    on:click={() => auth(asset.home_domain)}>Authenticate with Anchor</button
                >
                <div class="form-control">
                    <label class="label" for={`authButton${asset.asset_code}`}>
                        <span class="label-text"
                            >Please authenticate before attempting any transfers.</span
                        >
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
                                                    on:click={() =>
                                                        launchTransferModalSep6({
                                                            homeDomain: asset.home_domain,
                                                            assetCode: asset.asset_code,
                                                            assetIssuer: asset.asset_issuer,
                                                            // @ts-ignore
                                                            endpoint: endpoint,
                                                            sep6Info: sep6Info,
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
                                                    on:click={() =>
                                                        launchTransferWindowSep24({
                                                            homeDomain: asset.home_domain,
                                                            assetCode: asset.asset_code,
                                                            assetIssuer: asset.asset_issuer,
                                                            // @ts-ignore
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
