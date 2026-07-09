import type { Work } from '@/types/json-resume';

const AGENTIC_ERA_START_DATE = '2023-01';

export function splitWorkByEra(work: Work[]): {
  agenticEra: Work[];
  foundation: Work[];
} {
  const agenticEra: Work[] = [];
  const foundation: Work[] = [];

  for (const job of work) {
    if (job.startDate && job.startDate >= AGENTIC_ERA_START_DATE) {
      agenticEra.push(job);
    } else {
      foundation.push(job);
    }
  }

  return { agenticEra, foundation };
}
