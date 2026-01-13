import { test, expect } from '@playwright/test';

test.describe('RFQs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rfqs');
  });

  test('should display RFQs list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Request');
  });

  test('should have create RFQ button', async ({ page }) => {
    await expect(page.locator('text=Create RFQ').or(page.locator('text=New RFQ'))).toBeVisible();
  });

  test('should display RFQ stats', async ({ page }) => {
    // Check for stats
    await expect(page.locator('text=Open').or(page.locator('text=Active'))).toBeVisible();
  });

  test('should navigate to RFQ detail', async ({ page }) => {
    const rfqLink = page.locator('[href^="/rfqs/"]').first();
    await rfqLink.click();

    await expect(page.url()).toContain('/rfqs/');
  });
});

test.describe('RFQ Detail', () => {
  test('should display RFQ information', async ({ page }) => {
    await page.goto('/rfqs/1');

    await expect(page.locator('text=Back to RFQs')).toBeVisible();
  });

  test('should show quotes section', async ({ page }) => {
    await page.goto('/rfqs/1');

    await expect(page.locator('text=Quotes')).toBeVisible();
  });

  test('should show requirements section', async ({ page }) => {
    await page.goto('/rfqs/1');

    await expect(page.locator('text=Requirements')).toBeVisible();
  });

  test('should show invited vendors', async ({ page }) => {
    await page.goto('/rfqs/1');

    await expect(page.locator('text=Invited Vendors')).toBeVisible();
  });

  test('should have accept quote functionality', async ({ page }) => {
    await page.goto('/rfqs/1');

    await expect(page.locator('text=Accept Quote')).toBeVisible();
  });
});

test.describe('RFQ Edit', () => {
  test('should display edit form', async ({ page }) => {
    await page.goto('/rfqs/1/edit');

    await expect(page.locator('h1')).toContainText('Edit RFQ');
  });

  test('should have vendor selection', async ({ page }) => {
    await page.goto('/rfqs/1/edit');

    await expect(page.locator('text=Invited Vendors')).toBeVisible();
  });

  test('should have deadline field', async ({ page }) => {
    await page.goto('/rfqs/1/edit');

    await expect(page.locator('text=Deadline')).toBeVisible();
  });

  test('should allow adding vendors', async ({ page }) => {
    await page.goto('/rfqs/1/edit');

    // Check for add vendor functionality
    await expect(page.locator('select').or(page.locator('text=Select vendor'))).toBeVisible();
  });

  test('should have close RFQ option', async ({ page }) => {
    await page.goto('/rfqs/1/edit');

    await expect(page.locator('text=Close RFQ')).toBeVisible();
  });
});
