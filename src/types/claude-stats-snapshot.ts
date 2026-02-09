export interface ClaudeStatsSnapshot {
  generatedAt: string;
  sessions: { total: number; projectCount: number };
  messages: { user: number; assistant: number; total: number };
  git: {
    commits: number;
    filesChanged: number;
    insertions: number;
    deletions: number;
    reposScanned: number;
  };
  dateRange: { earliest: string; latest: string };
}
