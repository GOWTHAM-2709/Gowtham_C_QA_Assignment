import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage extends BasePage and contains all selectors and actions
 * for the Tichi web application multi-step login flow.
 *
 * The login flow is two-step:
 *   Step 1: Enter email → click "Continue"
 *     - Registered email  → transitions to Step 2 (password field) on same URL /login
 *     - Unregistered email → redirects to /sign-up?email=...
 *   Step 2: Enter password → click "Login"
 */
export class LoginPage extends BasePage {
  // --- Step 1: Email Form Elements ---
  readonly emailInput: Locator;
  readonly continueButton: Locator;
  readonly emailError: Locator;
  readonly googleSignInButton: Locator;

  // --- Step 2: Password Form Elements ---
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly editEmailButton: Locator;
  readonly forgotPasswordButton: Locator;
  readonly passwordToggleVisibilityButton: Locator;
  readonly loginError: Locator;

  // --- Step 2: Password Validation Labels ---
  readonly uppercaseRule: Locator;
  readonly lowercaseRule: Locator;
  readonly numberRule: Locator;
  readonly specialCharRule: Locator;
  readonly lengthRule: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1: Email selectors
    this.emailInput = page.locator('input#email');
    this.continueButton = page.locator('button:has-text("Continue")');
    // More specific selector targeting only the inline validation error paragraph
    this.emailError = page.locator('p.text-sm.text-red-500');
    this.googleSignInButton = page.locator('div[role="button"]:has-text("Continue with Google")');

    // Step 2: Password selectors
    this.passwordInput = page.locator('input#password');
    this.loginButton = page.locator('button:has-text("Login")');
    this.editEmailButton = page.locator('button:has-text("Edit")');
    this.forgotPasswordButton = page.locator('button:has-text("Forgot Password?")');
    this.passwordToggleVisibilityButton = page.locator('button.absolute.right-3');
    this.loginError = page.locator('text=Invalid login details');

    // Password complexity criteria elements
    this.uppercaseRule = page.locator('text=An Uppercase');
    this.lowercaseRule = page.locator('text=A Lowercase');
    this.numberRule = page.locator('text=1 Number(s)');
    this.specialCharRule = page.locator('text=1 Special Character(s)');
    this.lengthRule = page.locator('text=Between 8-20 characters');
  }

  /**
   * Navigates to the Tichi login page.
   */
  async navigateToLogin(): Promise<void> {
    await this.navigateTo('/login');
  }

  /**
   * Enters the email in the email field.
   */
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Clicks the Continue button on Step 1.
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.continueButton.click();
  }

  /**
   * Gets the email validation error text (below the email input field).
   * Returns null if no error is visible.
   */
  async getEmailError(): Promise<string | null> {
    try {
      await this.emailError.waitFor({ state: 'visible', timeout: 5000 });
      return await this.emailError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Waits for the password input field to appear (i.e., Step 2 of login).
   * Use this after clickContinue() to confirm a registered email was entered.
   * @param timeout Maximum wait time in milliseconds (default 10s)
   */
  async waitForPasswordForm(timeout: number = 10000): Promise<void> {
    await this.passwordInput.waitFor({ state: 'visible', timeout });
  }

  /**
   * Enters the password in the password field.
   */
  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Clicks the Login button on Step 2.
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Checks if the Login button is enabled.
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  /**
   * Clicks the Edit email link to go back to Step 1.
   */
  async clickEditEmail(): Promise<void> {
    await this.editEmailButton.click();
  }

  /**
   * Clicks the Forgot Password button.
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordButton.click();
  }

  /**
   * Toggles the password field visibility.
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggleVisibilityButton.click();
  }

  /**
   * Gets the login authentication error text after a failed login attempt.
   * Returns null if no error is visible.
   */
  async getLoginError(): Promise<string | null> {
    try {
      await this.loginError.waitFor({ state: 'visible', timeout: 5000 });
      return await this.loginError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Convenience method: performs the full two-step login flow.
   * Enters email → clicks Continue → waits for password field → enters password → clicks Login.
   * NOTE: Only works with a registered account email.
   * @param email A registered user email address
   * @param password The corresponding password
   */
  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.clickContinue();
    await this.waitForPasswordForm();
    await this.enterPassword(password);
    await this.clickLogin();
  }
}
