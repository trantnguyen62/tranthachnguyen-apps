# Cloudify E2E Test Suite

## Overview

This test suite contains **167 E2E tests** that test real user flows with actual data creation and cleanup.

## Test Structure

```
e2e/
├── auth/                    # Authentication tests (50 tests)
│   ├── login.spec.ts        # Login form, validation, OAuth
│   ├── signup.spec.ts       # Signup form, validation
│   └── session.spec.ts      # Protected routes, API auth
├── public/                  # Public pages (20 tests)
│   └── pages.spec.ts        # Home, docs, pricing, 404, responsive
├── security/                # Security tests (15 tests)
│   └── input-validation.spec.ts  # XSS, SQL injection, path traversal
├── edge-cases/              # Edge cases (25 tests)
│   └── stress.spec.ts       # Browser nav, API errors, accessibility
├── user-flows/              # Real user journey tests (57 tests)
│   ├── complete-user-journey.spec.ts  # Full signup → project → logout
│   ├── ui-user-flows.spec.ts          # UI interactions
│   ├── project-management.spec.ts     # Project CRUD + access control
│   └── auth-security.spec.ts          # Auth security tests
└── helpers/
    └── test-utils.ts        # Reusable test utilities
```

## Prerequisites

### 1. Start PostgreSQL Database

The user flow tests require a running PostgreSQL database.

**Option A: Local PostgreSQL**
```bash
# macOS with Homebrew
brew services start postgresql

# Or start manually
pg_ctl -D /usr/local/var/postgres start
```

**Option B: Docker**
```bash
docker run -d \
  --name cloudify-db \
  -e POSTGRES_USER=cloudify \
  -e POSTGRES_PASSWORD=cloudify123 \
  -e POSTGRES_DB=cloudify \
  -p 5432:5432 \
  postgres:15
```

### 2. Run Database Migrations

```bash
npx prisma migrate dev
```

### 3. Update .env

Ensure your `.env` has:
```
DATABASE_URL="postgresql://cloudify:cloudify123@localhost:5432/cloudify"
AUTH_SECRET="your-auth-secret"
```

## Running Tests

### Run All Tests
```bash
npm run e2e
```

### Run Specific Test Suites

```bash
# UI-only tests (no database required)
npm run e2e -- e2e/auth/login.spec.ts
npm run e2e -- e2e/public/

# User flow tests (database required)
npm run e2e -- e2e/user-flows/

# Security tests
npm run e2e -- e2e/security/
```

### Interactive Mode
```bash
npm run e2e:ui
```

### Debug Mode
```bash
npm run e2e:debug
```

## Test Data Management

All user flow tests:
1. **Create unique test data** using timestamps and random strings
2. **Clean up after themselves** in `afterAll` hooks
3. **Are isolated** - each test file creates its own test user

### Test User Format
```
email: test-{timestamp}-{random}@e2e-test.cloudify.app
password: TestPassword123!
name: E2E Test User {timestamp}
```

### Test Project Format
```
name: E2E-Test-Project-{timestamp}-{random}
```

## What These Tests Catch

### ✅ Bugs Found During Development:
1. **Missing SessionProvider** - OAuth buttons not working
2. **Form state clearing** - Email clears during loading
3. **API 500 errors** - Database errors not handled gracefully
4. **Missing API endpoints** - No /api/deployments listing
5. **Access control issues** - Users accessing other users' data

### Test Categories:

| Category | What It Tests |
|----------|---------------|
| Auth Forms | Login/signup rendering, validation, navigation |
| Protected Routes | Dashboard redirects, API 401 responses |
| User Journeys | Complete flows from signup to project deletion |
| Project CRUD | Create, read, update, delete with cleanup |
| Access Control | Users can't access other users' data |
| Security | XSS, SQL injection, path traversal |
| Edge Cases | Long inputs, Unicode, rapid submissions |
| Accessibility | Labels, keyboard nav, headings |

## Debugging Failed Tests

### View Screenshots
Failed tests save screenshots to:
```
test-results/[test-name]/test-failed-1.png
```

### View Traces
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Check Server Logs
While tests run, check the Next.js dev server output for errors.

## CI/CD Integration

For CI environments, ensure:
1. PostgreSQL is available (use GitHub Actions service)
2. Run migrations before tests
3. Set `CI=true` for stricter test behavior

Example GitHub Action:
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: cloudify
      POSTGRES_PASSWORD: cloudify123
      POSTGRES_DB: cloudify
    ports:
      - 5432:5432

steps:
  - run: npx prisma migrate deploy
  - run: npm run e2e
```
