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

/* ────────────────────────────────────
   HELPERS
   ──────────────────────────────────── */

/** Remove all children from a DOM element (safe alternative to innerHTML = '') */
function clearChildren(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/* ────────────────────────────────────
   STAT CHANGE TRACKING & FLASH
   ──────────────────────────────────── */

interface StatSnapshot {
  depth: string;
  atk: string;
  guard: string;
  luck: string;
  gold: string;
  relic: string;
}

let prevStats: StatSnapshot | null = null;

/* ────────────────────────────────────
   TRANSITION & ANIMATION TRACKING
   ──────────────────────────────────── */

let lastRoomSig = '';
let lastLogSource = '';
let lastLogCount = 0;

function roomSignature(state: BoredState): string {
  if (!state.run) return 'idle';
  if (state.run.phase === 'buff') {
    return `buff:${state.run.buffChoices.join(',')}`;
  }
  if (state.run.phase === 'transition') return 'transition';
  if (!state.run.room) return 'empty';
  return `room:${state.run.room.type}:${state.run.room.title}`;
}

function logSourceKey(state: BoredState): string {
  if (state.run) return `run:${state.run.seed}`;
  if (state.lastRun) return `last:${state.lastRun.seed}`;
  return 'none';
}

/** Update text with a fade animation only when the value changes */
function setTextAnimated(el: HTMLElement, text: string): void {
  if (el.textContent === text) return;
  el.textContent = text;
  el.classList.remove('dungeon-text-swap');
  void el.offsetWidth;
  el.classList.add('dungeon-text-swap');
}

function flashChip(el: HTMLElement): void {
  const chip = el.closest('.dungeon-chip');
  if (!chip) return;
  chip.classList.remove('dungeon-chip--flash');
  void (chip as HTMLElement).offsetWidth;
  chip.classList.add('dungeon-chip--flash');
}

/* ────────────────────────────────────
   CHOICE BUTTON SYSTEM
   ──────────────────────────────────── */

const KEYBOARD_LABELS = ['A', 'B', 'Enter'];

/** Maps action kind to color tint class */
function choiceColorClass(choiceId: string): string {
  if (choiceId.startsWith('battle_') || choiceId.startsWith('boss_') || choiceId === 'use_smoke') {
    return 'dungeon-choice--combat';
  }
  if (choiceId === 'rest_breathe' || choiceId === 'shrine_pray' || choiceId === 'use_tonic') {
    return 'dungeon-choice--safe';
  }
  if (
    choiceId === 'cache_smash' ||
    choiceId === 'trap_dash' ||
    choiceId === 'trap_salvage' ||
    choiceId === 'shrine_bless' ||
    choiceId === 'lore_pledge' ||
    choiceId === 'merchant_leave'
  ) {
    return 'dungeon-choice--risky';
  }
  return 'dungeon-choice--neutral';
}

function choiceColorClassForBuff(): string {
  return 'dungeon-choice--buff';
}

function createChoiceButton(
  label: string,
  description: string,
  dataset: Record<string, string>,
  index: number,
  colorClass: string
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `dungeon-choice ${colorClass}`;

  Object.entries(dataset).forEach(([key, value]) => {
    button.dataset[key] = value;
  });

  const top = document.createElement('div');
  top.className = 'dungeon-choice__top';

  const title = document.createElement('span');
  title.className = 'dungeon-choice__label';
  title.textContent = label;

  const kbd = document.createElement('kbd');
  kbd.className = 'dungeon-kbd';
  kbd.textContent = KEYBOARD_LABELS[index] || String(index + 1);

  top.appendChild(title);
  top.appendChild(kbd);

  const desc = document.createElement('p');
  desc.className = 'dungeon-choice__desc';
  desc.textContent = description;

  button.appendChild(top);
  button.appendChild(desc);
  return button;
}

/* ────────────────────────────────────
   REFRESH FUNCTIONS
   ──────────────────────────────────── */

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
  clearChildren(target);

  const keys = (Object.keys(entries) as T[]).filter((key) => (entries[key] || 0) > 0);
  if (!keys.length) {
    const empty = document.createElement('li');
    empty.textContent = fallbackText;
    empty.className = 'dungeon-empty-text';
    target.appendChild(empty);
    return;
  }

  keys.forEach((key) => {
    const row = document.createElement('li');
    row.className = 'dungeon-inv-row';

    const name = document.createElement('span');
    name.textContent = labels[key].label;
    name.className = 'dungeon-inv-row__name';

    const count = document.createElement('span');
    count.textContent = `x${entries[key] || 0}`;
    count.className = 'dungeon-inv-row__count';

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
  const barTimeFill = document.getElementById('bar-time-fill');
  const barHpFill = document.getElementById('bar-hp-fill');

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

    if (barTimeFill) {
      barTimeFill.style.width = '100%';
      barTimeFill.removeAttribute('data-urgent');
      barTimeFill.removeAttribute('data-critical');
    }
    if (barHpFill) {
      barHpFill.style.width = '100%';
      barHpFill.removeAttribute('data-low');
    }
    prevStats = null;
    return;
  }

  const newStats: StatSnapshot = {
    depth: state.run.depth.toString(),
    atk: state.run.attack.toString(),
    guard: state.run.guard.toString(),
    luck: state.run.luck.toString(),
    gold: state.run.gold.toString(),
    relic: state.run.relicSecured ? 'Secured' : 'Missing',
  };

  // Time bar
  els.statTime.textContent = state.run.timeLeft.toFixed(1);
  const timePct = Math.max(0, (state.run.timeLeft / 60) * 100);
  if (barTimeFill) {
    barTimeFill.style.width = `${timePct}%`;
    if (state.run.timeLeft <= 10) {
      barTimeFill.setAttribute('data-critical', 'true');
      barTimeFill.removeAttribute('data-urgent');
    } else if (state.run.timeLeft <= 25) {
      barTimeFill.setAttribute('data-urgent', 'true');
      barTimeFill.removeAttribute('data-critical');
    } else {
      barTimeFill.removeAttribute('data-urgent');
      barTimeFill.removeAttribute('data-critical');
    }
  }

  // HP bar
  const hpText = `${Math.max(0, Math.round(state.run.hp))}/${Math.round(state.run.maxHp)}`;
  els.statHp.textContent = hpText;
  const hpPct = Math.max(0, (state.run.hp / state.run.maxHp) * 100);
  if (barHpFill) {
    barHpFill.style.width = `${hpPct}%`;
    if (hpPct <= 30) {
      barHpFill.setAttribute('data-low', 'true');
    } else {
      barHpFill.removeAttribute('data-low');
    }
  }

  // Stat chips with flash on change
  const statEntries: [keyof StatSnapshot, HTMLElement][] = [
    ['depth', els.statDepth],
    ['atk', els.statAtk],
    ['guard', els.statGuard],
    ['luck', els.statLuck],
    ['gold', els.statGold],
    ['relic', els.statRelic],
  ];

  statEntries.forEach(([key, el]) => {
    const newVal = newStats[key];
    el.textContent = newVal;
    if (prevStats && prevStats[key] !== newVal) {
      flashChip(el);
    }
  });

  prevStats = newStats;
}

function refreshQuestBrief(state: BoredState, els: UiRefs): void {
  if (!state.run) {
    setTextAnimated(els.questRole, 'You are Nyx, the Lantern Courier.');
    setTextAnimated(
      els.questMotivation,
      'Motivation: steal the Dawn Relic' + ' and prove this run still matters.'
    );
    setTextAnimated(
      els.questObjective,
      'Objective: descend to floor 9,' + ' secure the relic, and bank shards.'
    );
    return;
  }

  const currentLocation = state.run.room
    ? locationCatalog[state.run.room.locationKey].label
    : locationCatalog.corridor.label;

  setTextAnimated(
    els.questRole,
    `${state.meta.alias} · Floor ${state.run.floor}` +
      ` · ${currentLocation}` +
      ` · ${state.run.archetype}`
  );
  els.questMotivation.textContent = '';

  if (state.run.phase === 'buff') {
    setTextAnimated(els.questObjective, 'Draft one relic buff to reinforce your archetype.');
    return;
  }

  if (state.run.phase === 'transition') {
    setTextAnimated(els.questObjective, 'Transitioning to next room...');
    return;
  }

  setTextAnimated(els.questObjective, 'Pick an action. Every action costs the seconds shown.');
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

    setTextAnimated(
      els.runSummary,
      `Floor ${state.run.floor}` +
        ` · Buffs: ${buffText}` +
        ` · Debuffs: ${debuffs || 'none'}` +
        ` · Collectibles: ${collectibles || 'none'}` +
        ` · Consumables: ${consumables || 'none'}` +
        chainText
    );
    return;
  }

  if (!state.lastRun) {
    setTextAnimated(
      els.runSummary,
      'No run yet. Spend shards on upgrades,' + ' pick your line, then start a run.'
    );
    return;
  }

  const status = state.lastRun.victory ? 'Victory' : 'Defeat';
  setTextAnimated(
    els.runSummary,
    `${status}: depth ${state.lastRun.depth},` +
      ` earned ${state.lastRun.shardsEarned} shards,` +
      ` ${state.lastRun.timeLeft.toFixed(1)}s left,` +
      ` seed ${state.lastRun.seed}.`
  );
}

