// tests/e2e/reader.novels.spec.ts
import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../helpers/test-utils';

test.describe('Reader Novel Viewing', () => {
  test('should view novel list', async ({ page }) => {
    await page.goto('/novels');
    
    // Wait for novels to load
    await page.waitForSelector('[data-testid="novel-card"]');
    
    // Verify at least one novel is visible
    const novels = page.locator('[data-testid="novel-card"]');
    await expect(novels).toHaveCount(1);
  });

  test('should read a chapter', async ({ page }) => {
    await page.goto('/novels');
    
    // Click on first novel
    await page.locator('[data-testid="novel-card"]').first().click();
    
    // Wait for novel detail page
    await page.waitForSelector('[data-testid="chapter-list"]');
    
    // Click on first chapter
    await page.locator('[data-testid="chapter-item"]').first().click();
    
    // Verify chapter content is visible
    await expect(page.locator('[data-testid="chapter-content"]')).toBeVisible();
    
    // Verify reading progress is tracked
    await page.waitForTimeout(2000); // Wait for progress to be saved
  });
});
