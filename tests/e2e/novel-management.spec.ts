// tests/e2e/novel-management.spec.ts
import { test, expect } from '@playwright/test';

// Use a unique name for the novel in each test run to avoid conflicts
const novelTitle = `My E2E Test Novel ${Date.now()}`;

test.describe('Novel Management', () => {
  test('Admin can create, view, and edit a novel', async ({ page }) => {
    // 1. Go to the novel management page
    await page.goto('/admin/novels');
    await expect(page.getByRole('heading', { name: 'Novels' })).toBeVisible();

    // 2. Click the "Create Novel" button
    await page.getByRole('link', { name: 'Create Novel' }).click();
    await expect(page).toHaveURL('/admin/novels/create');
    await expect(page.getByRole('heading', { name: 'Create New Novel' })).toBeVisible();

    // 3. Fill out the form and create the novel
    await page.getByPlaceholder('Enter novel title').fill(novelTitle);
    await page.getByPlaceholder('Enter novel description').fill('This is a description written by an automated test.');
    await page.getByRole('button', { name: 'Create Novel' }).click();

    // 4. Verify the new novel appears in the list
    await expect(page).toHaveURL('/admin/novels');
    await expect(page.getByText(novelTitle)).toBeVisible();

    // 5. Navigate to the edit page for the new novel
    // We locate the link within the div that contains our novel's title
    const novelRow = page.locator('div.bg-gray-800', { hasText: novelTitle });
    await novelRow.getByRole('link', { name: 'Edit' }).click();

    // 6. Verify we are on the edit page and the title is correct
    await expect(page.getByRole('heading', { name: 'Edit Novel' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter novel title')).toHaveValue(novelTitle);

    // 7. (Optional) Edit the novel and save
    const updatedDescription = 'This description has been updated by the test.';
    await page.getByPlaceholder('Enter novel description').fill(updatedDescription);
    await page.getByRole('button', { name: 'Update Novel' }).click();

    // 8. Verify the redirect and that the data could have been updated
    await expect(page).toHaveURL('/admin/novels');
    await expect(page.getByText(novelTitle)).toBeVisible(); // The title should still be there
  });
});
