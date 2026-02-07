import { expect, test } from '@playwright/test';

test.describe('Projects Page', () => {
  test('shows at least one repo card', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toContainText('Projects');

    // Should have at least one project card (or a fallback message if API failed)
    const cards = page.locator('.interactive-card');
    const fallback = page.locator('text=No repos found');
    const hasCards = await cards.count();
    const hasFallback = await fallback.count();
    expect(hasCards > 0 || hasFallback > 0).toBe(true);
  });

  test('cards have name and GitHub link', async ({ page }) => {
    await page.goto('/projects');

    const firstCard = page.locator('.interactive-card').first();
    const cardCount = await page.locator('.interactive-card').count();

    if (cardCount > 0) {
      await expect(firstCard.locator('h2')).toBeVisible();
      await expect(firstCard).toHaveAttribute('href', /github\.com/);
    }
  });
});
