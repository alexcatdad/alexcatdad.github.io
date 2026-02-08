import { $ } from 'bun';

await $`bun run scripts/generate-projects-snapshot.ts`;
await $`bun run scripts/generate-stats-snapshot.ts`;
