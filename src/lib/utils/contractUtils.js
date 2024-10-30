import { StrKey, Contract } from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

/**
 * Determines if a contract ID represents a Stellar Asset Contract (SAC)
 * @param {string} contractId - The contract ID to check
 * @returns {boolean} True if the contract ID is for a SAC
 */
function isStellarAssetContract(contractId) {
    return contractId.startsWith('CA');
}

/**
 * Generates a contract client for interacting with a Stellar smart contract
 * @param {string} contractId - The contract ID to validate and connect to
 * @returns {Promise<Contract>} A Contract instance
 */
export async function generateContractClient(contractId) {
    const server = new Server('https://soroban-testnet.stellar.org');
    
    // Validate contract ID
    if (!StrKey.isValidContract(contractId)) {
        throw new Error('Invalid contract ID format');
    }

    try {
        if (isStellarAssetContract(contractId)) {
            // For SAC contracts, create contract instance without fetching WASM
            const contract = new Contract(contractId);
            console.log('Contract:', contract);
            return contract;
        }
        else {
            // For WASM contracts, fetch the WASM first
            console.log('Fetching WASM for contract ID:', contractId);
            const contractResponse = await server.getContractWasmByContractId(contractId);
            
            console.log('Contract WASM length:', contractResponse.length);
            const contract = new Contract(contractId);
            console.log(contract);
            
            // You might want to add the contract's interface here
            // This could involve parsing the WASM to get available methods
            
            return contract;
        }
    } catch (serverError) {
        console.error('Error handling contract:', serverError);
        
        if (serverError.response && serverError.response.status === 404) {
            throw new Error(`Contract not found: ${contractId}`);
        }

        throw new Error(`Failed to handle contract: ${serverError.message}`);
    }
}