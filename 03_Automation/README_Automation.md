# Playwright TypeScript Test Automation Suite

This directory contains the automated end-to-end test suite for the **Tichi Web Application**, developed using Playwright, TypeScript, and the Page Object Model (POM) architecture.

## Folder Structure

```text
03_Automation/
├── pages/
│   ├── BasePage.ts         # Common page object utilities & actions
│   └── LoginPage.ts        # POM representation of Tichi sign-in elements and actions
├── tests/
│   └── login.spec.ts       # Automated test suite executing core login scenarios
├── playwright.config.ts    # Config settings for tests, browsers, outputs & report paths
└── package.json            # Dependencies, scripts, and runtime commands
```

## Setup & Prerequisites

### 1. Requirements
Ensure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **NPM** (packaged with Node.js)

### 2. Installation
Navigate to this directory in your terminal and install the dependencies:
```bash
cd 03_Automation
npm install
```

### 3. Install Playwright Browsers
Download the required browser binaries:
```bash
npx playwright install --with-deps
```

---

## Running Tests

You can execute the automated test scenarios using the scripts provided in `package.json`:

### Run all tests in headless mode
Executes tests on Chromium, Firefox, and WebKit in the background.
```bash
npm run test
```

### Run tests in headed mode (visible browsers)
Opens browser windows during execution to visually inspect test interactions.
```bash
npm run test:headed
```

### Run tests in Playwright Interactive UI Mode
Opens a rich, interactive test runner interface allowing debugging, step-by-step playback, and DOM inspections.
```bash
npm run test:ui
```

### Run tests in debug mode
Steps through tests interactively with the Playwright Inspector.
```bash
npm run test:debug
```

---

## Test Results and Reports

### 1. HTML Execution Report
When tests finish, a complete HTML test execution report is automatically compiled.
- Output Location: [04_ExecutionReport/](file:///d:/Gowtham_C_QA_Assignment/04_ExecutionReport/) (relative directory: `../04_ExecutionReport`).
- View the report in your browser by opening `index.html` inside that directory, or run the following command to serve it locally:
  ```bash
  npm run show-report
  ```

### 2. Failure Screenshots & Traces
If a test scenario fails:
- A screenshot is captured at the precise moment of failure.
- A recording of the execution timeline and network trace is compiled.
- These artifacts are stored in [05_Screenshots/](file:///d:/Gowtham_C_QA_Assignment/05_Screenshots/) (relative directory: `../05_Screenshots`).