function intentLabel(intent: string): string {
  if (intent === 'fast') return 'Fast strike';
  if (intent === 'heavy') return 'Heavy hit';
  if (intent === 'debuff') return 'Debuff pressure';
  return '';
}

function refreshRoom(state: BoredState, els: UiRefs): void {
  const sig = roomSignature(state);
  const sigChanged = sig !== lastRoomSig;

  // Default: hide transition art
  els.transitionAscii.classList.add('hidden');
  els.transitionAscii.textContent = '';

  if (!state.run) {
    setTextAnimated(els.roomTitle, 'Ready for a run');
    setTextAnimated(
      els.roomDescription,
      'Press start to enter the dungeon.' +
        ' Reach depth 9 and secure the relic' +
        ' before time is spent.'
    );
    els.roomIntent.textContent = '';
    els.roomMission.textContent = '';
    els.roomRisk.textContent = '';
    if (sigChanged) {
      clearChildren(els.choiceList);
      lastRoomSig = sig;
    }
    return;
  }

  if (state.run.phase === 'buff') {
    setTextAnimated(els.roomTitle, 'Relic Draft');
    setTextAnimated(els.roomDescription, 'Choose 1 buff for this run.');
    setTextAnimated(els.roomMission, 'Reinforce your archetype for the next floors.');
    els.roomIntent.textContent = '';
    els.roomRisk.textContent = '';

    if (sigChanged) {
      clearChildren(els.choiceList);
      state.run.buffChoices.forEach((buffKey, index) => {
        const buff = buffCatalog.find((entry) => entry.key === buffKey);
        if (!buff) return;
        const btn = createChoiceButton(
          buff.label,
          buff.description,
          { buffKey },
          index,
          choiceColorClassForBuff()
        );
        btn.classList.add('dungeon-choice--enter');
        btn.style.animationDelay = `${index * 0.06}s`;
        els.choiceList.appendChild(btn);
      });
      lastRoomSig = sig;
    }
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
    setTextAnimated(els.roomTitle, 'Crossing the dungeon');
    setTextAnimated(
      els.roomDescription,
      'You push through the corridor' + ' toward the next encounter.'
    );
    els.roomIntent.textContent = '';
    els.roomMission.textContent = '';
    els.roomRisk.textContent = '';
    els.transitionAscii.textContent = frame;
    els.transitionAscii.classList.remove('hidden');

    if (sigChanged) {
      clearChildren(els.choiceList);
      lastRoomSig = sig;
    }
    return;
  }

  if (!state.run.room) {
    setTextAnimated(els.roomTitle, 'The dungeon is quiet');
    setTextAnimated(els.roomDescription, 'No room is active.');
    els.roomIntent.textContent = '';
    els.roomMission.textContent = '';
    els.roomRisk.textContent = '';
    if (sigChanged) {
      clearChildren(els.choiceList);
      lastRoomSig = sig;
    }
    return;
  }

  setTextAnimated(els.roomTitle, state.run.room.title);
  setTextAnimated(els.roomDescription, state.run.room.description);
  setTextAnimated(els.roomIntent, intentLabel(state.run.room.intent));
  setTextAnimated(els.roomMission, state.run.room.mission);
  setTextAnimated(els.roomRisk, state.run.room.risk);

  if (sigChanged) {
    clearChildren(els.choiceList);
    state.run.room.options.forEach((option, index) => {
      const btn = createChoiceButton(
        option.label,
        option.description,
        { choiceId: option.id },
        index,
        choiceColorClass(option.id)
      );
      btn.classList.add('dungeon-choice--enter');
      btn.style.animationDelay = `${index * 0.06}s`;
      els.choiceList.appendChild(btn);
    });
    lastRoomSig = sig;
  }
}

