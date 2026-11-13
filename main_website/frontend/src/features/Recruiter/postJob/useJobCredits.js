import { useCallback, useEffect, useState } from 'react';
import { getPaymentPlanStatus } from '../../../services/paymentService';

import { userMessage } from '../../../services/apiClient';
/**
 * Job credits and the credit pack on offer, from GET /payments/status
 * (quota counted by the server; price from backend payments/plans.js).
 */
export default function useJobCredits(token) {
  const [state, setState] = useState({ loading: true, error: null, quota: null, offer: null });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const status = await getPaymentPlanStatus(token);
      setState({ loading: false, error: null, quota: status.quotaInfo || null, offer: status.offer || null });
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: userMessage(err, 'Could not load your job credits.') }));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
