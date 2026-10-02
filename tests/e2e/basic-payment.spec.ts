import { test, expect } from '@playwright/test';

test.describe('Basic Payment App - E2E Tests', () => {
  test('should load the homepage and display payment form', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is set correctly
    await expect(page).toHaveTitle(/Basic Payment App/);
    
    // Check that the header exists
    await expect(page.locator('h1')).toContainText(/Basic Payment App/);
    
    // Check that the payment form is visible
    await expect(page.locator('#payment-form')).toBeVisible();
  });

  test('should display network selector with Stellar options', async ({ page }) => {
    await page.goto('/');
    
    // Check that network selector exists
    const networkSelect = page.locator('#network-select');
    await expect(networkSelect).toBeVisible();
    
    // Check for Stellar network options
    await expect(networkSelect.locator('option[value="testnet"]')).toBeVisible();
    await expect(networkSelect.locator('option[value="pubnet"]')).toBeVisible();
  });

  test('should validate source account input', async ({ page }) => {
    await page.goto('/');
    
    const sourceAccountInput = page.locator('#source-account');
    await expect(sourceAccountInput).toBeVisible();
    
    // Try submitting with empty source account
    await page.locator('#submit-payment').click();
    
    // Should show validation error
    const sourceError = page.locator('#source-account-error');
    await expect(sourceError).toBeVisible();
    await expect(sourceError).toContainText(/invalid/i);
  });

  test('should validate destination account input', async ({ page }) => {
    await page.goto('/');
    
    const destinationAccountInput = page.locator('#destination-account');
    await expect(destinationAccountInput).toBeVisible();
    
    // Try submitting with empty destination
    await page.locator('#submit-payment').click();
    
    const destinationError = page.locator('#destination-account-error');
    await expect(destinationError).toBeVisible();
    await expect(destinationError).toContainText(/invalid/i);
  });

  test('should validate amount input', async ({ page }) => {
    await page.goto('/');
    
    const amountInput = page.locator('#amount');
    await expect(amountInput).toBeVisible();
    
    // Try submitting with invalid amount (negative)
    await amountInput.fill('-100');
    await page.locator('#submit-payment').click();
    
    const amountError = page.locator('#amount-error');
    await expect(amountError).toBeVisible();
    await expect(amountError).toContainText(/invalid|must be positive/i);
  });

  test('should show transaction result after submission', async ({ page }) => {
    await page.goto('/');
    
    // Fill in valid-looking test data
    await page.locator('#source-account').fill('GTEST1234567890ABCDEFGHIJKLMNOPQRSTU');
    await page.locator('#destination-account').fill('GDEST1234567890ABCDEFGHIJKLMNOPQRSTU');
    await page.locator('#amount').fill('10.00');
    
    // Submit the form
    await page.locator('#submit-payment').click();
    
    // The transaction will likely fail in E2E due to network issues,
    // but we should see some response (success or error message)
    const resultArea = page.locator('#transaction-result');
    await expect(resultArea).toBeVisible();
  });

  test('should have loading state during transaction', async ({ page }) => {
    await page.goto('/');
    
    // Fill in test data
    await page.locator('#source-account').fill('GTEST1234567890ABCDEFGHIJKLMNOPQRSTU');
    await page.locator('#destination-account').fill('GDEST1234567890ABCDEFGHIJKLMNOPQRSTU');
    await page.locator('#amount').fill('10.00');
    
    // Click submit and check for loading state
    const submitButton = page.locator('#submit-payment');
    await submitButton.click();
    
    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled();
  });
});
