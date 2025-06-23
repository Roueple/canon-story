// tests/e2e/admin.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('should load the admin dashboard and display key elements', async ({ page }) => {
    await page.goto('/admin');
    
    // Check for the main dashboard heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    
    // Check for a few stat cards
    await expect(page.getByText('Total Users')).toBeVisible();
    await expect(page.getByText('Novels')).toBeVisible();
    
    // Check for a quick action button
    await expect(page.getByRole('link', { name: 'Create Novel' })).toBeVisible();
  });

  test('should navigate to the novels management page', async ({ page }) => {
    await page.goto('/admin');
    
    // Use the sidebar link to navigate
    await page.getByRole('link', { name: 'Novels' }).click();
    
    // Verify we are on the correct page
    await expect(page).toHaveURL('/admin/novels');
    await expect(page.getByRole('heading', { name: 'Novels' })).toBeVisible();
  });
});
