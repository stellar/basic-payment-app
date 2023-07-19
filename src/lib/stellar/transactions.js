import { TransactionBuilder, Networks, Server, Operation, Asset, Memo } from 'stellar-sdk'

const horizonUrl = 'https://horizon-testnet.stellar.org'
const networkPassphrase = Networks.TESTNET

/** @module $lib/stellar/transactions */
/**
 * For consistency, all functions in this module will return the same type of object.
 * @typedef {Object} TransactionResponse
 * @property {string} transaction Stellar transaction envelope in base64-encoded, XDR format
 * @property {string} network_passphrase Network passphrase the transaction was built for
 */

/**
 * Constructs and returns a Stellar transaction that contains a `createAccount` operation and an optional memo.
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.destination Public Stellar address to be created on the network
 * @param {number|string} opts.amount Amount to be sent as the destination account's starting balance
 * @param {string} [opts.memo] Memo to add to the transaction
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createCreateAccountTransaction({ source, destination, amount, memo }) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })

    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    transaction.addOperation(
        Operation.createAccount({
            destination: destination,
            startingBalance: amount.toString(),
        })
    )

    let builtTransaction = transaction.setTimeout(300).build()
    console.log(
        '$src/stellar/transactions.js createCreateAccountTransaction builtTransaction',
        builtTransaction
    )
    return {
        transaction: builtTransaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that contains a `payment` operaion and an optional memo.
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.destination Public Stellar address to receive the payment
 * @param {string} [opts.asset=native] Asset to be sent to the destination address (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {number|string} opts.amount Amount of the asset to send in the payment
 * @param {string|Buffer} [opts.memo] Memo to add to the transaction, either a string or a Buffer object
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createPaymentTransaction({ source, destination, asset, amount, memo }) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })

    let sendAsset = Asset.native()
    if (asset && asset !== 'native') {
        sendAsset = new Asset(asset.split(':')[0], asset.split(':')[1])
    }

    if (memo) {
        if (typeof memo === 'string') {
            transaction.addMemo(Memo.text(memo))
        } else if (typeof memo === 'object') {
            transaction.addMemo(Memo.hash(memo.toString('hex')))
        }
    }

    transaction.addOperation(
        Operation.payment({
            destination: destination,
            amount: amount.toString(),
            asset: sendAsset,
        })
    )

    let builtTransaction = transaction.setTimeout(300).build()
    console.log(
        '$src/stellar/transactions.js createPaymentTransaction builtTransaction',
        builtTransaction
    )
    return {
        transaction: builtTransaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that will create or modify a trustline on an account.
 * @param {Object} opts Options object
 * @param {string} opts.source Public Stellar address to use as the source account of the transaction
 * @param {string} opts.asset Asset to add/modify/remove trustline on the `source` account for (example: USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5)
 * @param {string|number} [opts.limit] Desired limit for the trustline on the `source` account (use '0' to delete the trustline)
 * @returns {Promise<TransactionResponse>} Object containing the relevant network passphrase and the built transaction envelope in XDR base64 encoding, ready to be signed and submitted
 */
export async function createChangeTrustTransaction({ source, asset, limit }) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)

    let trustAsset = new Asset(asset.split(':')[0], asset.split(':')[1])
    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })
        .addOperation(
            Operation.changeTrust({
                asset: trustAsset,
                limit: limit?.toString(),
            })
        )
        .setTimeout(300)
        .build()

    console.log(
        '$src/stellar/transactions.js createChangeTrustTransaction transaction',
        transaction
    )
    return {
        transaction: transaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that will contain a path payment strict send operation to send/receive different assets.
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
}) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)

    let sendAsset =
        sourceAsset === 'native'
            ? Asset.native()
            : new Asset(sourceAsset.split(':')[0], sourceAsset.split(':')[1])
    let destAsset =
        destinationAsset === 'native'
            ? Asset.native()
            : new Asset(destinationAsset.split(':')[0], destinationAsset.split(':')[1])
    /** @todo Figure out a good number to use for slippage. And why! */
    // we will calculate an acceptable 2% slippage here for... reasons?
    let destMin = ((98 * parseFloat(destinationAmount)) / 100).toFixed(7)

    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })

    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    transaction.addOperation(
        Operation.pathPaymentStrictSend({
            sendAsset: sendAsset,
            sendAmount: sourceAmount.toString(),
            destination: destination,
            destAsset: destAsset,
            destMin: destMin,
        })
    )

    let builtTransaction = transaction.setTimeout(300).build()
    return {
        transaction: builtTransaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}

/**
 * Constructs and returns a Stellar transaction that will contain a path payment strict receive operation to send/receive different assets.
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
}) {
    let server = new Server(horizonUrl)
    let sourceAccount = await server.loadAccount(source)

    let sendAsset =
        sourceAsset === 'native'
            ? Asset.native()
            : new Asset(sourceAsset.split(':')[0], sourceAsset.split(':')[1])
    /** @todo Figure out a good number to use for slippage. And why! */
    // we will calculate an acceptable 2% slippage here for... reasons?
    let sendMax = ((100 * parseFloat(sourceAmount)) / 98).toFixed(7)
    let destAsset =
        destinationAsset === 'native'
            ? Asset.native()
            : new Asset(destinationAsset.split(':')[0], destinationAsset.split(':')[1])

    let transaction = new TransactionBuilder(sourceAccount, {
        networkPassphrase: networkPassphrase,
        fee: '100000',
    })

    if (memo) {
        transaction.addMemo(Memo.text(memo))
    }

    transaction.addOperation(
        Operation.pathPaymentStrictReceive({
            sendAsset: sendAsset,
            sendMax: sendMax,
            destination: destination,
            destAsset: destAsset,
            destAmount: destinationAmount,
        })
    )

    let builtTransaction = transaction.setTimeout(300).build()
    return {
        transaction: builtTransaction.toXDR(),
        network_passphrase: networkPassphrase,
    }
}
