import { describe, it, expect } from 'vitest';
import { validateStellarAddress, validateAmount, formatStellarAddress } from '../../../src/lib/stellar';

describe('Stellar Utilities', () => {
  describe('validateStellarAddress', () => {
    it('should return true for valid testnet address', () => {
      const validAddress = 'GAAZI4TCR3TY5OJHCTJC2A3QSY6HS5SW7NDB4WIGEWXAXTG4SGSGKW7U';
      expect(validateStellarAddress(validAddress)).toBe(true);
    });

    it('should return false for invalid address', () => {
      const invalidAddress = 'invalid-address';
      expect(validateStellarAddress(invalidAddress)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateStellarAddress('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(validateStellarAddress(null as any)).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should return true for valid positive amount', () => {
      expect(validateAmount('10.50')).toBe(true);
      expect(validateAmount('100')).toBe(true);
      expect(validateAmount('0.01')).toBe(true);
    });

    it('should return false for negative amount', () => {
      expect(validateAmount('-10')).toBe(false);
    });

    it('should return false for zero amount', () => {
      expect(validateAmount('0')).toBe(false);
      expect(validateAmount('0.00')).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      expect(validateAmount('abc')).toBe(false);
      expect(validateAmount('10abc')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateAmount('')).toBe(false);
    });
  });

  describe('formatStellarAddress', () => {
    it('should format valid address correctly', () => {
      const address = 'GAAZI4TCR3TY5OJHCTJC2A3QSY6HS5SW7NDB4WIGEWXAXTG4SGSGKW7U';
      expect(formatStellarAddress(address)).toBe(address);
    });

    it('should return empty string for invalid address', () => {
      expect(formatStellarAddress('invalid')).toBe('');
    });
  });
});
