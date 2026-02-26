import { expect, test } from '@playwright/test';

test.describe('Work Page', () => {
  test('shows resume content', async ({ page }) => {
    await page.goto('/work');
    await expect(page.getByRole('heading', { name: 'Alex Alexandrescu' })).toBeVisible();
    await expect(page.getByText('Agentic Engineer', { exact: true }).first()).toBeVisible();
  });

  test('tab navigation switches sections', async ({ page }) => {
    await page.goto('/work');

    // Wait for React island to hydrate
    await page.waitForSelector('button:has-text("Experience")');

    // Click Experience tab
    await page.click('button:has-text("Experience")');
    await expect(page.locator('[data-resume-section="experience"]')).toBeVisible();

    // Click Skills tab
    await page.click('button:has-text("Skills")');
    await expect(page.locator('[data-resume-section="skills"]')).toBeVisible();
  });

  test('download menu opens with options', async ({ page }) => {
    await page.goto('/work');

    // Wait for download FAB to appear
    const fab = page.locator('button[aria-label="Open download menu"]');
    await expect(fab).toBeVisible();

    // Open menu
    await fab.click();
    await expect(page.locator('text=Download PDF')).toBeVisible();
    await expect(page.locator('text=Download Markdown')).toBeVisible();
  });

  test('role filtering via query param', async ({ page }) => {
    await page.goto('/work?role=ic-senior');
    await expect(page.getByRole('heading', { name: 'Alex Alexandrescu' })).toBeVisible();
  });

  test('legacy /cv route redirects to /work', async ({ page }) => {
    await page.goto('/cv');
    await expect(page).toHaveURL('/work');
  });

  test('print page renders resume content', async ({ page }) => {
    // Block print dialog from firing
    await page.addInitScript(() => {
      window.print = () => {};
    });
    await page.goto('/work/print');
    await expect(page.getByRole('heading', { name: 'Alex Alexandrescu' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Foundation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Open Source' })).toBeVisible();
  });
});
