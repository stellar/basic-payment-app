import React, { useState, useEffect } from 'react';
import ContactList from './ContactList';
import PaymentForm from './PaymentForm';
import TransactionHistory from './TransactionHistory';
import { connectToNetwork, sendPayment, sendSacTransfer, getBalance } from './stellar';

const App = () => {
  const [serverUrl, setServerUrl] = useState('https://horizon-testnet.stellar.org');
  const [networkPassphrase, setNetworkPassphrase] = useState(
    'Test SDF Network ; September 2015'
  );
  const [sourceSeed, setSourceSeed] = useState('');
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Alice', address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZabcdef' },
    { id: 2, name: 'Bob', address: 'CSacTestContractAddress123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    { id: 3, name: 'Carol', address: 'GBXYZABCDEFGHIJKLMNOPQRSTUVWXYZabcdef' },
  ]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [amount, setAmount] = useState('');
  const [assetCode, setAssetCode] = useState('XLM');
  const [assetIssuer, setAssetIssuer] = useState('');

  useEffect(() => {
    if (connected && sourceSeed) {
      loadAccount();
    }
  }, [connected, sourceSeed]);

  const loadAccount = async () => {
    try {
      setError(null);
      const server = new StellarSdk.Server(serverUrl);
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSeed);
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

      setAccount({
        publicKey: sourceKeypair.publicKey(),
        sequence: sourceAccount.sequence,
      });

      let totalBalance = '0';
      for (const entry of sourceAccount.balances) {
        if (entry.asset_type === 'native') {
          totalBalance = entry.balance;
        }
      }
      setBalance(totalBalance);
    } catch (err) {
      setError('Failed to load account: ' + err.message);
    }
  };

  const handleConnect = () => {
    if (!sourceSeed) {
      setError('Please enter your seed phrase');
      return;
    }
    try {
      StellarSdk.Keypair.fromSecret(sourceSeed);
      setConnected(true);
      setError(null);
    } catch (err) {
      setError('Invalid seed phrase');
    }
  };

  const handleSendPayment = async () => {
    if (!sourceSeed || !selectedContact) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setError(null);
      const server = new StellarSdk.Server(serverUrl);
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSeed);
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

      const asset = assetCode === 'XLM'
        ? StellarSdk.Asset.native()
        : new StellarSdk.Asset(assetCode, assetIssuer);

      const result = await sendPayment(server, sourceKeypair, sourceAccount, selectedContact, amount, asset);
      setTransactions([result, ...transactions]);
      setAmount('');
      setSelectedContact(null);
      await loadAccount();
    } catch (err) {
      setError('Payment failed: ' + err.message);
    }
  };

  const handleSendSacTransfer = async () => {
    if (!sourceSeed || !selectedContact) {
      setError('Please fill in all fields');
      return;
    }
    try {
      setError(null);
      const server = new StellarSdk.Server(serverUrl);
      const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSeed);
      const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

      const asset = assetCode === 'XLM'
        ? StellarSdk.Asset.native()
        : new StellarSdk.Asset(assetCode, assetIssuer);

      const result = await sendSacTransfer(server, sourceKeypair, sourceAccount, selectedContact, amount, asset);
      setTransactions([result, ...transactions]);
      setAmount('');
      setSelectedContact(null);
      await loadAccount();
    } catch (err) {
      setError('SAC transfer failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Basic Payment App</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Connection Settings</h3>
        <input
          type="text"
          placeholder="Horizon Server URL"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input
          type="password"
          placeholder="Source Seed / Secret Key"
          value={sourceSeed}
          onChange={(e) => setSourceSeed(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <button onClick={handleConnect} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Connect
        </button>
        {connected && <span style={{ color: 'green', marginLeft: '10px' }}>✓ Connected</span>}
        {error && <span style={{ color: 'red', marginLeft: '10px' }}>{error}</span>}
        {account && (
          <div style={{ marginTop: '10px' }}>
            <p>Account: {account.publicKey}</p>
            <p>Sequence: {account.sequence}</p>
            <p>Balance: {balance} XLM</p>
          </div>
        )}
      </div>

      {!connected ? (
        <ContactList contacts={contacts} onSelect={setSelectedContact} />
      ) : (
        <>
          <PaymentForm
            selectedContact={selectedContact}
            amount={amount}
            assetCode={assetCode}
            assetIssuer={assetIssuer}
            onAmountChange={setAmount}
            onAssetCodeChange={setAssetCode}
            onAssetIssuerChange={setAssetIssuer}
            onSelectContact={setSelectedContact}
            onSend={handleSendPayment}
            onSendSac={handleSendSacTransfer}
            contacts={contacts}
            isSacTransfer={false}
          />
          <TransactionHistory transactions={transactions} />
        </>
      )}
    </div>
  );
};

export default App;
