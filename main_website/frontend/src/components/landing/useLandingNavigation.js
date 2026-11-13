import { useMemo } from 'react';
import {
  COMMON_LANDING_PATH,
  CANDIDATE_LANDING_PATH,
  RECRUITER_LANDING_PATH,
  LANDING_URL,
  CANDIDATE_URL,
  RECRUITER_URL
} from '../../config';

const isLocalHost = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/** Let ctrl/cmd/shift/middle clicks open the real href in a new tab or window. */
const isModifiedClick = (event) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

/** Client-side route change; App.jsx re-renders on pushState/popstate. */
function goToPath(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

/** Link props for a portal: a cross-subdomain URL when configured (not on localhost), otherwise an in-app path. */
function portalLink(externalBase, path) {
  const useExternal = Boolean(externalBase) && !isLocalHost();
  const href = useExternal ? `${externalBase}${path}` : path;
  return {
    href,
    onClick: (event) => {
      if (useExternal || isModifiedClick(event)) return;
      event.preventDefault();
      goToPath(path);
    }
  };
}

/**
 * Everything the landing page links to:
 *  - home / candidate / recruiter: spread onto an <a> (`{...nav.candidate}`)
 *  - section(id): smooth-scroll to a section on this page
 *  - page(path): in-app route such as /privacy
 */
export default function useLandingNavigation() {
  return useMemo(
    () => ({
      home: portalLink(LANDING_URL, COMMON_LANDING_PATH),
      candidate: portalLink(CANDIDATE_URL, CANDIDATE_LANDING_PATH),
      recruiter: portalLink(RECRUITER_URL, RECRUITER_LANDING_PATH),
      section: (id) => ({
        href: `#${id}`,
        onClick: (event) => {
          if (isModifiedClick(event)) return;
          event.preventDefault();
          if (id === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
      }),
      page: (path) => ({
        href: path,
        onClick: (event) => {
          if (isModifiedClick(event)) return;
          event.preventDefault();
          goToPath(path);
        }
      })
    }),
    []
  );
}
