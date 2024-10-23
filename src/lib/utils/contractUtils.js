import { StrKey, Contract } from '@stellar/stellar-sdk'
import { Server } from '@stellar/stellar-sdk/rpc'

/**
 * Generates a contract client for interacting with a Stellar smart contract
 * @param {string} contractId - The contract ID to validate and connect to
 * @returns {Promise<Contract>} A Contract instance
 */
export async function generateContractClient(contractId) {
    const server = new Server('https://soroban-testnet.stellar.org')

    // Validate contract ID
    if (!StrKey.isValidContract(contractId)) {
        throw new Error('Invalid contract ID format')
    }

    try {
        console.log('Fetching WASM for contract ID:', contractId)

        // Fetch the contract's WASM using the contract ID
        const contractResponse = await server.getContractWasmByContractId(contractId)

        // Log the WASM bytecode length or the data for debugging
        console.log('Contract WASM length:', contractResponse.length) // Adjust if needed based on actual response structure

        // Create a contract instance (you may need to initialize this differently based on your library's requirements)
        const contract = new Contract(contractId)

        // You might want to add the contract's interface here
        // This could involve parsing the WASM to get available methods

        return contract // Return the contract instance
    } catch (serverError) {
        console.error('Error fetching contract WASM:', serverError)

        // Handle specific server error responses
        if (serverError.response && serverError.response.status === 404) {
            throw new Error(`Contract not found: ${contractId}`)
        }

        // Throw a general error for other server issues
        throw new Error(`Failed to fetch contract WASM: ${serverError.message}`)
    }
}
