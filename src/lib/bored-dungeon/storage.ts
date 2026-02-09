import { STORAGE_KEY, VERSION } from './catalog';
import type { BoredState, LastRunState, ParsedState, RunState } from './types';

function hydrateRun(run: RunState): RunState {
  return {
    ...run,
    transitionMsRemaining: run.transitionMsRemaining ?? 0,
    transitionFrame: run.transitionFrame ?? 0,
    archetype: run.archetype ?? 'balanced',
    seed: run.seed ?? 0,
    rngState: run.rngState ?? run.seed ?? 0,
    forcedScenario: run.forcedScenario ?? null,
  };
}

function hydrateLastRun(lastRun: LastRunState): LastRunState {
  return {
    ...lastRun,
    timeLeft: lastRun.timeLeft ?? 0,
    seed: lastRun.seed ?? 0,
    archetype: lastRun.archetype ?? 'balanced',
    buffs: lastRun.buffs || {},
    highlights: lastRun.highlights || [],
  };
}

export function makeDefaultBoredState(): BoredState {
  return {
    version: VERSION,
    meta: {
      alias: 'Nyx',
      shards: 0,
      runs: 0,
      wins: 0,
      bestDepth: 0,
      upgrades: {
        vigor: 0,
        might: 0,
        instinct: 0,
      },
    },
    run: null,
    lastRun: null,
  };
}

export function loadBoredState(): BoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultBoredState();

    const parsed = JSON.parse(raw) as ParsedState;
    if (!parsed || parsed.version !== VERSION) return makeDefaultBoredState();

    const defaults = makeDefaultBoredState();
    const parsedMeta = parsed.meta || {};

    return {
      ...defaults,
      ...parsed,
      run: parsed.run ? hydrateRun(parsed.run) : null,
      lastRun: parsed.lastRun ? hydrateLastRun(parsed.lastRun) : null,
      meta: {
        ...defaults.meta,
        ...parsedMeta,
        alias: typeof parsedMeta.alias === 'string' ? parsedMeta.alias : defaults.meta.alias,
        upgrades: {
          ...defaults.meta.upgrades,
          ...(parsedMeta.upgrades || {}),
        },
      },
    };
  } catch {
    return makeDefaultBoredState();
  }
}

export function saveBoredState(state: BoredState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
