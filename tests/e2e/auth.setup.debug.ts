import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/user.json');

setup('authenticate as admin - debug mode', async ({ page }) => {
  const adminEmail = process.env.ADMIN_TEST_EMAIL || 'admin@canonstory.com';
  const adminPassword = process.env.ADMIN_TEST_PASSWORD || 'TestPassword123!';

  // Enable console logging
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  console.log('🔍 Debug mode: Starting admin authentication...');
  console.log('Email:', adminEmail);

  // Navigate with logging
  console.log('1. Navigating to /sign-in...');
  await page.goto('/sign-in');
  await page.screenshot({ path: 'debug-1-signin-page.png' });

  // Wait for Clerk
  console.log('2. Waiting for Clerk to initialize...');
  await page.waitForFunction(() => {
    return window.Clerk && window.Clerk.isReady();
  }, { timeout: 10000 });

  // Wait for form
  console.log('3. Waiting for form to be visible...');
  await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
  
  // Log all buttons on the page
  const buttons = await page.$$eval('button', btns => 
    btns.map(btn => ({ text: btn.textContent, type: btn.type }))
  );
  console.log('Buttons found on page:', buttons);

  // Fill email
  console.log('4. Filling email address...');
  await page.getByLabel('Email address').fill(adminEmail);
  await page.screenshot({ path: 'debug-2-email-filled.png' });

  // Try different selectors
  console.log('5. Clicking Continue button...');
  try {
    // Method 1: Specific form button
    await page.locator('form button[type="submit"]:has-text("Continue")').click();
  } catch (e1) {
    console.log('Method 1 failed:', e1.message);
    try {
      // Method 2: By class
      await page.locator('.cl-formButtonPrimary').click();
    } catch (e2) {
      console.log('Method 2 failed:', e2.message);
      // Method 3: Last resort - nth selector
      await page.locator('button:has-text("Continue")').nth(1).click();
    }
  }

  // Wait for password field
  console.log('6. Waiting for password field...');
  await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 5000 });
  await page.screenshot({ path: 'debug-3-password-field.png' });

  // Fill password
  console.log('7. Filling password...');
  await page.getByLabel('Password').fill(adminPassword);

  // Submit password
  console.log('8. Submitting password...');
  await page.locator('form button[type="submit"]:has-text("Continue")').click();

  // Wait for redirect
  console.log('9. Waiting for authentication...');
  const finalUrl = await page.waitForURL((url) => !url.toString().includes('sign-in'), { 
    timeout: 10000 
  });
  console.log('Redirected to:', page.url());
  await page.screenshot({ path: 'debug-4-authenticated.png' });

  // Save state
  console.log('10. Saving authentication state...');
  await page.context().storageState({ path: authFile });
  
  console.log('✅ Authentication complete!');
});
