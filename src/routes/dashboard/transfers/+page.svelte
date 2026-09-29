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

<script lang="ts">
    import type { PageProps } from './$types'
    let { data }: PageProps = $props()

    // We import things from external packages that will be needed
    import { LogInIcon, LogOutIcon } from 'svelte-feather-icons'

    // We import any Svelte components we will need
    import TransferModalSep6 from './components/TransferModalSep6.svelte'
    import ConfirmationModal from '$lib/components/ConfirmationModal.svelte'

    // We import any stores we will need to read and/or write
    import { invalidateAll } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { transfers } from '$lib/state/Transfers.svelte'
    import { wallet } from '$lib/state/Wallet.svelte'
    import { webAuth } from '$lib/state/WebAuth.svelte'

    // We import some of our `$lib` functions
    import { submit } from '$lib/stellar/horizonQueries'
    import { fetchStellarToml } from '$lib/stellar/sep1'
    import { getSep6Info, type Sep6Info } from '$lib/stellar/sep6'
    import { getChallengeTransaction, submitChallengeTransaction } from '$lib/stellar/sep10'
    import { getSep24Info, getTransferStatus24, initiateTransfer24 } from '$lib/stellar/sep24'
    import { createPaymentTransaction } from '$lib/stellar/transactions'
    import type { AnchorTransaction } from '$lib/stellar/anchorTransactions'
    import { alert } from '$lib/state/Alert.svelte'
    import { error } from '@sveltejs/kit'

    // The `open` and `close` Svelte context functions control the modal window
    import { getContext } from 'svelte'
    import type { ModalContext } from '$lib/types'
    const { open, close } = getContext<ModalContext>('simple-modal')

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
     * @param homeDomain Domain to examine current authentication status for
     */
    const getAuthStatus = (homeDomain: string) => {
        if (webAuth.getToken(homeDomain)) {
            if (webAuth.isTokenExpired(homeDomain)) {
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
     * @param pincode Pincode that was confirmed by the modal window
     */
    const onAuthConfirm = async (pincode: string) => {
        // Sign the transaction with the user's keypair
        let signedTransaction = await wallet.sign({
            transactionXDR: challengeXDR,
            network: challengeNetwork,
            pincode: pincode,
        })
        // Submit the signed tx to the SEP-10 server, and get the JWT token back
        let token = await submitChallengeTransaction({
            transactionXDR: signedTransaction.toXdr(),
            homeDomain: challengeHomeDomain,
        })
        // Add the token to our store
        webAuth.setAuth(challengeHomeDomain, token)
        // Reload any relevant `load()` functions (i.e., refresh the page)
        invalidateAll()
    }

    /**
     * Requests a challenge transaction from a SEP-10 server, and presents it to the user for pincode verification
     * @async
     * @function auth
     * @param homeDomain Domain to authenticate with via SEP-10 protocol
     */
    const auth = async (homeDomain: string) => {
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
     * @param opts Options object
     * @param opts.homeDomain Domain of the anchor that is handling the transfer
     * @param opts.assetCode Stellar asset code that will be transferred using the anchor
     * @param opts.assetIssuer Public Stellar address that issues the asset being transferred
     * @param opts.sep6Info Info published by the anchor detailing what assets and/or transfer methods are available
     * @param opts.endpoint Endpoint of the transfer server to interact with (e.g., `deposit` or `withdraw`)
     */
    const launchTransferModalSep6 = ({
        homeDomain,
        assetCode,
        assetIssuer,
        endpoint,
        sep6Info,
    }: {
        homeDomain: string
        assetCode: string
        assetIssuer: string
        sep6Info: Sep6Info
        endpoint: 'deposit' | 'withdraw'
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
            // The SEP-6 modal is still open when the user is ready to pay. Our
            // modal library can't swap one modal for another, so we close
            // this one first, and open the payment confirmation once it's gone.
            payAnchor: async (opts: {
                transaction: AnchorTransaction
                assetCode: string
                assetIssuer: string
            }) => close({ onClosed: () => payAnchor(opts) }),
        })
    }

    /**
     * After a withdraw transaction has been presented to the user, and they've confirmed with the correct pincode, sign and submit the transaction to the Stellar network.
     * @async
     * @function onPaymentConfirm
     * @param pincode The 6-digit pincode the user has confirmed that will decrypt the Stellar secret key for signing
     */
    const onPaymentConfirm = async (pincode: string) => {
        // Use the wallet to sign the transaction
        let signedTransaction = await wallet.sign({
            transactionXDR: paymentXDR,
            network: paymentNetwork,
            pincode: pincode,
        })
        // Submit the transaction to the Stellar network
        await submit(signedTransaction)
    }

    /**
     * Builds the Stellar payment that completes a withdrawal, and presents it to the user for confirmation. We only call this once the anchor's transaction is `pending_user_transfer_start`, which is when it tells us where to send the payment, how much to send, and which memo to use.
     * @param opts Options object
     * @param opts.transaction The anchor's transaction for this withdrawal (SEP-6 and SEP-24 use the same format)
     * @param opts.assetCode Stellar asset code to be transferred in the payment transaction
     * @param opts.assetIssuer Public Stellar address that issues the asset
     */
    const payAnchor = async ({
        transaction,
        assetCode,
        assetIssuer,
    }: {
        transaction: AnchorTransaction
        assetCode: string
        assetIssuer: string
    }) => {
        // The anchor tells us where to send the payment, how much to send, and
        // which memo to attach (so it can match our payment to this transfer)
        let payment = await createPaymentTransaction({
            source: data.publicKey,
            destination: transaction.withdraw_anchor_account ?? '',
            asset: `${assetCode}:${assetIssuer}`,
            amount: transaction.amount_in ?? '',
            memo: transaction.withdraw_memo,
            memoType: transaction.withdraw_memo_type,
        })

        // Set the component variables to hold the transaction details
        paymentXDR = payment.transaction
        paymentNetwork = payment.network_passphrase

        // SEP-24 asks wallets to show the user where their funds are going,
        // and where they can learn more about the withdrawal
        let body = 'To finish your withdrawal, send this payment to the anchor.'
        if (transaction.to && transaction.external_extra_text) {
            body += ` Your funds will go to ${transaction.external_extra_text} (${transaction.to}).`
        } else if (transaction.to) {
            body += ` Your funds will go to ${transaction.to}.`
        }
        if (transaction.more_info_url) {
            body += ` You can follow the withdrawal's progress at ${transaction.more_info_url}`
        }

        open(ConfirmationModal, {
            title: 'Complete Your Withdrawal',
            body: body,
            transactionXDR: paymentXDR,
            transactionNetwork: paymentNetwork,
            onConfirm: onPaymentConfirm,
        })
    }

    /**
     * Launch the interactive SEP-24 popup window for the user to interact directly with the anchor to begin a transfer.
     * @function launchTransferWindowSep24
     * @param opts Options object
     * @param opts.homeDomain Domain of the anchor that is handling the transfer
     * @param opts.assetCode Stellar asset code that will be transferred using the anchor
     * @param opts.assetIssuer Public Stellar address that issues the asset
     * @param opts.endpoint Endpoint of the transfer server to interact with (i.e., `deposit` or `withdraw`)
     */
    const launchTransferWindowSep24 = async ({
        homeDomain,
        assetCode,
        assetIssuer,
        endpoint,
    }: {
        homeDomain: string
        assetCode: string
        assetIssuer: string
        endpoint: 'deposit' | 'withdraw'
    }) => {
        // We open the popup window right away, while the browser still sees
        // this as a response to the user's click. If we waited until after
        // talking to the anchor, popup blockers might stop the window.
        const popup = window.open('', 'bpaTransfer24Window', 'popup')
        if (!popup) {
            error(400, { message: 'Please allow popups for this site, so the anchor can open' })
        }

        // We initiate the transfer from the SEP-24 server, and get the
        // interactive URL (and the transfer's ID) back from it
        let response
        try {
            response = await initiateTransfer24({
                authToken: webAuth.requireToken(homeDomain),
                endpoint: endpoint,
                homeDomain: homeDomain,
                urlFields: {
                    asset_code: assetCode,
                    account: data.publicKey,
                },
            })
        } catch (err) {
            popup.close()
            throw err
        }
        const { url, id } = response

        // SEP-24 recommends not giving the anchor's page access to our window
        // (like `noopener` would), so we cut that link before sending the
        // popup to the anchor
        popup.opener = null
        popup.location.href = url

        // Store the transfer in the browser's localStorage, so we can check on
        // it later from the transfer history
        transfers.addTransfer({
            homeDomain: homeDomain,
            protocol: 'sep24',
            assetCode: assetCode,
            transferID: id,
        })

        // For a deposit, the anchor's window has everything the user needs, so
        // our part is done
        if (endpoint === 'deposit') return

        // For a withdrawal, we keep checking the transfer until the user is
        // done in the anchor's window (or closes it). SEP-24 also lets anchors
        // send us a callback, but checking the `/transaction` endpoint works
        // with every anchor.
        let transaction = await getTransferStatus24({
            authToken: webAuth.requireToken(homeDomain),
            transferId: id,
            homeDomain: homeDomain,
        })
        while (transaction.status === 'incomplete' && !popup.closed) {
            // Wait a few seconds before checking again
            await new Promise((resolve) => setTimeout(resolve, 3000))
            transaction = await getTransferStatus24({
                authToken: webAuth.requireToken(homeDomain),
                transferId: id,
                homeDomain: homeDomain,
            })
        }
        // We try to close the anchor's window, but because we cut its link to
        // our window (above), the browser may not let us. If so, the user can
        // close it themselves.
        popup.close()

        if (transaction.status === 'pending_user_transfer_start') {
            // The anchor is ready for the user to send their payment
            await payAnchor({ transaction, assetCode, assetIssuer })
        } else if (transaction.status !== 'incomplete') {
            // Something else happened (e.g., the anchor had an error)
            alert.setAlert({
                type: 'info',
                title: 'Withdrawal not started',
                message: `The anchor says this withdrawal is ${transaction.status}. ${transaction.message ?? ''}`,
            })
        }
    }
</script>

<h1>Transfers</h1>
<p>
    The <code>/dashboard/transfers</code> page will allow the user to view assets they hold trustlines
    for, which have infrastructure available to utilize for asset transfers. A few series of server queries
    find out which assets the user can transfer, which protocols are available for those transfers (SEP-6
    and SEP-24 currently), check the authentication status of the user with the relevant anchor, and present
    them with buttons that will allow them to initiate a transfer with the anchor.
</p>
<p>
    Use the Stellar network's rails to existing financial infrastructure to move assets between the
    ledger and traditional banking accounts.
</p>

<h2>Initiate a Transfer</h2>
<p>
    Below, are listed all your trusted assets with the required infrastructure to facilitate deposit
    and/or withdrawals. We have implemented both <a
        href="https://www.stellar.org/protocol/sep-6"
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

<!-- An asset can be listed under more than one anchor, so the key includes the home domain -->
{#each data.homeDomainBalances as asset (`${asset.home_domain}:${asset.asset_code}:${asset.asset_issuer}`)}
    {#await fetchStellarToml(asset.home_domain) then stellarToml}
        {#if 'WEB_AUTH_ENDPOINT' in stellarToml || 'TRANSFER_SERVER' in stellarToml}
            {@const authStatus = getAuthStatus(asset.home_domain)}
            <h3 class="card-title">
                {asset.asset_code} <small>({asset.home_domain})</small>
                <div class={authStatusClasses[authStatus]}>{authStatus}</div>
            </h3>
            {@const assetDescription = stellarToml.CURRENCIES?.find(
                ({ code, issuer }) => code === asset.asset_code && issuer === asset.asset_issuer,
            )?.desc}
            {#if assetDescription}
                <p>{assetDescription}</p>
            {/if}
            {#if authStatus !== 'auth_valid'}
                <button
                    id={`authButton${asset.asset_code}`}
                    name={`authButton${asset.asset_code}`}
                    class="btn btn-primary"
                    onclick={() => auth(asset.home_domain)}>Authenticate with Anchor</button
                >
                <p class="label">Please authenticate before attempting any transfers.</p>
            {:else}
                <div class="flex w-full flex-col lg:flex-row">
                    {#if 'TRANSFER_SERVER' in stellarToml}
                        {#await getSep6Info(asset.home_domain) then sep6Info}
                            <div
                                class="card grid flex-grow place-items-center rounded-box bg-base-300"
                            >
                                <div class="card-body w-full">
                                    <h4>SEP-6 Transfers</h4>
                                    <div class="join w-full join-vertical lg:join-horizontal">
                                        {#each Object.entries(sep6Info) as [endpoint, details] (endpoint)}
                                            {#if (endpoint === 'deposit' || endpoint === 'withdraw') && asset.asset_code in details}
                                                <button
                                                    class={transferButtonClasses[endpoint]}
                                                    disabled={authStatus !== 'auth_valid'}
                                                    onclick={() =>
                                                        launchTransferModalSep6({
                                                            homeDomain: asset.home_domain,
                                                            assetCode: asset.asset_code,
                                                            assetIssuer: asset.asset_issuer,
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
                        <div class="divider lg:divider-horizontal"></div>
                    {/if}
                    {#if 'TRANSFER_SERVER_SEP0024' in stellarToml}
                        {#await getSep24Info(asset.home_domain) then sep24Info}
                            <div
                                class="card grid flex-grow place-items-center rounded-box bg-base-300"
                            >
                                <div class="card-body w-full">
                                    <h4>SEP-24 Transfers</h4>
                                    <div class="join w-full join-vertical lg:join-horizontal">
                                        {#each Object.entries(sep24Info) as [endpoint, details] (endpoint)}
                                            {#if (endpoint === 'deposit' || endpoint === 'withdraw') && asset.asset_code in details}
                                                <button
                                                    class={transferButtonClasses[endpoint]}
                                                    disabled={authStatus !== 'auth_valid'}
                                                    onclick={() =>
                                                        launchTransferWindowSep24({
                                                            homeDomain: asset.home_domain,
                                                            assetCode: asset.asset_code,
                                                            assetIssuer: asset.asset_issuer,
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

{#each data.missingTrustlines as { homeDomain, assetCode, assetIssuer } (`${homeDomain}:${assetCode}:${assetIssuer}`)}
    <h3 class="card-title">{assetCode} <small>({homeDomain})</small></h3>
    <p>
        This anchor also supports <strong>{assetCode}</strong>. To transfer it, first
        <a href={resolve('/dashboard/assets')}>add a trustline</a> for it on the Assets page.
    </p>
{/each}
