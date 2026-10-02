import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import PaymentForm from '../../../src/routes/+page.svelte';

// Mock the stellar SDK
vi.mock('@stellar/stellar-sdk', () => ({
  Horizon: {
    Server: class MockServer {
      transactions() {
        return {
          post: vi.fn().mockResolvedValue({
            data: { result_xdr: 'test_result' },
          }),
        };
      }
    },
  },
  PublicKey: class MockPublicKey {
    constructor(publicKey: string) {
      this.key = publicKey;
    }
    key: string;
  },
  Networks: {
    PUBLIC: 'Public Global Stellar Network ; September 2015',
    TESTNET: 'Test SDF Network ; September 2015',
  },
  StrKey: {
    encodeEd25519PublicKey: vi.fn().mockReturnValue('GTEST1234567890ABCDEFGHIJKLMNOPQRSTU'),
    decodeEd25519PublicKey: vi.fn().mockReturnValue(new Uint8Array(32)),
  },
}));

describe('PaymentForm Component', () => {
  it('should render the payment form with all fields', () => {
    render(PaymentForm);
    
    expect(screen.getByLabelText(/source account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/network/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send payment/i })).toBeInTheDocument();
  });

  it('should validate empty source account', async () => {
    render(PaymentForm);
    
    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await fireEvent.click(submitButton);
    
    expect(screen.getByText(/invalid source account/i)).toBeInTheDocument();
  });

  it('should validate empty destination account', async () => {
    render(PaymentForm);
    
    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await fireEvent.click(submitButton);
    
    expect(screen.getByText(/invalid destination account/i)).toBeInTheDocument();
  });

  it('should validate empty amount', async () => {
    render(PaymentForm);
    
    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await fireEvent.click(submitButton);
    
    expect(screen.getByText(/invalid amount/i)).toBeInTheDocument();
  });

  it('should validate negative amount', async () => {
    render(PaymentForm);
    
    const amountInput = screen.getByLabelText(/amount/i);
    await fireEvent.input(amountInput, { target: { value: '-100' } });
    
    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await fireEvent.click(submitButton);
    
    expect(screen.getByText(/invalid amount/i)).toBeInTheDocument();
  });
});
