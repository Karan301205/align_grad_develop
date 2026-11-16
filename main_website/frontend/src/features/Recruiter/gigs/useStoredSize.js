import { useEffect, useState } from 'react';

/** A size in px the user can change, remembered in this browser. `initial` may be null (= automatic). */
export default function useStoredSize(key, initial) {
  const [size, setSize] = useState(() => {
    try {
      const stored = Number(localStorage.getItem(key));
      return Number.isFinite(stored) && stored > 0 ? stored : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      if (size == null || size === initial) localStorage.removeItem(key);
      else localStorage.setItem(key, String(size));
    } catch {
      // Storage can be blocked (private window); the size just isn't remembered.
    }
  }, [key, size, initial]);

  return [size, setSize];
}
