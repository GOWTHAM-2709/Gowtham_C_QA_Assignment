# Audited Defect Verification Report (Updated)

**Prepared By:** Senior QA Lead  
**Candidate Audited:** Gowtham C (QA Intern)  
**Date of Audit:** July 02, 2026  
**Environment:** Stage (`https://tichi-app-webapp-stage.web.app`)  
**OS:** Windows 11  
**Browsers Checked:** Google Chrome, Mozilla Firefox, Apple Safari (WebKit)  

---

## Executive Summary

As part of the final release gate review for the Tichi Web Application (Stage), we audited the three defects submitted in the candidate's initial report. Our validation was conducted using browser diagnostics, automated API request interception, and Playwright verification scripts.

Two out of the three reported defects are **not reproducible** under stage testing and are classified as **False Positives**. One defect represents a standard **Architectural Risk** associated with stateless token management rather than a functional logic defect.

| Bug ID | Title | Reported Severity | Audited Status | Core Finding & Log Proof |
|:---|:---|:---:|:---:|:---|
| **BUG_001** | Login accepts invalid email format (`gowtham@tichi`) | Medium | ❌ **False Positive** | Form submission is blocked client-side; UI displays `"Please enter a valid email"` validation message. |
| **BUG_002** | Signup allows registration with weak passwords | High | ❌ **False Positive** | Sub-8-character passwords are blocked client-side. Alphanumeric passwords lacking complexity (e.g. `abcdef12`) are rejected by the backend API with a `400 Bad Request`. |
| **BUG_003** | Login session token is not destroyed on logout | High | ⚠️ **Needs Clarification (Architectural Risk)** | Standard stateless JWT design. Local token removal successfully logs the user out from the client. Token invalidation backend-side requires a server-side state repository (e.g., Redis). |

---

## Detailed Bug Audit & Verification Logs

### BUG_001: Login functionality accepts invalid email format (`gowtham@tichi`)
*   **Reported Behavior:** The candidate reported that the login form accepts malformed emails without top-level domain suffixes (e.g., `gowtham@tichi`) and forwards processing to the backend.
*   **Verification Status:** ❌ **False Positive / Not Reproducible**
*   **Detailed Diagnostics:**
    *   During testing on `/login`, inputting `gowtham@tichi` in the email container and clicking the "Continue" button immediately triggers a client-side block.
    *   The border of the input field turns red, and an inline validation paragraph element `p.text-sm.text-red-500` displays: `"Please enter a valid email"`.
    *   No network request is generated to the authentication server, proving that form submission is prevented at the browser level.
*   **Lead Verdict:** The form contains active custom regex-like validation that safely blocks submission of malformed emails. The defect is rejected.

---

### BUG_002: Sign up form allows registration without enforcing password complexity rules
*   **Reported Behavior:** The candidate reported that a profile could be registered using weak, numeric-only keys (such as `12345`).
*   **Verification Status:** ❌ **False Positive / Not Reproducible**
*   **Detailed Diagnostics:**
    1.  **Length Check (UI Block):** Inputting `12345` displays an inline warning `"Password must be at least 8 characters long"` and blocks form submission.
    2.  **Complexity Check (API Block):** When inputting an 8-character, weak alphanumeric password (such as `abcdef12` or `12345678`), the frontend allows clicking the "Sign Up" button. However, the backend API (`https://o0guf45zb8.execute-api.ap-south-1.amazonaws.com/qa/auth/register`) intercepts the request and blocks registration.
    3.  **HTTP Response Log (Weak Password):**
        *   **Request URL:** `/qa/auth/register`
        *   **HTTP Status:** `400 Bad Request`
        *   **Response Body:** `{"message":["Password must be alphanumeric"],"error":"Bad Request","statusCode":400}`
        *   *Note:* The backend error message is confusing (it uses the term "alphanumeric" to represent a complex password requiring uppercase, lowercase, numbers, and special characters), but it successfully blocks the registration.
    4.  **HTTP Response Log (Strong Password - `Abcdef12#`):**
        *   **Request URL:** `/qa/auth/register`
        *   **HTTP Status:** `201 Created`
        *   **Response Body:** `{"data":{"_id":"6a469e3c04bd20057bb36637","firstName":"Test","lastName":"QA","email":"test_qa_strong_xxx@tichi.com","phoneNumber":"9540079995",...},"statusCode":201}`
*   **Lead Verdict:** The system successfully prevents weak password registration both via frontend validation (length) and backend API validation (complexity rules). The defect is rejected.

---

### BUG_003: Login session token is not destroyed or invalidated upon explicit UI logout action
*   **Reported Behavior:** Wiping the token locally deletes local storage variables but replaying the token via API still retrieves profile metrics.
*   **Verification Status:** ⚠️ **Needs Clarification (Architectural Risk)**
*   **Detailed Diagnostics:**
    *   Tichi's architecture utilizes JSON Web Tokens (JWT) for authentication.
    *   Upon explicit UI logout, the application correctly executes `localStorage.clear()` (or similar method) to delete the client-side session.
    *   Because JWT is stateless, the token remains cryptographically valid until its expiration timestamp is reached.
*   **Lead Verdict:** This behavior is an architectural consequence of stateless JWT authentication rather than a coding bug. In a stateless system, logouts are client-side only. To address this risk, we recommend implementing a Redis-based blocklist on the backend to blacklist tokens upon logout, or reducing the JWT expiration time (TTL) to 15 minutes with refresh tokens. The defect is reclassified from a "functional bug" to an "architectural security recommendation".

---

## QA Lead Recommendations for Candidate
1.  **Increase Diagnostic Depth:** When documenting bugs, candidates should inspect the DevTools Network tab to confirm if a submission actually reached the server or was handled correctly by the API.
2.  **Verify Length and Complexity Separately:** Ensure you verify boundary constraints (like length limits) separately from password complexity rules.
3.  **Understand JWT Limitations:** Distinguish between code bugs (e.g., local storage not being cleared) and stateless architectural trade-offs (e.g., token still valid until expiry).
