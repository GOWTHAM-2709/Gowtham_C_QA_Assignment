# Defect Report — Final
## Tichi Web Application | Exploratory Testing

---

| Field | Value |
|---|---|
| **Application** | Tichi Web Application |
| **URL** | https://tichi-app-webapp-stage.web.app |
| **Environment** | Stage |
| **Browser** | Google Chrome (Playwright Chromium) |
| **OS** | Windows 11 |
| **Tester** | Gowtham C (QA Intern) |
| **Testing Type** | Exploratory Testing |
| **Date** | 2 July 2026 |
| **Report Version** | Final v1.0 |

---

## Summary

| Total Defects | Critical | High | Medium | Low |
|---|---|---|---|---|
| **4** | 0 | 1 | 2 | 1 |

---

## Bug Classification Legend

| Status | Meaning |
|---|---|
| **Confirmed** | Reproducible; supported by screenshots, API response logs |
| **Not Reproducible** | Could not reproduce in repeated attempts |
| **False Positive** | Initial analysis was incorrect; behavior is by design |

---

## BUG_001 — Duplicate Account Registration Fails Silently: No UI Error Shown to User

| Field | Value |
|---|---|
| **Bug ID** | BUG_001 |
| **Module** | Signup |
| **Severity** | High |
| **Priority** | High |
| **Status** | Confirmed |
| **Environment** | Stage |
| **Browser** | Chrome |
| **Reported Date** | 2 July 2026 |

### Description
When a user attempts to register with a phone number that is already associated with an existing account, the backend API returns HTTP `400 Bad Request` with the message `"User Already Exists"`. However, the Signup UI does not surface this error to the user — no toast notification, no inline field error, and no redirect occurs. The form remains in its filled state with no indication of why registration failed.

### Steps to Reproduce
1. Navigate to `https://tichi-app-webapp-stage.web.app/sign-up`
2. Fill in all fields with valid data
3. For the **Mobile Number** field, enter a phone number already associated with an account (e.g., `9876543210` with `+91` prefix)
4. Use a unique, unregistered email address
5. Fill in a valid password and confirm password (e.g., `Abcdef12#`)
6. Check the **Terms and Conditions** checkbox
7. Click **Sign Up**

### Expected Result
A clear user-facing error message is displayed:
> *"An account with this phone number already exists. Please log in or use a different number."*

### Actual Result
The API returns `400 Bad Request`:
```json
{"message":"User Already Exists","error":"Bad Request","statusCode":400}
```
The UI shows no error. The signup form remains unchanged with all filled values. The user receives no feedback and has no way to understand why the registration failed.

### API Evidence
```
POST /api/auth/register
Response: 400 Bad Request
Body: {"message":"User Already Exists","error":"Bad Request","statusCode":400}
```

### Impact
Users attempting to register with an existing phone number will be left confused with no actionable error. They may attempt to re-submit multiple times, creating a frustrating user experience. New users cannot distinguish between a network error and a duplicate account error.

### Recommendation
Intercept the `400 "User Already Exists"` API response and display an actionable error:
- Show a toast notification: *"A Tichi account already exists with this phone number. Please login instead."*
- Optionally, highlight the Mobile Number field with a red border and inline message.
- Add a clickable link redirecting to the login page.

---

## BUG_002 — Password Mismatch Validation Uses Grammatically Incorrect Error Message

| Field | Value |
|---|---|
| **Bug ID** | BUG_002 |
| **Module** | Signup |
| **Severity** | Medium |
| **Priority** | Medium |
| **Status** | Confirmed |
| **Environment** | Stage |
| **Browser** | Chrome |
| **Reported Date** | 2 July 2026 |

### Description
When a user enters mismatched values in the **Password** and **Confirm Password** fields on the Signup page and moves to another field or submits the form, a browser-native validation tooltip appears displaying:

> *"Confirm password must be match with password"*

This message contains incorrect English grammar (`"must be match with"` instead of `"must match"`). Additionally, the validation is surfaced as a transient browser-level tooltip (via `setCustomValidity()`) rather than a persistent, visually styled inline error message below the Confirm Password field — which is the industry-standard UX pattern.

