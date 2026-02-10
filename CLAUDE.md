# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Dev server (localhost:4321)
bun run build            # Production build (static output to dist/)
bun run preview          # Preview production build
bun lint                 # Biome check
bun lint:fix             # Biome auto-fix
bun format               # Biome format
bunx playwright test     # E2E tests (requires build first)
```

## Architecture

Astro static site portfolio deployed on GitHub Pages. Four pages, React islands for interactive CV components, zero backend.

### Pages

```
/              Home landing page (hero + nav cards)
/cv            Resume/CV with React island (tabs, sections, downloads)
/projects      GitHub repos grid (fetched at build time)
/contact       Contact info with email obfuscation
```

### Data Flow

```
src/content/resume/alex.json → getEntry('resume','alex') → Astro pages
                                                          → React islands (ResumeLayout, DownloadButtons)
api.github.com/users/alexcatdad/repos → fetchGitHubRepos() → /projects (build-time)
```

### Key Architectural Patterns

- **Astro + React islands**: Pages are static Astro components. Interactive pieces use `client:load` for React hydration (ResumeLayout, DownloadButtons).
- **Content Collections**: Resume data in `src/content/resume/alex.json`, loaded via `file()` loader with Zod schema validation (`src/content.config.ts`).
- **Vanilla `<script>` components**: Theme toggle, scroll progress, nav, welcome toast, contact reveal — all Astro components with inline scripts (no React).
- **Role filtering**: `?role=ic-senior|ic-staff|manager|consultant|founder|ai-engineer` — processed client-side in ResumeLayout and DownloadButtons.
- **Client-side downloads**: PDF via `@react-pdf/renderer` `pdf().toBlob()`, Markdown via `generateMarkdown()` — no API routes.
- **Contact obfuscation**: Email encoded at build time, decoded on click (`src/lib/contact-obfuscation.ts`).
- **View Transitions**: `<ClientRouter />` for SPA-like navigation between pages.

### Styling

- Tailwind CSS v4 with `@tailwindcss/vite` (Vite plugin, not PostCSS)
- Dark mode (default) / light mode via `html.light` class toggle
- Design tokens as CSS custom properties in `src/styles/global.css`
- shadcn/ui (New York style) for base components inside React islands
- `tailwindcss-animate` for animation utilities
- `prefers-reduced-motion` fully respected
- Glassmorphism, gradients, neo-grid/orb decorative backgrounds

### Path Alias

`@/*` → `./src/*`

## Stack

- **Runtime**: Bun (strict — `enginesStrict: true`, Bun ≥1.3.11)
- **Framework**: Astro 5 (static output), React 19 (islands only)
- **Styling**: Tailwind CSS v4, shadcn/ui, tailwindcss-animate
- **Content**: Astro Content Collections with Zod schemas
- **Types**: JSON Resume v1.0.0 schema (`src/types/json-resume.ts`) with custom extensions
- **Linting**: Biome — single quotes, 2-space indent, 100-char lines, `useImportType: error`
- **Testing**: Playwright E2E tests (`e2e/`)
- **Deployment**: GitHub Pages via GitHub Actions (`withastro/action`)
- **PDF**: `@react-pdf/renderer` (client-side generation)

## Biome Rules

- `useImportType`: **error** — always use `import type` for type-only imports
- `noExplicitAny`: warn
- `useExhaustiveDependencies`: warn
- Single quotes, JSX double quotes, ES5 trailing commas, always semicolons
- Ignores: `.astro`, `dist/`, `.astro/` directories, `*.css` files

## Security

- `<meta>` tags for `noindex/nofollow/noarchive` and `no-referrer` (in Base.astro layout)
- GitHub Pages cannot set HTTP headers — uses meta tags instead
- No secrets or env vars required (zero-backend static site)
- Optional `GITHUB_TOKEN` env var for higher GitHub API rate limits in CI

## CI/CD

GitHub Actions (`.github/workflows/deploy.yml`):
1. **lint** — `bunx biome ci .`
2. **build** — `bun run build`, uploads artifact for test + Pages
3. **test** — downloads build artifact, Playwright E2E
4. **deploy** — `actions/deploy-pages` (main only, skipped on PRs)

Triggers: push to main, PR to main, weekly cron (Sunday 00:00 UTC), manual dispatch.
