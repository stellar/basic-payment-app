<script lang="ts">
    import { onDestroy } from 'svelte'
    import { isHttpError } from '@sveltejs/kit'
    import KycInformation from './KYCInformation.svelte'
    import { initiateTransfer6, getTransferStatus6 } from '$lib/stellar/sep6'
    import { getSep12Fields, putSep12Fields } from '$lib/stellar/sep12'
    import { FINAL_STATUSES, type AnchorTransaction } from '$lib/stellar/anchorTransactions'
    import { kyc } from '$lib/state/Kyc.svelte'
    import { webAuth } from '$lib/state/WebAuth.svelte'
    import { transfers } from '$lib/state/Transfers.svelte'

    interface Props {
        transferData?: { endpoint: string; transfer_id?: string; transfer_submitted?: boolean }
        formData?: Record<string, string>
        homeDomain?: string
        assetIssuer?: string
        payAnchor?: (opts: {
            transaction: AnchorTransaction
            assetCode: string
            assetIssuer: string
        }) => Promise<void>
    }

    let {
        transferData = $bindable({ endpoint: '' }),
        formData = {},
        homeDomain = '',
        assetIssuer = '',
        payAnchor = async () => {},
    }: Props = $props()

    // Statuses where the user has something to do next, so we stop checking
    // the transfer and show them what that is
    const USER_ACTION_STATUSES = [
        'pending_customer_info_update',
        'pending_transaction_info_update',
        'pending_user_transfer_start',
        'pending_user_transfer_complete',
    ]

    let transaction: AnchorTransaction | undefined = $state()
    let kycFields: string[] = $state([])
    let kycStatus: 'needed' | 'submitting' | 'waiting' | 'stuck' = $state('needed')
    let kycError = $state('')

    // We stop checking on the transfer if the user leaves this step
    let stopped = false
    onDestroy(() => (stopped = true))

    /**
     * Gets the latest version of the transfer from the anchor.
     */
    const refreshTransaction = async () => {
        transaction = await getTransferStatus6({
            authToken: webAuth.requireToken(homeDomain),
            transferId: transferData.transfer_id ?? '',
            domain: homeDomain,
        })
    }

    /**
     * Keeps checking the transfer until the user needs to do something, or
     * the transfer is finished.
     */
    const waitForNextStep = async () => {
        while (!stopped) {
            await refreshTransaction()
            if (!transaction) return
            if (USER_ACTION_STATUSES.includes(transaction.status)) return
            if (FINAL_STATUSES.includes(transaction.status)) return
            // Wait a few seconds before checking again
            await new Promise((resolve) => setTimeout(resolve, 3000))
        }
    }

    /**
     * Submits the transfer to the anchor (only once), and then waits to see
     * what the anchor needs next.
     */
    const startTransfer = async () => {
        if (!transferData.transfer_submitted) {
            const { id } = await initiateTransfer6({
                authToken: webAuth.requireToken(homeDomain),
                endpoint: transferData.endpoint,
                formData: formData,
                domain: homeDomain,
            })
            transferData.transfer_submitted = true
            transferData.transfer_id = id
            transfers.addTransfer({
                homeDomain: homeDomain,
                protocol: 'sep6',
                assetCode: formData.asset_code,
                transferID: id,
            })
        }
        await waitForNextStep()
    }
    const transferRequest = startTransfer()

    /**
     * Sends the anchor the extra information it asked for about this transfer
     * (when its status is `pending_customer_info_update`).
     */
    const submitKyc = async () => {
        if (!transaction) return
        kycStatus = 'submitting'
        kycError = ''

        // Collect the values the user entered for the fields the anchor asked for
        let fields: Record<string, string> = {}
        for (const field of kycFields) {
            if (kyc.fields[field]) fields[field] = kyc.fields[field]
        }

        try {
            await putSep12Fields({
                authToken: webAuth.requireToken(homeDomain),
                fields: fields,
                homeDomain: homeDomain,
                transactionId: transaction.id,
                type: 'sep6',
            })
            const { status } = await getSep12Fields({
                authToken: webAuth.requireToken(homeDomain),
                homeDomain: homeDomain,
                transactionId: transaction.id,
                type: 'sep6',
            })
            if (status !== 'ACCEPTED') {
                kycStatus = 'needed'
                kycError = `The anchor has marked your information as ${status}.`
                return
            }
        } catch (err) {
            kycStatus = 'needed'
            // Errors from our SEP-12 helpers carry the anchor's message
            kycError = isHttpError(err) ? err.body.message : 'Unable to send your information'
            return
        }

        kycStatus = 'waiting'
        await waitForKycReview()
    }

    /**
     * After the user's information is accepted, the anchor should move the
     * transfer forward. We check for up to 30 seconds.
     */
    const waitForKycReview = async () => {
        const giveUpAt = Date.now() + 30_000
        while (!stopped && Date.now() < giveUpAt) {
            await refreshTransaction()
            if (transaction?.status !== 'pending_customer_info_update') {
                // The anchor has moved on, so we go back to waiting for
                // whatever the user needs to do next
                await waitForNextStep()
                return
            }
            await new Promise((resolve) => setTimeout(resolve, 3000))
        }
        // Some anchors don't re-check a transfer after its information is
        // updated. See https://github.com/stellar/anchor-platform/issues/1945
        kycStatus = 'stuck'
    }

    const sendPayment = () => {
        if (!transaction) return
        return payAnchor({ transaction, assetCode: formData.asset_code, assetIssuer })
    }
