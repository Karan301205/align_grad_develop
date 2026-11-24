const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const env = require('../../config/env');
const { isMock } = require('../../infrastructure/database');
const { identityIds } = require('./gigIdentity');
const { corsOrigin } = require('../../config/cors');

// Realtime for gig chat (Socket.IO). The server never pushes message text: when a message
// is saved it sends a small "chat changed" signal to the two people in that conversation,
// and their app fetches the new messages through the normal GET /gigs/:gigId/messages call.
// Access rules, ordering and de-duplication therefore stay in one place (gig.controller).
//
// Each socket joins a room per identity its account uses (User id, Profile or Company id),
// because gig rows can carry any of those ids in senderId / receiverId.

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const roomFor = (id) => `user:${id}`;

let io = null;

/** Attaches Socket.IO to the HTTP server. Connections must present the same JWT as the HTTP API. */
function attachRealtime(httpServer) {
  io = new Server(httpServer, {
    // Same browser origins as the HTTP API (config/cors.js); the token travels in the handshake.
    cors: { origin: corsOrigin() }
  });

  io.use((socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, env.JWT_SECRET);
      if (!decoded || !decoded.id) return next(new Error('unauthorized'));
      if (!isMock() && !OBJECT_ID.test(decoded.id)) return next(new Error('unauthorized'));
      socket.data.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      const ids = await identityIds(socket.data.user);
      ids.forEach((id) => socket.join(roomFor(id)));
    } catch (err) {
      console.error('[realtime] could not join chat rooms:', err.message);
      socket.disconnect(true);
    }
  });
}

/**
 * Tells the sender and the receiver of a saved gig message that their chat has new content.
 * Only the gig id is sent. Never throws: a realtime failure must not fail the message.
 */
function notifyGigChat(message) {
  if (!io || !message) return;
  try {
    const payload = { gigId: message.gigId };
    for (const id of new Set([message.senderId, message.receiverId].filter(Boolean))) {
      io.to(roomFor(id)).emit('gig:chat-changed', payload);
    }
  } catch (err) {
    console.error('[realtime] could not notify gig chat:', err.message);
  }
}

/** Disconnects every socket and stops accepting new ones (graceful shutdown). */
async function closeRealtime() {
  if (!io) return;
  const closing = io;
  io = null;
  await new Promise((resolve) => closing.close(() => resolve()));
}

module.exports = { attachRealtime, closeRealtime, notifyGigChat, roomFor };