### Steps to Reproduce
1. Navigate to `https://tichi-app-webapp-stage.web.app/sign-up`
2. In the **Password** field enter: `Abcdef12#`
3. In the **Confirm Password** field enter a different value: `Xyzabc99!`
4. Click on any other field (e.g., First Name) to trigger the blur event
5. Observe the validation tooltip that appears near the Confirm Password field

### Expected Result
- A persistent, styled inline error appears **immediately below** the Confirm Password field:
  > *"Passwords do not match"*
- The error text must be grammatically correct.
- The error should appear in real-time on blur.

### Actual Result
- A browser-native popup tooltip appears: **"Confirm password must be match with password"**
- The grammar is incorrect (`"must be match"` is not valid English)
- The tooltip is transient — it disappears when the user interacts with any element
- The Submit button remains enabled despite the mismatch

### Screenshot Evidence
Screenshot: `05_Screenshots/exploratory/D_password_mismatch.png`

### Impact
- Users who type mismatched passwords without reading the transient tooltip will not be aware of the error.
- The grammatically incorrect message reduces product quality perception.
- Non-native English speakers will find the error message confusing.

### Recommendation
1. Replace the `setCustomValidity()` approach with a React-state-based inline error below the Confirm Password field.
2. Implement real-time `onChange` comparison: display `"Passwords do not match"` immediately when values differ.
3. Disable the Sign Up button until the passwords match.
4. Correct the error text to: **"Passwords do not match"**

---

## BUG_003 — No "Resend Verification Email" Option After Login Fails with "Email not verified"

| Field | Value |
|---|---|
| **Bug ID** | BUG_003 |
| **Module** | Login / Session / Post-Signup Flow |
| **Severity** | Medium |
| **Priority** | High |
| **Status** | Confirmed |
| **Environment** | Stage |
| **Browser** | Chrome |
| **Reported Date** | 2 July 2026 |

### Description
After a user creates an account, they must verify their email before logging in. When the user attempts to login with valid credentials before verifying their email, the application correctly shows the error:

> *"Email not verified"*

However, the login page provides **no mechanism to resend the verification email**. There is no "Resend Verification Email" button, link, or any actionable next-step guidance. The user is left with an error message and no path forward.

### Steps to Reproduce
1. Register a new account at `https://tichi-app-webapp-stage.web.app/sign-up` (unique email and phone)
2. Do **not** click the verification link in the registration email
3. Navigate to `https://tichi-app-webapp-stage.web.app/login`
4. Enter the registered email address and click **Continue**
5. Enter the correct password on Step 2 and click **Login**
6. Observe the error and the absence of a resend option

### Expected Result
Upon receiving the `401 "Email not verified"` response, the application displays:
> *"Your email address has not been verified. Please check your inbox for the verification link."*
>
> **[Resend Verification Email]** ← clickable button

### Actual Result
The error message **"Email not verified"** is displayed in red above the email field on login Step 2. However:
- No resend link or button is visible
- No redirect to a verification page occurs
- No instructions on what the user should do next
- The user has no self-service recovery path from the login page

### Screenshot Evidence
Screenshot: `05_Screenshots/exploratory/E_login_unverified_no_feedback.png`

### API Evidence
```
POST /api/auth/login
Response: 401 Unauthorized
Body: {"message":"Email not verified","error":"Unauthorized","statusCode":401}
```

### Impact
Users who miss or delete the verification email have no self-service recovery path. They must contact support to verify their account, creating unnecessary friction and support overhead.

### Recommendation
1. When the `401 "Email not verified"` response is received, display a **"Resend Verification Email"** button below the error message.
2. Implement a `POST /api/auth/resend-verification` endpoint and wire it to the button.
3. Show a success toast: *"Verification email sent! Please check your inbox."*
4. Consider redirecting to a dedicated "Verify Your Email" page immediately after successful signup.

---

## BUG_004 — Signup: Name Input Fields Have No Maximum Character Length Constraint

