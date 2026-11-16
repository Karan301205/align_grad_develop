import { useCallback, useEffect, useRef, useState } from 'react';

/** A banner message that clears itself: notice = { tone, message } | null. */
export default function useNotice(duration = 5000) {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setNotice(null);
  }, []);

  const show = useCallback(
    (tone, message) => {
      clearTimeout(timer.current);
      setNotice({ tone, message });
      timer.current = setTimeout(() => setNotice(null), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { notice, show, clear };
}
