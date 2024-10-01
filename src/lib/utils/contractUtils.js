import  Contract from 'stellar-sdk';

export async function generateContractClient(contractId, server) {
    try {
        // Validate contract ID format
        if (!contractId.match(/^C[A-Z2-7]{55}$/)) {
            throw new Error('Invalid contract ID format');
        }

        // Get the contract's footprint which includes the WASM hash
        const footprintResponse = await server.getFootprint(contractId);
        
        // Create contract instance
        const contract = new Contract(contractId);
        
        // You might want to add the contract's interface here
        // This would involve parsing the WASM to get available methods
        
        return contract;
    } catch (error) {
        console.error('Error generating contract client:', error);
        throw new Error(`Failed to generate contract client: ${error.message}`);
    }
}