</script>

<p>
    <em>You may not be finished yet.</em> We have submitted your transfer to the anchor, and we'll keep
    checking on it. Anything else you need to do will show up below.
</p>
{#await transferRequest}
    <p>Checking on your transfer with the anchor...</p>
{:then}
    {#if transaction}
        <div class="overflow-x-auto">
            <table class="table">
                <tbody>
                    <tr>
                        <th>Status</th>
                        <td><code>{transaction.status}</code> {transaction.message ?? ''}</td>
                    </tr>
                    {#if transaction.amount_in}
                        <tr><th>Amount in</th><td>{transaction.amount_in}</td></tr>
                    {/if}
                    {#if transaction.amount_fee}
                        <tr><th>Fee</th><td>{transaction.amount_fee}</td></tr>
                    {/if}
                    {#if transaction.amount_out}
                        <tr><th>Amount out</th><td>{transaction.amount_out}</td></tr>
                    {/if}
                    {#if transaction.more_info_url}
                        <tr>
                            <th>More info</th>
                            <td>
                                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- this links to the anchor's site, not a page in our app -->
                                <a href={transaction.more_info_url} target="_blank" rel="noopener"
                                    >View this transfer on the anchor's site</a
                                >
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>

        {#if transaction.status === 'pending_customer_info_update'}
            {#if kycStatus === 'stuck'}
                <p class="text-warning">
                    The anchor accepted your information, but hasn't moved this transfer forward
                    yet. Some anchors only check your information when a transfer starts. Now that
                    your information is on file, you can close this window and start a new transfer.
                </p>
            {:else if kycStatus === 'waiting'}
                <p>Your information was accepted. Waiting for the anchor to continue...</p>
            {:else}
                <p>The anchor needs some more information from you for this transfer.</p>
                <KycInformation
                    homeDomain={homeDomain}
                    sep12Fields={kycFields}
                    transactionId={transaction.id}
                />
                {#if kycError}
                    <p class="text-error">{kycError}</p>
                {/if}
                <button
                    type="button"
                    class="btn my-1 btn-primary"
                    disabled={kycStatus === 'submitting'}
                    onclick={submitKyc}>Submit Information</button
                >
            {/if}
        {:else if transaction.status === 'pending_user_transfer_start' && transferData.endpoint === 'withdraw'}
            <p>The anchor is ready for you to send your payment.</p>
            <button type="button" class="btn my-1 btn-primary" onclick={sendPayment}
                >Send Stellar Payment</button
            >
        {:else if transaction.status === 'pending_user_transfer_start' && transaction.instructions}
            <p>To finish your deposit, send your funds to the anchor using these details:</p>
            <table class="table">
                <tbody>
                    {#each Object.entries(transaction.instructions) as [key, instruction] (key)}
                        <tr>
                            <th>{instruction.description}</th>
                            <td><code>{instruction.value}</code></td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else if FINAL_STATUSES.includes(transaction.status)}
            <p>This transfer is finished.</p>
        {/if}
    {/if}
{:catch err}
    <p class="text-error">
        We couldn't submit your transfer to the anchor: {err.body?.message ?? err.message}
    </p>
{/await}
