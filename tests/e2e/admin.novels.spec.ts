// tests/e2e/admin.novels.spec.ts
import { test, expect } from '@playwright/test';
import { createTestHelpers } from '../helpers/test-utils';

const novelTitle = `Admin Test Novel ${Date.now()}`;
const updatedNovelTitle = `${novelTitle} (Updated)`;
const chapterTitle = 'Chapter 1: The First Step';

test.describe('Admin Novel Management', () => {
  // This test chain ensures a clean, predictable flow.
  // It relies on tests running in order, which is fine given workers=1.
  
  test('should create a new novel', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.navigateToAdmin('/novels');

    await page.getByRole('link', { name: 'Create Novel' }).click();
    await expect(page).toHaveURL('/admin/novels/create');

    // Fill out the form using robust selectors
    await page.getByPlaceholder('Enter novel title').fill(novelTitle);
    await page.getByPlaceholder('Enter novel description').fill('This is a test novel description.');
    await page.getByLabel('Publish this novel').check();
    await page.getByRole('button', { name: 'Create Novel' }).click();
    
    // Verify redirection and that the new novel appears in the list
    await expect(page).toHaveURL('/admin/novels');
    await expect(page.getByRole('heading', { name: novelTitle })).toBeVisible();
  });

  test('should edit an existing novel', async ({ page }) => {
    const helpers = createTestHelpers(page);
    
    await helpers.navigateToAdmin('/novels');

    // Find the novel created in the previous test and click Edit
    const novelCard = page.locator('div.bg-gray-800', { hasText: novelTitle });
    await novelCard.getByRole('link', { name: 'Edit' }).click();

    await expect(page.getByRole('heading', { name: 'Edit Novel' })).toBeVisible();
    
    await page.getByPlaceholder('Enter novel title').fill(updatedNovelTitle);
    await page.getByRole('button', { name: 'Update Novel' }).click();

    await expect(page).toHaveURL('/admin/novels');
    await expect(page.getByRole('heading', { name: updatedNovelTitle })).toBeVisible();
  });

  test('should create a chapter', async ({ page }) => {
    const helpers = createTestHelpers(page);

    await helpers.navigateToAdmin('/novels');
    
    // Find the updated novel and navigate to its chapters page
    const novelCard = page.locator('div.bg-gray-800', { hasText: updatedNovelTitle });
    await novelCard.getByRole('link', { name: 'Chapters' }).click();
    
    await expect(page).toHaveURL(new RegExp('/admin/novels/.*/chapters'));
    
    await page.getByRole('link', { name: 'Add Chapter' }).click();
    await expect(page).toHaveURL(new RegExp('/admin/novels/.*/chapters/create'));

    // Wait for the page to be ready by checking for the heading
    await expect(page.getByRole('heading', { name: /Create New Chapter|Finalize Imported Chapter/ })).toBeVisible({ timeout: 15000 });

    // Fill out the chapter form
    await page.getByLabel('Chapter Number *').fill('1');
    await page.getByPlaceholder('Enter chapter title').fill(chapterTitle);
    await helpers.fillRichTextEditor('This is the content of the first chapter.');
    await page.getByLabel('Status').selectOption('free');
    await page.getByLabel('Publish this chapter immediately').check();
    
    await page.getByRole('button', { name: 'Create Chapter' }).click();

    // Verify redirection and that the new chapter appears
    await expect(page).toHaveURL(new RegExp('/admin/novels/.*/chapters'));
    await expect(page.getByText(chapterTitle)).toBeVisible();
  });
});
