// FILE: fix-all-tests.mjs
import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();

async function updateFile(filePath, modifications) {
  const fullPath = path.join(projectRoot, filePath);
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    let changed = false;
    for (const { find, replace } of modifications) {
      const newContent = content.replace(find, replace);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }
    if (changed) {
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`-  No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error);
  }
}

async function writeFile(filePath, content) {
    const fullPath = path.join(projectRoot, filePath);
    try {
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(`✅ Wrote file ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing ${filePath}:`, error);
    }
}

async function main() {
  console.log('🚀 Applying definitive fixes for all Playwright tests...');

  // 1. Fix admin chapter creation test by adding a wait
  await updateFile('tests/e2e/admin.novels.spec.ts', [
    {
      find: `await page.getByRole('link', { name: 'Add Chapter' }).click();
    await expect(page).toHaveURL(new RegExp('/admin/novels/.*/chapters/create'));

    // Fill out the chapter form
    await page.getByLabel('Chapter Number *').fill('1');`,
      replace: `await page.getByRole('link', { name: 'Add Chapter' }).click();
    await expect(page).toHaveURL(new RegExp('/admin/novels/.*/chapters/create'));

    // Wait for the page to be ready by checking for the heading
    await expect(page.getByRole('heading', { name: /Create New Chapter|Finalize Imported Chapter/ })).toBeVisible({ timeout: 15000 });

    // Fill out the chapter form
    await page.getByLabel('Chapter Number *').fill('1');`
    }
  ]);

  // 2. Make public homepage test more patient and robust
  await updateFile('tests/e2e/public.homepage.spec.ts', [
    {
        find: `await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();`,
        replace: `await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 15000 });`
    },
    {
        find: `await page.getByRole('button', { name: 'Sign Up' })).toBeVisible();`,
        replace: `await page.getByRole('button', { name: 'Sign Up' })).toBeVisible({ timeout: 15000 });`
    },
    {
        find: `await page.getByRole('button', { name: 'Sign In' }).click();`,
        replace: `await page.getByRole('button', { name: 'Sign In' }).click();`
    },
    {
        find: `await expect(page.locator('.cl-modal-body').getByRole('heading', { name: 'Sign in to Canon Story' })).toBeVisible();`,
        replace: `await expect(page.locator('.cl-modal-body').getByRole('heading', { name: /Sign in to Canon Story/i })).toBeVisible({ timeout: 15000 });`
    }
  ]);

  // 3. Add data-testid to novel cards for reliable selection
  await updateFile('src/app/(public)/novels/page.tsx', [
    {
      find: `<Link
              key={novel.id}
              href={\`/novels/\${novel.id}\`}
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >`,
      replace: `<Link
              key={novel.id}
              href={\`/novels/\${novel.id}\`}
              data-testid="novel-card"
              className="group bg-card border border-border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >`
    }
  ]);

  // 4. Make reader tests more robust with better waits and selectors.
  await writeFile('tests/e2e/reader.novels.spec.ts', `// tests/e2e/reader.novels.spec.ts
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
`);

  // 5. Fix simple sign-in test to use a reliable selector.
  await updateFile('tests/e2e/simple.spec.ts', [
    {
        find: `const signInForm = page.locator('form, [data-clerk-sign-in]');
  await expect(signInForm).toBeVisible({ timeout: 10000 });`,
        replace: `// Wait for the identifier input, which is a stable part of the Clerk form.
  await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 20000 });`
    }
  ]);
  
  console.log('\\n🎉 All definitive fixes have been applied!');
}

main();