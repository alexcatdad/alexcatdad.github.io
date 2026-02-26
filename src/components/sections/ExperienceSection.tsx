import { BriefcaseBusiness } from 'lucide-react';
import { splitWorkByEra } from '@/lib/resume-utils';
import { cn } from '@/lib/utils';
import type { Work } from '@/types/json-resume';

interface ExperienceSectionProps {
  work: Work[];
  formatDate: (date?: string) => string;
  highlighted?: boolean;
}

const parseDate = (date?: string) => {
  if (!date) return null;
  const [year, month = '01'] = date.split('-');
  return new Date(Number(year), Number(month) - 1 || 0);
};

const getDuration = (start?: string, end?: string) => {
  const startDate = parseDate(start);
  if (!startDate) return null;
  const endDate = parseDate(end) ?? new Date();
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years <= 0 && remainder <= 0) return null;
  return `${years > 0 ? `${years}y ` : ''}${remainder > 0 ? `${remainder}m` : ''}`.trim();
};

function WorkCard({
  job,
  index,
  formatDate,
  highlighted,
  compact = false,
}: {
  job: Work;
  index: number;
  formatDate: (date?: string) => string;
  highlighted: boolean;
  compact?: boolean;
}) {
  return (
    <article
      key={`${job.name ?? 'role'}-${job.position ?? 'position'}-${job.startDate ?? 'start'}`}
      data-resume-item={`work.${index}`}
      className={cn(
        'interactive-card relative rounded-3xl border border-border bg-card/50 p-5 text-sm text-foreground/90 shadow-apple transition-transform duration-300 hover:-translate-y-1 focus-within:outline-none dark:border-border dark:bg-card',
        compact ? 'mb-6' : 'mb-8'
      )}
    >
      <span
        className="absolute -left-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-xs font-semibold text-primary transition-transform duration-300"
        style={{ transform: highlighted ? 'scale(1.1)' : 'scale(1)' }}
      >
        {job.name?.[0] ?? '•'}
      </span>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          {job.position && (
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
              {job.position}
            </h3>
          )}
          {job.name && <p className="text-sm text-accent">{job.name}</p>}
        </div>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
          <p>
            {formatDate(job.startDate)} — {formatDate(job.endDate)}
          </p>
          {getDuration(job.startDate, job.endDate) && (
            <p className="text-xs text-muted-foreground/80 dark:text-muted-foreground/80">
              {getDuration(job.startDate, job.endDate)}
            </p>
          )}
          {job.teamSize && (
            <p className="mt-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground dark:border-border dark:text-muted-foreground">
              Team: {job.teamSize}
            </p>
          )}
        </div>
      </div>
      {!compact && job.summary && (
        <p className="mt-3 text-sm text-muted-foreground dark:text-muted-foreground">
          {job.summary}
        </p>
      )}
      {job.highlights && job.highlights.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-foreground/80 dark:text-foreground/80">
          {job.highlights.map((highlight) => (
            <li key={`${job.name ?? 'role'}-${highlight}`} className="flex items-start gap-2">
              <span className="mt-1 text-accent">•</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}
      {!compact && job.keywords && job.keywords.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {job.keywords.map((keyword) => (
            <span
              key={`${job.name ?? 'role'}-${keyword}`}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground dark:border-border dark:bg-background/30 dark:text-muted-foreground"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function ExperienceSection({
  work,
  formatDate,
  highlighted = false,
}: ExperienceSectionProps) {
  const { agenticEra, foundation } = splitWorkByEra(work);

  return (
    <section
      className="mb-12"
      aria-label="Experience timeline"
      data-resume-section="experience"
      data-highlighted={highlighted}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-accent">
          <BriefcaseBusiness className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">
            Experience
          </p>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground">
            Impact timeline
          </h2>
        </div>
      </div>
      <div className="relative ps-6 before:absolute before:left-3 before:top-3 before:h-[calc(100%-12px)] before:w-px before:bg-gradient-to-b before:from-primary/60 before:via-border before:to-transparent dark:before:via-border">
        {/* Agentic Era */}
        {agenticEra.length > 0 && (
          <>
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Agentic Era
              </span>
            </div>
            {agenticEra.map((job, index) => (
              <WorkCard
                key={`${job.name ?? 'role'}-${job.position ?? 'position'}-${job.startDate ?? 'start'}`}
                job={job}
                index={index}
                formatDate={formatDate}
                highlighted={highlighted}
              />
            ))}
          </>
        )}

        {/* Foundation */}
        {foundation.length > 0 && (
          <>
            <div className="mb-6 mt-10 border-t border-border pt-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Foundation
              </span>
              <p className="mt-2 text-xs text-muted-foreground">
                Pre-AI roles condensed to transferable value for agentic work
              </p>
            </div>
            {foundation.map((job, index) => (
              <WorkCard
                key={`${job.name ?? 'role'}-${job.position ?? 'position'}-${job.startDate ?? 'start'}`}
                job={job}
                index={agenticEra.length + index}
                formatDate={formatDate}
                highlighted={highlighted}
                compact
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
}
