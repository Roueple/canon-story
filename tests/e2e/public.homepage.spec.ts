// tests/e2e/public.homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Public Homepage', () => {
  test('should display homepage content', async ({ page }) => {
    await page.goto('/');
    
    // Verify main elements are visible
    await expect(page.getByRole('heading', { name: /Welcome to Canon Story/i })).toBeVisible();
    // CORRECTED: It's a button, not a link.
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('should open sign in modal', async ({ page }) => {
    await page.goto('/');
    
    // CORRECTED: Click the "Sign In" button
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // CORRECTED: Verify the modal appears
    await expect(page.locator('.cl-modal-body').getByRole('heading', { name: /Sign in to Canon Story/i })).toBeVisible({ timeout: 10000 });
  });
});