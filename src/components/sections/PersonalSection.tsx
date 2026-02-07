import type { Certificate, Education, Interest, Language, Volunteer } from '@/types/json-resume';

interface PersonalSectionProps {
  volunteer?: Volunteer[];
  interests?: Interest[];
  education?: Education[];
  languages?: Language[];
  certificates?: Certificate[];
  formatDate: (date?: string) => string;
  highlighted?: boolean;
}

export function PersonalSection({
  volunteer,
  interests,
  education,
  languages,
  certificates,
  formatDate,
  highlighted = false,
}: PersonalSectionProps) {
  return (
    <div data-resume-section="personal" data-highlighted={highlighted}>
      {volunteer && volunteer.length > 0 && (
        <section className="interactive-card mb-10 rounded-3xl border border-border bg-card/50 p-6 shadow-apple transition-colors dark:border-border dark:bg-card">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground dark:text-foreground">
            <span className="text-primary">▸</span> Volunteer
          </h2>
          <div className="space-y-4">
            {volunteer.map((v, index) => (
              <article
                key={`${v.organization ?? 'volunteer'}-${v.position ?? 'role'}`}
                data-resume-item={`volunteer.${index}`}
                className="hover-lift rounded-2xl border border-border bg-secondary/30 p-5 text-sm transition-transform duration-300 hover:-translate-y-1 dark:border-border dark:bg-background/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    {v.position && (
                      <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                        {v.position}
                      </h3>
                    )}
                    {v.organization && <p className="text-sm text-accent">{v.organization}</p>}
                  </div>
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {formatDate(v.startDate)} – {formatDate(v.endDate)}
                  </span>
                </div>
                {v.summary && (
                  <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                    {v.summary}
                  </p>
                )}
                {v.highlights && v.highlights.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                    {v.highlights.map((h) => (
                      <li key={`${v.organization ?? 'volunteer'}-${h}`}>• {h}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {interests && interests.length > 0 && (
        <section className="interactive-card mb-10 rounded-3xl border border-border bg-card/50 p-6 shadow-apple transition-colors dark:border-border dark:bg-card">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground dark:text-foreground">
            <span className="text-primary">▸</span> Interests
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {interests.map((int) => (
              <article
                key={`${int.name ?? 'interest'}`}
                className="hover-lift rounded-2xl border border-border bg-secondary/30 p-5 text-sm transition-transform duration-300 hover:-translate-y-1 dark:border-border dark:bg-background/30"
              >
                {int.name && (
                  <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-foreground">
                    {int.name}
                  </h3>
                )}
                {int.keywords && int.keywords.length > 0 && (
                  <ul className="space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                    {int.keywords.map((kw) => (
                      <li key={`${int.name ?? 'interest'}-${kw}`}>{kw}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {(education || languages || certificates) && (
        <section className="interactive-card mb-10 rounded-3xl border border-border bg-card/50 p-6 shadow-apple transition-colors dark:border-border dark:bg-card">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground dark:text-foreground">
            <span className="text-primary">▸</span> Education & Languages
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {education && education.length > 0 && (
              <div className="hover-lift rounded-2xl border border-border bg-secondary/30 p-5 text-sm transition-transform duration-300 hover:-translate-y-1 dark:border-border dark:bg-background/30">
                {education.map((edu, index) => (
                  <div
                    key={`${edu.institution ?? 'education'}-${edu.startDate ?? index}`}
                    data-resume-item={`education.${index}`}
                    className={
                      index > 0 ? 'mt-4 border-t border-border pt-4 dark:border-border' : ''
                    }
                  >
                    {edu.studyType && (
                      <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                        {edu.studyType}
                      </h3>
                    )}
                    {edu.institution && <p className="text-sm text-accent">{edu.institution}</p>}
                    {edu.area && (
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {edu.area}
                        {edu.endDate && ` · ${edu.endDate.split('-')[0]}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="hover-lift rounded-2xl border border-border bg-secondary/30 p-5 text-sm transition-transform duration-300 hover:-translate-y-1 dark:border-border dark:bg-background/30">
              {languages && languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                    Languages
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {languages.map((lang) => (
                      <span
                        key={`${lang.language}-${lang.fluency ?? 'fluency'}`}
                        className="text-sm text-muted-foreground dark:text-muted-foreground"
                      >
                        {lang.language}{' '}
                        {lang.fluency && (
                          <span className="text-xs text-muted-foreground/80 dark:text-muted-foreground/80">
                            ({lang.fluency})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {certificates && certificates.length > 0 && (
                <div
                  className={
                    languages && languages.length > 0
                      ? 'mt-4 border-t border-border pt-4 dark:border-border'
                      : ''
                  }
                >
                  <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                    Certificates
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
                    {certificates.map((cert) => (
                      <li key={`${cert.name}-${cert.issuer ?? 'issuer'}`}>
                        {cert.name}
                        {cert.issuer && (
                          <span className="text-muted-foreground/80 dark:text-muted-foreground/80">
                            {' '}
                            · {cert.issuer}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
