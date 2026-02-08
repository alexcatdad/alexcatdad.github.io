import { expect, test } from '@playwright/test';

test.describe('Tools Page', () => {
  test('shows tools sections and custom tools', async ({ page }) => {
    await page.goto('/tools');

    await expect(page.getByRole('heading', { name: 'My tools of choice' })).toBeVisible();
    await expect(page.getByText('Bun')).toBeVisible();
    await expect(page.getByText('paw-proxy')).toBeVisible();
    await expect(page.getByText('catnap')).toBeVisible();
  });
});
