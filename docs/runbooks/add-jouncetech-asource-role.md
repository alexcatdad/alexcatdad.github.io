# Add Jouncetech asource Resume Role

## Purpose

Use this runbook when updating the public resume entry for the Jouncetech/asource role.

## Secret Handling

- Clone or inspect the asource source repository outside this portfolio repository.
- Do not copy `.env`, generated runtime manifests, credentials, tenant data, deployment endpoints, or customer-specific operational details into this repo.
- Keep public resume wording at product and architecture level unless a human explicitly approves a public URL or specific claim.

## Source Files

- `src/content/resume/alex.json`
- `src/lib/resume-utils.ts`
- `decisions.jsonl`

## Procedure

1. Confirm the portfolio worktree is on the intended branch:

   ```bash
   git status --short --branch
   ```

2. Inspect only safe asource docs and source structure from a temporary clone:

   ```bash
   tmpdir=$(mktemp -d /tmp/asource-inspect.XXXXXX)
   ASOURCE_SOURCE_REPO=<authorized-asource-source-repository-url>
   git clone --depth 1 "$ASOURCE_SOURCE_REPO" "$tmpdir/asource-source"
   ```

3. Update `src/content/resume/alex.json` with high-level role wording.

4. If the role should appear in the primary Experience section, confirm `src/lib/resume-utils.ts` still groups the current role with the agentic-era experience.

5. Validate formatting and build behavior:

   ```bash
   bun run lint
   bun run build
   ```

6. Review the final diff for accidental sensitive details:

   ```bash
   git diff -- src/content/resume/alex.json src/lib/resume-utils.ts decisions.jsonl docs/runbooks/add-jouncetech-asource-role.md
   ```
