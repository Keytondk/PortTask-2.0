import { test, expect } from '@playwright/test';

test.describe('Vessels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/vessels');
  });

  test('should display vessels list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Vessels');
  });

  test('should display vessel cards', async ({ page }) => {
    // Check for vessel cards with key information
    await expect(page.locator('[data-testid="vessel-card"]').or(page.locator('.group').first())).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Pacific');
    // Wait for filtering
    await page.waitForTimeout(300);
  });

  test('should navigate to vessel detail page', async ({ page }) => {
    const vesselLink = page.locator('[href^="/vessels/"]').first();
    await vesselLink.click();

    await expect(page.url()).toContain('/vessels/');
  });
});

test.describe('Vessel Detail', () => {
  test('should display vessel information', async ({ page }) => {
    await page.goto('/vessels/1');

    await expect(page.locator('text=Back to Vessels')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show vessel specifications', async ({ page }) => {
    await page.goto('/vessels/1');

    // Check for specification sections
    await expect(page.locator('text=IMO')).toBeVisible();
  });

  test('should have edit functionality', async ({ page }) => {
    await page.goto('/vessels/1');

    await page.click('text=Edit');
    await expect(page).toHaveURL('/vessels/1/edit');
  });
});

test.describe('Vessel Edit', () => {
  test('should display edit form with sections', async ({ page }) => {
    await page.goto('/vessels/1/edit');

    await expect(page.locator('h1')).toContainText('Edit Vessel');
    await expect(page.locator('text=Basic Information')).toBeVisible();
    await expect(page.locator('text=Registration')).toBeVisible();
    await expect(page.locator('text=Dimensions')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/vessels/1/edit');

    // Clear required field
    await page.fill('input[name="name"]', '');
    await page.click('button:has-text("Save Changes")');

    // Form should not submit with empty required field
    await expect(page).toHaveURL('/vessels/1/edit');
  });

  test('should have delete confirmation', async ({ page }) => {
    await page.goto('/vessels/1/edit');

    await page.click('text=Delete Vessel');
    await expect(page.locator('text=Are you sure')).toBeVisible();
  });
});
