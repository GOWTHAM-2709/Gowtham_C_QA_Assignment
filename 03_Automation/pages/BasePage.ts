import { Page } from '@playwright/test';

/**
 * BasePage is the parent Page Object class containing common locators,
 * helper methods, and page interactions shared across the application.
 */
export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to a given URL (relative to baseURL or absolute).
   */
  async navigateTo(url: string = '/'): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Retrieves the current page URL.
   */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Retrieves the current page title.
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Helper method to wait for a specific time duration (ms).
   */
  async waitForTimeout(timeoutMs: number): Promise<void> {
    await this.page.waitForTimeout(timeoutMs);
  }
}
