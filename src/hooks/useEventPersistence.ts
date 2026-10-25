import { useState, useEffect, useRef } from 'react';
import { EventPlan } from '../types';

export interface EventPersistenceState {
  isSaving: boolean;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving' | 'idle' | 'error';
  errorMessage: string | null;
}

/**
 * Debounced persistence hook that saves EventPlan to localStorage after 500ms of inactivity.
 * Provides live auto-save indicators and notifications for maximum responsiveness and reliability.
 */
export function useEventPersistence(
  plan: EventPlan,
  storageKey: string = 'celebrite_event_plan',
  debounceMs: number = 500
): EventPersistenceState {
  const [state, setState] = useState<EventPersistenceState>({
    isSaving: false,
    lastSaved: null,
    saveStatus: 'idle',
    errorMessage: null,
  });

  const isInitialMount = useRef(true);

  useEffect(() => {
    // Avoid marking as saving on first render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, saveStatus: 'saving' }));

    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(plan));
        setState({
          isSaving: false,
          lastSaved: new Date(),
          saveStatus: 'saved',
          errorMessage: null,
        });
      } catch (err: unknown) {
        console.error('Failed to auto-save celebration event plan:', err);
        const msg = err instanceof Error ? err.message : 'Storage quota exceeded or unavailable';
        setState({
          isSaving: false,
          lastSaved: null,
          saveStatus: 'error',
          errorMessage: msg,
        });
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [plan, storageKey, debounceMs]);

  return state;
}

export default useEventPersistence;
