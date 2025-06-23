// tests/helpers/test-utils.ts
import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForClerkAuth() {
    // Wait for Clerk to fully load
    await this.page.waitForFunction(() => {
      return window.Clerk && window.Clerk.isReady();
    }, { timeout: 10000 });
  }

  async waitForToast(message: string) {
    const toast = this.page.locator('[role="alert"]', { hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
  }

  async dismissToast() {
    const closeButton = this.page.locator('[role="alert"] button[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  async navigateToAdmin(path: string = '') {
    await this.page.goto(`/admin${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  async fillRichTextEditor(content: string) {
    // Assuming you're using a contenteditable div or similar
    const editor = this.page.locator('[contenteditable="true"], .rich-text-editor');
    await editor.click();
    await editor.fill(content);
  }

  async selectFromDropdown(label: string, value: string) {
    await this.page.getByLabel(label).selectOption(value);
  }

  async uploadFile(selector: string, filePath: string) {
    const fileInput = this.page.locator(selector);
    await fileInput.setInputFiles(filePath);
  }
}

export function createTestHelpers(page: Page) {
  return new TestHelpers(page);
}
