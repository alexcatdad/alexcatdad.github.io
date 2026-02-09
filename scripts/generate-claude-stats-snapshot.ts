import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { ClaudeStatsSnapshot } from '../src/types/claude-stats-snapshot';

const CLAUDE_PROJECTS_DIR = join(process.env.HOME ?? '~', '.claude', 'projects');
const REPOS_DIR = join(process.env.HOME ?? '~', 'REPOS', 'alexcatdad');
const SNAPSHOT_PATH = resolve('src/content/generated/claude-stats.snapshot.json');
const SNAPSHOT_META_PATH = resolve('src/content/generated/snapshot.meta.json');

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

async function updateMeta(snapshot: ClaudeStatsSnapshot) {
  const current = (await readJson<Record<string, unknown>>(SNAPSHOT_META_PATH)) ?? {};
  const meta = {
    ...current,
    claudeStats: {
      generatedAt: snapshot.generatedAt,
      sessions: snapshot.sessions.total,
      messages: snapshot.messages.total,
      commits: snapshot.git.commits,
    },
  };
  await writeJson(SNAPSHOT_META_PATH, meta);
}

// Phase A: Read JSONL sessions from ~/.claude/projects
async function collectSessionStats() {
  let totalSessions = 0;
  let userMessages = 0;
  let assistantMessages = 0;
  let earliest = '';
  let latest = '';
  const projectDirs = new Set<string>();

  const projectEntries = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true });
  for (const entry of projectEntries) {
    if (!entry.isDirectory()) continue;

    const projectPath = join(CLAUDE_PROJECTS_DIR, entry.name);
    const files = await readdir(projectPath);
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));

    if (jsonlFiles.length === 0) continue;
    projectDirs.add(entry.name);

    for (const file of jsonlFiles) {
      totalSessions++;
      const filePath = join(projectPath, file);
      const content = await readFile(filePath, 'utf8');

      for (const line of content.split('\n')) {
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as {
            type?: string;
            timestamp?: string;
          };

          if (parsed.type === 'user') userMessages++;
          else if (parsed.type === 'assistant') assistantMessages++;

          if (parsed.timestamp) {
            if (!earliest || parsed.timestamp < earliest) earliest = parsed.timestamp;
            if (!latest || parsed.timestamp > latest) latest = parsed.timestamp;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  return {
    sessions: { total: totalSessions, projectCount: projectDirs.size },
    messages: {
      user: userMessages,
      assistant: assistantMessages,
      total: userMessages + assistantMessages,
    },
    dateRange: { earliest, latest },
  };
}

// Phase B: Scan git repos for Claude-authored commits
function collectGitStats() {
  let commits = 0;
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;
  let reposScanned = 0;

  if (!existsSync(REPOS_DIR)) return { commits, filesChanged, insertions, deletions, reposScanned };

  const entries = execFileSync('ls', [REPOS_DIR], { encoding: 'utf8' }).trim().split('\n');

  for (const name of entries) {
    const repoPath = join(REPOS_DIR, name);
    const gitDir = join(repoPath, '.git');
    if (!existsSync(gitDir)) continue;

    reposScanned++;

    // Count commits (separate call — merge commits have no shortstat)
    try {
      const commitOutput = execFileSync(
        'git',
        ['log', '--all', '--grep=Co-Authored-By: Claude', '--format=%H'],
        { cwd: repoPath, encoding: 'utf8', timeout: 15000 }
      ).trim();
      if (commitOutput) {
        commits += commitOutput.split('\n').length;
      }
    } catch {
      // skip repos that fail
    }

    // Collect shortstat for lines/files
    try {
      const statOutput = execFileSync(
        'git',
        ['log', '--all', '--grep=Co-Authored-By: Claude', '--shortstat', '--format='],
        { cwd: repoPath, encoding: 'utf8', timeout: 15000 }
      ).trim();
      if (!statOutput) continue;

      for (const line of statOutput.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const filesMatch = trimmed.match(/(\d+) files? changed/);
        const insMatch = trimmed.match(/(\d+) insertions?\(\+\)/);
        const delMatch = trimmed.match(/(\d+) deletions?\(-\)/);

        if (filesMatch) filesChanged += Number.parseInt(filesMatch[1], 10);
        if (insMatch) insertions += Number.parseInt(insMatch[1], 10);
        if (delMatch) deletions += Number.parseInt(delMatch[1], 10);
      }
    } catch {
      // skip repos that fail
    }
  }

  return { commits, filesChanged, insertions, deletions, reposScanned };
}

async function main() {
  try {
    console.log('collecting Claude session stats...');
    const sessionStats = await collectSessionStats();

    console.log('collecting Claude git stats...');
    const gitStats = collectGitStats();

    const snapshot: ClaudeStatsSnapshot = {
      generatedAt: new Date().toISOString(),
      sessions: sessionStats.sessions,
      messages: sessionStats.messages,
      git: gitStats,
      dateRange: sessionStats.dateRange,
    };

    await writeJson(SNAPSHOT_PATH, snapshot);
    await updateMeta(snapshot);

    console.log(
      `claude stats snapshot generated: ${snapshot.sessions.total} sessions, ${snapshot.messages.total} messages, ${snapshot.git.commits} commits`
    );
  } catch (error) {
    const fallback = await readJson<ClaudeStatsSnapshot>(SNAPSHOT_PATH);
    if (fallback) {
      console.warn('claude stats snapshot generation failed, using existing snapshot');
      console.warn(error);
      return;
    }

    throw error;
  }
}

await main();
