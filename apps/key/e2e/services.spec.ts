import { test, expect } from '@playwright/test';

test.describe('Services', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('should display services list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Services');
  });

  test('should show service stats', async ({ page }) => {
    // Check for stats cards
    await expect(page.locator('text=Total Services').or(page.locator('text=Active'))).toBeVisible();
  });

  test('should have filter tabs', async ({ page }) => {
    // Check for status filter tabs
    const tabs = page.locator('button, [role="tab"]');
    await expect(tabs.first()).toBeVisible();
  });

  test('should navigate to service detail', async ({ page }) => {
    const serviceLink = page.locator('[href^="/services/"]').first();
    await serviceLink.click();

    await expect(page.url()).toContain('/services/');
  });
});

test.describe('Service Detail', () => {
  test('should display service information', async ({ page }) => {
    await page.goto('/services/1');

    await expect(page.locator('text=Back to Services')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show service details section', async ({ page }) => {
    await page.goto('/services/1');

    await expect(page.locator('text=Service Details')).toBeVisible();
  });

  test('should show activity timeline', async ({ page }) => {
    await page.goto('/services/1');

    await expect(page.locator('text=Activity Timeline')).toBeVisible();
  });

  test('should show port call information', async ({ page }) => {
    await page.goto('/services/1');

    await expect(page.locator('text=Port Call')).toBeVisible();
  });

  test('should show vendor information', async ({ page }) => {
    await page.goto('/services/1');

    await expect(page.locator('text=Vendor')).toBeVisible();
  });
});

test.describe('Service Edit', () => {
  test('should display edit form', async ({ page }) => {
    await page.goto('/services/1/edit');

    await expect(page.locator('h1')).toContainText('Edit Service');
  });

  test('should have service type dropdown', async ({ page }) => {
    await page.goto('/services/1/edit');

    await expect(page.locator('select[name="type"]')).toBeVisible();
  });

  test('should have vendor selection', async ({ page }) => {
    await page.goto('/services/1/edit');

    await expect(page.locator('text=Vendor')).toBeVisible();
  });

  test('should have pricing fields', async ({ page }) => {
    await page.goto('/services/1/edit');

    await expect(page.locator('text=Pricing').or(page.locator('text=Total Price'))).toBeVisible();
  });
});
