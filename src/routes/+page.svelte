<script lang="ts">
  import { validateStellarAddress, validateAmount } from '$lib/stellar';
  import { Horizon, Keypair, Networks, TransactionBuilder } from '@stellar/stellar-sdk';

  let sourceAccount = '';
  let destinationAccount = '';
  let amount = '';
  let network = 'testnet';
  let isLoading = false;
  let transactionResult = null;
  let errorMessage = '';

  function getServer() {
    return new Horizon.Server(
      network === 'testnet' 
        ? 'https://horizon-testnet.stellar.org' 
        : 'https://horizon.stellar.org'
    );
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    
    errorMessage = '';
    transactionResult = null;
    
    // Validate inputs
    const errors = [];
    if (!validateStellarAddress(sourceAccount)) {
      errors.push('Invalid source account address');
    }
    if (!validateStellarAddress(destinationAccount)) {
      errors.push('Invalid destination account address');
    }
    if (!validateAmount(amount)) {
      errors.push('Invalid amount');
    }
    
    if (errors.length > 0) {
      errorMessage = errors.join('\n');
      return;
    }
    
    isLoading = true;
    
    try {
      const server = getServer();
      
      // Fetch source account sequence
      const sourceAccountInfo = await server.accounts().accountId(sourceAccount).call();
      const destinationAccountInfo = await server.accounts().accountId(destinationAccount).call();
      
      // Create transaction
      const transaction = new TransactionBuilder(sourceAccountInfo, {
        fee: '100',
        networkPassphrase: Networks[network === 'testnet' ? 'TESTNET' : 'PUBLIC'],
      })
        .addOperation({
          type: 'payment',
          destination: destinationAccount,
          asset: 'XLM',
          amount: amount,
        })
        .setTimeout(30)
        .build();
      
      // Sign with a test keypair (in production, this would come from user's wallet)
      const sourceKeypair = Keypair.fromSecret(
        'SA测试密钥用于演示目的-' + Math.random().toString(36).substring(7)
      );
      
      transaction.sign(sourceKeypair);
      
      // Submit transaction
      const submitResponse = await server.transactions().create(transaction);
      
      transactionResult = {
        success: true,
        hash: submitResponse.hash,
        status: submitResponse.status,
      };
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Basic Payment App</title>
</svelte:head>

<div class="container">
  <header>
    <h1>Basic Payment App</h1>
    <p class="subtitle">Send XLM payments on the Stellar blockchain</p>
  </header>

  <main>
    <form id="payment-form" on:submit={handleSubmit}>
      <div class="form-group">
        <label for="network">Network</label>
        <select id="network-select" bind:value={network}>
          <option value="testnet">Testnet</option>
          <option value="pubnet">Public Network</option>
        </select>
      </div>

      <div class="form-group">
        <label for="source-account">Source Account</label>
        <input
          id="source-account"
          type="text"
          bind:value={sourceAccount}
          placeholder="Enter source Stellar address"
        />
        {#if !validateStellarAddress(sourceAccount) && sourceAccount}
          <span class="error" id="source-account-error">Invalid source account address</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="destination-account">Destination Account</label>
        <input
          id="destination-account"
          type="text"
          bind:value={destinationAccount}
          placeholder="Enter destination Stellar address"
        />
        {#if !validateStellarAddress(destinationAccount) && destinationAccount}
          <span class="error" id="destination-account-error">Invalid destination account address</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="amount">Amount (XLM)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          bind:value={amount}
          placeholder="Enter amount to send"
        />
        {#if amount && !validateAmount(amount)}
          <span class="error" id="amount-error">Invalid amount (must be positive)</span>
        {/if}
      </div>

      <button type="submit" disabled={isLoading} id="submit-payment">
        {isLoading ? 'Processing...' : 'Send Payment'}
      </button>
    </form>

    {#if errorMessage}
      <div class="error-message" id="transaction-error">
        <strong>Error:</strong>
        <pre>{errorMessage}</pre>
      </div>
    {/if}

    {#if transactionResult}
      <div class="success-message" id="transaction-result">
        <strong>Transaction Submitted!</strong>
        <p>Hash: {transactionResult.hash}</p>
        <p>Status: {transactionResult.status}</p>
      </div>
    {/if}
  </main>
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  h1 {
    color: #095dee;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #666;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: #095dee;
    box-shadow: 0 0 0 2px rgba(9, 93, 238, 0.2);
  }
  
  button {
    width: 100%;
    padding: 1rem;
    background-color: #095dee;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background-color: #0747b3;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  .error-message, .success-message {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 4px;
  }
  
  .error-message {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }
  
  .success-message {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
  
  pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
