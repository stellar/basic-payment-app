import { error } from '@sveltejs/kit'
import {
    KeyManager,
    LocalStorageKeyStore,
    ScryptEncrypter,
    KeyType,
} from '@stellar/typescript-wallet-sdk-km'
import { TransactionBuilder, type Transaction } from '@stellar/stellar-sdk'
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { LocalStorage } from '$lib/state/localStorage.svelte'

/**
 * @module $lib/state/Wallet
 * @description Reactive state holding the user's wallet details, persisted in
 * the browser's localStorage. A user either has a pincode-encrypted keypair
 * stored in the browser, or has connected an external wallet (like Freighter)
 * through the Stellar Wallets Kit.
 */

interface WalletData {
    /** ID used to uniquely identify which encrypted keypair to use from the browser's localStorage. For wallet users, this is their public key. */
    keyId: string
    /** Public Stellar address derived from the encrypted keypair, or provided by the connected wallet */
    publicKey: string
    /** Helpful information for developer environments (should not be used in production) */
    devInfo?: {
        /** Secret Stellar key derived from the encrypted keypair */
        secretKey: string
    }
}

class Wallet {
    #data = new LocalStorage<WalletData>('bpa:walletStore', { keyId: '', publicKey: '' })

    get keyId() {
        return this.#data.current.keyId
    }

    get publicKey() {
        return this.#data.current.publicKey
    }

    get devInfo() {
        return this.#data.current.devInfo
    }

    /** Whether the user signed in with an external wallet, rather than a pincode-encrypted keypair */
    get isWalletUser() {
        return this.keyId !== '' && this.keyId === this.publicKey
    }

    /**
     * Connects a user by their public key (wallet-based registration). This
     * effectively both "registers" and "logs in" the wallet.
     * @param opts Options object
     * @param opts.publicKey Public Stellar address
     */
    connectWallet({ publicKey }: { publicKey: string }) {
        this.#data.current = { keyId: publicKey, publicKey }
    }

    /**
     * Registers a user by storing their encrypted keypair in the browser's localStorage.
     * @param opts Options object
     * @param opts.publicKey Public Stellar address which will be the user's public key throughout the application
     * @param opts.secretKey Secret key that corresponds to the user's public key
     * @param opts.pincode Pincode that will be used to encrypt this keypair
     * @throws Will throw an error if there is a problem encrypting and/or storing the keypair
     */
    async register({
        publicKey,
        secretKey,
        pincode,
    }: {
        publicKey: string
        secretKey: string
        pincode: string
    }) {
        try {
            const keyManager = setupKeyManager()

            const keyMetadata = await keyManager.storeKey({
                key: {
                    type: KeyType.plaintextKey,
                    publicKey: publicKey,
                    privateKey: secretKey,
                },
                password: pincode,
                encrypterName: ScryptEncrypter.name,
            })

            this.#data.current = {
                keyId: keyMetadata.id,
                publicKey: publicKey,
                // Don't include this in a real-life production application.
                // It's just here to make the secret key accessible in case
                // we need to do some manual transactions or something.
                devInfo: {
                    secretKey: secretKey,
                },
            }
        } catch (err) {
            console.error('Error saving key', err)
            error(400, { message: 'Error saving key' })
        }
    }

    /**
     * Compares a submitted pincode to make sure it is valid for the stored, encrypted keypair.
     * @param opts Options object
     * @param opts.pincode Pincode being confirmed against existing stored wallet
     * @param opts.firstPincode On signup, the pincode that is being matched against
     * @param opts.signup Whether or not the confirmation is for the initial signup
     * @throws Will throw an error if the signup pincodes don't match, or if the provided pincode doesn't decrypt the keypair.
     */
    async confirmPincode({
        pincode,
        firstPincode = '',
        signup = false,
    }: {
        pincode: string
        firstPincode?: string
        signup?: boolean
    }) {
        if (!signup) {
            try {
                const keyManager = setupKeyManager()
                await keyManager.loadKey(this.keyId, pincode)
            } catch {
                error(400, { message: 'invalid pincode' })
            }
        } else if (pincode !== firstPincode) {
            error(400, { message: 'pincode mismatch' })
        }
    }

    /**
     * Sign and return a Stellar transaction
     * @param opts Options object
     * @param opts.transactionXDR A Stellar transaction in base64-encoded XDR format
     * @param opts.network Network passphrase for the network this transaction is intended for
     * @param opts.pincode Pincode to be used as the encryption password for the keypair (not needed for wallet users)
     * @returns A signed Stellar transaction ready to submit to the network
     * @throws Will throw an error if there is a problem signing the transaction.
     */
    async sign({
        transactionXDR,
        network,
        pincode,
    }: {
        transactionXDR: string
        network: string
        pincode?: string
    }): Promise<Transaction> {
        try {
            if (this.isWalletUser) {
                const { address } = await StellarWalletsKit.getAddress()

                // Sign the transaction using the connected wallet
                const { signedTxXdr } = await StellarWalletsKit.signTransaction(transactionXDR, {
                    address,
                    networkPassphrase: network,
                })

                // The wallet gives us back XDR, but callers expect a
                // `Transaction` (just like the keypair path below returns).
                // This app never builds fee bump transactions.
                return TransactionBuilder.fromXdr(signedTxXdr, network) as Transaction
            }

            const keyManager = setupKeyManager()
            return await keyManager.signTransaction({
                transaction: TransactionBuilder.fromXdr(transactionXDR, network) as Transaction,
                id: this.keyId,
                password: pincode ?? '',
            })
        } catch (err) {
            console.error('Error signing transaction', err)
            error(400, { message: 'Error signing transaction' })
        }
    }
}

export const wallet = new Wallet()

/**
 * @returns A configured `keyManager` for use as a wallet
 */
function setupKeyManager() {
    const localKeyStore = new LocalStorageKeyStore()
    localKeyStore.configure({
        prefix: 'bpa',
        storage: localStorage,
    })
    const keyManager = new KeyManager({
        keyStore: localKeyStore,
    })
    keyManager.registerEncrypter(ScryptEncrypter)

    return keyManager
}
