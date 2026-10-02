import { Horizon, StrKey } from '@stellar/stellar-sdk';

/**
 * Validates a Stellar public key address.
 * @param address - The Stellar address to validate
 * @returns true if the address is valid, false otherwise
 */
export function validateStellarAddress(address: string | null | undefined): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

/**
 * Validates a payment amount.
 * @param amount - The amount to validate
 * @returns true if the amount is valid (positive number), false otherwise
 */
export function validateAmount(amount: string | null | undefined): boolean {
  if (!amount || typeof amount !== 'string') {
    return false;
  }
  
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0;
}

/**
 * Formats a Stellar address for display.
 * @param address - The Stellar address to format
 * @returns The formatted address or empty string if invalid
 */
export function formatStellarAddress(address: string): string {
  if (validateStellarAddress(address)) {
    return address;
  }
  return '';
}

/**
 * Creates a Horizon server instance for the specified network.
 * @param network - The network to connect to ('testnet' or 'pubnet')
 * @returns The Horizon server instance
 */
export function getHorizonServer(network: 'testnet' | 'pubnet'): Horizon.Server {
  const url = network === 'testnet' 
    ? 'https://horizon-testnet.stellar.org'
    : 'https://horizon.stellar.org';
  
  return new Horizon.Server(url);
}
