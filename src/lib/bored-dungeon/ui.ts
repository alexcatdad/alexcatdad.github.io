import {
  buffCatalog,
  collectibleCatalog,
  consumableCatalog,
  debuffCatalog,
  locationCatalog,
  metaUpgrades,
} from './catalog';
import type {
  BoredState,
  BuffKey,
  CollectibleKey,
  ConsumableKey,
  DebuffKey,
  LastRunState,
  LeaderboardEntry,
  RunState,
  UiRefs,
} from './types';

export interface RenderGameUiOptions {
  leaderboard?: LeaderboardEntry[];
  leaderboardSource?: string;
  telemetryLines?: string[];
}

function readRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

export function readUiRefs(): UiRefs {
  return {
    statTime: readRequiredElement('stat-time'),
    statDepth: readRequiredElement('stat-depth'),
    statHp: readRequiredElement('stat-hp'),
    statAtk: readRequiredElement('stat-atk'),
    statGuard: readRequiredElement('stat-guard'),
    statLuck: readRequiredElement('stat-luck'),
    statGold: readRequiredElement('stat-gold'),
    statGoal: readRequiredElement('stat-goal'),
    statRelic: readRequiredElement('stat-relic'),
    roomTitle: readRequiredElement('room-title'),
    roomDescription: readRequiredElement('room-description'),
    roomIntent: readRequiredElement('room-intent'),
    roomMission: readRequiredElement('room-mission'),
    roomRisk: readRequiredElement('room-risk'),
    transitionAscii: readRequiredElement<HTMLPreElement>('transition-ascii'),
    choiceList: readRequiredElement('choice-list'),
    questRole: readRequiredElement('quest-role'),
    questMotivation: readRequiredElement('quest-motivation'),
    questObjective: readRequiredElement('quest-objective'),
    runSummary: readRequiredElement('run-summary'),
    recapPanel: readRequiredElement('recap-panel'),
    recapTitle: readRequiredElement('recap-title'),
    recapList: readRequiredElement<HTMLUListElement>('recap-list'),
    eventLog: readRequiredElement<HTMLUListElement>('event-log'),
    eventLogViewport: readRequiredElement('event-log-viewport'),
    startRunBtn: readRequiredElement<HTMLButtonElement>('action-start-run'),
    restartRunBtn: readRequiredElement<HTMLButtonElement>('action-restart-run'),
    abandonRunBtn: readRequiredElement<HTMLButtonElement>('action-abandon-run'),
    resetBtn: readRequiredElement<HTMLButtonElement>('action-reset'),
    telemetryResetBtn: readRequiredElement<HTMLButtonElement>('telemetry-reset'),
    metaAliasInput: readRequiredElement<HTMLInputElement>('meta-alias'),
    metaShards: readRequiredElement('meta-shards'),
    metaRuns: readRequiredElement('meta-runs'),
    metaWins: readRequiredElement('meta-wins'),
    metaBestDepth: readRequiredElement('meta-best-depth'),
    inventoryCollectibles: readRequiredElement<HTMLUListElement>('inventory-collectibles'),
    inventoryConsumables: readRequiredElement<HTMLUListElement>('inventory-consumables'),
    inventoryDebuffs: readRequiredElement<HTMLUListElement>('inventory-debuffs'),
    upgradeList: readRequiredElement('upgrade-list'),
    leaderboardList: readRequiredElement<HTMLUListElement>('leaderboard-list'),
    leaderboardStatus: readRequiredElement('leaderboard-status'),
    telemetrySummary: readRequiredElement('telemetry-summary'),
    sidebarPanel: readRequiredElement('sidebar-panel'),
    sidebarToggle: readRequiredElement<HTMLButtonElement>('sidebar-toggle'),
    sidebarClose: readRequiredElement<HTMLButtonElement>('sidebar-close'),
  };
}

function createChoiceButton(
  label: string,
  description: string,
  dataset: Record<string, string>
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className =
    'rounded-2xl border border-border bg-background/60 p-3 text-left hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';

  Object.entries(dataset).forEach(([key, value]) => {
    button.dataset[key] = value;
  });

  const title = document.createElement('p');
  title.className = 'text-sm font-semibold text-foreground';
  title.textContent = label;

  const text = document.createElement('p');
  text.className = 'mt-1 text-xs text-muted-foreground';
  text.textContent = description;

  button.appendChild(title);
  button.appendChild(text);
  return button;
}

