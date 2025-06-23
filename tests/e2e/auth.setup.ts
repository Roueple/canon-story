// tests/e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import { STORAGE_STATE } from '../../playwright.config';

const adminUser = process.env.TEST_ADMIN_USER;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

setup('authenticate as admin', async ({ page }) => {
  if (!adminUser || !adminPassword) {
    throw new Error('TEST_ADMIN_USER and TEST_ADMIN_PASSWORD environment variables must be set in your .env.test file.');
  }

  await page.goto('/sign-in');
  
  await page.waitForFunction(() => (window as any).Clerk?.isReady(), null, { timeout: 20000 });
  await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 10000 });

  await page.locator('input[name="identifier"]').fill(adminUser);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL('/', { timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'Welcome to Canon Story' })).toBeVisible({ timeout: 10000 });

  await page.context().storageState({ path: STORAGE_STATE });
  console.log('Authentication state saved successfully.');
});
