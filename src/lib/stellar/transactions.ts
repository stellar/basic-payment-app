import {
    TransactionBuilder,
    Networks,
    Operation,
    Asset,
    Memo,
    Contract,
    Horizon,
    rpc,
    nativeToScVal,
} from '@stellar/stellar-sdk'
import { error } from '@sveltejs/kit'
import { base64ToBytes } from '$lib/utils/base64'

/**
 * @module $lib/stellar/transactions
 * @description A collection of functions that will generate and return
 * transactions that can then be signed and submitted to the Stellar network
 * (testnet for our use). Currently implemented functions:
 *
 * {@link createCreateAccountTransaction}
 * {@link createPaymentTransaction}
 * {@link createChangeTrustTransaction}
 * {@link createPathPaymentStrictSendTransaction}
 * {@link createPathPaymentStrictReceiveTransaction}
 * {@link createContractTransferTransaction}
 */

// We are setting a very high maximum fee, which increases our transaction's
// chance of being included in the ledger. We're making this a `const` so we can
// change it on one place as and when recommendations and/or best practices
// evolve. Current recommended fee is `100_000` stroops.
const maxFeePerOperation = '100000'
const horizonUrl = 'https://horizon-testnet.stellar.org'
const networkPassphrase = Networks.TESTNET
const standardTimebounds = 300 // 5 minutes for the user to review/sign/submit
const rpcUrl = 'https://soroban-testnet.stellar.org'

/**
 * For consistency, all functions in this module will return the same type of object.
 * (This is also the structure of the Object returned when requesting a SEP-10 challenge transaction.)
 */
interface TransactionResponse {
    transaction: string
    network_passphrase: string
}

/**
 * Constructs and returns a Stellar transaction that contains a `createAccount` operation and an optional memo.
 * @async
 * @function createCreateAccountTransaction
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.destination Public Stellar address to be created on the network
 * @param {number|string} opts.amount Amount to be sent as the destination account's starting balance
 * @param {string} [opts.memo] Memo to add to the transaction
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createCreateAccountTransaction({
    source,
    destination,
    amount,
    memo,
}: {
    source: string
    destination: string
    amount: number | string
    memo?: string
}): Promise<TransactionResponse> {
    // The minimum account balance on the Stellar network is 1 XLM (2 base
    // reserves). We'll check that `amount` meets or exceeds that requirement
    // early, so we can fail quickly.
    if (parseFloat(amount.toString()) < 1) {
        throw error(400, { message: 'insufficient starting balance' })
    }

    // First, we setup our transaction by loading the source account from the
    // network, and initializing the TransactionBuilder. This is the first step
    // in constructing all Stellar transactions.
    let server = new Horizon.Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: maxFeePerOperation,
    })

    // If a memo was supplied, add it to the transaction
    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    // Add a single `createAccount` operation
    transaction.addOperation(
        Operation.createAccount({
            destination: destination,
            startingBalance: amount.toString(),
        }),
    )

    // Before the transaction can be signed, it requires timebounds, and it must
    // be "built"
    let builtTransaction = transaction.setTimeout(standardTimebounds).build()
    return {
        transaction: builtTransaction.toXdr(),
        network_passphrase: networkPassphrase,
    }
}

/** The kinds of memo an anchor may ask us to attach to a payment */
export type MemoType = 'text' | 'id' | 'hash'

/**
 * Builds a Stellar memo of the given type. This is how anchors (in SEP-6 and
 * SEP-24) tell us to label a payment, so they know which transfer it's for.
 * @param value The memo value. For hash memos, anchors send this base64-encoded.
 * @param type What kind of memo this is
 * @returns A memo ready to add to a transaction
 */
export function buildMemo(value: string, type: MemoType = 'text') {
    switch (type) {
        case 'id':
            return Memo.id(value)
        case 'hash':
            return Memo.hash(base64ToBytes(value))
        default:
            return Memo.text(value)
    }
}

