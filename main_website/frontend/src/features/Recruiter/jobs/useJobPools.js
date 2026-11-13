import { useEffect, useRef, useState } from 'react';
import { apiFetch, userMessage, SERVER_MESSAGE } from '../../../services/apiClient';

const requirementsKey = (requirements) =>
  JSON.stringify((requirements || []).map((req) => [String(req.skillName || '').toLowerCase(), Number(req.minRating)]).sort());

/**
 * "N candidates meet your bars" for each job, from POST /recruiter/jobs/eligible-count
 * (the same rule that decides who may apply). Jobs with the same bars share one
 * request, two run at a time, and answers are kept while the page is open.
 * Returns { [jobId]: { status: 'none' | 'loading' | 'done' | 'error', eligible, total, error } }.
 */
export default function useJobPools(jobs, token) {
  const [byKey, setByKey] = useState({});
  const requested = useRef(new Set());

  useEffect(() => {
    const asked = requested.current;
    const queue = [];
    jobs.forEach((job) => {
      const requirements = (job.requirements || []).map(({ skillName, minRating }) => ({ skillName, minRating: Number(minRating) }));
      if (requirements.length === 0) return;
      const key = requirementsKey(requirements);
      if (asked.has(key)) return;
      asked.add(key);
      queue.push({ key, requirements });
    });
    if (queue.length === 0) return undefined;

    let cancelled = false;
    setByKey((prev) => ({ ...prev, ...Object.fromEntries(queue.map(({ key }) => [key, { status: 'loading' }])) }));

    const run = async () => {
      while (queue.length && !cancelled) {
        const { key, requirements } = queue.shift();
        let result;
        try {
          const res = await apiFetch('/recruiter/jobs/eligible-count', { token, method: 'POST', json: { requirements } });
          const body = await res.json().catch(() => ({}));
          result = res.ok
            ? { status: 'done', eligible: body.eligible, total: body.total }
            : { status: 'error', error: body.error || SERVER_MESSAGE };
        } catch (err) {
          result = { status: 'error', error: userMessage(err) };
        }
        // Answers are keyed by the bars, so one that arrives after the list changed is still right.
        // A failed count is asked again the next time the list changes (e.g. after Refresh).
        if (result.status === 'error') asked.delete(key);
        setByKey((prev) => ({ ...prev, [key]: result }));
      }
    };
    run();
    run();
    return () => {
      // Stop starting new requests; the ones not started yet are asked again on the next run.
      cancelled = true;
      queue.forEach(({ key }) => asked.delete(key));
    };
  }, [jobs, token]);

  const pools = {};
  jobs.forEach((job) => {
    const key = requirementsKey(job.requirements);
    pools[job.id] = (job.requirements || []).length === 0 ? { status: 'none' } : byKey[key] || { status: 'loading' };
  });
  return pools;
}
