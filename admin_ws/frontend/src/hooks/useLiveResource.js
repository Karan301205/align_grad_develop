import { useEffect, useRef } from 'react';
import { usePageActive } from '../app/PageActiveContext.js';
import useAutoRefresh from './useAutoRefresh.js';
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

  useAutoRefresh(reload, { intervalMs, active });

  return resource;
}
