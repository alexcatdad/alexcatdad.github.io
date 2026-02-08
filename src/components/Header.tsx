import { ArrowUpRight, Globe, Mail, MapPin, UserRound } from 'lucide-react';
import type { Basics } from '@/types/json-resume';

interface HeaderProps {
  basics?: Basics;
}

export function Header({ basics }: HeaderProps) {
  if (!basics) return null;

  const location = basics.location
    ? `${basics.location.city || ''}${basics.location.city && basics.location.countryCode ? ', ' : ''}${basics.location.countryCode || ''}`
    : '';

  const contactItems = [
    basics.email && {
      icon: Mail,
      label: basics.email,
      href: `mailto:${basics.email}`,
    },
    location && {
      icon: MapPin,
      label: location,
    },
    basics.url && {
      icon: Globe,
      label: basics.url.replace(/^https?:\/\//, ''),
      href: basics.url,
    },
  ].filter((item): item is { icon: typeof Mail; label: string; href?: string } => Boolean(item));

  const featuredProfile = basics.profiles?.[0];

  return (
    <header className="interactive-card mb-12 rounded-3xl border border-border bg-card/50 p-6 shadow-apple-lg backdrop-blur-xl dark:bg-card/50 transition-[border-color,box-shadow] duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {basics.name && (
            <h1 className="text-4xl font-semibold text-foreground text-balance md:text-5xl">
              {basics.name}
            </h1>
          )}
          {basics.label && (
            <p className="text-lg font-medium text-primary/90 transition-opacity">{basics.label}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {location && (
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-foreground dark:bg-secondary">
                {location}
              </span>
            )}
            {basics.pronouns && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] text-foreground dark:bg-secondary">
                <UserRound className="h-3.5 w-3.5 text-primary" />
                {basics.pronouns}
              </span>
            )}
          </div>
        </div>
        {featuredProfile && (
          <a
            href={featuredProfile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary dark:border-border dark:bg-secondary dark:hover:border-primary dark:hover:text-primary"
          >
            <span>{featuredProfile.network}</span>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </div>

      {contactItems.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {contactItems.map((item) => {
            const Icon = item.icon;
            const sharedProps = {
              className:
                'group flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground transition dark:border-border dark:bg-secondary',
            };
            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`${sharedProps.className} hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary`}
              >
                <Icon className="h-4 w-4 text-primary transition group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </a>
            ) : (
              <div key={item.label} className={sharedProps.className}>
                <Icon className="h-4 w-4 text-primary" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