| Field | Value |
|---|---|
| **Bug ID** | BUG_004 |
| **Module** | Signup / Input Validation |
| **Severity** | Low |
| **Priority** | Low |
| **Status** | Confirmed |
| **Environment** | Stage |
| **Browser** | Chrome |
| **Reported Date** | 2 July 2026 |

### Description
The **First Name** and **Last Name** input fields on the Signup page do not enforce any maximum character length constraint. A user can type or paste an arbitrarily long string (tested up to 500+ characters) without any validation error, warning, or character counter. No `maxlength` attribute exists on these fields.

### Steps to Reproduce
1. Navigate to `https://tichi-app-webapp-stage.web.app/sign-up`
2. Click on the **First Name** input field
3. Paste a string of 500+ characters (e.g., 500 × the letter 'A')
4. Observe that all characters are accepted without any validation error

### Expected Result
- The First Name field enforces a maximum of 50 characters
- An inline error appears if exceeded: *"Maximum 50 characters allowed"*
- The `maxlength="50"` HTML attribute prevents typing beyond the limit

### Actual Result
- All 500 characters are accepted and stored in the field
- The text visually overflows the input field
- No error message or character counter is shown
- The field has no `maxlength` attribute

### Screenshot Evidence
Screenshot: `05_Screenshots/exploratory/F_large_input.png`

### Impact
- **Database**: Backend may encounter column-length overflow errors in the schema.
- **UI Rendering**: Extremely long names could break profile page layouts and email templates.
- **Security**: Long inputs may be used for denial-of-service or buffer overflow probing.

### Recommendation
1. Add `maxlength="50"` to the First Name and Last Name `<input>` elements.
2. Display a character counter below the field (e.g., `"0/50"` updating in real-time).
3. Show an inline error when the limit is reached: *"Name cannot exceed 50 characters."*
4. Validate the length on the backend as a defense-in-depth measure.

---

## Previously Audited Bugs (Reclassified)

The following bugs from the original `Defect_Report.docx` were audited and reclassified:

| Original Bug ID | Original Title | Reclassified Status | Reason |
|---|---|---|---|
| BUG_001 | Login accepts invalid email format | **False Positive** | Login form validates email format correctly. Invalid format (e.g., `gowtham@tichi,com`) is caught by HTML5 validation. Custom error *"Please enter a valid email address."* shown on Step 1. |
| BUG_002 | Signup accepts weak passwords | **False Positive** | Signup enforces 8-char minimum with alphanumeric requirement. Weak passwords (e.g., `abcdef12`) rejected by API with `400 "Password must be alphanumeric"`. |
| BUG_003 | Logout does not invalidate session token | **Architectural Risk (Not a Code Defect)** | App uses stateless JWT tokens. Token expiry is configured at issuance (TTL). Client-side logout clears the stored token. This is by architectural design; risk is mitigated through short token TTLs. |

---

## Defect Traceability Matrix

| Bug ID | Test Case(s) | Module | Severity | Confirmed? | Screenshot |
|---|---|---|---|---|---|
| BUG_001 | TC_SGN_019 (Duplicate Phone) | Signup | High | Yes | `B_signup_duplicate_silent.png` |
| BUG_002 | TC_SGN_006, TC_SGN_007 | Signup | Medium | Yes | `D_password_mismatch.png` |
| BUG_003 | TC_LGN_010 (Verification) | Login / Session | Medium | Yes | `E_login_unverified_no_feedback.png` |
| BUG_004 | TC_SGN_004 (Input Validation) | Signup | Low | Yes | `F_large_input.png` |

---

## Test Environment Details

| Property | Value |
|---|---|
| Application | Tichi Web Application |
| URL | https://tichi-app-webapp-stage.web.app |
| Environment | Stage |
| Platform | Firebase Hosting + Node.js Backend |
| Auth | JWT (stateless) |
| Testing Tool | Playwright v1.x with Chromium |
| OS | Windows 11 |
| Testing Date | 2 July 2026 |

---

*Prepared by: Gowtham C | QA Intern | Final Submission*
