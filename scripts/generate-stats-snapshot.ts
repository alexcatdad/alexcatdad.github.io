import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { ProjectLifecycleState } from '../src/types/project-snapshot';
import type { StatsSnapshot } from '../src/types/stats-snapshot';

const OWNER = process.env.GITHUB_OWNER ?? 'alexcatdad';
const ACTIVE_DAYS = 30;
const COMMIT_DAYS = 90;

const STATS_SNAPSHOT_PATH = resolve('src/content/generated/stats.snapshot.json');
const SNAPSHOT_META_PATH = resolve('src/content/generated/snapshot.meta.json');

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  fork: boolean;
}

const headers: HeadersInit = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'alexcatdad.github.io-snapshot-generator',
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const now = new Date();

function computeDaysSince(dateIso: string): number {
  const diffMs = now.getTime() - new Date(dateIso).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function computeState(daysSinceCommit: number): ProjectLifecycleState {
  if (daysSinceCommit <= 7) return 'active';
  if (daysSinceCommit <= 30) return 'maintenance';
  if (daysSinceCommit <= 90) return 'paused';
  return 'archived';
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function updateMeta(snapshot: StatsSnapshot) {
  const current = (await readJson<Record<string, unknown>>(SNAPSHOT_META_PATH)) ?? {};
  const meta = {
    ...current,
    generatedAt: snapshot.generatedAt,
    owner: snapshot.owner,
    stats: {
      generatedAt: snapshot.generatedAt,
      publicRepos: snapshot.totals.publicRepos,
      activeRepos: snapshot.totals.activeRepos,
      recentCommitCount: snapshot.totals.recentCommitCount,
    },
  };

  await writeJson(SNAPSHOT_META_PATH, meta);
}

async function countRecentCommits(repoFullName: string, sinceIso: string): Promise<number> {
  let page = 1;
  let total = 0;

  while (page <= 5) {
    const url = `https://api.github.com/repos/${repoFullName}/commits?since=${encodeURIComponent(sinceIso)}&per_page=100&page=${page}`;
    const response = await fetch(url, { headers });

    if (response.status === 403 || response.status === 401) {
      throw new Error(`${url} failed with ${response.status} ${response.statusText}`);
    }

    if (response.status === 409 || response.status === 404) {
      return total;
    }

    if (!response.ok) {
      return total;
    }

    const commits = (await response.json()) as unknown[];
    total += commits.length;

    if (commits.length < 100) {
      return total;
    }

    page += 1;
  }

  return total;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];

  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      results.push(await worker(item));
    }
  });

  await Promise.all(runners);
  return results;
}

async function main() {
  try {
    const repos = await fetchJson<GitHubRepo[]>(
      `https://api.github.com/users/${OWNER}/repos?per_page=100&type=public&sort=updated`
    );
    const baseRepos = repos.filter((repo) => !repo.fork);

    const since = new Date(now);
    since.setUTCDate(since.getUTCDate() - COMMIT_DAYS);
    const sinceIso = since.toISOString();

    const perRepoCommitCounts = await mapWithConcurrency(baseRepos, 6, async (repo) => ({
      repo,
      count: await countRecentCommits(repo.full_name, sinceIso),
    }));

    const recentCommitCount = perRepoCommitCounts.reduce((sum, item) => sum + item.count, 0);
    const recentTouchedRepos = perRepoCommitCounts.filter((item) => item.count > 0).length;

    const languageMap = new Map<string, number>();
    for (const repo of baseRepos) {
      if (!repo.language) continue;
      languageMap.set(repo.language, (languageMap.get(repo.language) ?? 0) + 1);
    }

    const languages = Array.from(languageMap.entries())
      .map(([name, reposCount]) => ({ name, repos: reposCount }))
      .sort((a, b) => b.repos - a.repos)
      .slice(0, 12);

    const recentUpdates = [...baseRepos]
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      .slice(0, 10)
      .map((repo) => {
        const daysSinceCommit = computeDaysSince(repo.pushed_at);
        return {
          name: repo.name,
          htmlUrl: repo.html_url,
          description: repo.description,
          language: repo.language,
          pushedAt: repo.pushed_at,
          daysSinceCommit,
          state: computeState(daysSinceCommit),
        };
      });

    const stars = baseRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const forks = baseRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const activeRepos = baseRepos.filter(
      (repo) => computeDaysSince(repo.pushed_at) <= ACTIVE_DAYS
    ).length;

    const snapshot: StatsSnapshot = {
      generatedAt: now.toISOString(),
      owner: OWNER,
      windows: {
        activeDays: ACTIVE_DAYS,
        commitDays: COMMIT_DAYS,
      },
      totals: {
        publicRepos: baseRepos.length,
        stars,
        forks,
        activeRepos,
        recentCommitCount,
        recentTouchedRepos,
      },
      languages,
      recentUpdates,
    };

    await writeJson(STATS_SNAPSHOT_PATH, snapshot);
    await updateMeta(snapshot);

    console.log(
      `stats snapshot generated: ${snapshot.totals.publicRepos} repos, ${snapshot.totals.recentCommitCount} recent commits`
    );
  } catch (error) {
    const fallback = await readJson<StatsSnapshot>(STATS_SNAPSHOT_PATH);
    if (fallback) {
      console.warn('stats snapshot generation failed, using existing snapshot');
      console.warn(error);
      return;
    }

    throw error;
  }
}

await main();
