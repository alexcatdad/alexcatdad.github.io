export type ProjectLifecycleState = 'active' | 'maintenance' | 'paused' | 'archived';

export interface ProjectMetaFile {
  what: string;
  why: string;
  hero?: string;
  tags?: string[];
  featured?: boolean;
  order?: number;
}

export interface ProjectSnapshotItem {
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  defaultBranch: string;
  pushedAt: string;
  lastCommitAt: string;
  daysSinceCommit: number;
  state: ProjectLifecycleState;
  what: string;
  why: string;
  hero: string;
  tags: string[];
  featured: boolean;
  order: number;
}

export interface ProjectsSnapshot {
  generatedAt: string;
  owner: string;
  thresholds: {
    activeDays: number;
    maintenanceDays: number;
    pausedDays: number;
  };
  totals: {
    scannedRepos: number;
    includedRepos: number;
    excludedRepos: number;
  };
  items: ProjectSnapshotItem[];
}
