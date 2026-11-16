import { useCallback, useEffect, useRef, useState } from 'react';

const GENERIC = 'Something went wrong on our side. Please try again in a moment.';

/**
 * Loads one thing from the admin API and returns { data, error, loading, reload, setData }.
 *
 * `fetcher` returns the API's JSON ({ success, ... }); `select` picks the part to keep.
 * A failed load gives the user one plain sentence in `error` (the technical detail is
 * already in the console, see api/adminApi.js). While reloading, the old data stays so
 * the page doesn't blank. A slow, older response never overwrites a newer one.
 * `reload({ silent: true })` refreshes in the background: no spinner, and the old data
 * stays on screen if it fails (the error is still reported).
 */
export default function useResource(fetcher, select = (json) => json) {
  const [state, setState] = useState({ data: null, error: '', loading: true });
  const latest = useRef(0);
  const fetcherRef = useRef(fetcher);
  const selectRef = useRef(select);

  useEffect(() => {
    fetcherRef.current = fetcher;
    selectRef.current = select;
  });

  const reload = useCallback(async ({ silent = false } = {}) => {
    const id = ++latest.current;
    if (!silent) setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const json = await fetcherRef.current();
      if (id !== latest.current) return;
      if (!json || json.success === false) throw new Error(json?.error || GENERIC);
      setState({ data: selectRef.current(json), error: '', loading: false });
    } catch (err) {
      if (id !== latest.current) return;
      console.error('[admin] load failed:', err);
      setState((current) => ({ ...current, error: err.message || GENERIC, loading: false }));
    }
  }, []);

  useEffect(() => {
    reload();
    return () => {
      latest.current += 1; // ignore a response that arrives after unmount
    };
  }, [reload]);

  const setData = useCallback(
    (update) => setState((current) => ({ ...current, data: typeof update === 'function' ? update(current.data) : update })),
    []
  );

  return { ...state, reload, setData };
}
