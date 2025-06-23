// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Correctly define __dirname in an ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load the .env.test file relative to the config file
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export const STORAGE_STATE = path.join(__dirname, 'tests/e2e/.auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
