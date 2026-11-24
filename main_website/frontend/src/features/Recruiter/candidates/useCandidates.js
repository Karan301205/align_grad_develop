import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, SERVER_MESSAGE, userMessage } from '../../../services/apiClient';

// Candidate data from the server, a page at a time (backend candidateSearch.service.js):
//   POST /recruiter/candidates/search   one page of cards for the filters
//   GET  /recruiter/candidates/facets   filter menus (skills, colleges, degrees, years, total)
//   GET  /recruiter/candidates/:id      one full profile (contact details only for applicants)

async function readJson(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
  return body;
}

/** One candidate's full profile (by profile id or user id). */
export async function fetchCandidateDetail(token, id) {
  return readJson(await apiFetch(`/recruiter/candidates/${encodeURIComponent(id)}`, { token }));
}

const appendNew = (items, more) => {
  const seen = new Set(items.map((item) => item.id));
  return [...items, ...more.filter((item) => !seen.has(item.id))];
};

/**
 * Cards for `request` (the search body without `page`). Requests are debounced while filters
 * change, and a reply for an older request is ignored. The previous cards stay on screen while
 * the next ones load, so the list never flashes empty. `loadMore` appends the next page.
 * Pass `request = null` to skip searching.
 */
export function useCandidateSearch(token, request, { debounceMs = 250 } = {}) {
  const key = request ? JSON.stringify(request) : null;
  const [state, setState] = useState({ key: null, data: null, items: [], page: 1, error: null, loadingMore: false, moreError: null });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);

  const fetchPage = useCallback(
    async (body, page) => readJson(await apiFetch('/recruiter/candidates/search', { token, method: 'POST', json: { ...body, page } })),
    [token]
  );

  useEffect(() => {
    if (!key) return undefined;
    const requestId = latest.current + 1;
    latest.current = requestId;
    const timer = setTimeout(async () => {
      try {
        const data = await fetchPage(JSON.parse(key), 1);
        if (latest.current === requestId) setState({ key, data, items: data.items, page: 1, error: null, loadingMore: false, moreError: null });
      } catch (err) {
        if (latest.current === requestId) setState((prev) => ({ ...prev, key, error: userMessage(err), loadingMore: false }));
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [key, fetchPage, attempt, debounceMs]);

  const loadMore = async () => {
    if (state.key !== key || !state.data?.hasMore || state.loadingMore) return;
    const requestId = latest.current;
    setState((prev) => ({ ...prev, loadingMore: true, moreError: null }));
    try {
      const data = await fetchPage(JSON.parse(key), state.page + 1);
      if (latest.current === requestId) {
        setState((prev) => ({ ...prev, data: { ...prev.data, ...data }, items: appendNew(prev.items, data.items), page: data.page, loadingMore: false }));
      }
    } catch (err) {
      if (latest.current === requestId) setState((prev) => ({ ...prev, loadingMore: false, moreError: userMessage(err) }));
    }
  };

  const retry = () => {
    setState((prev) => ({ ...prev, key: null, error: null }));
    setAttempt((n) => n + 1);
  };

  const current = state.key === key;
  return {
    status: !key ? 'idle' : !current ? 'loading' : state.error ? 'error' : 'ready',
    items: state.items,
    total: state.data?.total ?? 0,
    meetsCount: state.data?.meetsCount ?? null,
    recommended: Boolean(state.data?.recommended),
    demand: state.data?.demand || null,
    hasMore: current && Boolean(state.data?.hasMore),
    loadingMore: state.loadingMore,
    moreError: state.moreError,
    error: current ? state.error : null,
    loadMore,
    retry
  };
}

/** Filter menus for the Candidates page (loaded once). */
export function useCandidateFacets(token, enabled = true) {
  const [state, setState] = useState({ status: enabled ? 'loading' : 'idle', data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await readJson(await apiFetch('/recruiter/candidates/facets', { token }));
        if (!cancelled) setState({ status: 'ready', data, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', data: null, error: userMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, enabled, attempt]);

  return {
    ...state,
    retry: () => {
      setState({ status: 'loading', data: null, error: null });
      setAttempt((n) => n + 1);
    }
  };
}

/**
 * Full profiles, fetched once per candidate while this page is open.
 * `load(id)` resolves to the profile; `entries[id]` is { status, data, error } for rendering.
 */
export function useCandidateProfiles(token) {
  const [entries, setEntries] = useState({});
  const requests = useRef(new Map());

  const load = useCallback(
    (id) => {
      if (!id) return Promise.resolve(null);
      if (requests.current.has(id)) return requests.current.get(id);
      const request = (async () => {
        setEntries((prev) => ({ ...prev, [id]: { status: 'loading', data: null, error: null } }));
        try {
          const data = await fetchCandidateDetail(token, id);
          setEntries((prev) => ({ ...prev, [id]: { status: 'ready', data, error: null } }));
          return data;
        } catch (err) {
          requests.current.delete(id); // let a retry ask again
          setEntries((prev) => ({ ...prev, [id]: { status: 'error', data: null, error: userMessage(err) } }));
          throw err;
        }
      })();
      requests.current.set(id, request);
      return request;
    },
    [token]
  );

  return { entries, load };
}
