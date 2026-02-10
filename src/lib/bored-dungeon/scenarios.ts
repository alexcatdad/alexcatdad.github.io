import { actionCatalog } from './catalog';
import type {
  ActionId,
  EnemyIntent,
  RoomOption,
  RoomState,
  RoomTag,
  RoomType,
  RunState,
} from './types';

interface ScenarioBuildTools {
  makeActionOption: (id: ActionId, label: string, description: string) => RoomOption;
  withUtilityActions: (run: RunState, roomType: RoomType, options: RoomOption[]) => RoomOption[];
  randomInt: (min: number, max: number) => number;
}

interface ScenarioDefinition {
  id: RoomType;
  tags: RoomTag[];
  canSpawn: (run: RunState) => boolean;
  weight: (run: RunState) => number;
  build: (run: RunState, tools: ScenarioBuildTools) => RoomState;
}

function actionTimeCost(actionId: ActionId): number {
  return actionCatalog[actionId].timeCost;
}

function makeActionOption(id: ActionId, label: string, description: string): RoomOption {
  const cost = actionTimeCost(id);
  const suffix = cost > 0 ? ` Costs ${cost}s.` : ' No time cost.';
  return { id, label, description: `${description}${suffix}` };
}

function withUtilityActions(
  run: RunState,
  roomType: RoomType,
  options: RoomOption[]
): RoomOption[] {
  const next = [...options];

  if (run.consumables.tonic > 0 && run.hp < run.maxHp) {
    next.push(
      makeActionOption('use_tonic', 'Use tonic', `Restore 10 HP (${run.consumables.tonic} left).`)
    );
  }

  if (
    run.consumables.smoke_bomb > 0 &&
    (roomType === 'battle' || roomType === 'boss' || roomType === 'mimic' || roomType === 'trap')
  ) {
    next.push(
      makeActionOption(
        'use_smoke',
        'Throw smoke bomb',
        `Avoid the next hit in this encounter (${run.consumables.smoke_bomb} left).`
      )
    );
  }

  next.push(
    makeActionOption('idle_whistle', 'Whistle and listen', 'Take a breath and gather yourself.')
  );
  return next;
}

function randomCombatIntent(randomInt: (min: number, max: number) => number): EnemyIntent {
  const roll = randomInt(0, 99);
  if (roll < 40) return 'fast';
  if (roll < 75) return 'heavy';
  return 'debuff';
}

