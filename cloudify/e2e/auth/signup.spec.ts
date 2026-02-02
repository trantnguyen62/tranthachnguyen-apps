import { test, expect } from '@playwright/test';

test.describe('Signup Page - Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
  });

  // Basic rendering tests
  test('21. renders signup form with all required elements', async ({ page }) => {
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByText('Continue with GitHub')).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('22. displays feature benefits list', async ({ page }) => {
    await expect(page.getByText('Unlimited deployments')).toBeVisible();
    await expect(page.getByText('Preview environments')).toBeVisible();
    await expect(page.getByText('Edge network included')).toBeVisible();
    await expect(page.getByText('$100 in free credits')).toBeVisible();
  });

  // Form validation tests
  test('23. name field is required', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toHaveAttribute('required', '');
  });

  test('24. email field is required', async ({ page }) => {
    await page.fill('input#name', 'Test User');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('25. password field is required', async ({ page }) => {
    await page.fill('input#name', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('26. shows password minimum length hint', async ({ page }) => {
    await expect(page.getByText('Must be at least 8 characters')).toBeVisible();
  });

  test('27. password has minLength attribute', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('minLength', '8');
  });

  test('28. rejects password shorter than 8 characters', async ({ page }) => {
    await page.fill('input#name', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'short');
    await page.click('button[type="submit"]');

    // Browser should show validation error
    const passwordInput = page.getByLabel('Password');
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  // Input handling tests
  test('29. accepts valid name with spaces', async ({ page }) => {
    const nameInput = page.getByLabel('Name');
    await nameInput.fill('John Doe Smith');
    await expect(nameInput).toHaveValue('John Doe Smith');
  });

  test('30. accepts valid email format', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await emailInput.fill('user@subdomain.example.com');
    await expect(emailInput).toHaveValue('user@subdomain.example.com');
  });

  // Navigation tests
  test('31. sign in link navigates to login page', async ({ page }) => {
    await page.click('text=Sign in');
    await expect(page).toHaveURL('/login');
  });

  test('32. logo links back to homepage', async ({ page }) => {
    await page.click('a:has-text("Cloudify")');
    await expect(page).toHaveURL('/');
  });

  test('33. terms link is present', async ({ page }) => {
    const termsLink = page.getByRole('link', { name: 'Terms of Service' });
    await expect(termsLink).toBeVisible();
  });

  test('34. privacy link is present', async ({ page }) => {
    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await expect(privacyLink).toBeVisible();
  });

  // Edge cases
  test('35. handles Unicode characters in name', async ({ page }) => {
    const unicodeName = '测试用户 José García';
    await page.fill('input#name', unicodeName);
    const nameInput = page.getByLabel('Name');
    await expect(nameInput).toHaveValue(unicodeName);
  });
});
