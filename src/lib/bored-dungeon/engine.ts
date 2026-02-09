import {
  actionCatalog,
  buffCatalog,
  collectibleCatalog,
  corridorFlavors,
  glowFlavors,
  idleFlavors,
  metaUpgrades,
} from './catalog';
import { applyIncomingDamage, createStartingCharacter } from './character';
import { getEncounterFlavors, getEntityLabel, getLocationLabel } from './entities';
import { buildScenarioRoom } from './scenarios';
import { makeDefaultBoredState } from './storage';
import type {
  ActionId,
  BoredEngine,
  BoredState,
  BuffKey,
  CollectibleKey,
  ConsumableKey,
  DebuffKey,
  EnemyIntent,
  EngineCallbacks,
  EntityKey,
  LastRunState,
  MetaUpgradeKey,
  PlayerArchetype,
  RoomState,
  RunState,
} from './types';

const actionKeys = new Set<ActionId>(Object.keys(actionCatalog) as ActionId[]);
const buffKeys = new Set<BuffKey>(buffCatalog.map((buff) => buff.key));
const metaUpgradeKeys = new Set<MetaUpgradeKey>(metaUpgrades.map((upgrade) => upgrade.key));

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const TRANSITION_DURATION_MS = 1400;
const TRANSITION_FRAME_MS = 120;
const TRANSITION_FRAME_COUNT = 8;

function chapterTag(
  tag: 'Entered' | 'Encounter' | 'Outcome' | 'Descent' | 'Decision',
  line: string
): string {
  return `[${tag}] ${line}`;
}

function determineArchetype(run: BoredState['meta']): PlayerArchetype {
  const { vigor, might, instinct } = run.upgrades;
  if (might > vigor && might >= instinct) return 'blitz';
  if (vigor > might && vigor >= instinct) return 'bulwark';
  if (instinct > might && instinct > vigor) return 'scavenger';
  return 'balanced';
}

function archetypeBuffWeight(archetype: PlayerArchetype, buffKey: BuffKey): number {
  const weights: Record<PlayerArchetype, Partial<Record<BuffKey, number>>> = {
    balanced: {
      iron_fur: 1,
      razor_claws: 1,
      bone_guard: 1,
      lucky_whiskers: 1,
      time_pocket: 1,
      scavenger_pouch: 1,
      blood_fangs: 1,
      thick_hide: 1,
    },
    bulwark: {
      iron_fur: 3,
      bone_guard: 3,
      thick_hide: 3,
      time_pocket: 1,
    },
    blitz: {
      razor_claws: 3,
      blood_fangs: 2,
      time_pocket: 2,
      lucky_whiskers: 1,
    },
    scavenger: {
      scavenger_pouch: 3,
      lucky_whiskers: 2,
      time_pocket: 2,
      razor_claws: 1,
    },
  };

  return weights[archetype][buffKey] || 1;
}

function applyArchetypeBonuses(run: RunState): void {
  if (run.archetype === 'bulwark') {
    run.maxHp += 8;
    run.hp = Math.min(run.maxHp, run.hp + 8);
    run.guard += 1;
    run.luck = Math.max(0, run.luck - 1);
    return;
  }

  if (run.archetype === 'blitz') {
    run.attack += 2;
    run.maxHp = Math.max(10, run.maxHp - 4);
    run.hp = Math.min(run.maxHp, run.hp);
    run.timeLeft += 2;
    return;
  }

  if (run.archetype === 'scavenger') {
    run.gold += 5;
    run.luck += 1;
    run.flags.scavenger += 1;
    return;
  }

  run.consumables.tonic += 1;
}

function summarizeTopBuff(buffs: Partial<Record<BuffKey, number>>): string {
  const sorted = Object.entries(buffs).sort((a, b) => b[1] - a[1]);
  const top = sorted.length > 0 ? sorted[0] : null;
  if (!top) return 'No buff stack';
  return `${top[0]} x${top[1]}`;
}

export function isActionId(value: string): value is ActionId {
  return actionKeys.has(value as ActionId);
}

export function isBuffKey(value: string): value is BuffKey {
  return buffKeys.has(value as BuffKey);
}

export function isMetaUpgradeKey(value: string): value is MetaUpgradeKey {
  return metaUpgradeKeys.has(value as MetaUpgradeKey);
}

