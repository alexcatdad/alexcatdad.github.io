import { Download, FileCode2, FileText, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildDownloadFileName } from '@/lib/download-utils';
import { generateMarkdown } from '@/lib/markdown-export';
import { filterResumeByRole, getRoleFromSearchParams } from '@/lib/role-filter';
import { cn } from '@/lib/utils';
import type { JSONResume } from '@/types/json-resume';

interface DownloadButtonsProps {
  resume: JSONResume;
  alignment?: 'left' | 'right';
}

export function DownloadButtons({ resume, alignment = 'right' }: DownloadButtonsProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<'pdf' | 'markdown' | null>(null);
  const [activeRoleLabel, setActiveRoleLabel] = useState<string | null>(null);

  const statusMessage = isDownloading
    ? `Preparing ${isDownloading === 'pdf' ? 'PDF' : 'Markdown'} download`
    : isOpen
      ? 'Download menu expanded'
      : 'Download menu collapsed';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const role = getRoleFromSearchParams(params);
    if (role !== 'all') {
      const label = resume._custom?.targetRoles?.[role]?.label ?? role.replace(/-/g, ' ');
      setActiveRoleLabel(label);
    } else {
      setActiveRoleLabel(null);
    }
  }, [resume._custom?.targetRoles]);

  const getFilteredResume = (): JSONResume => {
    if (typeof window === 'undefined') return resume;
    const params = new URLSearchParams(window.location.search);
    const role = getRoleFromSearchParams(params);
    return filterResumeByRole(resume, role);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownload = async (format: 'pdf' | 'markdown') => {
    setIsDownloading(format);

    try {
      const filtered = getFilteredResume();
      const role = getRoleFromSearchParams(new URLSearchParams(window.location.search));

      if (format === 'markdown') {
        const markdown = generateMarkdown(filtered);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const filename = buildDownloadFileName({
          basics: filtered.basics,
          targetRoles: filtered._custom?.targetRoles,
          role,
          format: 'markdown',
        });
        triggerDownload(blob, filename);
      } else {
        // Dynamic import to avoid bundling @react-pdf/renderer on initial load
        const [{ pdf }, { ProfilePDF }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@/components/pdf/ProfilePDF'),
        ]);
        const roleLabel =
          role !== 'all'
            ? (filtered._custom?.targetRoles?.[role]?.label ?? role.replace(/-/g, ' '))
            : undefined;
        const blob = await pdf(ProfilePDF({ resume: filtered, roleLabel })).toBlob();
        const filename = buildDownloadFileName({
          basics: filtered.basics,
          targetRoles: filtered._custom?.targetRoles,
          role,
          format: 'pdf',
        });
        triggerDownload(blob, filename);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-8 z-50', alignment === 'left' ? 'left-8' : 'right-8')}>
      <output className="sr-only" aria-live="polite">
        {statusMessage}
      </output>

      <div
        className={cn(
          'absolute bottom-20 flex flex-col gap-3 transition-all duration-200',
          alignment === 'left' ? 'left-0 items-start' : 'right-0 items-end',
          isOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-5'
        )}
      >
        {isOpen && activeRoleLabel && (
          <output
            className="glass-subtle flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-xs font-semibold text-foreground shadow-apple"
            aria-live="polite"
          >
            <Sparkles className="h-4 w-4 text-accent dark:text-accent" />
            Focused for {activeRoleLabel}
          </output>
        )}
        {isOpen && (
          <>
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading !== null}
              className={cn(
                'group relative flex items-center gap-3 px-5 py-3 glass rounded-2xl border border-border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.01] hover:border-primary shadow-apple',
                alignment === 'left'
                  ? 'hover:translate-x-1 flex-row-reverse'
                  : 'hover:-translate-x-1'
              )}
              aria-busy={isDownloading === 'pdf'}
            >
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {isDownloading === 'pdf' ? 'Generating...' : 'Download PDF'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                {isDownloading === 'pdf' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" />
                ) : (
                  <FileText className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDownload('markdown')}
              disabled={isDownloading !== null}
              className={cn(
                'group relative flex items-center gap-3 px-5 py-3 glass rounded-2xl border border-border transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.01] hover:border-accent shadow-apple',
                alignment === 'left'
                  ? 'hover:translate-x-1 flex-row-reverse'
                  : 'hover:-translate-x-1'
              )}
              aria-busy={isDownloading === 'markdown'}
            >
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                {isDownloading === 'markdown' ? 'Generating...' : 'Download Markdown'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg">
                {isDownloading === 'markdown' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" />
                ) : (
                  <FileCode2 className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading !== null}
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent transition-all duration-300 shadow-apple-lg hover:shadow-primary/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40',
          isOpen && 'rotate-180'
        )}
        aria-label={isOpen ? 'Close download menu' : 'Open download menu'}
        aria-expanded={isOpen}
        aria-busy={isDownloading !== null}
      >
        {isDownloading !== null ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary-foreground" />
        ) : isOpen ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <Download className="w-6 h-6 text-primary-foreground" />
        )}
      </button>
    </div>
  );
}