function refreshMeta(state: BoredState, els: UiRefs): void {
  els.metaShards.textContent = state.meta.shards.toString();
  els.metaRuns.textContent = state.meta.runs.toString();
  els.metaWins.textContent = state.meta.wins.toString();
  els.metaBestDepth.textContent = state.meta.bestDepth.toString();

  if (document.activeElement !== els.metaAliasInput) {
    els.metaAliasInput.value = state.meta.alias;
  }
}

function setInventoryList<T extends string>(
  target: HTMLUListElement,
  entries: Partial<Record<T, number>>,
  fallbackText: string,
  labels: Record<T, { label: string }>
): void {
  target.innerHTML = '';

  const keys = (Object.keys(entries) as T[]).filter((key) => (entries[key] || 0) > 0);
  if (!keys.length) {
    const empty = document.createElement('li');
    empty.textContent = fallbackText;
    empty.className = 'text-muted-foreground/70';
    target.appendChild(empty);
    return;
  }

  keys.forEach((key) => {
    const row = document.createElement('li');
    row.className = 'flex items-center justify-between gap-3';

    const name = document.createElement('span');
    name.textContent = labels[key].label;
    name.className = 'text-foreground';

    const count = document.createElement('span');
    count.textContent = `x${entries[key] || 0}`;
    count.className = 'text-xs text-muted-foreground';

    row.appendChild(name);
    row.appendChild(count);
    target.appendChild(row);
  });
}

function refreshInventory(state: BoredState, els: UiRefs): void {
  const runOrLast: RunState | LastRunState | null = state.run || state.lastRun;
  const collectibles = runOrLast?.collectibles || {
    relic_shard: 0,
    mimic_tooth: 0,
    guardian_sigil: 0,
  };
  const consumables: Record<ConsumableKey, number> = state.run?.consumables || {
    tonic: 0,
    smoke_bomb: 0,
  };
  const debuffs: Partial<Record<DebuffKey, number>> = state.run?.debuffs || {};

  setInventoryList<CollectibleKey>(
    els.inventoryCollectibles,
    collectibles,
    'No collectibles yet',
    collectibleCatalog
  );
  setInventoryList<ConsumableKey>(
    els.inventoryConsumables,
    consumables,
    'No consumables',
    consumableCatalog
  );
  setInventoryList<DebuffKey>(els.inventoryDebuffs, debuffs, 'No active debuffs', debuffCatalog);
}

function refreshRunStats(state: BoredState, els: UiRefs): void {
  els.statGoal.textContent = 'Depth 9';

  if (!state.run) {
    els.statTime.textContent = '60.0';
    els.statDepth.textContent = '0';
    els.statHp.textContent = '0';
    els.statAtk.textContent = '0';
    els.statGuard.textContent = '0';
    els.statLuck.textContent = '0';
    els.statGold.textContent = '0';
    els.statRelic.textContent = state.lastRun?.victory ? 'Secured (last run)' : 'Missing';
    return;
  }

  els.statTime.textContent = state.run.timeLeft.toFixed(1);
  els.statDepth.textContent = state.run.depth.toString();
  els.statHp.textContent = `${Math.max(0, Math.round(state.run.hp))}/${Math.round(state.run.maxHp)}`;
  els.statAtk.textContent = state.run.attack.toString();
  els.statGuard.textContent = state.run.guard.toString();
  els.statLuck.textContent = state.run.luck.toString();
  els.statGold.textContent = state.run.gold.toString();
  els.statRelic.textContent = state.run.relicSecured ? 'Secured' : 'Missing';
}

function refreshQuestBrief(state: BoredState, els: UiRefs): void {
  if (!state.run) {
    els.questRole.textContent = 'You are Nyx, the Lantern Courier.';
    els.questMotivation.textContent =
      'Motivation: steal the Dawn Relic and prove this run still matters.';
    els.questObjective.textContent =
      'Objective: descend to floor 9, secure the relic, and bank shards.';
    return;
  }

  const currentLocation = state.run.room
    ? locationCatalog[state.run.room.locationKey].label
    : locationCatalog.corridor.label;

  els.questRole.textContent = `You are ${state.meta.alias} on floor ${state.run.floor} (${currentLocation}) as ${state.run.archetype}.`;
  els.questMotivation.textContent =
    'Motivation: shards pay your debts, but the Dawn Relic is the real win condition.';

  if (state.run.phase === 'buff') {
    els.questObjective.textContent =
      'Objective: draft one relic buff to sharpen your current archetype.';
    return;
  }

  if (state.run.phase === 'transition') {
    els.questObjective.textContent =
      'Objective: transition to the next room and prepare for the next tradeoff.';
    return;
  }

  els.questObjective.textContent =
    'Objective: pick one action. Every action spends the seconds shown in its description.';
}

