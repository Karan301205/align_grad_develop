import { useEffect, useState } from 'react';

/** The current time, refreshed every `intervalMs`, so "updated 12 s ago" keeps counting. */
export default function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
