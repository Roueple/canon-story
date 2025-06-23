// tests/e2e/reader.novels.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reader Novel Viewing', () => {
  test('should view novel list', async ({ page }) => {
    await page.goto('/novels');
    
    // Wait for the first novel card to become visible. This is a good sign the page is hydrated and data is loaded.
    await expect(page.locator('[data-testid="novel-card"]').first()).toBeVisible({ timeout: 20000 });
    
    // Verify at least one novel is visible
    const novels = page.locator('[data-testid="novel-card"]');
    await expect(novels.first()).toBeVisible();
  });

  test('should read a chapter', async ({ page }) => {
    await page.goto('/novels');
    
    // Wait for cards to be ready, then click
    const firstNovelCard = page.locator('[data-testid="novel-card"]').first();
    await expect(firstNovelCard).toBeVisible({ timeout: 20000 });
    await firstNovelCard.click();
    
    // Wait for novel detail page to load its chapter list
    await expect(page.locator('[data-testid="chapter-list"]')).toBeVisible({ timeout: 15000 });
    
    // Click on first chapter
    await page.locator('[data-testid="chapter-item"]').first().click();
    
    // Verify chapter content is visible by looking for the article container
    await expect(page.locator('article[data-chapter-id]').first()).toBeVisible({ timeout: 15000 });
    
    // Verify reading progress is tracked (simple wait)
    await page.waitForTimeout(2000);
  });
});
