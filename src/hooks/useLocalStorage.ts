import { useCallback, useRef } from 'react';

/**
 * Returns a stable pair of [read, write] functions for a given localStorage key.
 * All localStorage access in the app should go through this hook — never call
 * localStorage.setItem / .getItem directly in components or other hooks.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const fallbackRef = useRef(fallback);

  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallbackRef.current;
      return JSON.parse(raw) as T;
    } catch {
      return fallbackRef.current;
    }
  }, [key]);

  const write = useCallback(
    (value: T): void => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silently ignore quota errors or private-browsing restrictions.
      }
    },
    [key]
  );

  const clear = useCallback((): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return { read, write, clear } as const;
}
