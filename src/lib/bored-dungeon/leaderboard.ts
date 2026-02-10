import Dexie, { type Table } from 'dexie';
import type { LastRunState, LeaderboardEntry } from './types';

const DB_NAME = 'bored-dungeon-leaderboard';
const TABLE_NAME = 'runs';

export interface LeaderboardAdapter {
  readonly name: string;
  appendEntry: (entry: LeaderboardEntry) => Promise<void>;
  getTop: (limit?: number) => Promise<LeaderboardEntry[]>;
  clear: () => Promise<void>;
}

class BoredLeaderboardDb extends Dexie {
  runs!: Table<LeaderboardEntry, number>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      [TABLE_NAME]: '++id,createdAt,runNumber,alias,shardsEarned,depth,victory,seed',
    });
  }
}

let dbInstance: BoredLeaderboardDb | null = null;

function getDb(): BoredLeaderboardDb | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return null;
  }

  if (!dbInstance) {
    dbInstance = new BoredLeaderboardDb();
  }

  return dbInstance;
}

function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.shardsEarned !== a.shardsEarned) return b.shardsEarned - a.shardsEarned;
  if (b.depth !== a.depth) return b.depth - a.depth;
  if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
  return b.runNumber - a.runNumber;
}

function buildSummaryFromRun(lastRun: LastRunState): string {
  const buffList = Object.entries(lastRun.buffs)
    .map(([key, count]) => `${key}x${count}`)
    .slice(0, 3)
    .join(', ');

  if (!buffList) {
    return `${lastRun.archetype} build`;
  }

  return `${lastRun.archetype} · ${buffList}`;
}

export function createLeaderboardEntry(
  lastRun: LastRunState,
  runNumber: number,
  alias: string
): LeaderboardEntry {
  return {
    createdAt: Date.now(),
    alias,
    runNumber,
    depth: lastRun.depth,
    floor: lastRun.floor,
    gold: lastRun.gold,
    shardsEarned: lastRun.shardsEarned,
    victory: lastRun.victory,
    reason: lastRun.reason,
    seed: lastRun.seed,
    archetype: lastRun.archetype,
    buildSummary: buildSummaryFromRun(lastRun),
  };
}

export function createDexieLeaderboardAdapter(): LeaderboardAdapter {
  return {
    name: 'Local IndexedDB',
    appendEntry: async (entry: LeaderboardEntry) => {
      const db = getDb();
      if (!db) return;
      await db.runs.add(entry);
    },
    getTop: async (limit = 12) => {
      const db = getDb();
      if (!db) return [];
      const all = await db.runs.toArray();
      return all.sort(compareEntries).slice(0, limit);
    },
    clear: async () => {
      const db = getDb();
      if (!db) return;
      await db.runs.clear();
    },
  };
}

export function createConvexLeaderboardAdapterStub(): LeaderboardAdapter {
  return {
    name: 'Convex (stub)',
    appendEntry: async () => {},
    getTop: async () => [],
    clear: async () => {},
  };
}
