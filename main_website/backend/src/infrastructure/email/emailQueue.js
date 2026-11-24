const { Queue, Worker } = require('bullmq');
const env = require('../../config/env');
const transport = require('./emailTransport');

// Optional email queue on Redis (BullMQ).
//
// With REDIS_URL set, deliverEmail() puts the email on the queue and returns at once; a worker
// in this same process sends queued emails a few at a time and retries failed sends.
// Without REDIS_URL, or whenever Redis can't take the job, the email is sent directly inside
// the request, exactly as before. Nothing has to change in deployment until REDIS_URL is set.

const QUEUE_NAME = 'email';
// Retries wait 5 s, then 10 s, ... OTP codes expire in 10 minutes, so retries stay short.
const RETRY_DELAY_MS = 5000;
// A job that failed every attempt keeps the email (and any code in it) for an hour so the
// failure can be looked at, then Redis deletes it. Sent emails are deleted at once.
const KEEP_FAILED_SECONDS = 60 * 60;

let queue = null;
let worker = null;

const isEnabled = () => Boolean(env.REDIS_URL);

// While Redis is unreachable the client retries in the background and reports each attempt;
// log a repeated message once instead of on every retry.
function errorLogger(label) {
  let last = '';
  return (err) => {
    const message = err?.message || String(err);
    if (message === last) return;
    last = message;
    console.error(`[email-queue] ${label}: ${message}`);
  };
}

/** The queue, created on first use; null when REDIS_URL is not set. */
function getQueue() {
  if (!isEnabled()) return null;
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      // Fail fast while Redis is unreachable, so deliverEmail sends directly instead of waiting.
      connection: { url: env.REDIS_URL, enableOfflineQueue: false, maxRetriesPerRequest: 1 },
      skipWaitingForReady: true,
      defaultJobOptions: {
        attempts: env.EMAIL_QUEUE_ATTEMPTS,
        backoff: { type: 'exponential', delay: RETRY_DELAY_MS },
        removeOnComplete: true,
        removeOnFail: { age: KEEP_FAILED_SECONDS }
      }
    });
    queue.on('error', errorLogger('queue connection'));
  }
  return queue;
}

/** Starts the worker that sends queued emails (called once at server start). No-op without REDIS_URL. */
function startEmailQueue() {
  if (!isEnabled() || worker) return;
  getQueue(); // connect now, so the first request finds Redis ready
  worker = new Worker(QUEUE_NAME, async (job) => {
    await transport.sendMail(job.data);
  }, {
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    concurrency: env.EMAIL_QUEUE_CONCURRENCY
  });
  worker.on('error', errorLogger('worker connection'));
  worker.on('failed', (job, err) => {
    if (!job) return;
    const lastTry = job.attemptsMade >= (job.opts.attempts || 1);
    console.error(
      `[email-queue] ${lastTry ? 'Gave up on' : 'Will retry'} email to ${job.data.to} ("${job.data.subject}") after attempt ${job.attemptsMade}: ${err.message}`
    );
  });
  console.log(`[email-queue] REDIS_URL is set: OTP emails use the queue (${env.EMAIL_QUEUE_CONCURRENCY} at a time, ${env.EMAIL_QUEUE_ATTEMPTS} attempts each), or are sent directly while Redis is unreachable.`);
}

/**
 * Sends one email ({ to, subject, html, text }).
 * Returns { queued: true } when Redis took it (the worker sends it within seconds), or
 * { queued: false } after sending it directly. A direct send that fails throws, as before.
 * `queue` can be passed in tests.
 */
async function deliverEmail(mail, { queue: target = getQueue() } = {}) {
  if (target) {
    try {
      await target.add('send', mail);
      return { queued: true };
    } catch (err) {
      console.error(`[email-queue] Redis did not take the email, sending it directly: ${err.message}`);
    }
  }
  await transport.sendMail(mail);
  return { queued: false };
}

/** Lets the worker finish the emails it is sending, then closes the Redis connections (shutdown). */
async function stopEmailQueue() {
  const closing = [worker, queue].filter(Boolean);
  worker = null;
  queue = null;
  await Promise.all(closing.map((item) => item.close().catch((err) => console.error('[email-queue] close failed:', err.message))));
}

module.exports = { deliverEmail, startEmailQueue, stopEmailQueue };