function refreshSummary(state: BoredState, els: UiRefs): void {
  if (state.run) {
    const buffNames = (Object.keys(state.run.buffs) as BuffKey[])
      .map((key) => {
        const buff = buffCatalog.find((entry) => entry.key === key);
        if (!buff) return null;
        const count = state.run?.buffs[key] || 0;
        return count > 1 ? `${buff.label} x${count}` : buff.label;
      })
      .filter((value): value is string => Boolean(value))
      .join(', ');

    const buffText = buffNames.length > 0 ? buffNames : 'None yet';
    const collectibles = (Object.entries(state.run.collectibles) as [CollectibleKey, number][])
      .map(([key, count]) => `${collectibleCatalog[key].label} x${count}`)
      .join(', ');
    const consumables = (Object.entries(state.run.consumables) as [ConsumableKey, number][])
      .map(([key, count]) => `${consumableCatalog[key].label} x${count}`)
      .join(', ');
    const debuffs = (Object.keys(state.run.debuffs) as DebuffKey[])
      .map((key) => debuffCatalog[key].label)
      .join(', ');

    const chainText = state.run.forcedScenario ? ` Next chain: ${state.run.forcedScenario}.` : '';

    els.runSummary.textContent = `Floor ${state.run.floor}, shards banked on finish. Buffs: ${buffText}. Debuffs: ${debuffs || 'none'}. Collectibles: ${collectibles || 'none'}. Consumables: ${consumables || 'none'}.${chainText}`;
    return;
  }

  if (!state.lastRun) {
    els.runSummary.textContent =
      'No run yet. Spend shards on upgrades, pick your line, then start a run.';
    return;
  }

  const status = state.lastRun.victory ? 'Victory' : 'Defeat';
  els.runSummary.textContent = `${status}: depth ${state.lastRun.depth}, earned ${state.lastRun.shardsEarned} shards, ${state.lastRun.timeLeft.toFixed(1)}s left, seed ${state.lastRun.seed}.`;
}

function intentLabel(intent: string): string {
  if (intent === 'fast') return 'Enemy intent: Fast strike next.';
  if (intent === 'heavy') return 'Enemy intent: Heavy hit charging.';
  if (intent === 'debuff') return 'Enemy intent: Debuff pressure incoming.';
  return 'Enemy intent: No direct attack telegraphed.';
}

function refreshRoom(state: BoredState, els: UiRefs): void {
  els.choiceList.innerHTML = '';
  els.transitionAscii.classList.add('hidden');
  els.transitionAscii.textContent = '';
  els.roomIntent.textContent = '';
  els.roomMission.textContent = '';
  els.roomRisk.textContent = '';

  if (!state.run) {
    els.roomTitle.textContent = 'Ready for a run';
    els.roomDescription.textContent =
      'Press start to enter the dungeon. Reach depth 9 and secure the relic before time is spent.';
    return;
  }

  if (state.run.phase === 'buff') {
    els.roomTitle.textContent = 'Relic Draft';
    els.roomDescription.textContent = 'Choose 1 buff for this run.';
    els.roomMission.textContent = 'Mission: reinforce your archetype for the next floors.';
    els.roomRisk.textContent = 'Risk: skipping synergy now makes late rooms harder.';

    state.run.buffChoices.forEach((buffKey) => {
      const buff = buffCatalog.find((entry) => entry.key === buffKey);
      if (!buff) return;
      const btn = createChoiceButton(buff.label, buff.description, {
        buffKey,
      });
      els.choiceList.appendChild(btn);
    });
    return;
  }

  if (state.run.phase === 'transition') {
    const frames = [
      '[ @............. ]\n  /|\\  echoes\n  / \\  in stone',
      '[ .@............ ]\n  /|\\  echoes\n  / \\  in stone',
      '[ ..@........... ]\n  /|\\  echoes\n  / \\  in stone',
      '[ ...@.......... ]\n  /|\\  echoes\n  / \\  in stone',
      '[ ....@......... ]\n  /|\\  echoes\n  / \\  in stone',
      '[ .....@........ ]\n  /|\\  echoes\n  / \\  in stone',
      '[ ......@....... ]\n  /|\\  echoes\n  / \\  in stone',
      '[ .......@...... ]\n  /|\\  echoes\n  / \\  in stone',
    ] as const;

    const frame = frames[state.run.transitionFrame % frames.length];
    els.roomTitle.textContent = 'Crossing the dungeon';
    els.roomDescription.textContent = 'You push through the corridor toward the next encounter.';
    els.roomMission.textContent = 'Mission: hold tempo and prepare your next trade.';
    els.roomRisk.textContent = 'Risk: bad pacing now makes floor spikes harder.';
    els.transitionAscii.textContent = frame;
    els.transitionAscii.classList.remove('hidden');
    return;
  }

  if (!state.run.room) {
    els.roomTitle.textContent = 'The dungeon is quiet';
    els.roomDescription.textContent = 'No room is active.';
    return;
  }

  els.roomTitle.textContent = state.run.room.title;
  els.roomDescription.textContent = state.run.room.description;
  els.roomIntent.textContent = intentLabel(state.run.room.intent);
  els.roomMission.textContent = `Mission: ${state.run.room.mission}`;
  els.roomRisk.textContent = `Risk: ${state.run.room.risk}`;

  state.run.room.options.forEach((option) => {
    const btn = createChoiceButton(option.label, option.description, {
      choiceId: option.id,
    });
    els.choiceList.appendChild(btn);
  });
}

