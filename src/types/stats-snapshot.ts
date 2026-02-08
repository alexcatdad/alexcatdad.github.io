import type { ProjectLifecycleState } from './project-snapshot';

export interface StatsLanguage {
  name: string;
  repos: number;
}

export interface StatsRecentRepo {
  name: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  daysSinceCommit: number;
  state: ProjectLifecycleState;
}

export interface StatsSnapshot {
  generatedAt: string;
  owner: string;
  windows: {
    activeDays: number;
    commitDays: number;
  };
  totals: {
    publicRepos: number;
    stars: number;
    forks: number;
    activeRepos: number;
    recentCommitCount: number;
    recentTouchedRepos: number;
  };
  languages: StatsLanguage[];
  recentUpdates: StatsRecentRepo[];
}
