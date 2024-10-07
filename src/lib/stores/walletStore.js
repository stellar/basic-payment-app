import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'
import { persisted } from 'svelte-local-storage-store'
import { KeyManager, KeyManagerPlugins, KeyType } from '@stellar/wallet-sdk'
import { TransactionBuilder, Operation, Asset, Contract, xdr, Address, StrKey } from 'stellar-sdk'
import { contacts } from './contactsStore'
import { Account } from 'stellar-sdk'

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
         * Sign and return a Stellar transaction, handling both regular payments and SAC transfers
         * @param {Object} opts Options object
         * @param {string} opts.destination Destination address (account or contract)
         * @param {string} opts.amount Amount to send
         * @param {Asset} opts.asset Asset to send
         * @param {string} opts.network Network passphrase for the network this transaction is intended for
         * @param {string} opts.pincode Pincode to be used as the encryption password for the keypair
         * @returns {Promise<import('stellar-sdk').Transaction>} A signed Stellar transaction ready to submit to the network
         * @throws Will throw an error if there is a problem signing the transaction.
         */
        signPayment: async ({ destination, amount, asset, network, pincode }) => {
            try {
                const keyManager = setupKeyManager()
                const { publicKey } = get(walletStore)
                const sourceAccount = new Account(publicKey, '0') // you have to Replace '0' with actual sequence number

                let transaction;

              
                    // Handle regular payment
                    transaction = new TransactionBuilder(sourceAccount, { fee: '100', networkPassphrase: network })
                        .addOperation(Operation.payment({
                            destination: destination,
                            asset: asset,
                            amount: amount
                        }))
                        .setTimeout(30)
                        .build();
             

                let signedTransaction = await keyManager.signTransaction({
                    transaction: transaction,
                    id: get(walletStore).keyId,
                    password: pincode,
                })
                return signedTransaction
            } catch (err) {
                console.error('Error signing transaction', err)
                if (err instanceof Error) {
                    throw error(400, { message: err.message || 'Error signing transaction' })
                } else {
                    throw error(400, { message: 'Unknown error occurred' })
                }
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
