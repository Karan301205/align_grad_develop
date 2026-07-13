import { API_BASE } from '../config';

// Centralized API client. Wraps `fetch` so callers no longer rebuild the
// `${API_BASE}` prefix or the `Authorization: Bearer` header by hand.
//
// It intentionally returns the raw `Response` object so existing call sites keep
// their exact behavior (`if (res.ok) { const data = await res.json(); }`, error
// handling, status checks). This is a pure DIP/DRY seam — no request semantics
// change.
//
// Options:
//   - token:   when provided, adds `Authorization: Bearer <token>`
//   - method:  HTTP method (default 'GET')
//   - json:    when provided, JSON-stringifies it as the body and sets
//              `Content-Type: application/json`
//   - body:    raw body (used when `json` is not provided)
//   - headers: extra headers merged in
export function apiFetch(path, { token, method = 'GET', json, body, headers = {} } = {}) {
  const finalHeaders = { ...headers };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (json !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(json);
  }

  return fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    ...(finalBody !== undefined ? { body: finalBody } : {})
  });
}
