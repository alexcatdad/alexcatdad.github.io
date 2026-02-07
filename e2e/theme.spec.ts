import { expect, test } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('switches dark/light', async ({ page }) => {
    // Emulate dark color scheme so default is dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Click theme toggle
    await page.click('#theme-toggle');
    await expect(html).toHaveClass(/light/);

    // Click again to go back to dark
    await page.click('#theme-toggle');
    await expect(html).toHaveClass(/dark/);
  });

  test('theme persists after navigation', async ({ page }) => {
    // Emulate dark color scheme so default is dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    // Default is dark, switch to light
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveClass(/light/);

    // Navigate to another page
    await page.click('a[href="/cv"]');
    await expect(page).toHaveURL('/cv');

    // Should still be light
    await expect(page.locator('html')).toHaveClass(/light/);
  });
});
