import { expect, test } from '@playwright/test';

test.describe("I'm bored page", () => {
  test('exposes deterministic hooks and persists progress', async ({ page }) => {
    await page.goto('/bored');

    await expect(page.getByRole('heading', { name: "I'm bored" })).toBeVisible();

    await page.waitForFunction(() => {
      const candidate = window as typeof window & {
        render_game_to_text?: unknown;
        advanceTime?: unknown;
      };
      return (
        typeof candidate.render_game_to_text === 'function' &&
        typeof candidate.advanceTime === 'function'
      );
    });

    const before = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
      };
      return JSON.parse(candidate.render_game_to_text()) as { resources: { wood: number } };
    });

    await page.evaluate(() => {
      const candidate = window as typeof window & {
        advanceTime: (ms: number) => void;
      };
      candidate.advanceTime(12000);
    });

    const after = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
      };
      return JSON.parse(candidate.render_game_to_text()) as { resources: { wood: number } };
    });

    expect(after.resources.wood).toBeGreaterThan(before.resources.wood);

    await page.reload();

    const reloaded = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
      };
      return JSON.parse(candidate.render_game_to_text()) as { resources: { wood: number } };
    });

    expect(reloaded.resources.wood).toBeGreaterThanOrEqual(after.resources.wood - 0.5);
  });
});
