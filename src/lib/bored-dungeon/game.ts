import {
  createBoredEngine,
  isActionId,
  isBuffKey,
  isMetaUpgradeKey,
  renderGameStateToText,
} from './engine';
import {
  createDexieLeaderboardAdapter,
  createLeaderboardEntry,
  type LeaderboardAdapter,
} from './leaderboard';
import { loadBoredState, saveBoredState } from './storage';
import {
  clearTelemetry,
  loadTelemetry,
  recordActionPick,
  recordRunFinish,
  recordScenarioSpawn,
  saveTelemetry,
  telemetrySummaryLines,
} from './telemetry';
import { startIntervalTicker } from './ticker';
import type { LastRunState, LeaderboardEntry, TelemetryState } from './types';
import {
  createSidebarController,
  type RenderGameUiOptions,
  readUiRefs,
  renderGameUi,
  triggerChoiceByIndex,
} from './ui';

function normalizeAlias(input: string): string {
  const trimmed = input.trim().slice(0, 18);
  return trimmed.length > 0 ? trimmed : 'Nyx';
}

export function initBoredDungeonGame(): void {
  const state = loadBoredState();
  const telemetryState: TelemetryState = loadTelemetry();
  const leaderboardAdapter: LeaderboardAdapter = createDexieLeaderboardAdapter();
  const els = readUiRefs();

  let leaderboardEntries: LeaderboardEntry[] = [];
  let uiOptions: RenderGameUiOptions = {
    leaderboard: leaderboardEntries,
    leaderboardSource: leaderboardAdapter.name,
    telemetryLines: telemetrySummaryLines(telemetryState),
  };

  const render = (): void => {
    uiOptions = {
      leaderboard: leaderboardEntries,
      leaderboardSource: leaderboardAdapter.name,
      telemetryLines: telemetrySummaryLines(telemetryState),
    };
    renderGameUi(state, els, uiOptions);
  };

  const persist = (): void => {
    saveBoredState(state);
  };

  const persistTelemetry = (): void => {
    saveTelemetry(telemetryState);
  };

  const refreshLeaderboard = async (): Promise<void> => {
    leaderboardEntries = await leaderboardAdapter.getTop(12);
    render();
  };

  const recordRun = async (runSummary: LastRunState, runNumber: number): Promise<void> => {
    await leaderboardAdapter.appendEntry(
      createLeaderboardEntry(runSummary, runNumber, state.meta.alias)
    );
    recordRunFinish(telemetryState, runSummary);
    persistTelemetry();
    await refreshLeaderboard();
  };

  const engine = createBoredEngine(state, {
    onStateChange: () => {
      persist();
      render();
    },
    onTransientChange: () => {
      render();
    },
    onScenarioSpawn: (room) => {
      recordScenarioSpawn(telemetryState, room.type);
      persistTelemetry();
      render();
    },
    onActionResolved: (actionId) => {
      recordActionPick(telemetryState, actionId);
      persistTelemetry();
      render();
    },
    onRunFinished: (runSummary, runNumber) => {
      void recordRun(runSummary, runNumber);
    },
  });

  const sidebar = createSidebarController(els);

  els.startRunBtn.addEventListener('click', engine.startRun);
  els.restartRunBtn.addEventListener('click', engine.startRun);
  els.abandonRunBtn.addEventListener('click', engine.abandonRun);

  els.resetBtn.addEventListener('click', () => {
    if (confirm('Reset all dungeon progress? This clears shards, upgrades, and leaderboard.')) {
      engine.resetProgress();
      void leaderboardAdapter.clear().then(refreshLeaderboard);
    }
  });

  els.telemetryResetBtn.addEventListener('click', () => {
    clearTelemetry();
    Object.assign(telemetryState, loadTelemetry());
    render();
  });

  els.metaAliasInput.addEventListener('change', () => {
    state.meta.alias = normalizeAlias(els.metaAliasInput.value);
    persist();
    render();
  });

  els.choiceList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest('button');
    if (!(button instanceof HTMLButtonElement)) return;

    const { choiceId, buffKey } = button.dataset;
    if (choiceId && isActionId(choiceId)) {
      engine.resolveRoomChoice(choiceId);
      sidebar.closeOnMobile();
      return;
    }

    if (buffKey && isBuffKey(buffKey)) {
      engine.chooseBuff(buffKey);
      sidebar.closeOnMobile();
    }
  });

  els.upgradeList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest('button');
    if (!(button instanceof HTMLButtonElement)) return;

    const { upgradeKey } = button.dataset;
    if (!upgradeKey || !isMetaUpgradeKey(upgradeKey)) return;

    engine.buyUpgrade(upgradeKey);
    sidebar.closeOnMobile();
  });

  els.sidebarToggle.addEventListener('click', sidebar.toggle);
  els.sidebarClose.addEventListener('click', sidebar.close);
  window.addEventListener('resize', sidebar.applyVisibility);

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (!state.run) {
      if (key === 'enter' || key === ' ' || key === 'spacebar' || key === 's') {
        engine.startRun();
        event.preventDefault();
      }
      return;
    }

    if (key === 'a' || key === 'arrowleft') {
      if (triggerChoiceByIndex(els.choiceList, 0)) {
        event.preventDefault();
      }
      return;
    }

    if (key === 'b' || key === 'arrowright') {
      if (triggerChoiceByIndex(els.choiceList, 1)) {
        event.preventDefault();
      }
      return;
    }

    if (key === 'enter' || key === ' ' || key === 'spacebar') {
      if (triggerChoiceByIndex(els.choiceList, 2) || triggerChoiceByIndex(els.choiceList, 0)) {
        event.preventDefault();
      }
    }
  });

  const saveTicker = startIntervalTicker(() => {
    persist();
  }, 5000);

  const engineTicker = startIntervalTicker(() => {
    engine.tick(100);
  }, 100);

  window.addEventListener('beforeunload', () => {
    saveTicker.stop();
    engineTicker.stop();
    persist();
    persistTelemetry();
  });

  window.render_game_to_text = () => renderGameStateToText(state);
  window.advanceTime = (ms: number) => {
    engine.tick(ms);
    render();
  };

  sidebar.applyVisibility();
  void refreshLeaderboard();
  render();
}
