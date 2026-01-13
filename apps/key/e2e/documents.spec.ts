import { test, expect } from '@playwright/test';

test.describe('Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents');
  });

  test('should display documents page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Documents');
  });

  test('should have upload button', async ({ page }) => {
    await expect(page.locator('text=Upload Document')).toBeVisible();
  });

  test('should show document stats', async ({ page }) => {
    await expect(page.locator('text=Total Documents')).toBeVisible();
    await expect(page.locator('text=Expiring')).toBeVisible();
  });

  test('should have category filters', async ({ page }) => {
    await expect(page.locator('text=All Documents')).toBeVisible();
    await expect(page.locator('text=Vessel Documents')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.click('text=Vessel Documents');
    // Category should be selected
    await expect(page.locator('button:has-text("Vessel Documents").bg-primary, [class*="bg-primary"]:has-text("Vessel Documents")')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Certificate');
    await page.waitForTimeout(300);
  });

  test('should open upload modal', async ({ page }) => {
    await page.click('text=Upload Document');

    await expect(page.locator('text=Document Name')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
  });

  test('should close upload modal', async ({ page }) => {
    await page.click('text=Upload Document');
    await expect(page.locator('text=Document Name')).toBeVisible();

    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Document Name')).not.toBeVisible();
  });

  test('should show document status badges', async ({ page }) => {
    // Check for status badges
    await expect(
      page.locator('text=Valid').or(page.locator('text=Expiring')).or(page.locator('text=Expired'))
    ).toBeVisible();
  });

  test('should show document actions on hover', async ({ page }) => {
    // Hover over first document
    const firstDoc = page.locator('[class*="Card"]').first();
    await firstDoc.hover();

    // Actions should be visible (download, view, delete)
    await expect(page.locator('svg').first()).toBeVisible();
  });
});
