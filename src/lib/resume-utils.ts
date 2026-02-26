import type { Work } from '@/types/json-resume';

const AGENTIC_ERA_START = 'Conversy';

export function splitWorkByEra(work: Work[]): {
  agenticEra: Work[];
  foundation: Work[];
} {
  const agenticEra: Work[] = [];
  const foundation: Work[] = [];

  for (const job of work) {
    if (job.name === AGENTIC_ERA_START) {
      agenticEra.push(job);
    } else {
      foundation.push(job);
    }
  }

  return { agenticEra, foundation };
}
