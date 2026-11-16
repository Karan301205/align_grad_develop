import { useEffect, useRef } from 'react';
import { usePageActive } from '../app/PageActiveContext.js';
import useResource from './useResource.js';

/**
 * useResource that also refreshes itself every `intervalMs` while its page is the visible
 * one and the browser tab is in front. Refreshes are silent (no spinner). Coming back to the
 * page, or to the tab, refreshes at once.
 */
export default function useLiveResource(fetcher, select, { intervalMs = 30000 } = {}) {
  const resource = useResource(fetcher, select);
  const active = usePageActive();
  const { reload } = resource;
  const arrived = useRef(false);

  // Back on the page after being away: refresh now. (The first load is useResource's own.)
  useEffect(() => {
    if (active && arrived.current) reload({ silent: true });
    arrived.current = true;
  }, [active, reload]);

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

  return resource;
}
