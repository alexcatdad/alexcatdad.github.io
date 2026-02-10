export type MetaUpgradeKey = 'vigor' | 'might' | 'instinct';
export type RunPhase = 'room' | 'buff' | 'transition';
export type RoomType =
  | 'battle'
  | 'cache'
  | 'shrine'
  | 'merchant'
  | 'rest'
  | 'boss'
  | 'mimic'
  | 'trap'
  | 'lore';
export type RoomTag = 'combat' | 'trap' | 'merchant' | 'lore' | 'recovery' | 'loot' | 'boss';
export type EnemyIntent = 'none' | 'fast' | 'heavy' | 'debuff';

export type LocationKey =
  | 'stairwell'
  | 'corridor'
  | 'cache'
  | 'shrine'
  | 'market'
  | 'alcove'
  | 'vault_gate'
  | 'archives'
  | 'gauntlet';

export type EntityKey =
  | 'none'
  | 'player'
  | 'tunnel_raider'
  | 'mimic'
  | 'shrine_wisp'
  | 'shadow_merchant'
  | 'vault_guardian'
  | 'wire_snare'
  | 'echo_scribe';

export type ActionId =
  | 'battle_rush'
  | 'battle_guard'
  | 'battle_feint'
  | 'boss_strike'
  | 'boss_guard'
  | 'cache_rummage'
  | 'cache_smash'
  | 'shrine_bless'
  | 'shrine_pray'
  | 'merchant_tonic'
  | 'merchant_blade'
  | 'merchant_leave'
  | 'rest_breathe'
  | 'rest_scout'
  | 'trap_disarm'
  | 'trap_dash'
  | 'trap_salvage'
  | 'lore_study'
  | 'lore_pledge'
  | 'use_tonic'
  | 'use_smoke'
  | 'idle_whistle';

export type CollectibleKey = 'relic_shard' | 'mimic_tooth' | 'guardian_sigil';
export type ConsumableKey = 'tonic' | 'smoke_bomb';
export type DebuffKey = 'rattled' | 'cursed';
export type PlayerArchetype = 'balanced' | 'bulwark' | 'blitz' | 'scavenger';

export type BuffKey =
  | 'iron_fur'
  | 'razor_claws'
  | 'bone_guard'
  | 'lucky_whiskers'
  | 'time_pocket'
  | 'scavenger_pouch'
  | 'blood_fangs'
  | 'thick_hide';

export interface MetaUpgrades {
  vigor: number;
  might: number;
  instinct: number;
}

export interface MetaState {
  alias: string;
  shards: number;
  runs: number;
  wins: number;
  bestDepth: number;
  upgrades: MetaUpgrades;
}

export interface RunFlags {
  scavenger: number;
  leech: number;
  damageReduction: number;
  smokeShield: number;
}

export interface RoomOption {
  id: ActionId;
  label: string;
  description: string;
}

export interface RoomState {
  type: RoomType;
  tags: RoomTag[];
  locationKey: LocationKey;
  entityKey: EntityKey;
  title: string;
  description: string;
  intent: EnemyIntent;
  mission: string;
  risk: string;
  options: RoomOption[];
}

export interface RunState {
  active: boolean;
  phase: RunPhase;
  transitionMsRemaining: number;
  transitionFrame: number;
  timeLeft: number;
  depth: number;
  floor: number;
  locationKey: LocationKey;
  hp: number;
  maxHp: number;
  attack: number;
  guard: number;
  luck: number;
  gold: number;
  room: RoomState | null;
  log: string[];
  buffs: Partial<Record<BuffKey, number>>;
  buffChoices: BuffKey[];
  collectibles: Record<CollectibleKey, number>;
  consumables: Record<ConsumableKey, number>;
  debuffs: Partial<Record<DebuffKey, number>>;
  idleBeats: number;
  flags: RunFlags;
  relicSecured: boolean;
  archetype: PlayerArchetype;
  seed: number;
  rngState: number;
  forcedScenario: RoomType | null;
}

export interface LastRunState {
  reason: string;
  depth: number;
  floor: number;
  gold: number;
  victory: boolean;
  shardsEarned: number;
  timeLeft: number;
  seed: number;
  archetype: PlayerArchetype;
  buffs: Partial<Record<BuffKey, number>>;
  highlights: string[];
  collectibles: Record<CollectibleKey, number>;
  log: string[];
}

