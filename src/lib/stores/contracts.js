import { writable } from 'svelte/store';

function createSavedContractsStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    add: (contract) => update(list => {
      if (!list.find(c => c.address === contract.address)) {
        return [...list, { ...contract, addedAt: Date.now() }];
      }
      return list;
    }),
    remove: (address) => update(list => list.filter(c => c.address !== address)),
    clear: () => set([])
  };
}

export const savedContracts = createSavedContractsStore();
