import type {
  ActionDefinition,
  ActionId,
  BuffDefinition,
  CatalogEntry,
  CollectibleDefinition,
  CollectibleKey,
  ConsumableDefinition,
  ConsumableKey,
  DebuffDefinition,
  DebuffKey,
  EncounterFlavorMap,
  EntityKey,
  LocationKey,
  MetaUpgradeDefinition,
} from './types';

export const STORAGE_KEY = 'bored-dungeon-v3';
export const VERSION = 3;

export const metaUpgrades: MetaUpgradeDefinition[] = [
  {
    key: 'vigor',
    label: 'Vigor',
    description: '+5 starting max HP per level.',
    cost: (level: number) => 6 + level * 5,
  },
  {
    key: 'might',
    label: 'Might',
    description: '+1 starting attack per level.',
    cost: (level: number) => 8 + level * 6,
  },
  {
    key: 'instinct',
    label: 'Instinct',
    description: '+1 starting luck and +2 starting gold per level.',
    cost: (level: number) => 7 + level * 5,
  },
];

export const buffCatalog: BuffDefinition[] = [
  {
    key: 'iron_fur',
    label: 'Iron Fur',
    description: '+8 max HP and heal 8.',
    stackable: true,
    apply: (run) => {
      run.maxHp += 8;
      run.hp = Math.min(run.maxHp, run.hp + 8);
    },
  },
  {
    key: 'razor_claws',
    label: 'Razor Claws',
    description: '+2 attack.',
    stackable: true,
    apply: (run) => {
      run.attack += 2;
    },
  },
  {
    key: 'bone_guard',
    label: 'Bone Guard',
    description: '+1 guard.',
    stackable: true,
    apply: (run) => {
      run.guard += 1;
    },
  },
  {
    key: 'lucky_whiskers',
    label: 'Lucky Whiskers',
    description: '+2 luck.',
    stackable: true,
    apply: (run) => {
      run.luck += 2;
    },
  },
  {
    key: 'time_pocket',
    label: 'Time Pocket',
    description: '+7 seconds.',
    stackable: true,
    apply: (run) => {
      run.timeLeft = Math.min(90, run.timeLeft + 7);
    },
  },
  {
    key: 'scavenger_pouch',
    label: 'Scavenger Pouch',
    description: 'Gain +2 gold at the start of each room.',
    stackable: false,
    apply: (run) => {
      run.flags.scavenger += 1;
    },
  },
  {
    key: 'blood_fangs',
    label: 'Blood Fangs',
    description: 'Heal 2 after each battle.',
    stackable: false,
    apply: (run) => {
      run.flags.leech += 1;
    },
  },
  {
    key: 'thick_hide',
    label: 'Thick Hide',
    description: 'Reduce incoming damage by 1.',
    stackable: false,
    apply: (run) => {
      run.flags.damageReduction += 1;
    },
  },
];

export const corridorFlavors: string[] = [
  'You walk for a while and find only damp stone and silence.',
  'Your footsteps echo through an empty stretch of corridor.',
  'Cold air slips past as you move through a dead, quiet hall.',
  'Nothing but dust and broken lantern hooks line this passage.',
];

export const glowFlavors: string[] = [
  'A faint glow crawls across the wall ahead.',
  'A thin blue shimmer leaks from cracked stone.',
  'You spot a weak light pulsing between old bricks.',
  'A ghostly glimmer paints the tunnel in pale color.',
];

export const encounterFlavors: EncounterFlavorMap = {
  battle: [
    'When you touch the glow, a raider rushes from the dark.',
    'You brush the glowing mark and a snarl answers back.',
    'The light snaps out and a hostile shadow lunges forward.',
  ],
  cache: [
    'The glow fades, revealing supply crates packed in dust.',
    'The wall opens into a forgotten cache of old gear.',
    'Behind the lit stone sits a stash no one came back for.',
  ],
  shrine: [
    'The light gathers into ash symbols around a waiting shrine.',
    'A shrine forms from smoke and asks for a choice.',
    'Runes burn briefly, and a shrine offers power at a cost.',
  ],
  merchant: [
    'The glow reflects in glass vials held by a shadow merchant.',
    'A trader steps from the dark as the glow settles.',
    'Coins rattle nearby; a hooded merchant waits for you.',
  ],
  rest: [
    'The glow softens into a quiet alcove where you can breathe.',
    'The passage opens into a still corner, safe for a moment.',
    'You find a calm pocket in the dungeon and catch your breath.',
  ],
  boss: [
    'The wall-light flares and the vault guardian stomps into view.',
    'The glow tears open the chamber and a giant silhouette rises.',
    'A towering guard emerges as the light burns white-hot.',
  ],
  mimic: [
    'The glowing crate opens one wet eye and snaps at your hand.',
    'Splintered wood flexes into teeth. It was a mimic.',
    'The cache shifts, grins, and lunges. Definitely a mimic.',
  ],
  trap: [
    'A tripwire twangs and blades unfold from the wall.',
    'Tiles click beneath your boot and darts streak past.',
    'The glow fractures into warning sigils and a trap arms itself.',
  ],
  lore: [
    'Etched runes pulse with an old memory of the vault.',
    'A whispering wall records names of failed runners.',
    'A ghostly scribe traces new lines as you approach.',
  ],
};

