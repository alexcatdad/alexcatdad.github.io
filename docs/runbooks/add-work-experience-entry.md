# Add Work Experience Entry

## Purpose

Use this runbook when adding or updating a public resume work experience entry.

Prefer this generic runbook over company-specific runbooks unless a role introduces a repeatable process that is genuinely unique to that employer or project.

## Privacy Boundary

- Keep public wording at role, product category, architecture, and owned-surface level.
- Do not publish private repository URLs, source snippets, `.env` files, credentials, tenant data, customer names, deployment endpoints, or operational incidents unless a human explicitly approves the exact claim.
- If private or commercial source material is needed for context, inspect it outside this portfolio repository and carry over only safe, summarized facts.

## Source Files

- `src/content/resume/alex.json`
- `src/lib/resume-utils.ts`
- `decisions.jsonl`
- Optional generated snapshots under `src/content/generated/` when public evidence changes.

## Procedure

1. Confirm the worktree is on the intended branch:

   ```bash
   git status --short --branch
   ```

2. Gather safe evidence for the role:

   ```bash
   gh repo list <owner> --visibility=public --limit 100 --json name,description,primaryLanguage,repositoryTopics,pushedAt,isFork,url
   ```

   For private source review, use an authorized temporary clone outside this repo:

   ```bash
   tmpdir=$(mktemp -d /tmp/resume-role-inspect.XXXXXX)
   SOURCE_REPO=<authorized-source-repository-url>
   git clone --depth 1 "$SOURCE_REPO" "$tmpdir/source"
   ```

3. Update `src/content/resume/alex.json` with concise, public-safe role wording.

4. Adjust `src/lib/resume-utils.ts` only when the role should move between existing resume sections.

5. Add or update a `decisions.jsonl` entry when the role requires a public/private wording boundary, sectioning change, or material evidence refresh.

6. Validate the change:

   ```bash
   bun run lint
   bun run build
   ```

7. Scan for accidental sensitive content before committing:

   ```bash
   rg -n "(api[_-]?key|secret|token|password|BEGIN .*PRIVATE|Authorization:|Bearer |tenant|customer|\\.env)" src docs decisions.jsonl
   ```

8. Review the final diff:

   ```bash
   git diff -- src/content/resume/alex.json src/lib/resume-utils.ts decisions.jsonl docs/runbooks/add-work-experience-entry.md
   ```
