import { useState, useCallback, useRef } from 'react';

export interface AnnouncerHook {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcement: string;
}

/**
 * Custom accessibility hook to deliver screen reader announcements using ARIA live regions.
 * Updates the global #live-announcer DOM node and maintains React state.
 */
export function useAnnouncer(): AnnouncerHook {
  const [announcement, setAnnouncement] = useState<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!message) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setAnnouncement(message);

    // Sync with DOM #live-announcer if present
    if (typeof document !== 'undefined') {
      const announcerEl = document.getElementById('live-announcer');
      if (announcerEl) {
        announcerEl.setAttribute('aria-live', priority);
        // Clear briefly then re-populate to ensure screen readers announce repeated text
        announcerEl.textContent = '';
        setTimeout(() => {
          announcerEl.textContent = message;
        }, 50);
      }
    }

    // Auto-clear message state after 4 seconds
    timeoutRef.current = setTimeout(() => {
      setAnnouncement('');
    }, 4000);
  }, []);

  return { announce, announcement };
}

export default useAnnouncer;
