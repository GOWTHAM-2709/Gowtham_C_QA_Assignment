import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Test credentials for a registered staging account.
 * Override by setting environment variables before running:
 *   $env:TEST_EMAIL="your@email.com"; $env:TEST_PASSWORD="YourPass1!"
 *
 * NOTE: The credential-dependent tests will be automatically skipped
 * if TEST_EMAIL / TEST_PASSWORD env vars are not set.
 */
const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';
const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD;

test.describe('Tichi Web Application - Login Flow Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
  });

  // ─── Tests requiring a REGISTERED user account ───────────────────────────────

  test('TC_LGN_001: Successful Login with Valid Credentials', async ({ page }) => {
    test.skip(!hasCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run this test');

    // Perform the complete two-step login
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);

    // Wait for post-login navigation and assert we've left /login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    const currentUrl = await loginPage.getUrl();
    expect(currentUrl).not.toContain('/login');
  });

  test('TC_LGN_002: Login Failure with Invalid Password', async ({ page }) => {
    test.skip(!hasCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run this test');

    // Enter registered email and proceed to Step 2
    await loginPage.enterEmail(TEST_EMAIL);
    await loginPage.clickContinue();
    await loginPage.waitForPasswordForm();

    // Enter intentionally incorrect password (meets complexity but wrong credential)
    await loginPage.enterPassword('WrongPass!1');
    await loginPage.clickLogin();

    // Verify authentication error message is shown
    const errorText = await loginPage.getLoginError();
    expect(errorText).toContain('Invalid login details');
    // Verify URL stays on login page
    expect(page.url()).toContain('/login');
  });

  test('TC_LGN_006: Password Complexity UI Verification', async () => {
    test.skip(!hasCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run this test');

    // Transition to password Step 2 using the registered email
    await loginPage.enterEmail(TEST_EMAIL);
    await loginPage.clickContinue();
    await loginPage.waitForPasswordForm();

    // Type a weak password (doesn't meet complexity rules)
    await loginPage.enterPassword('weak');

    // Assert all complexity rule labels are visible
    await expect(loginPage.uppercaseRule).toBeVisible();
    await expect(loginPage.lowercaseRule).toBeVisible();
    await expect(loginPage.numberRule).toBeVisible();
    await expect(loginPage.specialCharRule).toBeVisible();
    await expect(loginPage.lengthRule).toBeVisible();

    // Login button should be disabled while rules are not satisfied
    await expect(loginPage.loginButton).toBeDisabled();

    // Now fill in a strong, valid password
    await loginPage.enterPassword('P@ssword123');
    await loginPage.waitForTimeout(500);

    // Login button should now become enabled
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('TC_LGN_007: Leading/Trailing Whitespace Trimming in Email', async ({ page }) => {
    test.skip(!hasCredentials, 'Set TEST_EMAIL and TEST_PASSWORD env vars to run this test');

    // Enter email with extra spaces — the app should trim them
    await loginPage.enterEmail(`  ${TEST_EMAIL}  `);
    await loginPage.clickContinue();

    // If trim is applied, we get to Step 2 (password visible)
    await loginPage.waitForPasswordForm();
    await loginPage.enterPassword(TEST_PASSWORD);
    await loginPage.clickLogin();

    // Verify successful login (navigated away from /login)
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    expect(page.url()).not.toContain('/login');
  });

  // ─── Tests that work WITHOUT a registered account ────────────────────────────

  test('TC_LGN_003: Unregistered Email Redirects to Sign Up', async ({ page }) => {
    const unregisteredEmail = 'unregistered_qa_tichi_test@example.com';

    await loginPage.enterEmail(unregisteredEmail);
    await loginPage.clickContinue();

    // The app should redirect to /sign-up with the email pre-populated
    await page.waitForURL(/\/sign-up/, { timeout: 15000 });
    const currentUrl = page.url();
    expect(currentUrl).toContain('/sign-up');
    expect(currentUrl).toContain(encodeURIComponent(unregisteredEmail));
  });

  test('TC_LGN_004: Empty Email Shows Validation Error', async () => {
    // Click Continue without typing anything
    await loginPage.clickContinue();

    // Validation error paragraph should appear below email input
    const errorText = await loginPage.getEmailError();
    expect(errorText).toBe('Email is required');
  });

  test('TC_LGN_005: Invalid Email Format Blocked by HTML5 Validation', async () => {
    // Type a malformed email (no @ symbol)
    await loginPage.enterEmail('gowtham@tichi,com');
    await loginPage.clickContinue();

    // The browser's native HTML5 validation should block form submission;
    // the password field (Step 2) should NOT appear
    const isPasswordVisible = await loginPage.passwordInput.isVisible();
    expect(isPasswordVisible).toBe(false);

    // Verify the input itself is considered invalid by the browser
    const isInputValid = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => el.checkValidity()
    );
    expect(isInputValid).toBe(false);
  });
});
