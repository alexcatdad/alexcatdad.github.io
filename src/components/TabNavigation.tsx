import { cn } from '@/lib/utils';

type TabType = 'full' | 'experience' | 'skills' | 'projects' | 'personal';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'full', label: 'Full profile' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'personal', label: 'Personal' },
  ];

  return (
    <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-border bg-secondary/50 p-2 text-sm font-semibold text-muted-foreground dark:border-border dark:bg-card dark:text-muted-foreground">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={cn(
              'relative flex-1 rounded-xl px-4 py-2 transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              isActive
                ? 'bg-primary text-primary-foreground shadow-apple'
                : 'text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground'
            )}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-pressed={isActive}
          >
            {tab.label}
            {isActive && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-primary/80 shadow-apple"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
