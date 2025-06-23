import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/http:\/\/localhost:\d+\//);
  console.log('Homepage loaded successfully!');
});

test('can navigate to sign-in', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page).toHaveURL(/\/sign-in/);
  
  // Check if Clerk sign-in UI is present
  const signInForm = page.locator('form, [data-clerk-sign-in]');
  await expect(signInForm).toBeVisible({ timeout: 10000 });
  
  console.log('Sign-in page loaded successfully!');
});
