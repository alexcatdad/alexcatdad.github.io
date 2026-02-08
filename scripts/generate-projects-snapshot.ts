import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type {
  ProjectLifecycleState,
  ProjectMetaFile,
  ProjectsSnapshot,
} from '../src/types/project-snapshot';

const OWNER = process.env.GITHUB_OWNER ?? 'alexcatdad';
const ACTIVE_DAYS = 7;
const MAINTENANCE_DAYS = 30;
const PAUSED_DAYS = 90;

const PROJECTS_SNAPSHOT_PATH = resolve('src/content/generated/projects.snapshot.json');
const SNAPSHOT_META_PATH = resolve('src/content/generated/snapshot.meta.json');

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  pushed_at: string;
  fork: boolean;
  default_branch: string;
}

interface EnrichedProject {
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

const metaSchema: z.ZodType<ProjectMetaFile> = z
  .object({
    what: z.string().trim().min(1),
    why: z.string().trim().min(1),
    hero: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    featured: z.boolean().optional(),
    order: z.number().int().optional(),
  })
  .strict();

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
  if (daysSinceCommit <= ACTIVE_DAYS) return 'active';
  if (daysSinceCommit <= MAINTENANCE_DAYS) return 'maintenance';
  if (daysSinceCommit <= PAUSED_DAYS) return 'paused';
  return 'archived';
}

function getHeroFallback(repo: GitHubRepo): string {
  return `https://opengraph.githubassets.com/1/${repo.full_name}`;
}

function resolveHeroUrl(repo: GitHubRepo, hero?: string): string {
  if (!hero) {
    return getHeroFallback(repo);
  }

  if (hero.startsWith('https://') || hero.startsWith('http://')) {
    return hero;
  }

  const normalized = hero.replace(/^\.\//, '').replace(/^\//, '');
  if (!normalized) {
    return getHeroFallback(repo);
  }

  return `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/${normalized}`;
}

async function validateHeroUrl(url: string, fallback: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return url;
    }
  } catch {
    // fall back when URL cannot be resolved
  }

  return fallback;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      ...headers,
      Accept: 'application/vnd.github.raw+json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function fetchLatestCommitDate(repo: GitHubRepo): Promise<string> {
  const url = `https://api.github.com/repos/${repo.full_name}/commits?per_page=1`;
  const response = await fetch(url, { headers });

  if (response.status === 403 || response.status === 401) {
    throw new Error(`${url} failed with ${response.status} ${response.statusText}`);
  }

  if (!response.ok) {
    return repo.pushed_at;
  }

  const commits = (await response.json()) as Array<{
    commit?: {
      committer?: { date?: string };
      author?: { date?: string };
    };
  }>;

  const newest = commits[0];
  return newest?.commit?.committer?.date ?? newest?.commit?.author?.date ?? repo.pushed_at;
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(' 403 ') || message.toLowerCase().includes('rate limit');
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

async function updateMeta(snapshot: ProjectsSnapshot) {
  const current = (await readJson<Record<string, unknown>>(SNAPSHOT_META_PATH)) ?? {};
  const meta = {
    ...current,
    generatedAt: snapshot.generatedAt,
    owner: snapshot.owner,
    projects: {
      generatedAt: snapshot.generatedAt,
      includedRepos: snapshot.totals.includedRepos,
      excludedRepos: snapshot.totals.excludedRepos,
      scannedRepos: snapshot.totals.scannedRepos,
    },
  };

  await writeJson(SNAPSHOT_META_PATH, meta);
}

async function main() {
  try {
    const repos = await fetchJson<GitHubRepo[]>(
      `https://api.github.com/users/${OWNER}/repos?per_page=100&type=public&sort=updated`
    );
    const baseRepos = repos.filter((repo) => !repo.fork);

    const included: EnrichedProject[] = [];
    const excluded: Array<{ repo: string; reason: string }> = [];

    for (const repo of baseRepos) {
      const metaUrl = `https://api.github.com/repos/${repo.full_name}/contents/.project.json`;
      let rawMeta: string | null = null;

      try {
        rawMeta = await fetchText(metaUrl);
      } catch (error) {
        if (isRateLimitError(error)) {
          throw error;
        }

        excluded.push({
          repo: repo.full_name,
          reason: `metadata fetch error: ${error instanceof Error ? error.message : String(error)}`,
        });
        continue;
      }

      if (!rawMeta) {
        excluded.push({ repo: repo.full_name, reason: 'missing .project.json' });
        continue;
      }

      let parsedMeta: ProjectMetaFile;
      try {
        parsedMeta = metaSchema.parse(JSON.parse(rawMeta));
      } catch (error) {
        excluded.push({
          repo: repo.full_name,
          reason: `invalid .project.json: ${error instanceof Error ? error.message : String(error)}`,
        });
        continue;
      }

      const lastCommitAt = await fetchLatestCommitDate(repo);
      const daysSinceCommit = computeDaysSince(lastCommitAt);
      const hero = await validateHeroUrl(
        resolveHeroUrl(repo, parsedMeta.hero),
        getHeroFallback(repo)
      );

      included.push({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: repo.topics ?? [],
        defaultBranch: repo.default_branch,
        pushedAt: repo.pushed_at,
        lastCommitAt,
        daysSinceCommit,
        state: computeState(daysSinceCommit),
        what: parsedMeta.what,
        why: parsedMeta.why,
        hero,
        tags: parsedMeta.tags ?? [],
        featured: parsedMeta.featured ?? false,
        order: parsedMeta.order ?? 999,
      });
    }

    included.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.order !== b.order) return a.order - b.order;
      if (a.daysSinceCommit !== b.daysSinceCommit) return a.daysSinceCommit - b.daysSinceCommit;
      return b.stars - a.stars;
    });

    const snapshot: ProjectsSnapshot = {
      generatedAt: now.toISOString(),
      owner: OWNER,
      thresholds: {
        activeDays: ACTIVE_DAYS,
        maintenanceDays: MAINTENANCE_DAYS,
        pausedDays: PAUSED_DAYS,
      },
      totals: {
        scannedRepos: baseRepos.length,
        includedRepos: included.length,
        excludedRepos: excluded.length,
      },
      items: included,
    };

    await writeJson(PROJECTS_SNAPSHOT_PATH, snapshot);
    await updateMeta(snapshot);

    console.log(
      `projects snapshot generated: ${included.length} included, ${excluded.length} excluded`
    );
    if (excluded.length > 0) {
      console.log('excluded repositories:');
      for (const item of excluded) {
        console.log(`- ${item.repo}: ${item.reason}`);
      }
    }
  } catch (error) {
    const fallback = await readJson<ProjectsSnapshot>(PROJECTS_SNAPSHOT_PATH);
    if (fallback) {
      console.warn('projects snapshot generation failed, using existing snapshot');
      console.warn(error);
      return;
    }

    throw error;
  }
}

await main();
