// tests/e2e/public.homepage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Public Homepage', () => {
  test('should display homepage content', async ({ page }) => {
    await page.goto('/');
    
    // Verify main elements are visible
    await expect(page.getByRole('heading', { name: /Welcome to Canonstory/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in link
    await page.getByRole('link', { name: 'Sign In' }).click();
    
    // Verify we're on sign in page
    await expect(page).toHaveURL(/.*sign-in/);
    await expect(page.getByRole('heading', { name: 'Sign in to Canonstory' })).toBeVisible();
  });
});
