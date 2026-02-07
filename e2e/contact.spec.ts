import { expect, test } from '@playwright/test';

test.describe('Contact Page', () => {
  test('email reveal: click decodes and shows email', async ({ page }) => {
    await page.goto('/contact');

    // Should see reveal button
    const revealBtn = page.locator('.reveal-btn');
    await expect(revealBtn).toBeVisible();

    // Click to reveal
    await revealBtn.click();

    // Should see the decoded email
    const emailText = page.locator('.email-text');
    await expect(emailText).toBeVisible();
    await expect(emailText).toContainText('@');
  });

  test('copy button works', async ({ page, context }) => {
    // Grant clipboard permission
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/contact');

    // Reveal email first
    await page.click('.reveal-btn');

    // Click copy
    const copyBtn = page.locator('.copy-btn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Should show "Copied!" text
    await expect(page.locator('text=Copied!')).toBeVisible();
  });
});