/** CSS class for color-coded log tag */
function logTagClass(line: string): string {
  if (line.startsWith('[Outcome]')) return 'dungeon-log-entry__tag--outcome';
  if (line.startsWith('[Encounter]')) return 'dungeon-log-entry__tag--encounter';
  if (line.startsWith('[Decision]')) return 'dungeon-log-entry__tag--decision';
  if (line.startsWith('[Descent]')) return 'dungeon-log-entry__tag--descent';
  if (line.startsWith('[Entered]')) return 'dungeon-log-entry__tag--entered';
  return 'dungeon-log-entry__tag--default';
}

function createLogItem(line: string, index: number, isNewest: boolean): HTMLLIElement {
  const item = document.createElement('li');
  item.dataset.logIndex = String(index);
  item.className = `dungeon-log-entry${isNewest ? ' dungeon-log-entry--newest' : ''}`;

  const tagMatch = line.match(/^\[(\w+)\]/);
  if (tagMatch) {
    const tag = document.createElement('span');
    tag.textContent = `${tagMatch[0]} `;
    tag.className = `dungeon-log-entry__tag ${logTagClass(line)}`;
    const rest = document.createElement('span');
    rest.textContent = line.slice(tagMatch[0].length + 1);
    rest.className = 'dungeon-log-entry__text';
    item.appendChild(tag);
    item.appendChild(rest);
  } else {
    item.textContent = line;
    item.className += ' dungeon-log-entry__text';
  }

  return item;
}

