<script lang="ts">
    import { contractStore } from '$lib/stores/contractStore'
    import { generateContractClient } from '$lib/utils/contractUtils'
    import { SorobanRpc } from '@stellar/stellar-sdk'

    let contractId = ''
    let contractName = ''
    let error = ''
    let loading = false

    const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org')

    async function handleLoadContract() {
        loading = true
        error = ''

        try {
            const contract = await generateContractClient(contractId, server)
            $contractStore.setCurrentContract(contract)

            // Optionally save the contract
            if (contractName) {
                $contractStore.saveContract({
                    id: contractId,
                    name: contractName,
                    network: 'TESTNET', // or 'PUBLIC' for mainnet
                })
            }
        } catch (err) {
            error = err.message
        } finally {
            loading = false
        }
    }
</script>

<div class="container mx-auto p-4">
    <h1 class="mb-4 text-2xl font-bold">Stellar Smart Contract Interaction</h1>

    <div class="mb-4">
        <label class="mb-1 block text-sm font-medium" for="contractId"> Contract ID </label>
        <input
            id="contractId"
            type="text"
            bind:value={contractId}
            placeholder="Enter contract ID (C...)"
            class="w-full rounded border p-2"
        />
    </div>

    <div class="mb-4">
        <label class="mb-1 block text-sm font-medium" for="contractName">
            Contract Name (optional)
        </label>
        <input
            id="contractName"
            type="text"
            bind:value={contractName}
            placeholder="Enter a name for this contract"
            class="w-full rounded border p-2"
        />
    </div>

    <button
        on:click={handleLoadContract}
        disabled={loading}
        class="rounded bg-blue-500 px-4 py-2 text-white"
    >
        {loading ? 'Loading...' : 'Load Contract'}
    </button>

    {#if error}
        <div class="mt-2 text-red-500">{error}</div>
    {/if}

    <h2 class="mb-4 mt-8 text-xl font-bold">Saved Contracts</h2>
    {#each $contractStore.savedContracts as contract}
        <div class="mb-2 flex items-center justify-between rounded border p-4">
            <div>
                <span class="font-medium">{contract.name || 'Unnamed Contract'}</span>
                <span class="block text-sm text-gray-500">{contract.id}</span>
            </div>
            <button
                on:click={() => (contractId = contract.id)}
                class="rounded bg-gray-200 px-3 py-1"
            >
                Load
            </button>
        </div>
    {/each}
</div>
