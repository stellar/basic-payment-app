import { persisted } from 'svelte-local-storage-store'
import { v4 as uuidv4 } from 'uuid'
import { Contract, StrKey } from '@stellar/stellar-sdk'
import { error } from '@sveltejs/kit'
import { get } from 'svelte/store'

/**
 * @typedef {Object} SavedContract
 * @property {string} id Unique identifier for this contract
 * @property {string} contractId The Stellar contract ID
 * @property {string} name Human-readable name for this contract
 * @property {string} [description] Optional description of the contract
 */

function createContractStore() {
    /** @type {import('svelte/store').Writable<{savedContracts: SavedContract[], currentContract: SavedContract|null}>} */
    const { subscribe, set, update } = persisted('bpa:contractStore', {
        savedContracts: [],
        currentContract: null
    })

    return {
        subscribe,

        /**
         * Saves a new contract to the store
         * @param {SavedContract} contract Contract details to save
         * @throws Will throw an error if the contract ID is invalid
         */
        saveContract: (contract) => 
            update(store => {
                if (!StrKey.isValidContract(contract.contractId)) {
                    throw error(400, { message: 'Invalid contract ID' })
                }
                
                const newContract = {
                    ...contract,
                    id: contract.id || uuidv4()
                }
                
                return {
                    ...store,
                    savedContracts: [...store.savedContracts, newContract]
                }
            }),

        /**
         * Removes a contract from the store
         * @param {string} id Unique identifier of the contract to remove
         */
        removeContract: (id) => 
            update(store => ({
                ...store,
                savedContracts: store.savedContracts.filter(c => c.id !== id),
                currentContract: store.currentContract?.id === id ? null : store.currentContract
            })),

        /**
         * Sets the current active contract
         * @param {SavedContract|null} contract Contract to set as current, or null to clear
         */
        setCurrentContract: (contract) => 
            update(store => ({
                ...store,
                currentContract: contract
            })),

        /**
         * Looks up a contract by its Stellar contract ID
         * @param {string} contractId Stellar contract ID to look up
         * @returns {SavedContract|undefined} The found contract or undefined
         */
        lookup: (contractId) => {
            const store = get(contractStore)
            return store.savedContracts.find(contract => contract.contractId === contractId)
        },

        /**
         * Clears all saved contracts from the store
         */
        empty: () => set({ savedContracts: [], currentContract: null })
    }
}

export const contractStore = createContractStore()