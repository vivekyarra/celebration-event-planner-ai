import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * Type-safe localStorage hook with error boundary safety and cross-tab synchronization.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, () => void] {
  // Read initial stored value or fallback
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`useLocalStorage: Error reading key "${key}":`, error);
    }

    return initialValue instanceof Function ? initialValue() : initialValue;
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      if (typeof window === 'undefined') {
        console.warn(`useLocalStorage: window is undefined, cannot set key "${key}"`);
        return;
      }

      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (writeErr) {
            console.error(`useLocalStorage: Failed to write to key "${key}":`, writeErr);
          }
          return valueToStore;
        });
      } catch (error) {
        console.error(`useLocalStorage: Error setting key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      const fallback = initialValue instanceof Function ? initialValue() : initialValue;
      setStoredValue(fallback);
    } catch (error) {
      console.warn(`useLocalStorage: Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Synchronize with external changes across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (err) {
          console.warn(`useLocalStorage: Error parsing updated key "${key}":`, err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