export const entityCatalog: Record<EntityKey, CatalogEntry<EntityKey>> = {
  none: { key: 'none', label: 'No immediate threat', kind: 'none' },
  player: { key: 'player', label: 'Nyx, Lantern Courier', kind: 'player' },
  tunnel_raider: { key: 'tunnel_raider', label: 'Tunnel Raider', kind: 'enemy' },
  mimic: { key: 'mimic', label: 'Mimic Cache', kind: 'enemy' },
  shrine_wisp: { key: 'shrine_wisp', label: 'Ash Wisp', kind: 'encounter' },
  shadow_merchant: { key: 'shadow_merchant', label: 'Shadow Merchant', kind: 'npc' },
  vault_guardian: { key: 'vault_guardian', label: 'Vault Guardian', kind: 'boss' },
  wire_snare: { key: 'wire_snare', label: 'Wire Snare', kind: 'trap' },
  echo_scribe: { key: 'echo_scribe', label: 'Echo Scribe', kind: 'lore' },
};

export const locationCatalog: Record<LocationKey, CatalogEntry<LocationKey>> = {
  stairwell: { key: 'stairwell', label: 'Stairwell', kind: 'transition' },
  corridor: { key: 'corridor', label: 'Shadow Corridor', kind: 'travel' },
  cache: { key: 'cache', label: 'Dust Cache', kind: 'encounter' },
  shrine: { key: 'shrine', label: 'Ash Shrine', kind: 'encounter' },
  market: { key: 'market', label: 'Whisper Market', kind: 'encounter' },
  alcove: { key: 'alcove', label: 'Quiet Alcove', kind: 'encounter' },
  vault_gate: { key: 'vault_gate', label: 'Vault Gate', kind: 'boss' },
  archives: { key: 'archives', label: 'Rune Archives', kind: 'lore' },
  gauntlet: { key: 'gauntlet', label: 'Blade Gauntlet', kind: 'trap' },
};

export const actionCatalog: Record<ActionId, ActionDefinition> = {
  battle_rush: { id: 'battle_rush', timeCost: 7, kind: 'combat' },
  battle_guard: { id: 'battle_guard', timeCost: 9, kind: 'combat' },
  battle_feint: { id: 'battle_feint', timeCost: 8, kind: 'combat' },
  boss_strike: { id: 'boss_strike', timeCost: 8, kind: 'combat' },
  boss_guard: { id: 'boss_guard', timeCost: 10, kind: 'combat' },
  cache_rummage: { id: 'cache_rummage', timeCost: 6, kind: 'loot' },
  cache_smash: { id: 'cache_smash', timeCost: 5, kind: 'loot' },
  shrine_bless: { id: 'shrine_bless', timeCost: 6, kind: 'ritual' },
  shrine_pray: { id: 'shrine_pray', timeCost: 7, kind: 'ritual' },
  merchant_tonic: { id: 'merchant_tonic', timeCost: 4, kind: 'trade' },
  merchant_blade: { id: 'merchant_blade', timeCost: 5, kind: 'trade' },
  merchant_leave: { id: 'merchant_leave', timeCost: 3, kind: 'trade' },
  rest_breathe: { id: 'rest_breathe', timeCost: 6, kind: 'recovery' },
  rest_scout: { id: 'rest_scout', timeCost: 5, kind: 'recovery' },
  trap_disarm: { id: 'trap_disarm', timeCost: 6, kind: 'trap' },
  trap_dash: { id: 'trap_dash', timeCost: 4, kind: 'trap' },
  trap_salvage: { id: 'trap_salvage', timeCost: 7, kind: 'trap' },
  lore_study: { id: 'lore_study', timeCost: 5, kind: 'lore' },
  lore_pledge: { id: 'lore_pledge', timeCost: 6, kind: 'lore' },
  use_tonic: { id: 'use_tonic', timeCost: 0, kind: 'consumable' },
  use_smoke: { id: 'use_smoke', timeCost: 0, kind: 'consumable' },
  idle_whistle: { id: 'idle_whistle', timeCost: 0, kind: 'idle' },
};

export const collectibleCatalog: Record<CollectibleKey, CollectibleDefinition> = {
  relic_shard: { key: 'relic_shard', label: 'Relic Shard', score: 2 },
  mimic_tooth: { key: 'mimic_tooth', label: 'Mimic Tooth', score: 1 },
  guardian_sigil: { key: 'guardian_sigil', label: 'Guardian Sigil', score: 4 },
};

export const consumableCatalog: Record<ConsumableKey, ConsumableDefinition> = {
  tonic: { key: 'tonic', label: 'Tonic', description: 'Restore 10 HP instantly.' },
  smoke_bomb: {
    key: 'smoke_bomb',
    label: 'Smoke Bomb',
    description: 'Negate next hit in this encounter.',
  },
};

export const debuffCatalog: Record<DebuffKey, DebuffDefinition> = {
  rattled: { key: 'rattled', label: 'Rattled', description: '-1 guard for 2 floors.' },
  cursed: { key: 'cursed', label: 'Cursed Mark', description: '-1 attack for 2 floors.' },
};

export const idleFlavors: string[] = [
  'You whistle a half-remembered song. The dungeon listens.',
  'You hum a nervous tune and steady your breathing.',
  'You pause. Somewhere ahead, water drips in rhythm.',
  'You whistle softly and the corridor answers with echo.',
];
