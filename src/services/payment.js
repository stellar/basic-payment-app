const StellarSdk = require('stellar-sdk');

// Configuração do server (deveria vir de variáveis de ambiente ou configuração)
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

/**
 * Cria um claimable balance para um destinatário que não possui trustline
 * @param {string} amount - Quantidade a ser enviada
 * @param {StellarSdk.Asset} asset - Ativo a ser enviado
 * @param {string} destination - Chave pública do destinatário
 * @param {StellarSdk.Keypair} source - Keypair do remetente
 */
async function createClaimableBalance(amount, asset, destination, source) {
  try {
    // Cria um claimant que pode reclamar imediatamente
    const claimant = new StellarSdk.Claimant({
      destination: destination,
      condition: null // Condição imediata
    });

    // Cria a operação de claimable balance
    const operation = StellarSdk.Operation.createClaimableBalance({
      asset: asset,
      amount: amount,
      destination: destination,
      claimants: [claimant],
      source: source.publicKey()
    });

    // Constrói a transação
    const transaction = new StellarSdk.TransactionBuilder(source, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Assina e envia a transação
    transaction.sign(source);
    const result = await server.submitTransaction(transaction);
    console.log('Claimable balance criado com sucesso:', result.hash);
    return result;
  } catch (error) {
    console.error('Erro ao criar claimable balance:', error);
    throw error;
  }
}

/**
 * Envia um pagamento, criando um claimable balance se o destinatário não tiver trustline
 * @param {string} amount - Quantidade a ser enviada
 * @param {StellarSdk.Asset} asset - Ativo a ser enviado
 * @param {string} destination - Chave pública do destinatário
 * @param {StellarSdk.Keypair} source - Keypair do remetente
 */
async function sendPayment(amount, asset, destination, source) {
  try {
    // Tenta fazer o pagamento normalmente
    const paymentOperation = StellarSdk.Operation.payment({
      destination: destination,
      asset: asset,
      amount: amount,
      source: source.publicKey()
    });

    const transaction = new StellarSdk.TransactionBuilder(source, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase
    })
      .addOperation(paymentOperation)
      .setTimeout(30)
      .build();

    transaction.sign(source);
    const result = await server.submitTransaction(transaction);
    console.log('Pagamento enviado com sucesso:', result.hash);
    return result;
  } catch (error) {
    // Verifica se o erro é de falta de trustline
    const isTrustError = error.response && 
                         error.response.data && 
                         error.response.data.extras && 
                         error.response.data.extras.result_codes && 
                         (error.response.data.extras.result_codes.transaction_result === 'tx_no_trust' || 
                          (error.response.data.extras.result_codes.operations && 
                           error.response.data.extras.result_codes.operations.includes('op_no_trust')));

    if (isTrustError) {
      console.log('Destinatário não possui trustline. Criando claimable balance...');
      return await createClaimableBalance(amount, asset, destination, source);
    }
    
    throw error;
  }
}

module.exports = { sendPayment, createClaimableBalance };
<<<ENDFILE>>