function refreshLog(state: BoredState, els: UiRefs): void {
  els.eventLog.innerHTML = '';
  const lines = state.run?.log || state.lastRun?.log || [];

  if (!lines.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No events yet.';
    empty.className = 'text-muted-foreground/70';
    els.eventLog.appendChild(empty);
    return;
  }

  lines.forEach((line, index) => {
    const item = document.createElement('li');
    item.className = 'rounded-xl border border-border/60 bg-background/40 px-3 py-2';
    item.dataset.logIndex = String(index);
    item.textContent = line;
    els.eventLog.appendChild(item);
  });

  els.eventLogViewport.scrollTop = els.eventLogViewport.scrollHeight;
}

function refreshRecap(state: BoredState, els: UiRefs): void {
  if (state.run || !state.lastRun) {
    els.recapPanel.classList.add('hidden');
    els.recapList.innerHTML = '';
    return;
  }

  els.recapPanel.classList.remove('hidden');
  els.recapTitle.textContent = `Run recap · ${state.lastRun.victory ? 'Victory' : 'Defeat'} · ${state.lastRun.archetype}`;
  els.recapList.innerHTML = '';

  state.lastRun.highlights.forEach((line) => {
    const item = document.createElement('li');
    item.className = 'text-xs text-muted-foreground';
    item.textContent = line;
    els.recapList.appendChild(item);
  });
}

function refreshControlState(state: BoredState, els: UiRefs): void {
  const running = Boolean(state.run);
  els.startRunBtn.disabled = running;
  els.restartRunBtn.disabled = running;
  els.abandonRunBtn.disabled = !running;

  const disabledClass = ['opacity-65', 'cursor-not-allowed'];
  if (running) {
    els.startRunBtn.classList.add(...disabledClass);
    els.restartRunBtn.classList.add(...disabledClass);
    els.abandonRunBtn.classList.remove(...disabledClass);
  } else {
    els.startRunBtn.classList.remove(...disabledClass);
    els.restartRunBtn.classList.remove(...disabledClass);
    els.abandonRunBtn.classList.add(...disabledClass);
  }
}

function refreshUpgrades(state: BoredState, els: UiRefs): void {
  els.upgradeList.innerHTML = '';

  metaUpgrades.forEach((upgrade) => {
    const level = state.meta.upgrades[upgrade.key] || 0;
    const cost = upgrade.cost(level);
    const canBuy = state.meta.shards >= cost;

    const row = document.createElement('div');
    row.className = 'rounded-2xl border border-border bg-secondary/30 p-3';

    const title = document.createElement('p');
    title.className = 'text-sm font-semibold text-foreground';
    title.textContent = `${upgrade.label} · L${level}`;

    const desc = document.createElement('p');
    desc.className = 'mt-1 text-xs text-muted-foreground';
    desc.textContent = upgrade.description;

    const buy = document.createElement('button');
    buy.type = 'button';
    buy.className =
      'mt-2 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';
    buy.textContent = `Buy (${cost} shards)`;
    buy.dataset.upgradeKey = upgrade.key;
    buy.disabled = !canBuy || Boolean(state.run);

    if (buy.disabled) {
      buy.classList.add('opacity-65', 'cursor-not-allowed');
    }

    row.appendChild(title);
    row.appendChild(desc);
    row.appendChild(buy);
    els.upgradeList.appendChild(row);
  });
}

