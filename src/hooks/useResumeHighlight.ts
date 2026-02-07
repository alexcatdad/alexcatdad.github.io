import { useEffect, useRef, useState } from 'react';

type SectionId = 'experience' | 'skills' | 'projects' | 'personal';

interface UseResumeHighlightOptions {
  /**
   * The section ID to highlight
   */
  sectionId?: SectionId;
  /**
   * Duration in milliseconds for the highlight animation
   * @default 2000
   */
  duration?: number;
  /**
   * Whether to scroll to the section when highlighted
   * @default true
   */
  scrollToSection?: boolean;
  /**
   * Scroll offset in pixels when scrolling to section
   * @default 120
   */
  scrollOffset?: number;
}

interface UseResumeHighlightReturn {
  /**
   * Currently highlighted section ID
   */
  highlightedSection: SectionId | null;
  /**
   * Function to trigger highlight for a specific section
   */
  highlightSection: (id: SectionId) => void;
  /**
   * Function to trigger highlight for a specific item
   */
  highlightItem: (itemId: string) => void;
  /**
   * Function to clear the highlight
   */
  clearHighlight: () => void;
  /**
   * Check if a section is currently highlighted
   */
  isHighlighted: (id: SectionId) => boolean;
}

/**
 * Hook to manage resume section highlighting with scroll behavior
 */
export function useResumeHighlight(
  options: UseResumeHighlightOptions = {}
): UseResumeHighlightReturn {
  const {
    sectionId: initialSectionId,
    duration = 2000,
    scrollToSection = true,
    scrollOffset = 120,
  } = options;

  const [highlightedSection, setHighlightedSection] = useState<SectionId | null>(
    initialSectionId ?? null
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearHighlight = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setHighlightedSection(null);
  };

  const highlightSection = (id: SectionId) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the highlighted section
    setHighlightedSection(id);

    // Scroll to section if enabled
    if (scrollToSection && typeof window !== 'undefined') {
      // Use a small delay to ensure DOM is ready
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        const element = document.querySelector(`[data-resume-section="${id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const top = rect.top + window.scrollY - scrollOffset;
          window.scrollTo({
            top,
            behavior: 'smooth',
          });
        }
      }, 50);
    }

    // Auto-clear highlight after duration
    timeoutRef.current = setTimeout(() => {
      setHighlightedSection(null);
      timeoutRef.current = null;
    }, duration);
  };

  const highlightItem = (itemId: string) => {
    if (typeof window === 'undefined') return;

    // Use a small delay to ensure DOM is ready
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const element = document.querySelector(`[data-resume-item="${itemId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY - scrollOffset;
        window.scrollTo({
          top,
          behavior: 'smooth',
        });

        // Add a temporary highlight class or style if needed
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, duration);
      }
    }, 50);
  };

  const isHighlighted = (id: SectionId) => {
    return highlightedSection === id;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    highlightedSection,
    highlightSection,
    highlightItem,
    clearHighlight,
    isHighlighted,
  };
}
