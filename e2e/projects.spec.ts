import { expect, test } from '@playwright/test';

test.describe('Projects Page', () => {
  test('shows at least one repo card', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

    // Should have at least one project card (or a fallback message if no templated repos exist)
    const rows = page.locator('[data-project-card]');
    const fallback = page.getByText('No templated projects yet');
    const hasRows = await rows.count();
    const hasFallback = await fallback.count();
    expect(hasRows > 0 || hasFallback > 0).toBe(true);
  });

  test('cards have name and GitHub link', async ({ page }) => {
    await page.goto('/projects');

    const rows = page.locator('[data-project-card]');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();
      await expect(firstRow.locator('h2')).toBeVisible();
      await expect(firstRow.locator('a[href*="github.com"]')).toHaveCount(2);
    }
  });
});