function formatDate(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function refreshLeaderboard(
  els: UiRefs,
  leaderboard: LeaderboardEntry[],
  leaderboardSource: string
): void {
  els.leaderboardList.innerHTML = '';
  els.leaderboardStatus.textContent =
    leaderboard.length > 0 ? `${leaderboardSource} · top ${leaderboard.length}` : leaderboardSource;

  if (leaderboard.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No completed runs yet.';
    empty.className = 'text-muted-foreground/70';
    els.leaderboardList.appendChild(empty);
    return;
  }

  leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'rounded-xl border border-border/60 bg-background/40 px-3 py-2';

    const top = document.createElement('p');
    top.className = 'text-xs text-foreground';
    top.textContent = `#${index + 1} ${entry.alias} · ${entry.shardsEarned} shards · d${entry.depth}`;

    const bottom = document.createElement('p');
    bottom.className = 'mt-1 text-[11px] text-muted-foreground';
    bottom.textContent = `${entry.archetype} · seed ${entry.seed} · ${formatDate(entry.createdAt)}`;

    item.appendChild(top);
    item.appendChild(bottom);
    els.leaderboardList.appendChild(item);
  });
}

function refreshTelemetry(els: UiRefs, lines: string[]): void {
  els.telemetrySummary.innerHTML = '';
  lines.forEach((line) => {
    const row = document.createElement('p');
    row.className = 'text-[11px] text-muted-foreground';
    row.textContent = line;
    els.telemetrySummary.appendChild(row);
  });
}

export function renderGameUi(
  state: BoredState,
  els: UiRefs,
  options: RenderGameUiOptions = {}
): void {
  const leaderboard = options.leaderboard || [];
  const leaderboardSource = options.leaderboardSource || 'Local IndexedDB';
  const telemetryLines = options.telemetryLines || ['Runs 0 · Win 0% · Avg time left 0.0s'];

  refreshMeta(state, els);
  refreshInventory(state, els);
  refreshRunStats(state, els);
  refreshQuestBrief(state, els);
  refreshSummary(state, els);
  refreshRoom(state, els);
  refreshRecap(state, els);
  refreshLog(state, els);
  refreshControlState(state, els);
  refreshUpgrades(state, els);
  refreshLeaderboard(els, leaderboard, leaderboardSource);
  refreshTelemetry(els, telemetryLines);
}

export function triggerChoiceByIndex(choiceRoot: HTMLElement, index: number): boolean {
  const choices = Array.from(choiceRoot.querySelectorAll('button'));
  if (!choices.length) return false;

  const safeIndex = Math.max(0, Math.min(index, choices.length - 1));
  const choice = choices[safeIndex];
  if (!(choice instanceof HTMLButtonElement) || choice.disabled) return false;
  choice.click();
  return true;
}

export interface SidebarController {
  applyVisibility: () => void;
  closeOnMobile: () => void;
  toggle: () => void;
  close: () => void;
}

export function createSidebarController(els: UiRefs): SidebarController {
  let sidebarOpen = false;

  const isDesktopViewport = (): boolean => window.matchMedia('(min-width: 1024px)').matches;

  const applyVisibility = (): void => {
    if (isDesktopViewport()) {
      els.sidebarPanel.classList.remove('hidden');
      return;
    }

    if (sidebarOpen) {
      els.sidebarPanel.classList.remove('hidden');
    } else {
      els.sidebarPanel.classList.add('hidden');
    }

    els.sidebarToggle.textContent = sidebarOpen ? 'Hide inventory' : 'Show inventory';
  };

  const closeOnMobile = (): void => {
    if (isDesktopViewport()) return;
    sidebarOpen = false;
    applyVisibility();
  };

  const toggle = (): void => {
    sidebarOpen = !sidebarOpen;
    applyVisibility();
  };

  const close = (): void => {
    sidebarOpen = false;
    applyVisibility();
  };

  return {
    applyVisibility,
    closeOnMobile,
    toggle,
    close,
  };
}
