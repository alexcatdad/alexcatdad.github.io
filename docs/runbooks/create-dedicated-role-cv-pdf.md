# Create Dedicated Role CV PDF

## Purpose

Use this runbook when creating a role-specific PDF CV from the portfolio resume data.

Generated PDFs are local application artifacts. Keep them under `output/pdf/`, which is ignored by git, unless a human explicitly asks to commit a final artifact.

## Inputs

- Role brief, job description, or role title.
- `src/content/resume/alex.json`
- Current public repo evidence when relevant, usually through `gh`.
- Existing role-specific generator when available, for example `scripts/generate-vue-frontend-cv.py`.

## Design Gate

Before generating a PDF, pass the brief through the design filter:

1. Name the subject, audience, and job of the CV.
2. Define a compact token system:
   - color palette
   - type roles
   - layout concept
   - one restrained signature element
3. Critique the plan against generic CV defaults.
4. Remove internal process language such as "tailored CV", "generated for", or "role focus" from visible copy.
5. Keep the language truthful. Use target-role framing only where it is explicit, and do not invent commercial experience.

## Generation Workflow

1. Confirm worktree state:

   ```bash
   git status --short --branch
   ```

2. Gather public evidence if the role depends on repo proof:

   ```bash
   gh repo list alexcatdad \
     --visibility=public \
     --limit 100 \
     --json name,description,primaryLanguage,repositoryTopics,pushedAt,isFork,url
   ```

3. Update or create a role-specific generator under `scripts/`.

4. Generate the PDF with the bundled Python runtime:

   ```bash
   /Users/alex/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/generate-vue-frontend-cv.py
   ```

5. Inspect PDF metadata:

   ```bash
   pdfinfo output/pdf/alex-alexandrescu-vue-frontend-cv.pdf
   ```

6. Render pages for visual QA:

   ```bash
   mkdir -p tmp/pdfs/role-cv
   pdftoppm -r 180 -png output/pdf/alex-alexandrescu-vue-frontend-cv.pdf tmp/pdfs/role-cv/page
   ```

7. Extract text for content checks:

   ```bash
   /Users/alex/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 - <<'PY'
   import pdfplumber
   with pdfplumber.open("output/pdf/alex-alexandrescu-vue-frontend-cv.pdf") as pdf:
       print("pages", len(pdf.pages))
       text = "\n".join(page.extract_text() or "" for page in pdf.pages)
       print("chars", len(text))
   PY
   ```

8. Remove temporary renders after inspection:

   ```bash
   rm -rf tmp/pdfs/role-cv
   ```

## Quality Bar

- A4 portrait unless the recipient asks for another format.
- Two pages maximum for standard applications.
- No clipped text, overlapping sections, unreadable chips, or orphaned headings.
- Printed grayscale should remain legible.
- Text extraction should not contain reversed decorative labels or internal process notes.
- Generated output stays ignored by git unless explicitly requested.

## Safety Checks

- Do not include private repository URLs, secrets, tenant names, deployment endpoints, or raw source snippets.
- Search generated text and source for sensitive strings before delivery.
- Do not commit `output/` or `tmp/` artifacts by default.
