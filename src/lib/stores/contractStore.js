import { persisted } from 'svelte-local-storage-store';
import { StrKey } from '@stellar/stellar-sdk';
import { get } from 'svelte/store';

/**
 * @typedef {Object} SavedContract
 * @property {string} contractId - The Stellar contract ID
 * @property {string} name - Human-readable name for this contract
 * @property {string} [description] - Optional description of the contract
 */

/**
 * @typedef {Object} ContractStore
 * @property {SavedContract[]} savedContracts - An array of saved contracts
 * @property {SavedContract|null} currentContract - The currently active contract or null
 */

function createContractStore() {
    /** 
     * @type {import('svelte/store').Writable<ContractStore>} 
     */
    const { subscribe, set, update } = persisted('bpa:contractStore', {
        savedContracts: [],
        currentContract: null
    });

    return {
        subscribe,

        /**
         * Saves a new contract to the store
         * @param {SavedContract} contract - Contract details to save
         * @throws Will throw an error if the contract ID is invalid
         */
        saveContract: (contract) =>
            update(store => {
                if (!StrKey.isValidContract(contract.contractId)) {
                    throw new Error('Invalid contract ID');
                }

                const newContract = { ...contract };
                const updatedStore = {
                    ...store,
                    savedContracts: [...store.savedContracts, newContract]
                };

                // Log a success message to the console
                console.log('Contract saved successfully:', newContract);

                return updatedStore;
            }),

        /**
         * Removes a contract from the store
         * @param {string} id - Unique identifier of the contract to remove
         */
        removeContract: (id) =>
            update(store => ({
                ...store,
                savedContracts: store.savedContracts.filter(c => c.contractId !== id),
                currentContract: store.currentContract?.contractId === id ? null : store.currentContract
            })),

        /**
         * Sets the current active contract using its ID
         * @param {string|null} contractId - Contract ID to set as current, or null to clear
         * @throws Will throw an error if the contract ID is not found in saved contracts
         */
        setCurrentContract: (contractId) =>
            update(store => {
                if (contractId === null) {
                    return { ...store, currentContract: null };
                }

                const contract = store.savedContracts.find(c => c.contractId === contractId);
                if (!contract) {
                    throw new Error('Contract not found');
                }

                return { ...store, currentContract: contract };
            }),

        /**
         * Looks up a contract by its Stellar contract ID
         * @param {string} contractId - Stellar contract ID to look up
         * @returns {SavedContract|undefined} The found contract or undefined
         */
        lookup: (contractId) => {
            const store = get(contractStore);
            return store.savedContracts.find(contract => contract.contractId === contractId);
        },

        /**
         * Clears all saved contracts from the store
         */
        empty: () => set({ savedContracts: [], currentContract: null })
    };
}

export const contractStore = createContractStore();