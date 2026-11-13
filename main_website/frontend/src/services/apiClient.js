import { API_BASE } from '../config';

// Centralized API client. Wraps `fetch` so callers no longer rebuild the
// `${API_BASE}` prefix or the `Authorization: Bearer` header by hand.
//
// It returns a `Response`, so call sites keep their usual
// `if (res.ok) { const data = await res.json(); }` handling.
//
// Errors never show technical text in the UI, and always show it in the console:
//   - the server can't be reached: the full error goes to the console and the
//     call throws an Error carrying NETWORK_MESSAGE;
//   - 5xx answers: the server's message and technical `detail` go to the console,
//     and callers read `error: SERVER_MESSAGE` (unless the server marked its
//     message `public`, e.g. "Failed to send verification email…");
//   - 4xx answers ("Title is required", "Not allowed") are messages for the user
//     and pass through unchanged; they are also logged as warnings.
//
// Options:
//   - token:   when provided, adds `Authorization: Bearer <token>`
//   - method:  HTTP method (default 'GET')
//   - json:    when provided, JSON-stringifies it as the body and sets
//              `Content-Type: application/json`
//   - body:    raw body (used when `json` is not provided)
//   - headers: extra headers merged in

export const NETWORK_MESSAGE = 'Can’t reach AlignGrad right now. Check your connection and try again.';
export const SERVER_MESSAGE = 'Something went wrong on our side. Please try again in a moment.';

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

// Logs a 5xx answer and hands callers the same status with a plain message.
async function maskServerError(response, label) {
  const text = await response.text().catch(() => '');
  const body = parseJson(text);
  console.error(`[api] ${label} → HTTP ${response.status}:`, body ? body.detail || body.error || body : text.slice(0, 500));
  const { detail, ...rest } = body || {};
  void detail; // shown in the console only
  const error = rest.public && rest.error ? rest.error : SERVER_MESSAGE;
  return new Response(JSON.stringify({ ...rest, error }), {
    status: response.status,
    statusText: response.statusText,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function apiFetch(path, { token, method = 'GET', json, body, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (json !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(json);
  }

  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  // Prevent double '/api' if caller passes '/api/...' and API_BASE ends with '/api'
  const normalizedPath = (API_BASE.endsWith('/api') && trimmedPath.startsWith('/api/'))
    ? trimmedPath.slice(4)
    : (API_BASE.endsWith('/api') && trimmedPath === '/api' ? '' : trimmedPath);
  const label = `${method} ${normalizedPath}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${normalizedPath}`, {
      method,
      headers: finalHeaders,
      ...(finalBody !== undefined ? { body: finalBody } : {})
    });
  } catch (err) {
    console.error(`[api] ${label} could not reach the server:`, err);
    throw new Error(NETWORK_MESSAGE, { cause: err });
  }

  if (response.status === 401 && token && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aligngrade:unauthorized'));
  }
  if (response.status >= 500) {
    return maskServerError(response, label);
  }
  if (!response.ok) {
    response.clone().text().then((text) => {
      const parsed = parseJson(text);
      console.warn(`[api] ${label} → HTTP ${response.status}:`, parsed ? parsed.error || parsed : text.slice(0, 300));
    }).catch(() => {});
  }
  return response;
}

/**
 * What to show the user for a caught error. Messages written for people (server
 * text passed on by the app, or NETWORK_MESSAGE) are shown as they are. Built-in
 * errors (TypeError, SyntaxError, …: a bug, or an answer that couldn't be read) go
 * to the console and the user sees `fallback` instead.
 */
export function userMessage(err, fallback = SERVER_MESSAGE) {
  const technical =
    !err ||
    !err.message ||
    err instanceof TypeError ||
    err instanceof SyntaxError ||
    err instanceof ReferenceError ||
    err instanceof RangeError ||
    (typeof DOMException !== 'undefined' && err instanceof DOMException);
  if (technical) {
    console.error('[error]', err);
    return fallback;
  }
  return err.message;
}
