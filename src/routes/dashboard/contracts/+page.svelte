<script lang="ts">
    import { contractStore } from '$lib/stores/contractStore';
    import { generateContractClient } from '$lib/utils/contractUtils';
    import  SorobanRpc  from 'stellar-sdk';
    
    let contractId = '';
    let contractName = '';
    let error = '';
    let loading = false;
    
    const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
    
    async function handleLoadContract() {
        loading = true;
        error = '';
        
        try {
            const contract = await generateContractClient(contractId, server);
            $contractStore.setCurrentContract(contract);
            
            // Optionally save the contract
            if (contractName) {
                $contractStore.saveContract({
                    id: contractId,
                    name: contractName,
                    network: 'TESTNET' // or 'PUBLIC' for mainnet
                });
            }
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Stellar Smart Contract Interaction</h1>
    
    <div class="mb-4">
        <label class="block text-sm font-medium mb-1" for="contractId">
            Contract ID
        </label>
        <input
            id="contractId"
            type="text"
            bind:value={contractId}
            placeholder="Enter contract ID (C...)"
            class="w-full p-2 border rounded"
        />
    </div>
    
    <div class="mb-4">
        <label class="block text-sm font-medium mb-1" for="contractName">
            Contract Name (optional)
        </label>
        <input
            id="contractName"
            type="text"
            bind:value={contractName}
            placeholder="Enter a name for this contract"
            class="w-full p-2 border rounded"
        />
    </div>
    
    <button
        on:click={handleLoadContract}
        disabled={loading}
        class="bg-blue-500 text-white px-4 py-2 rounded"
    >
        {loading ? 'Loading...' : 'Load Contract'}
    </button>
    
    {#if error}
        <div class="text-red-500 mt-2">{error}</div>
    {/if}
    
    <h2 class="text-xl font-bold mt-8 mb-4">Saved Contracts</h2>
    {#each $contractStore.savedContracts as contract}
        <div class="border p-4 rounded mb-2 flex justify-between items-center">
            <div>
                <span class="font-medium">{contract.name || 'Unnamed Contract'}</span>
                <span class="text-sm text-gray-500 block">{contract.id}</span>
            </div>
            <button
                on:click={() => contractId = contract.id}
                class="bg-gray-200 px-3 py-1 rounded"
            >
                Load
            </button>
        </div>
    {/each}
</div>