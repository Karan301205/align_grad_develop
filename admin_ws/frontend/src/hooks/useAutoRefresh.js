import { useEffect } from 'react';

/**
 * Calls `reload({ silent: true })` every `intervalMs` while `active` is true and the browser tab is
 * in front, and once at once when the tab comes back to the front. `reload` must be a stable function
 * (useResource's is).
 */
export default function useAutoRefresh(reload, { intervalMs = 30000, active = true } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const refresh = () => {
      if (document.visibilityState === 'visible') reload({ silent: true });
    };
    const timer = setInterval(refresh, intervalMs);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [active, intervalMs, reload]);
}
