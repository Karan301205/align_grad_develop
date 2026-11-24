import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, userMessage, SERVER_MESSAGE } from '../../services/apiClient';

// Data for the Help & support page: the signed-in user's tickets (with their
// conversations), the topics they can file under, and the two actions. Errors are
// plain sentences for the UI; the technical detail is already in the console
// (services/apiClient.js).

async function readJson(res) {
  return res.json().catch(() => ({}));
}

export default function useSupportTickets(token) {
  const [state, setState] = useState({ loading: true, error: '', tickets: [], categories: [], limits: null });
  const latest = useRef(0);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++latest.current;
      if (!silent) setState((current) => ({ ...current, loading: true, error: '' }));
      try {
        const res = await apiFetch('/support/tickets', { token });
        const body = await readJson(res);
        if (id !== latest.current) return;
        if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
        setState({ loading: false, error: '', tickets: body.tickets || [], categories: body.categories || [], limits: body.limits || null });
      } catch (err) {
        if (id !== latest.current) return;
        setState((current) => ({ ...current, loading: false, error: userMessage(err) }));
      }
    },
    [token]
  );

  useEffect(() => {
    load();
    return () => {
      latest.current += 1; // ignore a response that arrives after leaving the page
    };
  }, [load]);

  // Puts the ticket the server returned at the top of the list (newest activity first). It is newer
  // than any list still loading (e.g. after Refresh), so that older response is dropped.
  const upsert = (ticket) => {
    latest.current += 1;
    setState((current) => ({ ...current, loading: false, tickets: [ticket, ...current.tickets.filter((t) => t.id !== ticket.id)] }));
  };

  /** Returns { ticket, emailSent } or { error }. */
  const createTicket = async ({ category, subject, message }) => {
    try {
      const res = await apiFetch('/support/tickets', { token, method: 'POST', json: { category, subject, message } });
      const body = await readJson(res);
      if (!res.ok) return { error: body.error || SERVER_MESSAGE };
      upsert(body.ticket);
      return { ticket: body.ticket, emailSent: Boolean(body.emailSent) };
    } catch (err) {
      return { error: userMessage(err) };
    }
  };

  /** Returns { ticket, reopened } or { error }. */
  const reply = async (ticketId, message) => {
    try {
      const res = await apiFetch(`/support/tickets/${ticketId}/messages`, { token, method: 'POST', json: { message } });
      const body = await readJson(res);
      if (!res.ok) return { error: body.error || SERVER_MESSAGE };
      upsert(body.ticket);
      return { ticket: body.ticket, reopened: Boolean(body.reopened) };
    } catch (err) {
      return { error: userMessage(err) };
    }
  };

  return { ...state, reload: load, createTicket, reply };
}
