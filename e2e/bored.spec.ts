import { expect, test } from '@playwright/test';

test.describe("I'm bored page", () => {
  test('supports deterministic time stepping and persists roguelite meta progress', async ({
    page,
  }) => {
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

    await page.evaluate(() => {
      localStorage.removeItem('bored-dungeon-v3');
      localStorage.removeItem('bored-dungeon-v2');
    });
    await page.reload();

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

    await page.getByRole('button', { name: 'Start run' }).click();

    const before = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
      };
      return JSON.parse(candidate.render_game_to_text()) as {
        mode: string;
        run: { timeLeft: number } | null;
      };
    });

    expect(before.mode).toBe('run');
    expect(before.run).not.toBeNull();

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
      return JSON.parse(candidate.render_game_to_text()) as {
        run: { timeLeft: number } | null;
      };
    });

    expect(after.run).not.toBeNull();
    expect(after.run?.timeLeft ?? 0).toBeCloseTo(before.run?.timeLeft ?? 0, 1);

    await page.locator('#choice-list button').first().click();

    const afterAction = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
      };
      return JSON.parse(candidate.render_game_to_text()) as {
        run: { timeLeft: number } | null;
      };
    });

    const finished = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
        advanceTime: (ms: number) => void;
      };
      let turns = 0;
      let guard = 0;
      while (turns < 40 && guard < 200) {
        const current = JSON.parse(candidate.render_game_to_text()) as {
          run: unknown;
          mode: string;
        };
        if (!current.run || current.mode === 'menu') {
          break;
        }
        const button = document.querySelector('#choice-list button');
        if (!(button instanceof HTMLButtonElement)) {
          candidate.advanceTime(200);
          guard += 1;
          continue;
        }
        button.click();
        turns += 1;
        guard += 1;
      }
      return JSON.parse(candidate.render_game_to_text()) as {
        mode: string;
        run: unknown;
        meta: { runs: number; shards: number };
      };
    });

    expect(afterAction.run).not.toBeNull();
    expect(afterAction.run?.timeLeft ?? 0).toBeLessThan(after.run?.timeLeft ?? 1000);
    expect(finished.mode).toBe('menu');
    expect(finished.run).toBeNull();
    expect(finished.meta.runs).toBeGreaterThan(0);
    expect(finished.meta.shards).toBeGreaterThan(0);

    await page.reload();

    const reloaded = await page.evaluate(() => {
      const candidate = window as typeof window & {
        render_game_to_text: () => string;
      };
      return JSON.parse(candidate.render_game_to_text()) as {
        meta: { runs: number; shards: number };
      };
    });

    expect(reloaded.meta.runs).toBeGreaterThanOrEqual(finished.meta.runs);
    expect(reloaded.meta.shards).toBeGreaterThanOrEqual(finished.meta.shards);
  });
});
