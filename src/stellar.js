import StellarSdk from 'stellar-sdk';

/**
 * Check if an address is a contract address (starts with 'C')
 */
export const isContractAddress = (address) => {
  return address && address.startsWith('C');
};

/**
 * Send a regular payment transaction
 */
export const sendPayment = async (server, sourceKeypair, sourceAccount, destination, amount, asset) => {
  const destinationAccount = await server.loadAccount(destination);
  
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset,
        amount,
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  const submitResult = await server.submitTransaction(transaction);
  return submitResult;
};

/**
 * Send a transfer transaction using invokeHostFunction for SAC (Stellar Asset Contract)
 */
export const sendSacTransfer = async (server, sourceKeypair, sourceAccount, contractAddress, amount, asset) => {
  const contractAccount = await server.loadAccount(contractAddress);
  
  // Build the transfer operation using invokeHostFunction
  const transferSymbol = 'transfer';
  const assetContractId = StellarSdk.Contract.fromScVal(
    StellarSdk.NativeAsset.toScVal(),
  ).address().toScVal();

  // Create the transaction with invokeHostFunction operation
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.invokeHostFunction({
        func: new StellarSdk.xdr.InvokeHostFunctionOp.body.invokeHostFunctionV0(
          new StellarSdk.ScVal('obj', [
            new StellarSdk.ScString(transferSymbol),
            assetContractId,
            StellarSdk.ScString.from(contractAddress),
            StellarSdk.ScVal.u64(BigInt(Math.floor(parseFloat(amount) * 10000000))),
          ]),
        ),
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  const submitResult = await server.submitTransaction(transaction);
  return submitResult;
};

/**
 * Get account balance
 */
export const getBalance = async (server, publicKey, assetCode = 'XLM', assetIssuer = '') => {
  const account = await server.loadAccount(publicKey);
  for (const entry of account.balances) {
    if (entry.asset_type === 'native') {
      return entry.balance;
    }
    if (entry.asset_code === assetCode && entry.asset_issuer === assetIssuer) {
      return entry.balance;
    }
  }
  return '0';
};
