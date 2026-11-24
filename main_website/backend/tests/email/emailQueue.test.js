// The optional Redis email queue (infrastructure/email/emailQueue.js): which path an email takes.
// No Redis is needed: the queue is a stand-in and sending is replaced by a recorder.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.REDIS_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const transport = require('../../src/infrastructure/email/emailTransport');
const { deliverEmail } = require('../../src/infrastructure/email/emailQueue');

const MAIL = { to: 'a@example.test', subject: 'Your code', html: '<p>123456</p>', text: '123456' };
const sent = [];
let failSend = false;
transport.sendMail = async (mail) => {
  if (failSend) throw new Error('SMTP down (test)');
  sent.push(mail);
  return {};
};

test('without REDIS_URL the email is sent directly, as before', async () => {
  sent.length = 0;
  assert.deepStrictEqual(await deliverEmail(MAIL), { queued: false });
  assert.deepStrictEqual(sent, [MAIL]);
});

test('when Redis takes the job, nothing is sent in the request', async () => {
  sent.length = 0;
  const added = [];
  const queue = { add: async (name, data) => added.push([name, data]) };
  assert.deepStrictEqual(await deliverEmail(MAIL, { queue }), { queued: true });
  assert.deepStrictEqual(added, [['send', MAIL]]);
  assert.strictEqual(sent.length, 0);
});

test('when Redis refuses the job, the email is sent directly instead', async () => {
  sent.length = 0;
  const queue = { add: async () => { throw new Error("Stream isn't writeable"); } };
  assert.deepStrictEqual(await deliverEmail(MAIL, { queue }), { queued: false });
  assert.deepStrictEqual(sent, [MAIL]);
});

test('a direct send that fails still throws, so the caller can tell the user', async () => {
  failSend = true;
  await assert.rejects(deliverEmail(MAIL), /SMTP down/);
  failSend = false;
});
