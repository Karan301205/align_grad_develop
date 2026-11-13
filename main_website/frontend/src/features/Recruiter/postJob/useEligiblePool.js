import { useEffect, useRef, useState } from 'react';
import { apiFetch, userMessage, SERVER_MESSAGE } from '../../../services/apiClient';

const DEBOUNCE_MS = 400;

/**
 * Live "candidates who meet all your bars" from POST /recruiter/jobs/eligible-count.
 * Requests are debounced while bars change; replies for an older set of bars are ignored.
 * @returns {{ status: 'idle'|'loading'|'ready'|'error', data: object|null, error: string|null, retry: () => void }}
 */
export default function useEligiblePool(token, requirements) {
  const key = JSON.stringify(requirements.map(({ skillName, minRating }) => [skillName, minRating]));
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const bars = JSON.parse(key).map(([skillName, minRating]) => ({ skillName, minRating }));
    if (bars.length === 0) return undefined;
    const requestId = latest.current + 1;
    latest.current = requestId;
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch('/recruiter/jobs/eligible-count', { token, method: 'POST', json: { requirements: bars } });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
        if (latest.current === requestId) setResult({ key, data: body, error: null });
      } catch (err) {
        if (latest.current === requestId) setResult({ key, data: null, error: userMessage(err) });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [key, token, attempt]);

  const retry = () => {
    setResult((prev) => ({ ...prev, key: null }));
    setAttempt((n) => n + 1);
  };

  if (requirements.length === 0) return { status: 'idle', data: null, error: null, retry };
  if (result.key !== key) return { status: 'loading', data: result.data, error: null, retry };
  if (result.error) return { status: 'error', data: null, error: result.error, retry };
  return { status: 'ready', data: result.data, error: null, retry };
}
