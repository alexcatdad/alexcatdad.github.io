# Astro Migration Design

Migration from Next.js 16 to Astro static site deployed on GitHub Pages.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Astro (static output) | SPA-like via View Transitions, zero JS by default, GitHub Pages compatible |
| UI islands | React | Easiest migration for existing shadcn/ui + ResumeLayout components |
| Component library | shadcn/ui (kept) | Official Astro support, existing components transfer directly |
| Projects source | GitHub API at build time | Auto-syncs public repos from `alexcatdad`, no manual maintenance |
| Content | Astro Content Collections | Resume as JSON collection, Zod schemas built in |
| Deployment | GitHub Pages via Actions | Static output, free, `alexcatdad.github.io` auto-enables Pages |
| i18n | Dropped (English only) | Simplifies migration, can re-add later with Astro's native i18n |
| Backend | None | No database, no API routes, no Convex needed |

## Dropped Features

- Access Gate + MongoDB visitor tracking
- AI features (Resume Chat, Cover Letter Generator)
- i18n (en/nl locale routing)
- All 6 API routes
- Anthropic SDK, WebLLM, MongoDB dependencies

## Pages

```
/                Home landing page
/cv              Resume/CV with role filtering (?role=ic-senior|ic-staff|manager|consultant|founder|ai-engineer)
/projects        GitHub repos grid (fetched at build time)
/contact         Contact info with obfuscation
```

## Content Model

```
src/content/
  config.ts          Collection schemas (Zod)
  resume/
    alex.json        JSON Resume v1.0.0 + _custom extensions (migrated from artifacts/)
```

Resume stays as JSON — the schema is well-defined and role filtering works against it. Projects are NOT a content collection; they're fetched from `api.github.com/users/alexcatdad/repos` at build time, filtered to exclude forks.

## Component Architecture

### Astro pages (static, zero JS)

```
src/pages/
  index.astro        Home
  cv.astro           Resume (reads collection, mounts React island)
  projects.astro     GitHub repos grid (build-time fetch)
  contact.astro      Contact info
```

### Layout

```
src/layouts/
  Base.astro         HTML shell, <head>, View Transitions, theme script, nav, footer
```

Single layout. ThemeScript becomes `<script is:inline>` to run before paint.

### React islands (hydrated on client)

| Component | Lines | Notes |
|---|---|---|
| ResumeLayout | ~500 | Core CV component — tabs, sections, scroll context, role filtering |
| Header | ~100 | Used inside ResumeLayout |
| ExperienceSection | ~125 | Child of ResumeLayout |
| SkillsSection | ~80 | Child of ResumeLayout |
| ProjectsSection | ~90 | Child of ResumeLayout |
| PersonalSection | ~185 | Child of ResumeLayout |
| TabNavigation | ~50 | Stateful tab switching |
| DownloadButtons | ~185 | PDF generation via @react-pdf/renderer |

### Vanilla `<script>` (no framework)

| Component | Current | Migration |
|---|---|---|
| ThemeToggle | React (63 lines) | Astro component + inline script (~15 lines) |
| ScrollProgress | React (41 lines) | Scroll listener + CSS variable (~10 lines) |
| NavigationClient | React (206 lines) | IntersectionObserver + vanilla JS (~40 lines) |
| ContactReveal | React (83 lines) | Click handler to decode email (~15 lines) |
| WelcomeToast | React (31 lines) | Auto-dismiss div + X button (~20 lines) |

### Deleted entirely

- AccessGate.tsx, AccessModal.tsx (no more gating)
- ResumeChat.tsx (AI dropped)
- CoverLetterModal.tsx, CoverLetterModalWrapper.tsx (AI dropped)
- ProfilePage.tsx (replaced by cv.astro)
- All API route files
- mongoClient.ts, llm-client.ts, web-llm.ts, cover-letter-*.ts, jd-fetcher.ts
- dictionaries/, proxy.ts, dictionaries.ts (i18n dropped)

## Styling

- Tailwind CSS v4 with `@tailwindcss/postcss` (unchanged)
- CSS custom properties from globals.css migrate to `src/styles/global.css`
- Dark/light theme via `html.light` class toggle (unchanged)
- shadcn/ui (New York style) components used inside React islands
- `tailwindcss-animate` for animation utilities
- `prefers-reduced-motion` respected
- Glassmorphism, gradients, spring easing, neo-grid, orbs — all carry over in CSS

## Build & Deployment

### GitHub Actions

```
Push to main OR weekly cron → bun install → astro build → deploy to GitHub Pages
```

Two triggers:
1. Push to `main` — normal deploys
2. Weekly cron (`0 0 * * 0`) — rebuilds to pick up new GitHub repos

### Build-time data

Projects page fetches `api.github.com/users/alexcatdad/repos` during build. No auth needed (public repos, 60 req/hr unauthenticated limit, 1 request per build).

### Environment

Zero env vars needed. Purely static, no secrets.

## Files Kept As-Is

- `src/types/json-resume.ts` — schema types
- `src/lib/utils.ts` — cn() utility (clsx + tailwind-merge)
- `src/lib/role-filter.ts` — resume role filtering
- `src/lib/experience-calculator.ts` — date calculations
- `src/lib/contact-obfuscation.ts` — email encode/decode
- `src/components/ui/` — shadcn components
- `biome.json` — linting config

## Migration Phases

### Phase 1 — Scaffold Astro

- Init Astro with React + Tailwind integrations
- Set up astro.config.mjs, tsconfig.json
- Migrate globals.css to src/styles/global.css
- Create Base.astro layout with View Transitions, theme script, nav, footer

### Phase 2 — Content & data layer

- Content Collection for resume (JSON schema + Zod)
- Copy master_resume.json into src/content/resume/
- Migrate utility modules (role-filter, experience-calculator)
- Build GitHub repo fetching for projects page

### Phase 3 — Pages

- `/` — Home landing page
- `/cv` — Mount ResumeLayout as React island
- `/projects` — GitHub repos grid
- `/contact` — Contact info with obfuscation

### Phase 4 — Interactive components

- Migrate ResumeLayout + children as React island
- Migrate DownloadButtons (React PDF)
- Vanilla scripts: theme toggle, scroll progress, welcome toast, contact reveal

### Phase 5 — Polish & deploy

- GitHub Actions workflow (.github/workflows/deploy.yml)
- Security headers via _headers file or meta tags
- Test all pages, View Transitions, theme persistence
- Delete all Next.js files, dependencies, configs
