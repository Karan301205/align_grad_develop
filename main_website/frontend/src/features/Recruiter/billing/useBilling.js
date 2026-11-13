import { useCallback, useEffect, useState } from 'react';
import { apiFetch, userMessage } from '../../../services/apiClient';

async function getJson(path, token, fallbackError) {
  const res = await apiFetch(path, { token });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${fallbackError} (HTTP ${res.status}).`);
  return data;
}

/**
 * Billing data for the signed-in recruiter, straight from the server:
 * GET /payments/status (job-credit quota + the pack on offer, priced by the backend)
 * and GET /payments/history (completed payments).
 */
export default function useBilling(token) {
  const [state, setState] = useState({ loading: true, error: null, status: null, payments: [] });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [status, history] = await Promise.all([
        getJson('/payments/status', token, 'Could not load your job credits'),
        getJson('/payments/history', token, 'Could not load your payments')
      ]);
      setState({ loading: false, error: null, status, payments: Array.isArray(history.payments) ? history.payments : [] });
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: userMessage(err, 'Could not load billing details.') }));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
