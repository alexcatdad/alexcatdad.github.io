import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('home page loads with correct content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  });

  test('nav links navigate to all pages', async ({ page }) => {
    await page.goto('/');

    await page.click('a[href="/cv"]');
    await expect(page).toHaveURL('/cv');

    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL('/projects');

    await page.click('a[href="/contact"]');
    await expect(page).toHaveURL('/contact');

    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('mobile viewport: hamburger menu works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');

    // Desktop nav should be hidden
    const desktopNav = page.locator('nav .hidden.lg\\:flex').first();
    await expect(desktopNav).not.toBeVisible();

    // Hamburger button should be visible
    const menuBtn = page.locator('#mobile-menu-btn');
    await expect(menuBtn).toBeVisible();

    // Click to open mobile menu
    await menuBtn.click();
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();

    // Click a link in mobile menu
    await page.click('#mobile-menu a[href="/cv"]');
    await expect(page).toHaveURL('/cv');
  });
});
