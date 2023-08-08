import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'
import { persisted } from 'svelte-local-storage-store'
import { KeyManager, KeyManagerPlugins, KeyType } from '@stellar/wallet-sdk'
import { TransactionBuilder } from 'stellar-sdk'

/** @typedef {import('stellar-sdk').Transaction} Transaction */

/**
 * @typedef {Object} WalletStore
 * @property {string} keyId ID used to uniquely identify which encrypted keypair to use from the browser's localStorage
 * @property {string} publicKey Public Stellar address derived from the encrypted keypair
 * @property {Object} [devInfo] Helpful information for developer environments (Should not be used in production)
 * @property {string} [devInfo.secretKey] Secret Stellar key derived from the encrypted keypair
 */

function createWalletStore() {
    /** @type {import('svelte/store').Writable<WalletStore>} */
    const { subscribe, set } = persisted('bpa:walletStore', { keyId: '', publicKey: '' })

    return {
        subscribe,

        /**
         * Registers a user by storing their encrypted keypair in the browser's localStorage.
         * @param {Object} opts Options object
         * @param {string} opts.publicKey Public Stellar address which will be the user's public key throughout the application
         * @param {string} opts.secretKey Secret key that corresponds to the user's public key
         * @param {string} opts.pincode Pincode that will be used to encrypt this keypair
         * @throws Will throw an error if there is a problem encrypting and/or storing the keypair
         */
        register: async ({ publicKey, secretKey, pincode }) => {
            try {
                const keyManager = setupKeyManager()

                let keyMetadata = await keyManager.storeKey({
                    key: {
                        type: KeyType.plaintextKey,
                        publicKey: publicKey,
                        privateKey: secretKey,
                    },
                    password: pincode,
                    encrypterName: KeyManagerPlugins.ScryptEncrypter.name,
                })

                set({
                    keyId: keyMetadata.id,
                    publicKey: publicKey,
                    // Don't include this in a real-life production application.
                    // It's just here to make the secret key accessible in case
                    // we need to do some manual transactions or something.
                    devInfo: {
                        secretKey: secretKey,
                    },
                })
            } catch (err) {
                console.error('Error saving key', err)
                // @ts-ignore
                throw error(400, { message: err.toString() })
            }
        },

        /**
         * Compares a submitted pincode to make sure it is valid for the stored, encrypted keypair.
         * @param {Object} opts Options object
         * @param {string} opts.pincode Pincode being confirmed against existing stored wallet
         * @param {string} [opts.firstPincode] On signup, the pincode that is being matched against
         * @param {boolean} [opts.signup=false] Whether or not the confirmation is for the initial signup
         * @throws Will throw an error if the signup pincodes don't match, or if the provided pincode doesn't decrypt the keypair.
         */
        confirmPincode: async ({ pincode, firstPincode = '', signup = false }) => {
            if (!signup) {
                try {
                    const keyManager = setupKeyManager()
                    let { keyId } = get(walletStore)
                    await keyManager.loadKey(keyId, pincode)
                } catch (err) {
                    throw error(400, { message: 'invalid pincode' })
                }
            } else {
                if (pincode !== firstPincode) {
                    throw error(400, { message: 'pincode mismatch' })
                }
            }
        },

        /**
         * Sign and return a Stellar transaction
         * @param {Object} opts Options object
         * @param {string} opts.transactionXDR A Stellar transaction in base64-encoded XDR format
         * @param {string} opts.network Network passphrase for the network this transaction is intended for
         * @param {string} opts.pincode Pincode to be used as the encryption password for the keypair
         * @returns {Promise<Transaction>} A signed Stellar transaction ready to submit to the network
         * @throws Will throw an error if there is a problem signing the transaction.
         */
        sign: async ({ transactionXDR, network, pincode }) => {
            try {
                const keyManager = setupKeyManager()
                let signedTransaction = await keyManager.signTransaction({
                    // @ts-ignore
                    transaction: TransactionBuilder.fromXDR(transactionXDR, network),
                    id: get(walletStore).keyId,
                    password: pincode,
                })
                return signedTransaction
            } catch (err) {
                console.error('Error signing transaction', err)
                // @ts-ignore
                throw error(400, { message: err.toString() })
            }
        },
    }
}

export const walletStore = createWalletStore()

/**
 * @returns {KeyManager} A configured `keyManager` for use as a wallet
 */
const setupKeyManager = () => {
    const localKeyStore = new KeyManagerPlugins.LocalStorageKeyStore()
    localKeyStore.configure({
        prefix: 'bpa',
        storage: localStorage,
    })
    const keyManager = new KeyManager({
        keyStore: localKeyStore,
    })
    keyManager.registerEncrypter(KeyManagerPlugins.ScryptEncrypter)

    return keyManager
}