const scenarioCatalog: ScenarioDefinition[] = [
  {
    id: 'boss',
    tags: ['boss', 'combat'],
    canSpawn: (run) => run.depth >= 10,
    weight: () => 50,
    build: (run, tools) => ({
      type: 'boss',
      tags: ['boss', 'combat'],
      locationKey: 'vault_gate',
      entityKey: 'vault_guardian',
      title: 'Vault Guardian',
      description: 'A plated brute blocks the relic vault.',
      intent: randomCombatIntent(tools.randomInt),
      mission: 'Break through and secure the Dawn Relic.',
      risk: 'High incoming damage with debuff pressure.',
      options: tools.withUtilityActions(run, 'boss', [
        tools.makeActionOption(
          'boss_strike',
          'All-in strike',
          'Spend time for high damage momentum.'
        ),
        tools.makeActionOption(
          'boss_guard',
          'Measured duel',
          'Spend more time to reduce incoming damage.'
        ),
      ]),
    }),
  },
  {
    id: 'battle',
    tags: ['combat'],
    canSpawn: () => true,
    weight: (run) => (run.depth < 4 ? 42 : 30),
    build: (run, tools) => ({
      type: 'battle',
      tags: ['combat'],
      locationKey: 'corridor',
      entityKey: 'tunnel_raider',
      title: 'Snarl in the dark',
      description: 'A tunnel raider rushes you.',
      intent: randomCombatIntent(tools.randomInt),
      mission: 'Win quickly to preserve HP and keep momentum.',
      risk: 'Bad exchanges convert seconds into damage.',
      options: tools.withUtilityActions(run, 'battle', [
        tools.makeActionOption(
          'battle_rush',
          'Rush attack',
          'Spend 7s for faster kill and bigger retaliation risk.'
        ),
        tools.makeActionOption(
          'battle_guard',
          'Guarded stance',
          'Spend 9s to trade time for safety.'
        ),
        tools.makeActionOption('battle_feint', 'Feint and stab', 'Spend 8s for luck-based payoff.'),
      ]),
    }),
  },
  {
    id: 'mimic',
    tags: ['combat', 'loot'],
    canSpawn: () => true,
    weight: (run) => 6 + run.depth * 0.9,
    build: (run, tools) => ({
      type: 'mimic',
      tags: ['combat', 'loot'],
      locationKey: 'cache',
      entityKey: 'mimic',
      title: 'Grinning mimic',
      description: 'A treasure chest opens rows of jagged teeth.',
      intent: randomCombatIntent(tools.randomInt),
      mission: 'Kill it and claim a rare collectible.',
      risk: 'High burst damage if you misread timing.',
      options: tools.withUtilityActions(run, 'mimic', [
        tools.makeActionOption('battle_rush', 'Crack it fast', 'Spend 7s for explosive opener.'),
        tools.makeActionOption('battle_guard', 'Circle carefully', 'Spend 9s to reduce variance.'),
        tools.makeActionOption(
          'battle_feint',
          'Bait the bite',
          'Spend 8s for high-risk timing play.'
        ),
      ]),
    }),
  },
  {
    id: 'cache',
    tags: ['loot'],
    canSpawn: () => true,
    weight: (run) => (run.depth <= 4 ? 24 : 14),
    build: (run, tools) => ({
      type: 'cache',
      tags: ['loot'],
      locationKey: 'cache',
      entityKey: 'none',
      title: 'Dusty cache',
      description: 'Old supply crates line the wall.',
      intent: 'none',
      mission: 'Convert seconds into gold and supplies.',
      risk: 'Greed paths can trigger trap damage.',
      options: tools.withUtilityActions(run, 'cache', [
        tools.makeActionOption(
          'cache_rummage',
          'Rummage carefully',
          'Spend 6s for stable gold and light sustain.'
        ),
        tools.makeActionOption(
          'cache_smash',
          'Smash and grab',
          'Spend 5s for more gold and trap risk.'
        ),
      ]),
    }),
  },
  {
    id: 'trap',
    tags: ['trap'],
    canSpawn: (run) => run.depth >= 2,
    weight: (run) => (run.depth < 5 ? 8 : 15),
    build: (run, tools) => ({
      type: 'trap',
      tags: ['trap'],
      locationKey: 'gauntlet',
      entityKey: 'wire_snare',
      title: 'Blade gauntlet',
      description: 'Tripwires and steel petals lock the corridor.',
      intent: 'heavy',
      mission: 'Escape with minimal HP loss.',
      risk: 'Rushing can burn HP; salvaging can cost extra time.',
      options: tools.withUtilityActions(run, 'trap', [
        tools.makeActionOption(
          'trap_disarm',
          'Disarm methodically',
          'Spend 6s to avoid most damage and gain control.'
        ),
        tools.makeActionOption(
          'trap_dash',
          'Dash through',
          'Spend 4s to save time at higher injury risk.'
        ),
        tools.makeActionOption(
          'trap_salvage',
          'Salvage gears',
          'Spend 7s for loot and force a cache follow-up.'
        ),
      ]),
    }),
  },
  {
    id: 'shrine',
    tags: ['lore', 'recovery'],
    canSpawn: () => true,
    weight: (run) => (run.depth >= 3 ? 16 : 10),
    build: (run, tools) => ({
      type: 'shrine',
      tags: ['lore', 'recovery'],
      locationKey: 'shrine',
      entityKey: 'shrine_wisp',
      title: 'Shrine of ash',
      description: 'A whisper offers power for a price.',
      intent: 'debuff',
      mission: 'Pick a rite that fits your build plan.',
      risk: 'Blessing routes can apply long-tail debuffs.',
      options: tools.withUtilityActions(run, 'shrine', [
        tools.makeActionOption(
          'shrine_bless',
          'Take blessing',
          'Spend 6s to trade HP for permanent attack.'
        ),
        tools.makeActionOption('shrine_pray', 'Quiet prayer', 'Spend 7s to buy time and recovery.'),
      ]),
    }),
  },
  {
    id: 'lore',
    tags: ['lore'],
    canSpawn: (run) => run.depth >= 3,
    weight: (run) => (run.depth >= 6 ? 15 : 8),
    build: (run, tools) => ({
      type: 'lore',
      tags: ['lore'],
      locationKey: 'archives',
      entityKey: 'echo_scribe',
      title: 'Rune archives',
      description: 'A spectral scribe trails your steps and records your intent.',
      intent: 'none',
      mission: 'Take knowledge to improve the next rooms.',
      risk: 'Wrong oath can chain you into harder rooms.',
      options: tools.withUtilityActions(run, 'lore', [
        tools.makeActionOption(
          'lore_study',
          'Study inscriptions',
          'Spend 5s for luck and relic clues.'
        ),
        tools.makeActionOption(
          'lore_pledge',
          'Swear a blood oath',
          'Spend 6s for power and forced shrine follow-up.'
        ),
      ]),
    }),
  },
  {
    id: 'merchant',
    tags: ['merchant'],
    canSpawn: () => true,
    weight: (run) => (run.gold > 8 ? 16 : 10),
    build: (run, tools) => ({
      type: 'merchant',
      tags: ['merchant'],
      locationKey: 'market',
      entityKey: 'shadow_merchant',
      title: 'Shadow merchant',
      description: 'A hooded trader rattles vials and blades.',
      intent: 'none',
      mission: 'Convert gold into a safer build spike.',
      risk: 'Leaving can trigger an ambush chain.',
      options: tools.withUtilityActions(run, 'merchant', [
        tools.makeActionOption(
          'merchant_tonic',
          'Buy tonic (6 gold)',
          'Spend 4s and gold for sustain now + inventory.'
        ),
        tools.makeActionOption(
          'merchant_blade',
          'Sharpen weapon (8 gold)',
          'Spend 5s and gold for scaling damage.'
        ),
        tools.makeActionOption(
          'merchant_leave',
          'Keep moving',
          'Spend 3s, keep gold, risk immediate ambush.'
        ),
      ]),
    }),
  },
  {
    id: 'rest',
    tags: ['recovery'],
    canSpawn: () => true,
    weight: (run) => (run.hp < run.maxHp / 2 ? 18 : 8),
    build: (run, tools) => ({
      type: 'rest',
      tags: ['recovery'],
      locationKey: 'alcove',
      entityKey: 'none',
      title: 'Quiet alcove',
      description: 'A moment to breathe.',
      intent: 'none',
      mission: 'Trade time for survivability and setup.',
      risk: 'Too much resting can starve depth progress.',
      options: tools.withUtilityActions(run, 'rest', [
        tools.makeActionOption(
          'rest_breathe',
          'Patch wounds',
          'Spend 6s for direct HP stabilization.'
        ),
        tools.makeActionOption(
          'rest_scout',
          'Scout ahead',
          'Spend 5s for gold, luck, and route info.'
        ),
      ]),
    }),
  },
];

function pickWeightedScenario(
  run: RunState,
  random: () => number,
  forcedType: RoomType | null
): ScenarioDefinition {
  if (forcedType) {
    const forced = scenarioCatalog.find((scenario) => scenario.id === forcedType);
    if (forced) return forced;
  }

  const candidates = scenarioCatalog.filter((scenario) => scenario.canSpawn(run));
  const weighted = candidates.map((scenario) => ({
    scenario,
    weight: Math.max(0, scenario.weight(run)),
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);

  if (total <= 0 || weighted.length === 0) {
    return scenarioCatalog.find((entry) => entry.id === 'battle') || scenarioCatalog[0];
  }

  let roll = random() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.scenario;
    }
  }

  return weighted[weighted.length - 1].scenario;
}

export function buildScenarioRoom(
  run: RunState,
  random: () => number,
  randomInt: (min: number, max: number) => number,
  forcedType: RoomType | null = null
): RoomState {
  const tools: ScenarioBuildTools = {
    makeActionOption,
    withUtilityActions,
    randomInt,
  };

  const scenario = pickWeightedScenario(run, random, forcedType);
  return scenario.build(run, tools);
}

export function listScenarioIds(): RoomType[] {
  return scenarioCatalog.map((scenario) => scenario.id);
}
