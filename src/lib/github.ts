export interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
  updated_at: string;
}

export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  try {
    const url = 'https://api.github.com/users/alexcatdad/repos?per_page=100&sort=updated';
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Optional auth token for higher rate limits in CI
    const token = import.meta.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`GitHub API returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const repos: GitHubRepo[] = await response.json();

    return repos
      .filter((repo) => !repo.fork && !repo.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
  } catch (error) {
    console.error('Failed to fetch GitHub repos:', error);
    return [];
  }
}
