# `.project.json` specification

This file defines how a repository is represented on the `/projects` page.

## Location

- Path: `/.project.json` (repo root)
- Repos without this file are excluded from the generated projects snapshot.

## Contract

The parser is strict (`additionalProperties: false`): unknown keys will make the file invalid.

Required fields:

- `what` (`string`): one clear line describing what the project is.
- `why` (`string`): one clear line describing why it exists.

Optional fields:

- `hero` (`string`): image URL or repo-relative path.
- `tags` (`string[]`): short keywords displayed on project cards.
- `featured` (`boolean`): featured projects are sorted first.
- `order` (`integer`): lower values sort earlier within the same featured group.

Machine-readable schema:

- `docs/project-meta.schema.json`

## Example

```json
{
  "what": "Zero-config HTTPS proxy for local macOS development.",
  "why": "Built to remove HTTPS friction from OAuth and secure-cookie local workflows.",
  "hero": "assets/hero.png",
  "tags": ["go", "proxy", "developer-tooling"],
  "featured": true,
  "order": 10
}
```

## How the site generator uses it

Source implementation:

- `scripts/generate-projects-snapshot.ts`

Behavior:

1. Fetches public repos for the configured owner.
2. For each repo, fetches `/.project.json`.
3. Validates against the strict schema.
4. Excludes repo if file is missing or invalid.
5. Computes project state from most recent commit date:
   - `active`: `<= 7` days
   - `maintenance`: `8-30` days
   - `paused`: `31-90` days
   - `archived`: `> 90` days
6. Resolves hero image:
   - Uses `hero` from `.project.json` if present.
   - If `hero` is relative, resolves it against the repo default branch.
   - If hero is missing or unreachable, falls back to GitHub Open Graph preview image.
7. Writes snapshot output to:
   - `src/content/generated/projects.snapshot.json`

## Operational notes

- Runtime pages do not call GitHub APIs for project cards.
- Data is generated at build/CI time (`bun run generate:projects-snapshot`).
- On API failures/rate limits, generation falls back to the last-known snapshot if available.

## Recommended rollout for all repos

For each repository you want to appear on `/projects`:

1. Add `/.project.json` using the schema above.
2. Commit and push to default branch.
3. Re-run snapshot generation in this site repo:
   - `bun run generate:projects-snapshot`
4. Confirm inclusion in `src/content/generated/projects.snapshot.json`.
