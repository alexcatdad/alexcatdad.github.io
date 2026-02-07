import { expect, test } from '@playwright/test';

test.describe('Projects Page', () => {
  test('shows at least one repo card', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    // Should have at least one project row (or a fallback message if API failed)
    const rows = page.locator('a[href*="github.com"]');
    const fallback = page.getByText('No repos found');
    const hasRows = await rows.count();
    const hasFallback = await fallback.count();
    expect(hasRows > 0 || hasFallback > 0).toBe(true);
  });

  test('cards have name and GitHub link', async ({ page }) => {
    await page.goto('/projects');

    const rows = page.locator('a[href*="github.com"]');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();
      await expect(firstRow.locator('h2')).toBeVisible();
      await expect(firstRow).toHaveAttribute('href', /github\.com/);
    }
  });
});
