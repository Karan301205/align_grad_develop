import { useCallback, useEffect, useRef, useState } from 'react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../services/apiClient';
import { putFileToS3 } from '../../services/uploadService';

const POLL_MS = 3000; // a new message shows within ~3 s while people are talking
const IDLE_POLL_MS = [6000, 10000]; // a quiet conversation is checked less often…
const IDLE_AFTER = 5; // …after this many polls in a row bring nothing new
const MAX_BACKOFF_MS = 30000; // failing polls slow down to at most every 30 s
// Each poll asks again for the last few seconds, so a message saved at the same moment
// as one already shown (two people sending at once) is never skipped; ids de-duplicate.
const OVERLAP_MS = 10000;
const PAGE_SIZE = 50;
// Same limits the server enforces (backend config/upload.config.js).
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const LIMITS = { image: 2 * 1024 * 1024, doc: 10 * 1024 * 1024 };
export const MESSAGE_MAX = 2000;

const order = (a, b) => new Date(a.createdAt) - new Date(b.createdAt) || String(a.id).localeCompare(String(b.id));
const merge = (list, incoming) => {
  if (!incoming.length) return list;
  const byId = new Map(list.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return [...byId.values()].sort(order);
};

/** Uploads one gig file (chat, pitch sample or finished work) and returns its public link. */
export async function uploadGigFile(file, token) {
  const fileType = IMAGE_TYPES.includes(file.type) ? 'image' : 'doc';
  if (file.size > LIMITS[fileType]) {
    throw new Error(`${file.name} is too large. ${fileType === 'image' ? 'Images' : 'Files'} can be up to ${LIMITS[fileType] / 1024 / 1024} MB.`);
  }
  const res = await apiFetch('/upload/request-url', { token, method: 'POST', json: { fileType, fileName: file.name, contentType: file.type || 'application/octet-stream' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
  const put = await putFileToS3(body.uploadUrl, file, file.type || 'application/octet-stream', token);
  if (!put.ok) throw new Error(`Couldn’t upload ${file.name}. Please try again.`);
  return body.publicUrl;
}

const EMPTY_THREAD = { messages: [], hasMore: false };
const EMPTY_STATUS = { loaded: false, error: null, reconnecting: false, loadingOlder: false };

/**
 * One private gig conversation (GET/POST /gigs/:gigId/messages).
 *
 * - Loads the latest page, then polls only for newer messages (an `after` cursor
 *   with a small overlap), one request at a time. Busy conversations are checked
 *   every 3 s, quiet ones every 6–10 s (back to 3 s on a new message, a send or a
 *   return to the tab), so many open chats don't flood the server. Polling pauses
 *   while the tab is hidden, backs off (up to 30 s) while the server can't be
 *   reached, and waits as long as the server asks when it answers 429.
 * - Sends are queued so messages arrive in the order they were written; each shows
 *   at once as "sending", becomes the saved message when the server answers, or
 *   stays as "failed" with Retry / Remove (nothing typed is lost silently).
 * - Everything is keyed by conversation (gig + freelancer), so answers that arrive
 *   after a switch never land in the wrong thread.
 * - `partnerId` is the hired freelancer (owner side); messages are de-duplicated by id.
 */
export default function useGigChat({ gigId, partnerId, token, enabled }) {
  const conversation = enabled && gigId ? `${gigId}:${partnerId || ''}` : null;
  const [thread, setThread] = useState({ key: null, ...EMPTY_THREAD });
  const [status, setStatus] = useState({ key: null, ...EMPTY_STATUS });
  const [outbox, setOutbox] = useState([]); // { tempId, conversation, text, file, status, error, createdAt }
  const latestRef = useRef({ key: null, at: null });
  const conversationRef = useRef(conversation);
  const queueRef = useRef(Promise.resolve());
  const tempSeq = useRef(0);
  const wakeRef = useRef(null); // speeds polling back up (set by the polling effect)

  const current = thread.key === conversation ? thread : EMPTY_THREAD;
  const st = status.key === conversation ? status : EMPTY_STATUS;

  const path = useCallback(
    (params) => {
      const query = new URLSearchParams();
      if (partnerId) query.set('with', partnerId);
      Object.entries(params).forEach(([key, value]) => value != null && query.set(key, String(value)));
      return `/gigs/${gigId}/messages?${query}`;
    },
    [gigId, partnerId]
  );

  const applyMessages = useCallback((key, incoming, extra = {}) => {
    setThread((prev) => {
      // A reply for a conversation that is no longer on screen is dropped; that
      // conversation reloads from the server when it is opened again.
      if (key !== conversationRef.current) return prev;
      const base = prev.key === key ? prev : { key, ...EMPTY_THREAD };
      const messages = merge(base.messages, incoming);
      if (messages.length) latestRef.current = { key, at: messages[messages.length - 1].createdAt };
      return { ...base, ...extra, key, messages };
    });
  }, []);

  const patchStatus = useCallback((key, patch) => setStatus((prev) => ({ ...(prev.key === key ? prev : { key, ...EMPTY_STATUS }), ...patch, key })), []);

  useEffect(() => {
    conversationRef.current = conversation;
    if (!conversation) return undefined;
    const key = conversation;
    let stopped = false;
    let timer = null;
    let delay = POLL_MS;
    let quiet = 0; // polls in a row with nothing new
    let inFlight = false;
    let loaded = false;

    const schedule = (ms) => {
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(tick, ms);
    };
    const idleDelay = () => (quiet < IDLE_AFTER ? POLL_MS : IDLE_POLL_MS[Math.min(IDLE_POLL_MS.length - 1, Math.floor((quiet - IDLE_AFTER) / IDLE_AFTER))]);

    async function tick() {
      if (stopped || inFlight) return;
      if (document.hidden && loaded) {
        schedule(POLL_MS); // paused while the tab is hidden
        return;
      }
      inFlight = true;
      const latest = latestRef.current.key === key ? latestRef.current.at : null;
      try {
        const since = loaded && latest ? new Date(Date.parse(latest) - OVERLAP_MS).toISOString() : null;
        const res = await apiFetch(since ? path({ after: since }) : path({ limit: PAGE_SIZE }), { token });
        const body = await res.json().catch(() => ({}));
        if (stopped) return;
        if (!res.ok) {
          // Lost access (not hired any more, gig deleted) won't fix itself: stop and say so.
          if (res.status === 403 || res.status === 404) {
            stopped = true;
            patchStatus(key, { loaded: true, reconnecting: false, error: body.error || SERVER_MESSAGE });
            return;
          }
          const err = new Error(body.error || SERVER_MESSAGE);
          err.retryAfterMs = res.status === 429 ? Number(res.headers?.get?.('Retry-After')) * 1000 || 0 : 0;
          throw err;
        }
        const incoming = body.messages || [];
        const fresh = !latest || incoming.some((m) => Date.parse(m.createdAt) > Date.parse(latest));
        applyMessages(key, incoming, loaded ? {} : { hasMore: Boolean(body.hasMore) });
        patchStatus(key, { loaded: true, error: null, reconnecting: false });
        quiet = fresh ? 0 : quiet + 1;
        // A full page of newer messages means more are waiting: fetch them right away.
        delay = loaded && body.hasMore ? 0 : idleDelay();
        loaded = true;
      } catch (err) {
        if (stopped) return;
        delay = Math.max(err.retryAfterMs || 0, Math.min(MAX_BACKOFF_MS, Math.max(POLL_MS, delay) * 2));
        patchStatus(key, loaded ? { reconnecting: true } : { error: userMessage(err) });
      } finally {
        inFlight = false;
        schedule(delay);
      }
    }

    const wake = () => {
      quiet = 0;
      if (loaded && !inFlight) {
        delay = POLL_MS;
        schedule(POLL_MS);
      }
    };
    wakeRef.current = wake;
    const onVisibility = () => {
      if (!document.hidden && loaded) {
        quiet = 0;
        delay = POLL_MS;
        schedule(0);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    schedule(0);
    return () => {
      stopped = true;
      clearTimeout(timer);
      if (wakeRef.current === wake) wakeRef.current = null;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [conversation, path, token, applyMessages, patchStatus]);

  const loadOlder = useCallback(async () => {
    const key = conversationRef.current;
    if (!key || st.loadingOlder || !current.hasMore || current.messages.length === 0) return;
    patchStatus(key, { loadingOlder: true });
    try {
      const res = await apiFetch(path({ before: current.messages[0].createdAt, limit: PAGE_SIZE }), { token });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      applyMessages(key, body.messages || [], { hasMore: Boolean(body.hasMore) });
      patchStatus(key, { loadingOlder: false });
    } catch (err) {
      patchStatus(key, { loadingOlder: false, error: userMessage(err) });
    }
  }, [st.loadingOlder, current, path, token, applyMessages, patchStatus]);

  // Delivers one queued message to the conversation it was written in.
  const deliver = useCallback(
    async (item, target) => {
      try {
        const fileUrl = item.file ? await uploadGigFile(item.file, token) : null;
        const res = await apiFetch(`/gigs/${target.gigId}/messages`, {
          token,
          method: 'POST',
          json: { text: item.text || null, fileUrl, ...(target.partnerId ? { receiverId: target.partnerId } : {}) }
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
        applyMessages(item.conversation, [body]);
        setOutbox((prev) => prev.filter((m) => m.tempId !== item.tempId));
        wakeRef.current?.(); // a reply is likely soon: poll at the fast rate again
      } catch (err) {
        setOutbox((prev) => prev.map((m) => (m.tempId === item.tempId ? { ...m, status: 'failed', error: userMessage(err) } : m)));
      }
    },
    [token, applyMessages]
  );

  const enqueue = useCallback(
    (item) => {
      const target = { gigId, partnerId };
      queueRef.current = queueRef.current.then(() => deliver(item, target));
    },
    [gigId, partnerId, deliver]
  );

  const send = useCallback(
    (text, file) => {
      const clean = String(text || '').trim();
      if (!conversation || (!clean && !file)) return false;
      tempSeq.current += 1;
      const item = { tempId: `local-${tempSeq.current}`, conversation, text: clean, file: file || null, status: 'sending', error: null, createdAt: new Date().toISOString() };
      setOutbox((prev) => [...prev, item]);
      enqueue(item);
      return true;
    },
    [conversation, enqueue]
  );

  const retry = useCallback(
    (tempId) => {
      const item = outbox.find((m) => m.tempId === tempId);
      if (!item || item.conversation !== conversation || item.status !== 'failed') return;
      setOutbox((prev) => prev.map((m) => (m.tempId === tempId ? { ...m, status: 'sending', error: null } : m)));
      enqueue({ ...item, status: 'sending' });
    },
    [outbox, conversation, enqueue]
  );

  const discard = useCallback((tempId) => setOutbox((prev) => prev.filter((m) => m.tempId !== tempId)), []);

  return {
    messages: current.messages,
    hasMore: current.hasMore,
    pending: outbox.filter((m) => m.conversation === conversation),
    loading: Boolean(conversation) && !st.loaded && !st.error,
    error: st.error,
    reconnecting: st.reconnecting,
    loadingOlder: st.loadingOlder,
    send,
    retry,
    discard,
    loadOlder
  };
}
