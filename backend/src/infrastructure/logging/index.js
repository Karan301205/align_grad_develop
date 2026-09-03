/**
 * Infrastructure logging helper.
 * Provides standardized non-sensitive log prefixes.
 */

const createLogger = (namespace) => ({
  info: (msg, ...args) => console.log(`[${namespace}] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[${namespace}] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${namespace}] ${msg}`, ...args),
});

module.exports = {
  createLogger,
  logger: createLogger('system')
};
