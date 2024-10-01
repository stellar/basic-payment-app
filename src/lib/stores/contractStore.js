import { writable } from 'svelte/store';
import  Contract  from 'stellar-sdk';

function createContractStore() {
    const { subscribe, set, update } = writable({
        savedContracts: loadSavedContracts()
    });

    return {
        subscribe,
        saveContract: (contract) => update(store => {
            const newSavedContracts = [...store.savedContracts, contract];
            localStorage.setItem('savedContracts', JSON.stringify(newSavedContracts));
            return { ...store, savedContracts: newSavedContracts };
        }),
        removeContract: (contractId) => update(store => {
            const newSavedContracts = store.savedContracts.filter(c => c.id !== contractId);
            localStorage.setItem('savedContracts', JSON.stringify(newSavedContracts));
            return { ...store, savedContracts: newSavedContracts };
        }),
        setCurrentContract: (contract) => update(store => ({
            ...store,
            currentContract: contract
        }))
    };
}

function loadSavedContracts() {
    const saved = localStorage.getItem('savedContracts');
    return saved ? JSON.parse(saved) : [];
}

export const contractStore = createContractStore();