/**
 * Constructs and returns a Stellar transaction that contains a `payment` operaion and an optional memo.
 * @async
 * @function createPaymentTransaction
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.destination Public Stellar address to receive the payment
 * @param {string} [opts.asset=native] Asset to be sent to the destination address (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {number|string} opts.amount Amount of the asset to send in the payment
 * @param {string} [opts.memo] Memo to add to the transaction
 * @param {MemoType} [opts.memoType=text] What kind of memo `memo` is (anchors tell us this, alongside the memo itself)
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createPaymentTransaction({
    source,
    destination,
    asset,
    amount,
    memo,
    memoType = 'text',
}: {
    source: string
    destination: string
    asset?: string
    amount: number | string
    memo?: string
    memoType?: MemoType
}): Promise<TransactionResponse> {
    // First, we setup our transaction by loading the source account from the
    // network, and initializing the TransactionBuilder. This is the first step
    // in constructing all Stellar transactions.
    let server = new Horizon.Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: maxFeePerOperation,
    })

    let sendAsset
    if (asset && asset !== 'native') {
        sendAsset = new Asset(asset.split(':')[0], asset.split(':')[1])
    } else {
        sendAsset = Asset.native()
    }

    // If a memo was supplied, add it to the transaction. Anchors may ask for a
    // text, id, or hash memo, so the anchor can match our payment to a transfer
    if (memo) {
        transaction.addMemo(buildMemo(memo, memoType))
    }

    // Add a single `payment` operation
    transaction.addOperation(
        Operation.payment({
            destination: destination,
            amount: amount.toString(),
            asset: sendAsset,
        }),
    )

    // Before the transaction can be signed, it requires timebounds, and it must
    // be "built"
    let builtTransaction = transaction.setTimeout(standardTimebounds).build()
    return {
        transaction: builtTransaction.toXdr(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that will create or modify a trustline on an account.
 * @async
 * @function createChangeTrustTransaction
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.asset Asset to add/modify/remove trustline on the `source` account for (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {string|number} [opts.limit] Desired limit for the trustline on the `source` account (use '0' to delete the trustline)
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createChangeTrustTransaction({
    source,
    asset,
    limit,
}: {
    source: string
    asset: string
    limit?: string | number
}): Promise<TransactionResponse> {
    // We start by converting the asset provided in string format into a Stellar
    // Asset() object
    let trustAsset = new Asset(asset.split(':')[0], asset.split(':')[1])

    // Next, we setup our transaction by loading the source account from the
    // network, and initializing the TransactionBuilder.
    let server = new Horizon.Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)

    // Chaning everything together from the `transaction` declaration means we
    // don't have to assign anything to `builtTransaction` later on. Either
    // method will have the same results.
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: maxFeePerOperation,
    })
        // Add a single `changeTrust` operation (this controls whether we are
        // adding, removing, or modifying the account's trustline)
        .addOperation(
            Operation.changeTrust({
                asset: trustAsset,
                limit: limit?.toString(),
            }),
        )
        // Before the transaction can be signed, it requires timebounds
        .setTimeout(standardTimebounds)
        // It also must be "built"
        .build()

    return {
        transaction: transaction.toXdr(),
        network_passphrase: networkPassphrase,
    }
}
/**
 * Constructs and returns a Stellar transaction that will contain a path payment strict send operation to send/receive different assets.
 * @async
 * @function createPathPaymentStrictSendTransaction
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.sourceAsset Stellar asset to be debited from the source account (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {string} opts.sourceAmount Amount of the asset to send in the payment
 * @param {string} opts.destination Public Stellar address to receive the payment
 * @param {string} opts.destinationAsset Stellar asset to be credited to the destination account (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {string} opts.destinationAmount Minimum amount of the destination asset to be received
 * @param {string} [opts.memo] Memo to add to the transaction
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createPathPaymentStrictSendTransaction({
    source,
    sourceAsset,
    sourceAmount,
    destination,
    destinationAsset,
    destinationAmount,
    memo,
}: {
    source: string
    sourceAsset: string
    sourceAmount: string
    destination: string
    destinationAsset: string
    destinationAmount: string
    memo?: string
}): Promise<TransactionResponse> {
    // First, we setup our transaction by loading the source account from the
    // network, and initializing the TransactionBuilder. This is the first step
    // in constructing all Stellar transactions.
    let server = new Horizon.Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: maxFeePerOperation,
    })

    // We work out the assets to be sent by the source account and received by
    // the destination account
    let sendAsset =
        sourceAsset === 'native'
            ? Asset.native()
            : new Asset(sourceAsset.split(':')[0], sourceAsset.split(':')[1])
    let destAsset =
        destinationAsset === 'native'
            ? Asset.native()
            : new Asset(destinationAsset.split(':')[0], destinationAsset.split(':')[1])

    /** @todo Figure out a good number to use for slippage. And why! And how to calculate it?? */
    // We will calculate an acceptable 2% slippage here for... reasons?
    let destMin = ((98 * parseFloat(destinationAmount)) / 100).toFixed(7)

    // If a memo was supplied, add it to the transaction
    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    // Add a single `pathPaymentStrictSend` operation
    transaction.addOperation(
        Operation.pathPaymentStrictSend({
            sendAsset: sendAsset,
            sendAmount: sourceAmount.toString(),
            destination: destination,
            destAsset: destAsset,
            destMin: destMin,
        }),
    )

    // Before the transaction can be signed, it requires timebounds, and it must
    // be "built"
    let builtTransaction = transaction.setTimeout(standardTimebounds).build()
    return {
        transaction: builtTransaction.toXdr(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that will contain a path payment strict receive operation to send/receive different assets.
 * @async
 * @function createPathPaymentStrictReceiveTransaction
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address that will be used for the source of the transaction
 * @param {string} opts.sourceAsset Stellar asset to be debited from the source account
 * @param {string} opts.sourceAmount Maximum amount of the source asset to be deducted from the source account
 * @param {string} opts.destination Public Stellar address that will receive the destination asset
 * @param {string} opts.destinationAsset Stellar asset to be credited to the destination account
 * @param {string} opts.destinationAmount The precise amount of the destination asset which will land in the destination account
 * @param {string} opts.memo Memo to add to the transaction
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createPathPaymentStrictReceiveTransaction({
    source,
    sourceAsset,
    sourceAmount,
    destination,
    destinationAsset,
    destinationAmount,
    memo,
}: {
    source: string
    sourceAsset: string
    sourceAmount: string
    destination: string
    destinationAsset: string
    destinationAmount: string
    memo: string
}): Promise<TransactionResponse> {
    // First, we setup our transaction by loading the source account from the
    // network, and initializing the TransactionBuilder. This is the first step
    // in constructing all Stellar transactions.
    let server = new Horizon.Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: maxFeePerOperation,
    })

    // We work out the assets to be sent by the source account and received by
    // the destination account
    let sendAsset =
        sourceAsset === 'native'
            ? Asset.native()
            : new Asset(sourceAsset.split(':')[0], sourceAsset.split(':')[1])
    let destAsset =
        destinationAsset === 'native'
            ? Asset.native()
            : new Asset(destinationAsset.split(':')[0], destinationAsset.split(':')[1])

    /** @todo Figure out a good number to use for slippage. And why! And how to calculate it?? */
    // We will calculate an acceptable 2% slippage here for... reasons?
    let sendMax = ((100 * parseFloat(sourceAmount)) / 98).toFixed(7)

    // If a memo was supplied, add it to the transaction
    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    // Add a single `pathPaymentStrictSend` operation
    transaction.addOperation(
        Operation.pathPaymentStrictReceive({
            sendAsset: sendAsset,
            sendMax: sendMax,
            destination: destination,
            destAsset: destAsset,
            destAmount: destinationAmount,
        }),
    )

    // Before the transaction can be signed, it requires timebounds, and it must
    // be "built"
    let builtTransaction = transaction.setTimeout(standardTimebounds).build()
    return {
        transaction: builtTransaction.toXdr(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction for transferring assets to a contract or account.
 * @async
 * @function createContractTransferTransaction
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.destination Public Stellar address or contract ID to receive the transfer
 * @param {string} opts.amount Amount of the asset to transfer
 * @param {string} opts.asset Asset to be transferred (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createContractTransferTransaction({
    source,
    destination,
    amount,
    asset,
}: {
    source: string
    destination: string
    amount: string
    asset: string
}): Promise<TransactionResponse> {
    const server = new rpc.Server(rpcUrl)
    const sourceAccount = await server.getAccount(source)

    const transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: maxFeePerOperation,
    })

    const [assetCode, assetIssuer] = asset.split(':')
    const contractId = new Asset(assetCode, assetIssuer).contractId(networkPassphrase)
    const contract = new Contract(contractId)

    const transferOp = contract.call(
        'transfer',
        nativeToScVal(source, { type: 'address' }),
        nativeToScVal(destination, { type: 'address' }),
        nativeToScVal(amount, { type: 'i128' }),
    )
    transaction.addOperation(transferOp)

    const builtTransaction = transaction.setTimeout(standardTimebounds).build()

    // Simulate the transaction
    const rpcServer = new rpc.Server(rpcUrl)
    const simulatedTx = await server.prepareTransaction(builtTransaction)

    return {
        transaction: simulatedTx.toXdr(),
        network_passphrase: networkPassphrase,
    }
}