function refreshLog(state: BoredState, els: UiRefs): void {
  const lines = state.run?.log || state.lastRun?.log || [];
  const sourceKey = logSourceKey(state);
  const sourceChanged = sourceKey !== lastLogSource;

  // Source changed (new run / run ended) → full rebuild
  if (sourceChanged) {
    lastLogSource = sourceKey;
    lastLogCount = 0;
    clearChildren(els.eventLog);
  }

  // Log was truncated (engine caps at 80) → full rebuild
  if (lines.length < lastLogCount) {
    lastLogCount = 0;
    clearChildren(els.eventLog);
  }

  // Empty state
  if (!lines.length) {
    if (els.eventLog.childElementCount === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'No events yet.';
      empty.className = 'dungeon-empty-text';
      els.eventLog.appendChild(empty);
    }
    lastLogCount = 0;
    return;
  }

  // Clear placeholder when first real entries arrive
  if (lastLogCount === 0 && els.eventLog.childElementCount > 0) {
    clearChildren(els.eventLog);
  }

  // Remove newest-highlight from previous tail entry
  if (lastLogCount > 0) {
    const prev = els.eventLog.lastElementChild;
    if (prev instanceof HTMLElement) {
      prev.classList.remove('dungeon-log-entry--newest');
    }
  }

  // Append only new entries
  const isIncremental = lastLogCount > 0;
  for (let i = lastLogCount; i < lines.length; i++) {
    const isLast = i === lines.length - 1;
    const item = createLogItem(lines[i], i, isLast);

    if (isIncremental) {
      item.classList.add('dungeon-log-entry--new');
      item.addEventListener(
        'animationend',
        () => {
          item.classList.remove('dungeon-log-entry--new');
        },
        { once: true }
      );
    }

    els.eventLog.appendChild(item);
  }

  lastLogCount = lines.length;
  els.eventLogViewport.scrollTop = els.eventLogViewport.scrollHeight;
}

