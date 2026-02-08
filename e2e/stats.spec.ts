import { expect, test } from '@playwright/test';

test.describe('Stats Page', () => {
  test('renders snapshot metadata and cards', async ({ page }) => {
    await page.goto('/stats');

    await expect(page.getByRole('heading', { name: 'Stats', exact: true })).toBeVisible();
    await expect(page.getByText('Generated:')).toBeVisible();
    await expect(page.getByText('Public repos', { exact: true })).toBeVisible();
    await expect(page.getByText('Language distribution')).toBeVisible();
  });
});
