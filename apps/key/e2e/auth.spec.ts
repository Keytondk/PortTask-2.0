import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Forgot password?');

    await expect(page).toHaveURL('/forgot-password');
    await expect(page.locator('h1')).toContainText('Forgot your password?');
  });

  test('should display forgot password page correctly', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('h1')).toContainText('Forgot your password?');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Send reset instructions');
  });

  test('should show success message after forgot password submission', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Check your email')).toBeVisible({ timeout: 5000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.click('button:has(svg)');
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.click('button:has(svg)');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
