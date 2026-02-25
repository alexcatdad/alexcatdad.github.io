import { expect, test } from '@playwright/test';

test.describe('Open Source Page', () => {
  test('shows featured project cards', async ({ page }) => {
    await page.goto('/open-source');
    await expect(page.getByRole('heading', { name: 'Open Source', exact: true })).toBeVisible();

    const cards = page.locator('[data-project-card]');
    await expect(cards).toHaveCount(3);
  });

  test('cards have screenshot and GitHub link', async ({ page }) => {
    await page.goto('/open-source');

    const cards = page.locator('[data-project-card]');
    const firstCard = cards.first();

    await expect(firstCard.locator('h2')).toBeVisible();
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('a[href*="github.com"]').first()).toBeVisible();
  });

  test('shows catnap, paw, and paw-proxy projects', async ({ page }) => {
    await page.goto('/open-source');

    await expect(page.getByRole('heading', { name: 'catnap' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'paw', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'paw-proxy' })).toBeVisible();
  });
});
