import { StrKey } from 'stellar-sdk';
import { Contract } from '@stellar/stellar-sdk';

/**
 * Generates a contract client for interacting with a Stellar smart contract
 * @param {string} contractId - The contract ID to validate and connect to
 * @param {Server} server - Stellar SDK Server instance
 * @returns {Promise<Contract>} A Contract instance
 */
export async function generateContractClient(contractId, server) {
    try {
        // Validate contract ID
        if (!StrKey.isValidContract(contractId)) {
            throw new Error('Invalid contract ID format');
        }

        try {
            // Get the contract's WASM using the correct method
            const contractResponse = await server.getContractWasmByContractId(contractId);
            
            // Create contract instance
            const contract = new Contract(contractId);
            
            // You might want to add the contract's interface here
            // This could involve parsing the WASM to get available methods
            
            return contract;
        } catch (serverError) {
            if (serverError.response && serverError.response.status === 404) {
                throw new Error(`Contract not found: ${contractId}`);
            }
            throw serverError;
        }
    } catch (error) {
        console.error('Error generating contract client:', error);
        throw new Error(`Failed to generate contract client: ${error.message}`);
    }
}