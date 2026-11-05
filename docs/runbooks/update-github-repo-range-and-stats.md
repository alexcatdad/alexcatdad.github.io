# Update GitHub Repo Range And Stats

## Purpose

Use this runbook when refreshing the public technical range or repository activity snapshot from current GitHub repository metadata.

This is a local maintenance workflow. Do not make GitHub Actions depend on `gh` for this task.

## Inputs

- GitHub CLI authenticated as the portfolio owner.
- Public repository metadata for `alexcatdad`.
- `src/content/resume/alex.json`
- `src/content/generated/stats.snapshot.json`
- `src/content/generated/snapshot.meta.json`

## Procedure

1. Confirm GitHub CLI access:

   ```bash
   gh auth status
   ```

2. Audit current public, non-fork repositories:

   ```bash
   gh repo list alexcatdad \
     --visibility=public \
     --limit 100 \
     --json name,description,primaryLanguage,repositoryTopics,pushedAt,isFork,isArchived,url
   ```

3. Summarize language and topic evidence with `gh api`:

   ```bash
   gh api 'users/alexcatdad/repos?per_page=100&type=public&sort=updated' \
     --jq '[.[] | select(.fork|not) | {name, language, pushed_at, description, topics}]'
   ```

4. Update `src/content/resume/alex.json` only with durable, public-facing technical evidence. Do not commit raw `gh` output.

5. Refresh only the public repository stats snapshot:

   ```bash
   GITHUB_TOKEN="$(gh auth token)" bun run generate:stats-snapshot
   ```

6. Build without regenerating local Claude/private-machine stats:

   ```bash
   bunx astro build
   ```

7. Validate:

   ```bash
   bun run lint
   git diff --check
   bun -e "JSON.parse(require('fs').readFileSync('src/content/generated/stats.snapshot.json', 'utf8')); JSON.parse(require('fs').readFileSync('src/content/generated/snapshot.meta.json', 'utf8'));"
   ```

## Guardrails

- Do not add private repository URLs, local filesystem paths, tokens, or raw `gh auth token` output to committed files.
- Do not refresh `src/content/generated/claude-stats.snapshot.json` during a GitHub repo audit unless that is explicitly part of the task.
- Keep generated snapshot churn scoped to public repository stats.
