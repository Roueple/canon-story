import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  const adminEmail = process.env.ADMIN_TEST_EMAIL || 'admin@canonstory.com';
  const adminPassword = process.env.ADMIN_TEST_PASSWORD || 'TestPassword123!';

  console.log('Starting authentication...');

  // Navigate to sign-in
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

  // Wait for Clerk to load
  await page.waitForTimeout(2000);

  // Fill email - using multiple strategies
  const emailInput = page.locator('input[name="identifier"], input[type="email"], input[placeholder*="email" i]').first();
  await emailInput.fill(adminEmail);

  // Find and click the Continue button - avoiding the Google button
  const continueButton = page.locator('button').filter({ 
    hasText: /^Continue$/ 
  }).filter({
    hasNotText: /Google/
  }).first();
  
  await continueButton.click();

  // Wait for password field
  await page.waitForTimeout(1000);
  
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(adminPassword);

  // Click Continue again
  await continueButton.click();

  // Wait for redirect
  await page.waitForTimeout(3000);

  console.log('Authentication complete!');

  // Save auth state
  await page.context().storageState({ path: authFile });
});
