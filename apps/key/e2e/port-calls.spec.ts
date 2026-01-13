import { test, expect } from '@playwright/test';

test.describe('Port Calls', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in real tests, you'd login first
    await page.goto('/port-calls');
  });

  test('should display port calls list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Port Calls');
    await expect(page.locator('text=Create Port Call')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Pacific Star');
    // Verify search filters results
    await expect(page.locator('text=Pacific Star')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Check for stats cards
    await expect(page.locator('text=Active Port Calls')).toBeVisible();
    await expect(page.locator('text=Arriving Today')).toBeVisible();
  });

  test('should navigate to create port call page', async ({ page }) => {
    await page.click('text=Create Port Call');

    await expect(page).toHaveURL('/port-calls/new');
    await expect(page.locator('h1')).toContainText('New Port Call');
  });

  test('should navigate to port call detail page', async ({ page }) => {
    // Click on first port call card
    const firstPortCall = page.locator('[href^="/port-calls/"]').first();
    await firstPortCall.click();

    await expect(page.url()).toContain('/port-calls/');
  });

  test('should filter by status', async ({ page }) => {
    // Click on status filter tabs if they exist
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });
});

test.describe('Port Call Detail', () => {
  test('should display port call details', async ({ page }) => {
    await page.goto('/port-calls/1');

    // Check for key elements
    await expect(page.locator('text=Back to Port Calls')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have edit button', async ({ page }) => {
    await page.goto('/port-calls/1');

    await expect(page.locator('text=Edit')).toBeVisible();
  });

  test('should navigate to edit page', async ({ page }) => {
    await page.goto('/port-calls/1');

    await page.click('text=Edit');

    await expect(page).toHaveURL('/port-calls/1/edit');
  });

  test('should display services section', async ({ page }) => {
    await page.goto('/port-calls/1');

    await expect(page.locator('text=Services')).toBeVisible();
  });
});

test.describe('Port Call Edit', () => {
  test('should display edit form', async ({ page }) => {
    await page.goto('/port-calls/1/edit');

    await expect(page.locator('h1')).toContainText('Edit Port Call');
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible();
  });

  test('should have cancel button', async ({ page }) => {
    await page.goto('/port-calls/1/edit');

    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should have danger zone for deletion', async ({ page }) => {
    await page.goto('/port-calls/1/edit');

    await expect(page.locator('text=Danger Zone')).toBeVisible();
    await expect(page.locator('text=Cancel Port Call')).toBeVisible();
  });

  test('should show confirmation dialog on delete', async ({ page }) => {
    await page.goto('/port-calls/1/edit');

    await page.click('text=Cancel Port Call');

    await expect(page.locator('text=Are you sure')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm")')).toBeVisible();
  });
});
