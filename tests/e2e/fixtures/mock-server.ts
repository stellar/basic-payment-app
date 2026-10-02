import { defineConfig } from '@playwright/test';

/**
 * This fixture demonstrates how to mock the Stellar API for testing.
 * In a real scenario, you might use a local Stellar node or mock server.
 */
export const mockStellarApi = {
  horizonTestnet: 'https://horizon-testnet.stellar.org',
  horizonPubnet: 'https://horizon.stellar.org',
  
  // Mock account data
  mockAccount: {
    id: 'GAAZI4TCR3TY5OJHCTJC2A3QSY6HS5SW7NDB4WIGEWXAXTG4SGSGKW7U',
    account_id: 'GAAZI4TCR3TY5OJHCTJC2A3QSY6HS5SW7NDB4WIGEWXAXTG4SGSGKW7U',
    sequence: '1234567890123456',
    subentry_count: 0,
  },
};

// Export the config for use in tests
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:4173',
  },
});
