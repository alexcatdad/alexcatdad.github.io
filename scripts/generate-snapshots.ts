import { $ } from 'bun';

await $`bun run scripts/generate-stats-snapshot.ts`;
await $`bun run scripts/generate-claude-stats-snapshot.ts`;
