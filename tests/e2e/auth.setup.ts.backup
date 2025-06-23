import { test as setup, expect } from '@playwright/test';
import 'dotenv/config';

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  // 1. PRE-FLIGHT CHECK: Fail immediately if env vars are missing.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'TESTING FAILED: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file.'
    );
  }

  // 2. Navigate to the sign-in page.
  await page.goto('/sign-in');

  // 3. ROBUST WAIT: Wait for the main Clerk container to be visible.
  // This is more reliable than waiting for a specific label.
  const signInContainer = page.locator('.cl-signIn-root');
  await expect(signInContainer).toBeVisible({ timeout: 25000 });

  // 4. INTERACTION: Now that the container is visible, interact with the form.
  await page.getByLabel('Email address').fill(adminEmail);
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByLabel('Password').fill(adminPassword);
  await page.getByRole('button', { name: 'Continue' }).click();

  // 5. VERIFICATION: Wait for successful login by checking the URL and a unique element.
  await page.waitForURL('**/admin', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // 6. SAVE STATE: Persist the authenticated state.
  await page.context().storageState({ path: adminFile });
});
