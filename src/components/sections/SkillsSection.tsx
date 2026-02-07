import { Layers3 } from 'lucide-react';
import type { Skill } from '@/types/json-resume';

interface SkillsSectionProps {
  skills: Skill[];
  highlighted?: boolean;
}

export function SkillsSection({ skills, highlighted = false }: SkillsSectionProps) {
  return (
    <section
      className="mb-12"
      aria-label="Skills"
      data-resume-section="skills"
      data-highlighted={highlighted}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary dark:text-primary">
          <Layers3 className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80 dark:text-primary/80">
            Core skills
          </p>
          <h2 className="text-2xl font-semibold text-foreground dark:text-foreground">
            Technical range
          </h2>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {skills.map((skill, index) => (
          <article
            key={`${skill.name ?? 'skill'}-${index}`}
            data-resume-item={`skills.${index}`}
            className="interactive-card rounded-3xl border border-border bg-card/50 p-5 text-sm text-foreground/90 shadow-apple transition-transform duration-300 hover:-translate-y-1 dark:border-border dark:bg-card dark:text-muted-foreground"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              {skill.name && (
                <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                  {skill.name}
                </h3>
              )}
              {skill.level && (
                <span className="rounded-full border border-primary/50 px-3 py-1 text-xs text-primary dark:border-primary/50 dark:text-primary">
                  {skill.level}
                </span>
              )}
            </div>
            {skill.keywords && skill.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skill.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-primary dark:border-border dark:bg-background/30 dark:text-primary"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
            {skill.practicalApplications && skill.practicalApplications.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground dark:border-border dark:bg-background/30 dark:text-muted-foreground">
                <p className="font-semibold uppercase tracking-[0.3em] text-primary dark:text-primary">
                  In practice
                </p>
                <ul className="mt-2 space-y-1">
                  {skill.practicalApplications.map((application) => (
                    <li key={application}>↳ {application}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
