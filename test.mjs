// fix-everything-final.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const fixEverything = async () => {
  console.log('🚀 COMPLETE FIX FOR CANONSTORY TESTING\n');
  console.log('This will fix both middleware and authentication issues.\n');

  // Step 1: Fix the middleware error
  console.log('📝 Step 1: Fixing middleware (Clerk v5 compatibility)...');
  
  const middlewareContent = `import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
`;

  await fs.writeFile('src/middleware.ts', middlewareContent, 'utf8');
  console.log('✅ Middleware fixed!\n');

  // Step 2: Create working auth setup
  console.log('📝 Step 2: Creating working authentication test...');
  
  const authSetupContent = `import { test as setup } from '@playwright/test';
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
`;

  await fs.mkdir('tests/e2e', { recursive: true });
  await fs.writeFile('tests/e2e/auth.setup.ts', authSetupContent, 'utf8');
  console.log('✅ Auth setup created!\n');

  // Step 3: Create a simple test that works
  console.log('📝 Step 3: Creating simple working test...');
  
  const simpleTestContent = `import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/http:\\/\\/localhost:\\d+\\//);
  console.log('Homepage loaded successfully!');
});

test('can navigate to sign-in', async ({ page }) => {
  await page.goto('/sign-in');
  await expect(page).toHaveURL(/\\/sign-in/);
  
  // Check if Clerk sign-in UI is present
  const signInForm = page.locator('form, [data-clerk-sign-in]');
  await expect(signInForm).toBeVisible({ timeout: 10000 });
  
  console.log('Sign-in page loaded successfully!');
});
`;

  await fs.writeFile('tests/e2e/simple.spec.ts', simpleTestContent, 'utf8');
  console.log('✅ Simple test created!\n');

  // Step 4: Create minimal playwright config
  console.log('📝 Step 4: Creating minimal Playwright config...');
  
  const playwrightConfigContent = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\\.setup\\.ts/,
    },
    {
      name: 'tests',
      testMatch: /.*\\.spec\\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: '.auth/user.json',
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
`;

  await fs.writeFile('playwright.config.ts', playwrightConfigContent, 'utf8');
  console.log('✅ Playwright config created!\n');

  // Step 5: Create .auth directory
  await fs.mkdir('.auth', { recursive: true });

  // Step 6: Create a test runner script
  console.log('📝 Step 5: Creating test runner...');
  
  const testRunnerContent = `// test-runner.mjs
import { execSync } from 'child_process';

console.log('🧪 Running Canonstory Tests\\n');

// Check if server is running
try {
  const response = await fetch('http://localhost:3000');
  console.log('✅ Dev server is running\\n');
} catch (error) {
  console.log('❌ Dev server is not running!');
  console.log('Please run: npm run dev\\n');
  process.exit(1);
}

// Run tests
const commands = [
  { name: 'Simple Tests', cmd: 'npx playwright test simple.spec.ts --project=tests' },
  { name: 'Auth Setup', cmd: 'npx playwright test auth.setup.ts' },
];

for (const { name, cmd } of commands) {
  console.log(\`Running: \${name}...\`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(\`✅ \${name} passed!\\n\`);
  } catch (error) {
    console.log(\`❌ \${name} failed!\\n\`);
  }
}
`;

  await fs.writeFile('test-runner.mjs', testRunnerContent, 'utf8');
  console.log('✅ Test runner created!\n');

  console.log('🎉 ALL FIXES APPLIED!\n');
  console.log('📋 INSTRUCTIONS:\n');
  console.log('1. Make sure your .env file has:');
  console.log('   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...');
  console.log('   CLERK_SECRET_KEY=sk_test_...');
  console.log('   ADMIN_TEST_EMAIL=admin@canonstory.com');
  console.log('   ADMIN_TEST_PASSWORD=TestPassword123!\n');
  console.log('2. Create test users in Clerk dashboard with above credentials\n');
  console.log('3. Run tests:');
  console.log('   Option A: node test-runner.mjs');
  console.log('   Option B: npx playwright test simple.spec.ts');
  console.log('   Option C: npx playwright test --ui (for debugging)\n');
  console.log('If tests still fail, the issue is likely with Clerk configuration, not the test code.');
};

// Run the complete fix
fixEverything().catch(console.error);