export function renderGameStateToText(state: BoredState): string {
  const run = state.run
    ? {
        phase: state.run.phase,
        transitionMsRemaining: state.run.transitionMsRemaining,
        transitionFrame: state.run.transitionFrame,
        timeLeft: Number(state.run.timeLeft.toFixed(2)),
        depth: state.run.depth,
        hp: Number(state.run.hp.toFixed(2)),
        maxHp: state.run.maxHp,
        attack: state.run.attack,
        guard: state.run.guard,
        luck: state.run.luck,
        gold: state.run.gold,
        archetype: state.run.archetype,
        seed: state.run.seed,
        buffs: state.run.buffs,
        room: state.run.room,
        buffChoices: state.run.buffChoices,
      }
    : null;

  return JSON.stringify({
    mode: state.run
      ? state.run.phase === 'buff'
        ? 'buff_choice'
        : state.run.phase === 'transition'
          ? 'transition'
          : 'run'
      : 'menu',
    coordinate_system: 'text interface (no spatial coordinates)',
    meta: state.meta,
    run,
    lastRun: state.lastRun,
  });
}

export function createBoredEngine(state: BoredState, callbacks: EngineCallbacks): BoredEngine {
  const commit = (): void => {
    callbacks.onStateChange();
  };

  const commitTransient = (): void => {
    callbacks.onTransientChange?.();
  };

  const appendLog = (text: string): void => {
    if (!state.run) return;
    state.run.log.push(text);
    if (state.run.log.length > 80) {
      state.run.log = state.run.log.slice(-80);
    }
  };

  const runRandom = (run: RunState): number => {
    run.rngState = (Math.imul(1664525, run.rngState) + 1013904223) >>> 0;
    return run.rngState / 4294967296;
  };

  const randomInt = (run: RunState, min: number, max: number): number =>
    Math.floor(runRandom(run) * (max - min + 1)) + min;

  const pickRandom = <T>(run: RunState, items: readonly T[]): T =>
    items[randomInt(run, 0, items.length - 1)];

  const consumeTime = (run: RunState, seconds: number): void => {
    run.timeLeft = clamp(run.timeLeft - seconds, 0, 90);
  };

  const addCollectible = (run: RunState, key: CollectibleKey, amount = 1): void => {
    run.collectibles[key] += amount;
  };

  const addConsumable = (run: RunState, key: ConsumableKey, amount = 1): void => {
    run.consumables[key] += amount;
  };

  const applyDebuff = (run: RunState, key: DebuffKey, floors = 2): void => {
    run.debuffs[key] = Math.max(run.debuffs[key] || 0, floors + 1);
  };

  const tickDebuffs = (run: RunState): void => {
    (Object.keys(run.debuffs) as DebuffKey[]).forEach((key) => {
      const remaining = (run.debuffs[key] || 0) - 1;
      if (remaining <= 0) {
        delete run.debuffs[key];
      } else {
        run.debuffs[key] = remaining;
      }
    });
  };

  const applyRunDamage = (run: RunState, rawDamage: number): number => {
    const smokeShielded = run.flags.smokeShield > 0;
    const damage = applyIncomingDamage(run, rawDamage);
    if (smokeShielded) {
      appendLog(chapterTag('Outcome', 'Smoke bomb absorbs the blow.'));
    }
    return damage;
  };

  const resolveBattle = (
    run: RunState,
    mode: 'battle_rush' | 'battle_guard' | 'battle_feint' | 'boss_strike' | 'boss_guard',
    intent: EnemyIntent,
    boss = false,
    enemyKey: EntityKey = 'tunnel_raider'
  ): void => {
    const enemyBonus = enemyKey === 'mimic' ? 2 : enemyKey === 'vault_guardian' ? 4 : 0;
    const intentPower =
      intent === 'fast' ? 2 : intent === 'heavy' ? 1 : intent === 'debuff' ? 1 : 0;
    const enemyPower = boss
      ? randomInt(
          run,
          10 + run.depth + enemyBonus + intentPower,
          16 + run.depth + enemyBonus + intentPower
        )
      : randomInt(
          run,
          5 + run.depth + enemyBonus + intentPower,
          10 + run.depth + enemyBonus + intentPower
        );

    const offensePenalty = run.debuffs.cursed ? 1 : 0;
    const offense = run.attack - offensePenalty + randomInt(run, 0, run.luck + 2);
    const momentum =
      mode === 'battle_rush' || mode === 'boss_strike'
        ? 3
        : mode === 'battle_feint'
          ? randomInt(run, -1, 4)
          : 1;

    const net = offense + momentum - Math.floor(enemyPower / 2);

    if (net >= 0) {
      const reward = boss ? randomInt(run, 14, 22) : randomInt(run, 4, 9);
      run.gold += reward;
      appendLog(chapterTag('Outcome', `You win the fight and loot ${reward} gold.`));

      if (enemyKey === 'mimic') {
        addCollectible(run, 'mimic_tooth', 1);
        appendLog(chapterTag('Outcome', 'You pull a Mimic Tooth from the wreckage.'));
      }

      if (run.flags.leech > 0) {
        run.hp = Math.min(run.maxHp, run.hp + 2 * run.flags.leech);
        appendLog(chapterTag('Outcome', 'Blood Fangs heal you after the kill.'));
      }

      if (boss) {
        run.relicSecured = true;
        addCollectible(run, 'guardian_sigil', 1);
        appendLog(chapterTag('Outcome', 'The vault guardian falls. The relic is yours.'));
      }
      return;
    }

    const heavyPenalty = intent === 'heavy' ? 3 : 0;
    const fastPenalty = intent === 'fast' ? 1 : 0;
    const danger = boss ? randomInt(run, 10, 16) : randomInt(run, 4, 11);
    const damage = applyRunDamage(
      run,
      danger + heavyPenalty + fastPenalty + (mode === 'battle_rush' ? 2 : 0)
    );
    appendLog(chapterTag('Outcome', `You survive, but take ${damage} damage.`));

    const debuffChance = intent === 'debuff' ? 0.55 : 0.3;
    if (runRandom(run) < debuffChance) {
      applyDebuff(run, 'rattled', 2);
      appendLog(chapterTag('Outcome', 'Debuff gained: Rattled (-1 guard) for 2 floors.'));
    }
  };

  const chooseWeightedBuff = (run: RunState, pool: BuffKey[]): BuffKey => {
    const weighted = pool.map((key) => ({
      key,
      weight: Math.max(1, archetypeBuffWeight(run.archetype, key)),
    }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = runRandom(run) * total;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.key;
    }
    return weighted[weighted.length - 1].key;
  };

  const maybeDraftBuff = (run: RunState): boolean => {
    if (run.depth % 3 !== 0) return false;

    const pool = buffCatalog
      .filter((buff) => buff.stackable || !run.buffs[buff.key])
      .map((buff) => buff.key);

    if (pool.length === 0) return false;

    run.phase = 'buff';
    run.room = null;
    run.buffChoices = [];

    while (run.buffChoices.length < Math.min(3, pool.length)) {
      const next = chooseWeightedBuff(
        run,
        pool.filter((key) => !run.buffChoices.includes(key))
      );
      if (!run.buffChoices.includes(next)) {
        run.buffChoices.push(next);
      }
    }

    appendLog(chapterTag('Encounter', 'A relic draft appears. Choose one buff.'));
    return true;
  };

  const beginNextRoom = (): void => {
    if (!state.run) return;

    state.run.transitionMsRemaining = 0;
    state.run.transitionFrame = 0;
    state.run.depth += 1;
    state.run.floor = state.run.depth;
    state.run.locationKey = 'stairwell';

    appendLog(chapterTag('Entered', `Floor ${state.run.floor}.`));

    if (state.run.depth > 1) {
      appendLog(chapterTag('Descent', `You descend the stairs to floor ${state.run.floor}.`));
    }

    tickDebuffs(state.run);

    if (state.run.flags.scavenger > 0) {
      const bonus = 2 * state.run.flags.scavenger;
      state.run.gold += bonus;
      appendLog(chapterTag('Outcome', `Scavenger Pouch finds ${bonus} gold.`));
    }

    state.run.phase = 'room';
    const forcedType = state.run.forcedScenario;
    state.run.room = buildScenarioRoom(
      state.run,
      () => runRandom(state.run as RunState),
      (min, max) => randomInt(state.run as RunState, min, max),
      forcedType
    );
    state.run.forcedScenario = null;
    state.run.locationKey = state.run.room.locationKey;

    appendLog(
      chapterTag('Encounter', `Depth ${state.run.depth}: ${pickRandom(state.run, corridorFlavors)}`)
    );
    appendLog(chapterTag('Encounter', pickRandom(state.run, glowFlavors)));
    appendLog(
      chapterTag('Encounter', pickRandom(state.run, getEncounterFlavors(state.run.room.type)))
    );

    const entityLabel = getEntityLabel(state.run.room.entityKey);
    const locationLabel = getLocationLabel(state.run.room.locationKey);
    appendLog(chapterTag('Encounter', `Location: ${locationLabel}. Encounter: ${entityLabel}.`));

    callbacks.onScenarioSpawn?.(state.run.room, state.run);
  };

  const finishRun = (reason: string): void => {
    if (!state.run) return;

    const run = state.run;
    const victory = run.depth >= 9 || run.relicSecured;
    const collectibleScore = (
      Object.entries(run.collectibles) as [CollectibleKey, number][]
    ).reduce((sum, [key, count]) => sum + collectibleCatalog[key].score * count, 0);

    const shardsEarned = Math.max(
      1,
      Math.floor(run.depth / 2) +
        Math.floor(run.gold / 10) +
        Math.floor(collectibleScore / 2) +
        (victory ? 4 : 0)
    );

    state.meta.shards += shardsEarned;
    state.meta.runs += 1;
    if (victory) {
      state.meta.wins += 1;
    }
    state.meta.bestDepth = Math.max(state.meta.bestDepth, run.depth);

    const highlights = [
      `Seed ${run.seed}`,
      `Archetype ${run.archetype}`,
      `Depth reached ${run.depth}`,
      `Time left ${run.timeLeft.toFixed(1)}s`,
      `Top buff ${summarizeTopBuff(run.buffs)}`,
      `Relic ${run.relicSecured ? 'secured' : 'not secured'}`,
    ];

    const lastRun: LastRunState = {
      reason,
      depth: run.depth,
      gold: run.gold,
      floor: run.floor,
      victory,
      shardsEarned,
      timeLeft: run.timeLeft,
      seed: run.seed,
      archetype: run.archetype,
      buffs: { ...run.buffs },
      highlights,
      collectibles: { ...run.collectibles },
      log: [...run.log],
    };

    state.lastRun = lastRun;
    state.run = null;
    callbacks.onRunFinished?.(lastRun, state.meta.runs);
    commit();
  };

  const finalizeRoomAction = (): void => {
    if (!state.run) return;
    if (state.run.hp <= 0) {
      finishRun('defeated');
      return;
    }

    if (state.run.relicSecured) {
      finishRun('relic secured');
      return;
    }

    if (state.run.timeLeft <= 0) {
      finishRun('time expired');
      return;
    }

    if (maybeDraftBuff(state.run)) {
      commit();
      return;
    }

    state.run.phase = 'transition';
    state.run.room = null;
    state.run.transitionMsRemaining = TRANSITION_DURATION_MS;
    state.run.transitionFrame = 0;
    appendLog(chapterTag('Descent', 'You move through the corridor toward the next chamber.'));
    commit();
  };

  const startRun = (): void => {
    if (state.run) return;

    const character = createStartingCharacter(state.meta.upgrades);
    const archetype = determineArchetype(state.meta);
    const seed = (Date.now() ^ Math.imul(state.meta.runs + 1, 2654435761)) >>> 0;

    state.run = {
      active: true,
      phase: 'room',
      transitionMsRemaining: 0,
      transitionFrame: 0,
      timeLeft: 60,
      depth: 0,
      floor: 0,
      locationKey: 'stairwell',
      hp: character.hp,
      maxHp: character.maxHp,
      attack: character.attack,
      guard: character.guard,
      luck: character.luck,
      gold: character.gold,
      room: null,
      log: [
        chapterTag('Entered', `Run seed ${seed}.`),
        chapterTag('Entered', `Archetype ${archetype}.`),
        chapterTag('Entered', 'Quest: retrieve the Dawn Relic from depth 9.'),
      ],
      buffs: {},
      buffChoices: [],
      collectibles: {
        relic_shard: 0,
        mimic_tooth: 0,
        guardian_sigil: 0,
      },
      consumables: {
        tonic: 1,
        smoke_bomb: 0,
      },
      debuffs: {},
      idleBeats: 0,
      flags: {
        scavenger: 0,
        leech: 0,
        damageReduction: 0,
        smokeShield: 0,
      },
      relicSecured: false,
      archetype,
      seed,
      rngState: seed,
      forcedScenario: null,
    };

    applyArchetypeBonuses(state.run);
    beginNextRoom();
    commit();
  };

  const abandonRun = (): void => {
    if (!state.run) return;
    appendLog(chapterTag('Outcome', 'You retreat early.'));
    finishRun('abandoned');
  };

  const buyUpgrade = (upgradeKey: MetaUpgradeKey): void => {
    if (state.run) return;
    const definition = metaUpgrades.find((upgrade) => upgrade.key === upgradeKey);
    if (!definition) return;

    const level = state.meta.upgrades[upgradeKey] || 0;
    const cost = definition.cost(level);
    if (state.meta.shards < cost) return;

    state.meta.shards -= cost;
    state.meta.upgrades[upgradeKey] = level + 1;
    commit();
  };

  const resetProgress = (): void => {
    const defaults = makeDefaultBoredState();
    state.version = defaults.version;
    state.meta = defaults.meta;
    state.run = defaults.run;
    state.lastRun = defaults.lastRun;
    commit();
  };

  const resolveRoomChoice = (choiceId: ActionId): void => {
    if (!state.run || state.run.phase !== 'room' || !state.run.room) return;

    const run = state.run;
    const roomSnapshot: RoomState = { ...run.room };

    appendLog(chapterTag('Decision', `Action selected: ${choiceId}.`));

    if (choiceId === 'idle_whistle') {
      run.idleBeats += 1;
      appendLog(chapterTag('Outcome', pickRandom(run, idleFlavors)));
      if (runRandom(run) < 0.18) {
        addCollectible(run, 'relic_shard', 1);
        appendLog(chapterTag('Outcome', 'While idling, you notice and pocket a Relic Shard.'));
      }
      if (run.idleBeats > 2 && runRandom(run) < 0.2) {
        applyDebuff(run, 'cursed', 2);
        appendLog(
          chapterTag('Outcome', 'The dungeon notices your hesitation. Debuff gained: Cursed Mark.')
        );
      }
      callbacks.onActionResolved?.(choiceId, roomSnapshot, run);
      commit();
      return;
    }

    if (choiceId === 'use_tonic') {
      if (run.consumables.tonic <= 0) {
        appendLog(chapterTag('Outcome', 'You search your pack, but there is no tonic left.'));
        callbacks.onActionResolved?.(choiceId, roomSnapshot, run);
        commit();
        return;
      }
      run.consumables.tonic -= 1;
      run.hp = Math.min(run.maxHp, run.hp + 10);
      appendLog(chapterTag('Outcome', 'You drink a tonic and recover 10 HP.'));
      callbacks.onActionResolved?.(choiceId, roomSnapshot, run);
      commit();
      return;
    }

    if (choiceId === 'use_smoke') {
      if (run.consumables.smoke_bomb <= 0) {
        appendLog(chapterTag('Outcome', 'No smoke bomb left to throw.'));
        callbacks.onActionResolved?.(choiceId, roomSnapshot, run);
        commit();
        return;
      }
      run.consumables.smoke_bomb -= 1;
      run.flags.smokeShield += 1;
      appendLog(chapterTag('Outcome', 'Smoke fills the room. Your next hit will be negated.'));
      callbacks.onActionResolved?.(choiceId, roomSnapshot, run);
      commit();
      return;
    }

    consumeTime(run, actionCatalog[choiceId].timeCost);

    switch (choiceId) {
      case 'battle_rush':
      case 'battle_guard':
      case 'battle_feint': {
        resolveBattle(run, choiceId, roomSnapshot.intent, false, roomSnapshot.entityKey);
        break;
      }
      case 'boss_strike':
      case 'boss_guard': {
        resolveBattle(run, choiceId, roomSnapshot.intent, true, 'vault_guardian');
        break;
      }
      case 'cache_rummage': {
        const gold = randomInt(run, 4, 9);
        const heal = randomInt(run, 0, 3);
        run.gold += gold;
        run.hp = Math.min(run.maxHp, run.hp + heal);
        appendLog(chapterTag('Outcome', `You gather ${gold} gold and recover ${heal} HP.`));
        if (runRandom(run) < 0.35) {
          addConsumable(run, 'tonic', 1);
          appendLog(chapterTag('Outcome', 'You find a sealed tonic in the crates.'));
        }
        break;
      }
      case 'cache_smash': {
        const gold = randomInt(run, 7, 13);
        run.gold += gold;
        const trap = randomInt(run, 0, 10);
        if (trap > run.luck + 4) {
          const damage = applyRunDamage(run, randomInt(run, 3, 8));
          appendLog(
            chapterTag('Outcome', `Trap springs. You gain ${gold} gold but lose ${damage} HP.`)
          );
          if (runRandom(run) < 0.4) {
            applyDebuff(run, 'rattled', 2);
            appendLog(chapterTag('Outcome', 'The blast leaves you rattled for 2 floors.'));
          }
        } else {
          appendLog(chapterTag('Outcome', `You smash crates and collect ${gold} gold.`));
          if (runRandom(run) < 0.25) {
            addConsumable(run, 'smoke_bomb', 1);
            appendLog(chapterTag('Outcome', 'You recover a working smoke bomb.'));
          }
        }
        if (runRandom(run) < 0.2) {
          addCollectible(run, 'relic_shard', 1);
          appendLog(chapterTag('Outcome', 'Hidden under splinters: a Relic Shard.'));
        }
        break;
      }
      case 'shrine_bless': {
        run.attack += 1;
        const damage = applyRunDamage(run, randomInt(run, 2, 5));
        appendLog(
          chapterTag('Outcome', `Dark blessing grants +1 attack at the cost of ${damage} HP.`)
        );
        if (runRandom(run) < 0.4) {
          applyDebuff(run, 'cursed', 2);
          appendLog(
            chapterTag('Outcome', 'The blessing brands you with a Cursed Mark for 2 floors.')
          );
        }
        break;
      }
      case 'shrine_pray': {
        run.timeLeft = Math.min(90, run.timeLeft + 4);
        run.hp = Math.min(run.maxHp, run.hp + 3);
        appendLog(chapterTag('Outcome', 'A calm prayer gives +4s and +3 HP.'));
        if (runRandom(run) < 0.25) {
          addCollectible(run, 'relic_shard', 1);
          appendLog(chapterTag('Outcome', 'A shard flakes from the shrine into your hand.'));
        }
        break;
      }
      case 'merchant_tonic': {
        if (run.gold >= 6) {
          run.gold -= 6;
          run.hp = Math.min(run.maxHp, run.hp + 5);
          addConsumable(run, 'tonic', 1);
          appendLog(chapterTag('Outcome', 'You buy a tonic and patch 5 HP on the spot.'));
        } else {
          appendLog(chapterTag('Outcome', 'Not enough gold for the tonic.'));
        }
        break;
      }
      case 'merchant_blade': {
        if (run.gold >= 8) {
          run.gold -= 8;
          run.attack += 2;
          appendLog(chapterTag('Outcome', 'Your weapon is sharpened: +2 attack.'));
        } else {
          appendLog(chapterTag('Outcome', 'Not enough gold for sharpening.'));
        }
        break;
      }
      case 'merchant_leave': {
        run.forcedScenario = 'battle';
        appendLog(
          chapterTag('Outcome', 'You leave the trader behind. A raider shadow follows your route.')
        );
        break;
      }
      case 'rest_breathe': {
        run.hp = Math.min(run.maxHp, run.hp + 6);
        appendLog(chapterTag('Outcome', 'You rest and recover 6 HP.'));
        if (run.debuffs.rattled || run.debuffs.cursed) {
          delete run.debuffs.rattled;
          delete run.debuffs.cursed;
          appendLog(chapterTag('Outcome', 'The rest clears your active debuffs.'));
        }
        break;
      }
      case 'rest_scout': {
        const found = randomInt(run, 3, 7);
        run.gold += found;
        run.luck += 1;
        appendLog(chapterTag('Outcome', `Scouting finds ${found} gold and raises luck by 1.`));
        if (runRandom(run) < 0.3) {
          addConsumable(run, 'smoke_bomb', 1);
          appendLog(chapterTag('Outcome', 'You scout an escape lane and pocket a smoke bomb.'));
        }
        if (runRandom(run) < 0.22) {
          run.forcedScenario = 'lore';
          appendLog(chapterTag('Descent', 'Your route map points to a rune archive next.'));
        }
        break;
      }
      case 'trap_disarm': {
        const gold = randomInt(run, 2, 5);
        run.gold += gold;
        appendLog(chapterTag('Outcome', `You disarm the mechanism and salvage ${gold} gold.`));
        break;
      }
      case 'trap_dash': {
        const damage = applyRunDamage(run, randomInt(run, 3, 7));
        appendLog(
          chapterTag('Outcome', `You dash through and take ${damage} damage to save time.`)
        );
        break;
      }
      case 'trap_salvage': {
        const gold = randomInt(run, 7, 12);
        run.gold += gold;
        const damage = applyRunDamage(run, randomInt(run, 1, 5));
        run.forcedScenario = 'cache';
        appendLog(chapterTag('Outcome', `You salvage ${gold} gold and take ${damage} damage.`));
        appendLog(chapterTag('Descent', 'The torn chamber reveals a nearby supply cache.'));
        break;
      }
      case 'lore_study': {
        run.luck += 1;
        run.timeLeft = Math.min(90, run.timeLeft + 2);
        appendLog(chapterTag('Outcome', 'Rune study grants +1 luck and +2s.'));
        if (runRandom(run) < 0.35) {
          addCollectible(run, 'relic_shard', 1);
          appendLog(chapterTag('Outcome', 'You decode a clue and recover a Relic Shard.'));
        }
        break;
      }
      case 'lore_pledge': {
        run.attack += 1;
        run.forcedScenario = 'shrine';
        appendLog(
          chapterTag('Outcome', 'You swear an oath: +1 attack, path bends toward a shrine.')
        );
        if (runRandom(run) < 0.35) {
          applyDebuff(run, 'cursed', 2);
          appendLog(chapterTag('Outcome', 'The oath leaves a Cursed Mark for 2 floors.'));
        }
        break;
      }
      default:
        break;
    }

    callbacks.onActionResolved?.(choiceId, roomSnapshot, run);
    appendLog(chapterTag('Outcome', 'Encounter resolved.'));
    run.room = null;
    finalizeRoomAction();
  };

  const chooseBuff = (buffKey: BuffKey): void => {
    if (!state.run || state.run.phase !== 'buff') return;
    const buff = buffCatalog.find((entry) => entry.key === buffKey);
    if (!buff) return;

    state.run.buffs[buff.key] = (state.run.buffs[buff.key] || 0) + 1;
    buff.apply(state.run);

    appendLog(chapterTag('Outcome', `Buff chosen: ${buff.label}.`));
    appendLog(chapterTag('Descent', 'The relic settles in your pack. The path forward opens.'));

    state.run.phase = 'transition';
    state.run.buffChoices = [];
    state.run.transitionMsRemaining = TRANSITION_DURATION_MS;
    state.run.transitionFrame = 0;

    if (state.run.hp <= 0) {
      finishRun('defeated');
      return;
    }

    commit();
  };

  const tick = (elapsedMs = 100): void => {
    if (!state.run) return;

    if (state.run.phase === 'transition') {
      const previousFrame = state.run.transitionFrame;
      state.run.transitionMsRemaining = clamp(
        state.run.transitionMsRemaining - elapsedMs,
        0,
        TRANSITION_DURATION_MS
      );
      const nextFrame = Math.floor(
        (TRANSITION_DURATION_MS - state.run.transitionMsRemaining) / TRANSITION_FRAME_MS
      );
      state.run.transitionFrame = nextFrame % TRANSITION_FRAME_COUNT;

      if (state.run.transitionMsRemaining <= 0) {
        beginNextRoom();
        commit();
      } else if (previousFrame !== state.run.transitionFrame) {
        commitTransient();
      }
      return;
    }

    if (state.run.timeLeft <= 0) {
      finishRun('time expired');
    }
  };

  return {
    startRun,
    abandonRun,
    buyUpgrade,
    resetProgress,
    resolveRoomChoice,
    chooseBuff,
    tick,
  };
}
