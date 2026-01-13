import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate through main menu items', async ({ page }) => {
    await page.goto('/');

    // Navigate to Port Calls
    await page.click('text=Port Calls');
    await expect(page).toHaveURL('/port-calls');

    // Navigate to Vessels
    await page.click('text=Vessels');
    await expect(page).toHaveURL('/vessels');

    // Navigate to Services
    await page.click('text=Services');
    await expect(page).toHaveURL('/services');

    // Navigate to RFQs
    await page.click('text=RFQs');
    await expect(page).toHaveURL('/rfqs');
  });

  test('should display dashboard on home page', async ({ page }) => {
    await page.goto('/');

    // Check for dashboard elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should have working back navigation', async ({ page }) => {
    await page.goto('/port-calls');
    await page.click('[href^="/port-calls/"]');

    await page.click('text=Back to Port Calls');
    await expect(page).toHaveURL('/port-calls');
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/');

    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
  });

  test('should navigate to fleet map', async ({ page }) => {
    await page.goto('/');

    // Try to find fleet map link
    const fleetMapLink = page.locator('text=Fleet Map').or(page.locator('text=Map'));
    if (await fleetMapLink.isVisible()) {
      await fleetMapLink.click();
      await expect(page).toHaveURL('/fleet-map');
    }
  });
});

test.describe('Responsive Navigation', () => {
  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu button should be visible
    const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();
    await expect(menuButton).toBeVisible();
  });

  test('should be accessible on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/port-calls');

    await expect(page.locator('h1')).toContainText('Port Calls');
  });
});
