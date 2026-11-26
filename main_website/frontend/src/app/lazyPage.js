import { lazy } from 'react';

// Pages are separate files that load the first time they're shown (React.lazy), so a visitor
// downloads only the screens they open. Render them inside <Suspense> (main.jsx and the layouts).
//
// After a new deploy, a tab that was already open can ask for a page file that no longer
// exists. Reload once to pick up the new version; a second failure within a minute (no
// connection, say) goes to PageErrorBoundary instead of reloading again.
const RELOAD_KEY = 'aligngrad:reloaded-for-update';

function reloadOnce() {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) || 0) < 60 * 1000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false; // storage blocked: don't risk a reload loop
  }
  window.location.reload();
  return true;
}

export function lazyPage(load) {
  return lazy(() => load().catch((err) => {
    console.error('[pages] A page file failed to load:', err);
    if (reloadOnce()) return new Promise(() => {}); // keep the loader up while the page reloads
    throw err;
  }));
}
