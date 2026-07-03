const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE = 'https://tichi-app-webapp-stage.web.app';
const SHOTS = 'D:/Gowtham_C_QA_Assignment/05_Screenshots/exploratory';
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const findings = [];
let bugCount = 0;

function log(id, area, title, severity, expected, actual, steps, recommendation, tag) {
  findings.push({ id, area, title, severity, expected, actual, steps, recommendation, tag });
  console.log(`\n=== ${id} [${severity}] ${title} ===`);
  console.log(`  Tag: ${tag}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
}

async function shot(page, name) {
  const p = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true }).catch(() => {});
  console.log(`  [SS] ${name}.png`);
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ─── BUG A: No success feedback after valid registration (201) ───────────────
  console.log('\n>>> TEST A: Signup success feedback (201 but stays on form)');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      let regStatus = null;
      page.on('response', async res => {
        if (res.url().includes('register')) regStatus = res.status();
      });
      await goto(page, `${BASE}/sign-up`);
      await page.fill('input#firstName', 'Explorer');
      await page.fill('input#lastName', 'Test');
      const rPhone = '6' + String(Date.now()).slice(-9);
      await page.fill('input#phoneNumber', rPhone);
      const rEmail = `exp_${Date.now()}@tichi.com`;
      await page.fill('input#email', rEmail);
      await page.fill('input#password', 'Abcdef12#');
      await page.fill('input#confirmPassword', 'Abcdef12#');
      await page.click('button#remember', { force: true });
      await page.waitForTimeout(500);
      await page.locator('button[type="submit"]').click({ force: true });
      await page.waitForTimeout(6000);
      const urlAfter = page.url();
      const formStillVisible = await page.locator('input#firstName').isVisible().catch(() => false);
      const toastCount = await page.locator('[role="alert"], [data-sonner-toast], .toast').count();
      console.log(`  API status: ${regStatus} | URL: ${urlAfter} | Form visible: ${formStillVisible} | Toasts: ${toastCount}`);
      await shot(page, 'A_signup_success_no_feedback');

      if (regStatus === 201 && formStillVisible && toastCount === 0) {
        log('EXP_BUG_001', 'Signup', 'No user feedback after successful account registration (201 Created)',
          'High',
          'After successful registration, app navigates to an email verification page or shows a success toast/message: "Registration successful! Please check your email."',
          `API returned ${regStatus} Created but the signup form remained visible on /sign-up with no toast notification, no redirect to email verification, and no success message whatsoever`,
          '1. Navigate to https://tichi-app-webapp-stage.web.app/sign-up\n2. Fill all fields with valid unique data\n3. Check the Terms checkbox\n4. Click Sign Up\n5. Observe the page after submission — API returns 201 but UI provides no feedback',
          'Navigate to a dedicated "Check Your Email" verification page OR display a success toast: "Account created! Please verify your email before logging in." This prevents user confusion and duplicate submissions.',
          'Signup / UX / Post-Registration Flow');
      }
    } catch (e) { console.log(`  [A] Error: ${e.message}`); }
    await ctx.close();
  }

  // ─── BUG B: Duplicate account – no UI error shown ───────────────────────────
  console.log('\n>>> TEST B: Duplicate phone/user – silent 400 error');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      let apiStatus = null;
      let apiBody = '';
      page.on('response', async res => {
        if (res.url().includes('register')) {
          apiStatus = res.status();
          try { apiBody = await res.text(); } catch (e) {}
        }
      });
      await goto(page, `${BASE}/sign-up`);
      await page.fill('input#firstName', 'Dup');
      await page.fill('input#lastName', 'User');
      await page.fill('input#phoneNumber', '9876543210'); // already registered
      await page.fill('input#email', `dup_${Date.now()}@tichi.com`);
      await page.fill('input#password', 'Abcdef12#');
      await page.fill('input#confirmPassword', 'Abcdef12#');
      await page.click('button#remember', { force: true });
      await page.waitForTimeout(500);
      await page.locator('button[type="submit"]').click({ force: true });
      await page.waitForTimeout(6000);
      const toastOrError = await page.locator('[role="alert"], [data-sonner-toast], .text-red-500, .toast').count();
      const allTextOnPage = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`  API: ${apiStatus} | Body: ${apiBody} | UI Alerts: ${toastOrError}`);
      console.log(`  Page text snippet: ${allTextOnPage}`);
      await shot(page, 'B_signup_duplicate_silent');

      if (apiStatus === 400 && apiBody.includes('Already Exists') && toastOrError === 0) {
        log('EXP_BUG_002', 'Signup', 'Duplicate account registration error (400) not surfaced to the user',
          'High',
          'An error message appears on the UI: "An account with this phone number or email already exists. Please login instead."',
          `Backend API returned 400 "User Already Exists" (body: ${apiBody.substring(0, 80)}) but the UI showed no error toast, no inline field error, and no redirect — leaving the user with no explanation of why registration failed`,
          '1. Navigate to https://tichi-app-webapp-stage.web.app/sign-up\n2. Fill in a phone number that is already registered (e.g., 9876543210)\n3. Use a unique email address\n4. Fill password, check Terms checkbox, click Sign Up\n5. Observe: page shows no error even though the API returns 400 User Already Exists',
          'Listen for a 400 response from the register API. If the error message contains "User Already Exists", display an inline error or toast: "This phone number is already associated with an account. Please login."',
          'Signup / Error Handling / UX');
      }
    } catch (e) { console.log(`  [B] Error: ${e.message}`); }
    await ctx.close();
  }

  // ─── BUG C: Phone number accepts non-numeric/short inputs ───────────────────
  console.log('\n>>> TEST C: Phone number field input validation');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await goto(page, `${BASE}/sign-up`);

      // Test 1: Alphabetic input
      await page.fill('input#phoneNumber', 'ABCDEFGHIJ');
      await page.waitForTimeout(500);
      const alphaVal = await page.inputValue('input#phoneNumber');
      console.log(`  [Phone Alpha] Entered: 'ABCDEFGHIJ', Got: '${alphaVal}'`);

      // Test 2: Too short (5 digits)
      await page.fill('input#phoneNumber', '12345');
      await page.fill('input#firstName', 'Short');
      await page.fill('input#lastName', 'Phone');
      await page.fill('input#email', `short_phone_${Date.now()}@tichi.com`);
      await page.fill('input#password', 'Abcdef12#');
      await page.fill('input#confirmPassword', 'Abcdef12#');
      await page.click('button#remember', { force: true });
      await page.waitForTimeout(500);
      const btn = page.locator('button[type="submit"]');
      const btnEnabled = await btn.isEnabled();
      let apiStatus = null;
      page.on('response', async res => {
        if (res.url().includes('register')) apiStatus = res.status();
      });
      if (btnEnabled) {
        await btn.click({ force: true });
        await page.waitForTimeout(5000);
      }
      console.log(`  [Short Phone] Btn enabled: ${btnEnabled} | API: ${apiStatus} | URL: ${page.url()}`);
      await shot(page, 'C_phone_validation');

      if (alphaVal.match(/[A-Za-z]/)) {
        log('EXP_BUG_003', 'Signup', 'Phone number field accepts alphabetic characters without client-side validation',
          'Medium',
          'Phone number field only accepts numeric digits (0-9); alphabetic characters are either rejected on keypress or trigger an inline validation error',
          `Phone number input accepted alphabetic characters: typed "ABCDEFGHIJ", stored value was "${alphaVal}". No validation error is shown.`,
          '1. Navigate to https://tichi-app-webapp-stage.web.app/sign-up\n2. Click the Phone Number input field\n3. Type letters: "ABCDEFGHIJ"\n4. Observe the input retains the alphabetic characters with no error message',
          'Add type="tel" attribute and a pattern="[0-9]{10}" constraint to the phone input. Implement an onKeyPress handler that allows only numeric digits. Show an inline error: "Please enter a valid 10-digit phone number."',
          'Signup / Input Validation');
      }

      if (btnEnabled && apiStatus && apiStatus < 400) {
        log('EXP_BUG_PHONE_SHORT', 'Signup', 'Short phone number (5 digits) accepted by form and API',
          'Medium',
          'A minimum phone number length of 10 digits is enforced with an inline error',
          `5-digit phone number "12345" was accepted, form submitted, and API returned status ${apiStatus}`,
          '1. Go to /sign-up\n2. Enter "12345" as phone\n3. Fill all other fields validly\n4. Click Sign Up',
          'Add minimum length validation (minlength="10") to the phone number input',
          'Signup / Input Validation');
      }
    } catch (e) { console.log(`  [C] Error: ${e.message}`); }
    await ctx.close();
  }

  // ─── BUG D: Password mismatch – no real-time inline error ───────────────────
  console.log('\n>>> TEST D: Password mismatch real-time validation');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await goto(page, `${BASE}/sign-up`);
      await page.fill('input#password', 'Abcdef12#');
      await page.fill('input#confirmPassword', 'Xyzabc99!');
      // Blur the confirm field
      await page.click('input#firstName');
      await page.waitForTimeout(1000);
      const mismatchError = await page.locator(':text("do not match"), :text("mismatch"), :text("passwords must match")').count();
      const btnEnabled = await page.locator('button[type="submit"]').isEnabled();
      console.log(`  [Mismatch] Inline error visible: ${mismatchError > 0} | Submit enabled: ${btnEnabled}`);
      await shot(page, 'D_password_mismatch');

      if (mismatchError === 0) {
        log('EXP_BUG_004', 'Signup', 'No real-time inline error when Confirm Password does not match Password',
          'Medium',
          '"Passwords do not match" error message appears below the Confirm Password field as soon as the user finishes typing or blurs the field',
          'After typing mismatched passwords and blurring the Confirm Password field, no inline validation error appears. The user gets no real-time feedback about the mismatch.',
          '1. Navigate to https://tichi-app-webapp-stage.web.app/sign-up\n2. Enter "Abcdef12#" in the Password field\n3. Enter "Xyzabc99!" in the Confirm Password field\n4. Click on any other field (blur the Confirm Password)\n5. Observe: no error appears under Confirm Password',
          'Add an onBlur and onChange handler to the Confirm Password field that compares it with the Password field. If they do not match, display an inline error: "Passwords do not match." Also disable the Submit button until they match.',
          'Signup / Validation / UX');
      }
    } catch (e) { console.log(`  [D] Error: ${e.message}`); }
    await ctx.close();
  }

  // ─── BUG E: Email verification error not shown on login ─────────────────────
  console.log('\n>>> TEST E: Login with unverified registered account');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      // Use one of the accounts we registered (email not verified)
      const testEmail = 'test_qa_strong_1783012922726_879@tichi.com';
      let loginStatus = null;
      let loginBody = '';
      page.on('response', async res => {
        if (res.url().includes('/auth/login')) {
          loginStatus = res.status();
          try { loginBody = await res.text(); } catch (e) {}
        }
      });
      await goto(page, `${BASE}/login`);
      await page.fill('input#email', testEmail);
      
      // Click Continue - if unregistered it goes to /sign-up, if registered goes to Step 2
      const continueBtn = page.locator('button:has-text("Continue")');
      await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
      await continueBtn.click();
      await page.waitForTimeout(4000);
      const urlAfterContinue = page.url();
      console.log(`  [Unverified Login] URL after Continue: ${urlAfterContinue}`);

      if (urlAfterContinue.includes('/login')) {
        // Account is registered - on password Step 2
        const pwdVisible = await page.locator('input#password').isVisible().catch(() => false);
        console.log(`  Password field visible: ${pwdVisible}`);
        if (pwdVisible) {
          await page.fill('input#password', 'Abcdef12#');
          await page.locator('button:has-text("Login")').click();
          await page.waitForTimeout(5000);
          const urlAfterLogin = page.url();
          const errorToasts = await page.locator('[role="alert"], [data-sonner-toast], .text-red-500').count();
          const allText = await page.evaluate(() => document.body.innerText.substring(0, 500));
          console.log(`  API Login: ${loginStatus} | Body: ${loginBody} | URL: ${urlAfterLogin} | Toast count: ${errorToasts}`);
          console.log(`  Page text: ${allText.substring(0, 200)}`);
          await shot(page, 'E_login_unverified_no_feedback');

          if (loginStatus === 401 && loginBody.includes('not verified') && errorToasts === 0 && urlAfterLogin.includes('/login')) {
            log('EXP_BUG_005', 'Login', 'Login failure due to unverified email displays no error message to the user',
              'High',
              'When login fails with 401 "Email not verified", the UI displays an actionable message: "Your email address has not been verified. Please check your inbox and click the verification link."',
              `API returned 401 Unauthorized with body "${loginBody.substring(0, 80)}" but the login page showed no error message, toast, or inline alert. User remains on /login with no explanation.`,
              '1. Register a new account on https://tichi-app-webapp-stage.web.app/sign-up\n2. Do NOT verify the email\n3. Go to /login\n4. Enter the registered email, click Continue\n5. Enter the correct password, click Login\n6. Observe: page stays at /login with no error message displayed',
              'Display an actionable error message when the API returns 401 "Email not verified". Show: "Email not verified. Please check your inbox for the verification link or request a new one." with a Resend Verification link.',
              'Login / Error Handling / UX / Session');
          }
        }
      }
    } catch (e) { console.log(`  [E] Error: ${e.message}`); }
    await ctx.close();
  }

  // ─── BUG F: Large input overflow in firstName ────────────────────────────────
  console.log('\n>>> TEST F: Input field max-length constraint');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await goto(page, `${BASE}/sign-up`);
      const bigStr = 'A'.repeat(500);
      await page.fill('input#firstName', bigStr);
      const actualLen = (await page.inputValue('input#firstName')).length;
      console.log(`  [Max Length] Typed 500 chars, got ${actualLen} chars`);
      await shot(page, 'F_large_input');

      if (actualLen >= 500) {
        log('EXP_BUG_006', 'Signup', 'Name fields have no maximum character length constraint',
          'Low',
          'Input fields enforce a maximum character limit (e.g. 50 chars for names) with an inline error "Maximum 50 characters allowed"',
          `The First Name field accepted ${actualLen} characters with no maxlength attribute or overflow protection. Excessively long names could cause rendering or database storage issues.`,
          '1. Navigate to https://tichi-app-webapp-stage.web.app/sign-up\n2. Paste a 500+ character string into the First Name field\n3. Observe that all characters are accepted without any validation error',
          'Add maxlength="50" attribute to the First Name, Last Name input fields. Display an inline counter and error if the user exceeds the limit.',
          'Signup / Input Validation');
      }
    } catch (e) { console.log(`  [F] Error: ${e.message}`); }
    await ctx.close();
  }

  // ─── BUG G: Terms checkbox – submit button still enabled without it ──────────
  console.log('\n>>> TEST G: Sign Up button state without Terms checkbox');
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await goto(page, `${BASE}/sign-up`);
      await page.fill('input#firstName', 'NoTerms');
      await page.fill('input#lastName', 'Check');
      const rPhone = '8' + String(Date.now()).slice(-9);
      await page.fill('input#phoneNumber', rPhone);
      await page.fill('input#email', `noterms_${Date.now()}@tichi.com`);
      await page.fill('input#password', 'Abcdef12#');
      await page.fill('input#confirmPassword', 'Abcdef12#');
      // Do NOT click the terms checkbox
      const signUpBtn = page.locator('button[type="submit"]');
      const isEnabled = await signUpBtn.isEnabled();
      console.log(`  [No Terms] Submit button enabled without checkbox: ${isEnabled}`);
      let apiStatus = null;
      if (isEnabled) {
        page.on('response', async res => {
          if (res.url().includes('register')) apiStatus = res.status();
        });
        await signUpBtn.click({ force: true });
        await page.waitForTimeout(5000);
      }
      console.log(`  [No Terms] API called: ${apiStatus !== null}, Status: ${apiStatus}`);
      await shot(page, 'G_no_terms_submit');

      if (isEnabled && apiStatus !== null) {
        log('EXP_BUG_007', 'Signup', 'Sign Up button enabled and form submits without accepting Terms & Conditions',
          'High',
          'The Sign Up button remains disabled until the Terms & Conditions checkbox is ticked. Clicking it without the checkbox shows a validation error: "You must accept the Terms and Conditions to proceed."',
          `Sign Up button was enabled (isEnabled: ${isEnabled}) without the Terms checkbox being checked. Clicking the button triggered an API call (status: ${apiStatus}), bypassing the mandatory Terms acceptance requirement.`,
          '1. Navigate to https://tichi-app-webapp-stage.web.app/sign-up\n2. Fill all form fields with valid data\n3. Do NOT tick the Terms & Conditions checkbox\n4. Observe that the Sign Up button is clickable\n5. Click Sign Up — the form submits to the backend without Terms acceptance',
          'Keep the Sign Up button disabled until the Terms checkbox is checked. On submit attempt without checkbox, display: "You must accept the Terms and Conditions to proceed." This is a legal and compliance requirement.',
          'Signup / Business Logic / Compliance');
      }
    } catch (e) { console.log(`  [G] Error: ${e.message}`); }
    await ctx.close();
  }

  await browser.close();

  // ─── SUMMARY ─────────────────────────────────────────────────────────────────
  console.log('\n\n============================================================');
  console.log('         EXPLORATORY TEST FINDINGS — FINAL SUMMARY');
  console.log('============================================================');
  console.log(`Confirmed bugs: ${findings.length}`);
  findings.forEach(f => {
    console.log(`  ${f.id} [${f.severity}] ${f.title}`);
    console.log(`    Area: ${f.area} | Tag: ${f.tag}`);
  });

  fs.writeFileSync(
    path.join(SHOTS, 'findings.json'),
    JSON.stringify(findings, null, 2)
  );
  console.log('\n[Saved] findings.json');
})().catch(err => {
  console.error('[Fatal]', err.message);
});
