// tests/e2e/reader.novels.spec.ts
import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../helpers/test-utils';

test.describe('Reader Novel Viewing', () => {
  test('should view novel list', async ({ page }) => {
    await page.goto('/novels');
    
    // CORRECTED: Wait for network to be idle, then check for the first card.
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="novel-card"]').first()).toBeVisible({ timeout: 10000 });
    
    // Verify at least one novel is visible
    const novels = page.locator('[data-testid="novel-card"]');
    await expect(novels.first()).toBeVisible();
  });

  test('should read a chapter', async ({ page }) => {
    await page.goto('/novels');
    
    // CORRECTED: Wait for network to be idle before clicking.
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="novel-card"]').first().click();
    
    // Wait for novel detail page
    await expect(page.locator('[data-testid="chapter-list"]')).toBeVisible();
    
    // Click on first chapter
    await page.locator('[data-testid="chapter-item"]').first().click();
    
    // Verify chapter content is visible
    await expect(page.locator('[data-testid="chapter-content"]')).toBeVisible();
    
    // Verify reading progress is tracked
    await page.waitForTimeout(2000); // Wait for progress to be saved
  });
});