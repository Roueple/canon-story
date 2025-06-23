import { test as setup, expect } from '@playwright/test';
import path from 'path';
import 'dotenv/config';

const authFile = '.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  const adminEmail = process.env.ADMIN_TEST_EMAIL;
  const adminPassword = process.env.ADMIN_TEST_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD must be set in your .env file for testing.');
  }

  console.log('Starting authentication for:', adminEmail);

  await page.goto('/sign-in');

  // Wait for the Clerk form to be visible and ready for interaction.
  await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 15000 });

  // Fill in the email address.
  await page.locator('input[name="identifier"]').fill(adminEmail);

  // Use a more robust locator to find the "Continue" button.
  // getByRole targets elements the way a user would, by their accessible name.
  // The regular expression /^Continue$/i ensures we match the exact word "Continue", case-insensitively.
  await page.getByRole('button', { name: /^Continue$/i }).click();

  // Wait for the password field to appear.
  await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 10000 });

  // Fill in the password.
  await page.locator('input[name="password"]').fill(adminPassword);

  // Click the "Continue" button again to submit the password.
  await page.getByRole('button', { name: /^Continue$/i }).click();

  // Wait for successful sign-in by checking for the main welcome heading on the homepage.
  // This is a much more reliable way to confirm login than waiting for a timeout.
  await expect(page.getByRole('heading', { name: /Welcome to Canon Story/i })).toBeVisible({ timeout: 15000 });
  
  console.log('Successfully authenticated and redirected to homepage.');

  // Save the authenticated state to the file.
  await page.context().storageState({ path: authFile });
  console.log('Authentication state saved.');
});