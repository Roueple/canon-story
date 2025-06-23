import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  const adminEmail = process.env.ADMIN_TEST_EMAIL || 'admin@canonstory.com';
  const adminPassword = process.env.ADMIN_TEST_PASSWORD || 'TestPassword123!';

  console.log('Starting admin authentication...');

  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for Clerk's sign-in form to be visible
  await page.waitForSelector('form', { timeout: 10000 });

  // Fill email - be more specific with the selector
  await page.getByLabel('Email address').fill(adminEmail);

  // Click the specific Continue button for email/password flow
  // Use a more specific selector to avoid ambiguity
  await page.locator('button[type="submit"]').filter({ hasText: /^Continue$/ }).click();

  // Wait for password field to appear
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });

  // Fill password
  await page.getByLabel('Password').fill(adminPassword);

  // Click Continue again for password submission
  await page.locator('button[type="submit"]').filter({ hasText: /^Continue$/ }).click();

  // Wait for successful authentication
  // Clerk redirects after successful login, so we wait for navigation
  await page.waitForURL('**/admin/**', { timeout: 10000 });

  // Verify we're logged in by checking for a user element or admin-specific content
  await page.waitForSelector('[data-testid="user-button"], [data-clerk-user-button]', { timeout: 10000 });

  console.log('Admin authentication successful');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('authenticate as reader', async ({ page }) => {
  const readerEmail = process.env.READER_TEST_EMAIL || 'reader@canonstory.com';
  const readerPassword = process.env.READER_TEST_PASSWORD || 'TestPassword123!';

  console.log('Starting reader authentication...');

  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for Clerk's sign-in form
  await page.waitForSelector('form', { timeout: 10000 });

  // Fill email
  await page.getByLabel('Email address').fill(readerEmail);

  // Click Continue button specifically for email flow
  await page.locator('button[type="submit"]').filter({ hasText: /^Continue$/ }).click();

  // Wait for password field
  await page.waitForSelector('input[type="password"]', { timeout: 5000 });

  // Fill password
  await page.getByLabel('Password').fill(readerPassword);

  // Click Continue for password
  await page.locator('button[type="submit"]').filter({ hasText: /^Continue$/ }).click();

  // Wait for redirect to home or reader area
  await page.waitForURL('**/', { timeout: 10000 });

  console.log('Reader authentication successful');

  // Save authentication state
  const readerAuthFile = path.join(__dirname, '../../.auth/reader.json');
  await page.context().storageState({ path: readerAuthFile });
});