function refreshRecap(state: BoredState, els: UiRefs): void {
  if (state.run || !state.lastRun) {
    els.recapPanel.classList.add('hidden');
    clearChildren(els.recapList);
    return;
  }

  els.recapPanel.classList.remove('hidden');
  const outcome = state.lastRun.victory ? 'Victory' : 'Defeat';
  els.recapTitle.textContent = `${outcome} · ${state.lastRun.archetype} · +${state.lastRun.shardsEarned} shards`;
  clearChildren(els.recapList);

  state.lastRun.highlights.forEach((line) => {
    const item = document.createElement('li');
    item.className = 'dungeon-recap-item';
    item.textContent = line;
    els.recapList.appendChild(item);
  });

  // Wire up dismiss button
  const dismissBtn = els.recapPanel.querySelector('.dungeon-recap-overlay__dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener(
      'click',
      () => {
        els.recapPanel.classList.add('hidden');
      },
      { once: true }
    );
  }

  // Also dismiss on backdrop click
  const backdrop = els.recapPanel.querySelector('.dungeon-recap-overlay__backdrop');
  if (backdrop) {
    backdrop.addEventListener(
      'click',
      () => {
        els.recapPanel.classList.add('hidden');
      },
      { once: true }
    );
  }
}

function refreshControlState(state: BoredState, els: UiRefs): void {
  const running = Boolean(state.run);
  els.startRunBtn.disabled = running;
  els.restartRunBtn.disabled = running;
  els.abandonRunBtn.disabled = !running;

  if (running) {
    els.startRunBtn.classList.add('dungeon-btn--hidden');
    els.restartRunBtn.classList.add('dungeon-btn--hidden');
    els.abandonRunBtn.classList.remove('dungeon-btn--hidden');
  } else {
    els.startRunBtn.classList.remove('dungeon-btn--hidden');
    els.restartRunBtn.classList.remove('dungeon-btn--hidden');
    els.abandonRunBtn.classList.add('dungeon-btn--hidden');
  }
}

function refreshUpgrades(state: BoredState, els: UiRefs): void {
  clearChildren(els.upgradeList);

  metaUpgrades.forEach((upgrade) => {
    const level = state.meta.upgrades[upgrade.key] || 0;
    const cost = upgrade.cost(level);
    const canBuy = state.meta.shards >= cost;

    const row = document.createElement('div');
    row.className = 'dungeon-upgrade-row';

    const title = document.createElement('p');
    title.className = 'dungeon-upgrade-row__title';
    title.textContent = `${upgrade.label} · L${level}`;

    const desc = document.createElement('p');
    desc.className = 'dungeon-upgrade-row__desc';
    desc.textContent = upgrade.description;

    const buy = document.createElement('button');
    buy.type = 'button';
    buy.className = 'dungeon-btn dungeon-btn--ghost dungeon-btn--sm';
    buy.style.marginTop = '0.375rem';
    buy.textContent = `Buy (${cost} shards)`;
    buy.dataset.upgradeKey = upgrade.key;
    buy.disabled = !canBuy || Boolean(state.run);

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
  clearChildren(els.leaderboardList);
  els.leaderboardStatus.textContent =
    leaderboard.length > 0 ? `${leaderboardSource} · top ${leaderboard.length}` : leaderboardSource;

  if (leaderboard.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'No completed runs yet.';
    empty.className = 'dungeon-empty-text';
    els.leaderboardList.appendChild(empty);
    return;
  }

  leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'dungeon-lb-row';

    const top = document.createElement('p');
    top.className = 'dungeon-lb-row__top';
    top.textContent = `#${index + 1} ${entry.alias} · ${entry.shardsEarned} shards · d${entry.depth}`;

    const bottom = document.createElement('p');
    bottom.className = 'dungeon-lb-row__bottom';
    bottom.textContent = `${entry.archetype} · seed ${entry.seed} · ${formatDate(entry.createdAt)}`;

    item.appendChild(top);
    item.appendChild(bottom);
    els.leaderboardList.appendChild(item);
  });
}

function refreshTelemetry(els: UiRefs, lines: string[]): void {
  clearChildren(els.telemetrySummary);
  lines.forEach((line) => {
    const row = document.createElement('p');
    row.className = 'dungeon-telemetry__line';
    row.textContent = line;
    els.telemetrySummary.appendChild(row);
  });
}

/* ────────────────────────────────────
   MAIN RENDER
   ──────────────────────────────────── */

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

    els.sidebarToggle.textContent = sidebarOpen ? 'Hide loadout' : 'Loadout & Upgrades';
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
