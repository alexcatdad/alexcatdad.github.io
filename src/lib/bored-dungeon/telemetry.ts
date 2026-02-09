import type { ActionId, LastRunState, RoomType, TelemetryState } from './types';

const TELEMETRY_STORAGE_KEY = 'bored-dungeon-telemetry-v1';

function makeDefaultTelemetryState(): TelemetryState {
  return {
    totalRuns: 0,
    totalWins: 0,
    totalTimeLeft: 0,
    scenarioCounts: {},
    actionCounts: {},
    depthStats: {},
  };
}

export function loadTelemetry(): TelemetryState {
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return makeDefaultTelemetryState();
    const parsed = JSON.parse(raw) as Partial<TelemetryState>;
    return {
      ...makeDefaultTelemetryState(),
      ...parsed,
      scenarioCounts: { ...(parsed.scenarioCounts || {}) },
      actionCounts: { ...(parsed.actionCounts || {}) },
      depthStats: { ...(parsed.depthStats || {}) },
    };
  } catch {
    return makeDefaultTelemetryState();
  }
}

export function saveTelemetry(state: TelemetryState): void {
  localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(state));
}

export function clearTelemetry(): TelemetryState {
  const next = makeDefaultTelemetryState();
  saveTelemetry(next);
  return next;
}

export function recordScenarioSpawn(state: TelemetryState, roomType: RoomType): void {
  state.scenarioCounts[roomType] = (state.scenarioCounts[roomType] || 0) + 1;
}

export function recordActionPick(state: TelemetryState, actionId: ActionId): void {
  state.actionCounts[actionId] = (state.actionCounts[actionId] || 0) + 1;
}

export function recordRunFinish(state: TelemetryState, runSummary: LastRunState): void {
  state.totalRuns += 1;
  if (runSummary.victory) {
    state.totalWins += 1;
  }
  state.totalTimeLeft += runSummary.timeLeft;

  const depthKey = String(runSummary.depth);
  const depthStat = state.depthStats[depthKey] || { runs: 0, wins: 0 };
  depthStat.runs += 1;
  if (runSummary.victory) depthStat.wins += 1;
  state.depthStats[depthKey] = depthStat;
}

function topEntries<T extends string>(
  map: Partial<Record<T, number>>,
  limit = 3
): Array<{ key: string; value: number }> {
  const pairs = (Object.entries(map) as Array<[string, number | undefined]>).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number'
  );

  return pairs
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

export function telemetrySummaryLines(state: TelemetryState): string[] {
  const winRate = state.totalRuns > 0 ? Math.round((state.totalWins / state.totalRuns) * 100) : 0;
  const avgTimeLeft =
    state.totalRuns > 0 ? (state.totalTimeLeft / state.totalRuns).toFixed(1) : '0.0';

  const scenarioLine =
    topEntries(state.scenarioCounts)
      .map((entry) => `${entry.key}:${entry.value}`)
      .join(', ') || 'none';

  const actionLine =
    topEntries(state.actionCounts)
      .map((entry) => `${entry.key}:${entry.value}`)
      .join(', ') || 'none';

  const depthLine =
    Object.entries(state.depthStats)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .slice(-4)
      .map(([depth, stats]) => {
        const rate = stats.runs > 0 ? Math.round((stats.wins / stats.runs) * 100) : 0;
        return `d${depth}:${rate}%`;
      })
      .join(', ') || 'none';

  return [
    `Runs ${state.totalRuns} · Win ${winRate}% · Avg time left ${avgTimeLeft}s`,
    `Scenario picks: ${scenarioLine}`,
    `Action picks: ${actionLine}`,
    `Win rate by depth: ${depthLine}`,
  ];
}
