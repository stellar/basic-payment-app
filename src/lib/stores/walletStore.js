import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'
import { persisted } from 'svelte-local-storage-store'
import { KeyManager, LocalStorageKeyStore, ScryptEncrypter, KeyType } from '@stellar/typescript-wallet-sdk-km'
import { TransactionBuilder } from '@stellar/stellar-sdk'
import {
    StellarWalletsKit,
    allowAllModules,
    XBULL_ID
  } from '@creit.tech/stellar-wallets-kit';


/** @typedef {import('@stellar/stellar-sdk').Transaction} Transaction */

/**
 * @typedef {Object} WalletStore
 * @property {string} keyId ID used to uniquely identify which encrypted keypair to use from the browser's localStorage
 * @property {string} publicKey Public Stellar address derived from the encrypted keypair
 * @property {Object} [devInfo] Helpful information for developer environments (Should not be used in production)
 * @property {string} [devInfo.secretKey] Secret Stellar key derived from the encrypted keypair
 */

function createWalletStore() {
    /** @type {import('svelte/store').Writable<WalletStore>} */
    const { subscribe, set, } = persisted('bpa:walletStore', { keyId: '', publicKey: '' })
    return {
        subscribe,



  /**
         * Connects a user by their public key (wallet-based registration)
         * @param {Object} opts Options object
         * @param {string} opts.publicKey Public Stellar address
         */
        connectWallet: async ({ publicKey }) => {
            try {
                // This effectively both "registers" and "logs in" the wallet
                set({
                    keyId: publicKey,
                    publicKey: publicKey,
                })
            } catch (err) {
                console.error('Error connecting wallet', err)
                throw error(400, { message: 'Failed to connect wallet' })
            }
        },

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
                    encrypterName: ScryptEncrypter.name,
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

                const { keyId, publicKey } = get(walletStore);

                if (keyId === publicKey) {

                const kit = new StellarWalletsKit({
                    // @ts-ignore
                    network: network,
                    selectedWalletId: XBULL_ID,
                    modules: allowAllModules(),
                });
                    const { address } = await kit.getAddress();

                    // Sign the transaction using the wallet address
                    const { signedTxXdr } = await kit.signTransaction(transactionXDR, {
                        address,
                        networkPassphrase: network, // or use your specific network passphrase
                    });

                    // @ts-ignore
                    return signedTxXdr; // Return the signed transaction
                } else {

                    const keyManager = setupKeyManager();
                    // Fallback to signing with pincode if no wallet
                    const signedTransaction = await keyManager.signTransaction({
                        // @ts-ignore
                        transaction: TransactionBuilder.fromXDR(transactionXDR, network),
                        id: keyId,
                        password: pincode,
                    });
                    // @ts-ignore
                    return signedTransaction;
                }
            }catch (err) {
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