export interface LeaderboardEntry {
  id?: number;
  createdAt: number;
  alias: string;
  runNumber: number;
  depth: number;
  floor: number;
  gold: number;
  shardsEarned: number;
  victory: boolean;
  reason: string;
  seed: number;
  archetype: PlayerArchetype;
  buildSummary: string;
}

export interface BoredState {
  version: number;
  meta: MetaState;
  run: RunState | null;
  lastRun: LastRunState | null;
}

export interface MetaUpgradeDefinition {
  key: MetaUpgradeKey;
  label: string;
  description: string;
  cost: (level: number) => number;
}

export interface BuffDefinition {
  key: BuffKey;
  label: string;
  description: string;
  stackable: boolean;
  apply: (run: RunState) => void;
}

export interface CatalogEntry<K extends string = string> {
  key: K;
  label: string;
  kind: string;
}

export interface ActionDefinition {
  id: ActionId;
  timeCost: number;
  kind: string;
}

export interface CollectibleDefinition {
  key: CollectibleKey;
  label: string;
  score: number;
}

export interface ConsumableDefinition {
  key: ConsumableKey;
  label: string;
  description: string;
}

export interface DebuffDefinition {
  key: DebuffKey;
  label: string;
  description: string;
}

export type EncounterFlavorMap = Record<RoomType, string[]>;

export interface UiRefs {
  statTime: HTMLElement;
  statDepth: HTMLElement;
  statHp: HTMLElement;
  statAtk: HTMLElement;
  statGuard: HTMLElement;
  statLuck: HTMLElement;
  statGold: HTMLElement;
  statGoal: HTMLElement;
  statRelic: HTMLElement;
  roomTitle: HTMLElement;
  roomDescription: HTMLElement;
  roomIntent: HTMLElement;
  roomMission: HTMLElement;
  roomRisk: HTMLElement;
  transitionAscii: HTMLPreElement;
  choiceList: HTMLElement;
  questRole: HTMLElement;
  questMotivation: HTMLElement;
  questObjective: HTMLElement;
  runSummary: HTMLElement;
  recapPanel: HTMLElement;
  recapTitle: HTMLElement;
  recapList: HTMLUListElement;
  eventLog: HTMLUListElement;
  eventLogViewport: HTMLElement;
  startRunBtn: HTMLButtonElement;
  restartRunBtn: HTMLButtonElement;
  abandonRunBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  telemetryResetBtn: HTMLButtonElement;
  metaAliasInput: HTMLInputElement;
  metaShards: HTMLElement;
  metaRuns: HTMLElement;
  metaWins: HTMLElement;
  metaBestDepth: HTMLElement;
  inventoryCollectibles: HTMLUListElement;
  inventoryConsumables: HTMLUListElement;
  inventoryDebuffs: HTMLUListElement;
  upgradeList: HTMLElement;
  leaderboardList: HTMLUListElement;
  leaderboardStatus: HTMLElement;
  telemetrySummary: HTMLElement;
  sidebarPanel: HTMLElement;
  sidebarToggle: HTMLButtonElement;
  sidebarClose: HTMLButtonElement;
}

export interface ParsedState {
  version?: number;
  meta?: Partial<MetaState> & {
    upgrades?: Partial<MetaUpgrades>;
  };
  run?: RunState | null;
  lastRun?: LastRunState | null;
}

export interface EngineCallbacks {
  onStateChange: () => void;
  onTransientChange?: () => void;
  onScenarioSpawn?: (room: RoomState, run: RunState) => void;
  onActionResolved?: (actionId: ActionId, room: RoomState, run: RunState) => void;
  onRunFinished?: (runSummary: LastRunState, runNumber: number) => void;
}

export interface BoredEngine {
  startRun: () => void;
  abandonRun: () => void;
  buyUpgrade: (upgradeKey: MetaUpgradeKey) => void;
  resetProgress: () => void;
  resolveRoomChoice: (choiceId: ActionId) => void;
  chooseBuff: (buffKey: BuffKey) => void;
  tick: (elapsedMs?: number) => void;
}

export interface TelemetryState {
  totalRuns: number;
  totalWins: number;
  totalTimeLeft: number;
  scenarioCounts: Partial<Record<RoomType, number>>;
  actionCounts: Partial<Record<ActionId, number>>;
  depthStats: Record<string, { runs: number; wins: number }>;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
