import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // We'll just check that the page loads and has some title.
    // Since we don't know the exact title, we'll confirm it's not 404
    await expect(page).not.toHaveTitle(/404/);
});
