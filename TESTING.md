# Playwright QA Testing Guide

## Setup

Playwright test framework is configured for end-to-end testing of the Team Tasks app.

- **Config:** `playwright.config.ts`
- **Tests:** `tests/` directory
- **MCP Server:** `.vscode/mcp.json`

## Quick Start

```powershell
# Local dev with auto-starting dev server
pnpm test

# Against production deployment
$env:PLAYWRIGHT_BASE_URL="https://todo.clossyan.com"
$env:PLAYWRIGHT_USER_EMAIL="your-email@example.com"
$env:PLAYWRIGHT_USER_PASSWORD="your-password"
pnpm test

# UI mode (watch, time-travel debug, step viewer)
pnpm test:ui

# Headed mode (see the browser)
pnpm test:headed

# Run specific test file
pnpm test tests/public.spec.ts

# Run specific test by name
pnpm test -- -g "login"
```

## Test Files

### `tests/public.spec.ts` — Public Pages
Tests that don't require authentication:
- Landing page renders "Sign in"
- Login page shows email/password form
- Invalid credentials show error
- Signup page shows name/email/password/confirm fields
- Mismatched passwords show error
- 404 page returns proper status

### `tests/authenticated.spec.ts` — Auth Journeys
Tests requiring a valid user account:
- Home page loads personal tasks after login
- App header visible after login
- Navigate to Teams Board
- Dashboard nav items visible
- Analytics page loads
- Archive page loads
- Features page loads
- Momentum page loads
- Redirect from `/login` when already authenticated

### `tests/onboarding.spec.ts` — Onboarding Tour
Tests the Onborda guided tour:
- Personal tour overlay appears on home page
- Personal tour step navigation (Welcome → Add Task → Task List → Notifications)
- Team tour appears on dashboard
- Team tour step navigation (Dashboard → Board → Analytics → Features → Done)

## Required Environment Variables

| Variable | Used For |
|----------|----------|
| `PLAYWRIGHT_BASE_URL` | App URL (default: `http://localhost:3000`) |
| `PLAYWRIGHT_USER_EMAIL` | Authenticated tests |
| `PLAYWRIGHT_USER_PASSWORD` | Authenticated tests |

## CI Integration

To add to GitHub Actions, add a job after the Docker build:

```yaml
  e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.PLAYWRIGHT_BASE_URL }}
          PLAYWRIGHT_USER_EMAIL: ${{ secrets.PLAYWRIGHT_USER_EMAIL }}
          PLAYWRIGHT_USER_PASSWORD: ${{ secrets.PLAYWRIGHT_USER_PASSWORD }}
```

## Playwright MCP (VS Code)

The MCP server is configured in `.vscode/mcp.json`. With the Playwright extension installed, you can ask Copilot to:
- "Navigate to the app and test the login flow"
- "Check if the onboarding tour renders correctly"
- "Take a screenshot of the dashboard"

The MCP provides `browser_*` tools for navigation, snapshots, clicks, and assertions.
