// tests/e2e/admin.novels.spec.ts
import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../helpers/test-utils';

test.describe('Admin Novel Management', () => {
  test('should create a new novel', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navigate to admin novels page
    await helpers.navigateToAdmin('/novels');

    // Click create novel button
    await page.getByRole('button', { name: 'Create Novel' }).click();

    // Fill novel form
    await page.getByLabel('Title').fill('Test Novel');
    await page.getByLabel('Description').fill('This is a test novel description');
    
    // Select genre
    await helpers.selectFromDropdown('Genre', 'fantasy');

    // Set as published
    const publishCheckbox = page.getByLabel('Published');
    await publishCheckbox.check();

    // Submit form
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify success
    await helpers.waitForToast('Novel created successfully');
    
    // Verify novel appears in list
    await expect(page.getByText('Test Novel')).toBeVisible();
  });

  test('should edit an existing novel', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.navigateToAdmin('/novels');

    // Find and click edit button for first novel
    const firstNovelRow = page.locator('tr').filter({ hasText: 'Test Novel' });
    await firstNovelRow.getByRole('button', { name: 'Edit' }).click();

    // Update title
    await page.getByLabel('Title').fill('Updated Test Novel');

    // Submit form
    await page.getByRole('button', { name: 'Update' }).click();

    // Verify success
    await helpers.waitForToast('Novel updated successfully');
    
    // Verify updated title appears
    await expect(page.getByText('Updated Test Novel')).toBeVisible();
  });

  test('should create a chapter', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    // Navigate to novel chapters
    await helpers.navigateToAdmin('/novels');
    
    // Click on a novel to view chapters
    await page.getByText('Updated Test Novel').click();

    // Click create chapter
    await page.getByRole('button', { name: 'Create Chapter' }).click();

    // Fill chapter form
    await page.getByLabel('Chapter Number').fill('1');
    await page.getByLabel('Title').fill('Chapter 1: The Beginning');
    
    // Fill rich text editor
    await helpers.fillRichTextEditor('This is the content of chapter 1.');

    // Set status
    await helpers.selectFromDropdown('Status', 'free');

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // Verify success
    await helpers.waitForToast('Chapter created successfully');
    
    // Verify chapter appears
    await expect(page.getByText('Chapter 1: The Beginning')).toBeVisible();
  });
});
