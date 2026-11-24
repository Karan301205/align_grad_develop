import { io } from 'socket.io-client';
import { API_BASE } from '../config';

// One Socket.IO connection per signed-in session, to the API's own origin. Features subscribe to
// events on it (for example the gig chat). If the connection is down, features keep working on
// their normal requests; the socket only makes updates arrive sooner.

let socket = null;
let socketToken = null;

/** The shared connection for this token (created on first use); null when there is no token or API address. */
export function getRealtime(token) {
  if (!token || !API_BASE) return null;
  if (socket && socketToken === token) return socket;
  if (socket) socket.disconnect();
  socketToken = token;
  // API_BASE is `<origin>/api`; Socket.IO is served at the origin under /socket.io.
  socket = io(API_BASE.replace(/\/api$/, ''), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionDelayMax: 30000
  });
  socket.on('connect_error', (err) => {
    console.error('[realtime] could not connect:', err.message);
  });
  return socket;
}

/** Closes the connection (on sign-out). */
export function disconnectRealtime() {
  if (socket) socket.disconnect();
  socket = null;
  socketToken = null;
}
