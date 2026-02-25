export interface FeaturedProject {
  /** Display name */
  name: string;
  /** Short tagline shown below the name */
  tagline: string;
  /** Hero screenshot path (relative to public/) */
  hero: string;
  /** What it does — 1-2 sentences */
  what: string;
  /** Why it was built — 1-2 sentences */
  why: string;
  /** Primary language */
  language: string;
  /** Color for the language dot (Tailwind class) */
  languageColor: string;
  /** Tags / tech stack */
  tags: string[];
  /** GitHub repos (owner/name) to fetch live stats for */
  repos: string[];
  /** External links */
  links: { label: string; url: string }[];
}

export const featuredProjects: FeaturedProject[] = [
  {
    name: 'catnap',
    tagline: 'macOS menubar dashboard for local git repos',
    hero: '/images/projects/catnap-hero.png',
    what: 'A native macOS menubar app that watches your local git repositories in real time. Shows branch status, uncommitted changes, and enriches data from GitHub — zero config required.',
    why: 'I wanted a passive, always-visible overview of all my repos without opening a terminal or browser. Built with SwiftUI for a lightweight, native feel.',
    language: 'Swift',
    languageColor: 'bg-orange-400',
    tags: ['SwiftUI', 'macOS', 'menubar', 'git', 'developer-tools'],
    repos: ['alexcatdad/catnap'],
    links: [
      { label: 'Repository', url: 'https://github.com/alexcatdad/catnap' },
      { label: 'Documentation', url: 'https://alexcatdad.github.io/catnap' },
    ],
  },
  {
    name: 'paw',
    tagline: 'Personal dotfiles manager CLI',
    hero: '/images/projects/paw-hero.png',
    what: 'A CLI tool for managing dotfiles across machines. Symlink-based profiles, package declarations, sync, audit, and scaffold — all from a single binary.',
    why: 'Keeping dotfiles versioned and portable across machines without fighting stow or chezmoi. Built to be opinionated about my workflow.',
    language: 'Go',
    languageColor: 'bg-cyan-400',
    tags: ['Go', 'CLI', 'dotfiles', 'symlinks', 'Homebrew'],
    repos: ['alexcatdad/paw'],
    links: [
      { label: 'Repository', url: 'https://github.com/alexcatdad/paw' },
      { label: 'Homebrew tap', url: 'https://github.com/alexcatdad/homebrew-tap' },
    ],
  },
  {
    name: 'paw-proxy',
    tagline: 'Zero-config HTTPS proxy for local macOS development',
    hero: '/images/projects/paw-proxy-hero.png',
    what: 'A local HTTPS reverse proxy that automatically generates and trusts certificates. Point it at any local port and get a .localhost domain with valid HTTPS — no mkcert, no Nginx config.',
    why: 'Tired of the ceremony around local HTTPS setup. This eliminates it entirely — run one command, get a trusted cert.',
    language: 'Go',
    languageColor: 'bg-cyan-400',
    tags: ['Go', 'HTTPS', 'proxy', 'SSL', 'local dev', 'macOS'],
    repos: ['alexcatdad/paw-proxy'],
    links: [
      { label: 'Repository', url: 'https://github.com/alexcatdad/paw-proxy' },
      { label: 'Homebrew tap', url: 'https://github.com/alexcatdad/homebrew-tap' },
    ],
  },
];
