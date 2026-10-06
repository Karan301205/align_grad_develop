const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { isMock } = require('../infrastructure/database');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token payload.' });
    }

    // When connected to live MongoDB, ObjectIDs must be 24-character hexadecimal strings.
    // If a stale mock token (e.g. "u_1790830586306") is provided, return 401 so the client re-authenticates.
    const mockActive = typeof isMock === 'function' ? isMock() : Boolean(isMock);
    if (!mockActive && !OBJECT_ID_REGEX.test(decoded.id)) {
      return res.status(401).json({ error: 'Session expired or invalid user ID. Please log in again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};
