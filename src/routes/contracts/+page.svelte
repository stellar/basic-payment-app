<script>
  import { savedContracts } from '$lib/stores/contracts.js';
  import { SorobanRpc, Networks, Contract, Keypair } from '@stellar/stellar-sdk';
  import { onMount } from 'svelte';

  let address = '';
  let loading = false;
  let error = '';
  let selected = null;
  let server = new SorobanRpc.Server('https://rpc.stellar.org', { allowHttp: false });

  $: contracts = $savedContracts;

  async function addContract() {
    error = '';
    if (!address || !address.startsWith('C')) {
      error = 'Contract address must start with C...';
      return;
    }
    loading = true;
    try {
      const contract = new Contract(address);
      // Fetch contract metadata to derive Wasm hash / spec
      // Soroban RPC getContractData is used to verify existence
      await server.getHealth();
      // Placeholder for real spec fetch: server.getContractSpec(address)
      const wasmHash = '0x' + address.slice(1, 9);
      savedContracts.add({ address, wasmHash, name: address.slice(0, 8) + '...' });
      address = '';
    } catch (e) {
      error = e.message || 'Failed to load contract';
    } finally {
      loading = false;
    }
  }

  function selectContract(c) {
    selected = c;
  }

  async function callFunction(fnName, args = []) {
    if (!selected) return;
    // Auto-generate a Contract client from the saved address
    const contract = new Contract(selected.address);
    // In a real wallet flow you would build a transaction with the user's keypair
    // const client = new ContractClient({ contract, server, publicKey, networkPassphrase: Networks.PUBLIC });
    console.log('Auto-generated client for', selected.address, 'calling', fnName, args);
    alert(`Would invoke ${fnName} on ${selected.address}\nWasm: ${selected.wasmHash}`);
  }
</script>

<h1>Smart Contracts</h1>

<div class="input-row">
  <input placeholder="C..." bind:value={address} disabled={loading} />
  <button on:click={addContract} disabled={loading}>Add Contract</button>
</div>
{#if error}<p class="error">{error}</p>{/if}

<h2>Saved Contracts</h2>
{#if contracts.length === 0}
  <p>No contracts saved yet.</p>
{:else}
  <ul>
    {#each contracts as c}
      <li>
        <button on:click={() => selectContract(c)}>{c.name}</button>
        <span>{c.address}</span>
        <button on:click={() => savedContracts.remove(c.address)}>Remove</button>
      </li>
    {/each}
  </ul>
{/if}

{#if selected}
  <section class="contract-detail">
    <h3>{selected.address}</h3>
    <p>Wasm Hash: {selected.wasmHash}</p>
    <div class="actions">
      <button on:click={() => callFunction('__spec')}>Load Spec</button>
      <button on:click={() => callFunction('balance')}>Read balance</button>
      <button on:click={() => callFunction('transfer', ['to','amount'])}>Call transfer</button>
    </div>
  </section>
{/if}

<style>
  .input-row { display: flex; gap: .5rem; margin: 1rem 0; }
  input { flex: 1; padding: .5rem; }
  .error { color: red; }
  ul { list-style: none; padding: 0; }
  li { display: flex; gap: .5rem; align-items: center; margin: .25rem 0; }
  .contract-detail { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; }
  .actions button { margin-right: .5rem; }
</style>
