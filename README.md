# Gowtham C — QA Assignment

**Katomaran Hackathon 2026 | QA Engineering Submission**

> **Application Under Test:** [Tichi Web App (Stage)](https://tichi-app-webapp-stage.web.app)
> **Environment:** Stage | **Browser:** Chrome | **OS:** Windows 11

---

## 📁 Repository Structure

```text
Gowtham_C_QA_Assignment/
├── README.md                          ← This file
├── QA_Audit_Report.md                 ← Senior QA Lead audit findings
│
├── 01_TestCases/
│   └── Tichi_TestCases.xlsx           ← 40 test cases (Login + Signup modules)
│
├── 02_DefectReports/
│   └── Defect_Report_Final.docx       ← Final defect report (4 confirmed bugs)
│
├── 03_Automation/                     ← Playwright + TypeScript (POM)
│   ├── pages/
│   │   ├── BasePage.ts                ← Common page actions
│   │   └── LoginPage.ts               ← Login page selectors & flows
│   ├── tests/
│   │   └── login.spec.ts              ← 7 automated scenarios × 3 browsers
│   ├── playwright.config.ts           ← Multi-browser Playwright config
│   ├── package.json                   ← Dependencies & scripts
│   └── README_Automation.md           ← Automation setup & run guide
│
├── 04_ExecutionReport/
│   └── index.html                     ← Playwright HTML execution report
│
└── 05_Screenshots/
    ├── BUG_001_signup_duplicate_silent.png
    ├── BUG_002_password_mismatch.png
    ├── BUG_003_login_unverified_no_feedback.png
    └── BUG_004_large_input_no_maxlength.png
```

---

## 📊 QA Metrics Summary

| Metric | Value |
|---|---|
| **Total Test Cases** | 40 |
| **Modules Covered** | Login, Signup |
| **Automated Scenarios** | 7 test cases × 3 browsers = 21 runs |
| **Automation Pass Rate** | 9 / 9 runnable = **100%** |
| **Skipped (credential-dependent)** | 12 |
| **Confirmed Bugs** | 4 |
| **Blocked Test Cases** | 2 |
| **Not Applicable** | 1 |

---

## 🐛 Confirmed Defects

| Bug ID | Severity | Title | Screenshot |
|---|---|---|---|
| **BUG_001** | 🔴 High | Duplicate account registration fails silently | `05_Screenshots/BUG_001_signup_duplicate_silent.png` |
| **BUG_002** | 🟡 Medium | Password mismatch error uses incorrect grammar | `05_Screenshots/BUG_002_password_mismatch.png` |
| **BUG_003** | 🟡 Medium | No "Resend Verification Email" after login block | `05_Screenshots/BUG_003_login_unverified_no_feedback.png` |
| **BUG_004** | 🟢 Low | Name fields accept unlimited character input | `05_Screenshots/BUG_004_large_input_no_maxlength.png` |

> Full defect details: [`02_DefectReports/Defect_Report_Final.docx`](02_DefectReports/Defect_Report_Final.docx)

---

## ⚙️ Automation Setup

```powershell
# Navigate to automation project
cd 03_Automation

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests (Chromium + Firefox + WebKit)
npx playwright test

# View HTML execution report
npx playwright show-report ../04_ExecutionReport
```

> See [`03_Automation/README_Automation.md`](03_Automation/README_Automation.md) for full documentation.

---

## 📋 Test Case Matrix

| Status | Count | Description |
|---|---|---|
| ✅ Passed | 9 | Verified via automation and direct observation |
| 🐛 Defect Observed | 4 | Bug reproduced and documented |
| 🔑 Credential Dependent | 15 | Requires registered active account |
| ⏭ Skipped | 9 | Pending manual execution with tooling |
| 🚫 Blocked | 2 | Requires environment control or mocking |
| ❌ Not Applicable | 1 | Feature not available in current build |

---

## 🔧 Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Playwright | 1.61.1 | Browser automation framework |
| TypeScript | 5.9.3 | Type-safe test scripting |
| ts-node | 10.9.2 | TypeScript execution |
| Node.js | 24.x | Runtime |
| Chromium / Firefox / WebKit | Latest | Cross-browser testing |

---

## 📄 Deliverables Checklist

- [x] 40 Manual Test Cases (Actual Result + Remarks updated)
- [x] Defect Report (4 confirmed bugs with screenshots and API evidence)
- [x] Playwright Automation Framework (POM + TypeScript)
- [x] Cross-browser Execution Report (HTML)
- [x] Bug Screenshot Evidence (4 images)
- [x] QA Audit Report
- [x] README Documentation

---

*Prepared by: **Gowtham C** | QA Intern | Katomaran Hackathon 2026*
