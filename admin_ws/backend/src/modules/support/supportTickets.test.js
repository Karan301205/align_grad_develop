// Help & support (admin side): ticket shaping, the emails, the request checks, and the
// reply / status flow against a fake database connection. Nothing reaches a real
// database or mailbox: env points at an unreachable placeholder, getDB() is replaced
// before any handler runs, and sendMail is a recorder.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@127.0.0.1:1/none?schema=test';
process.env.SMTP_HOST = '';
process.env.RECRUITER_PORTAL_URL = 'https://recruit.example/login?x=1';
process.env.CANDIDATE_PORTAL_URL = 'javascript:alert(1)';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatTicketSummary,
  formatTicketDetail,
  countByStatus,
  statusAfterAdminReply,
  supportLink,
  requesterName,
  categoryLabel
} = require('./supportTickets');
const { buildReplyEmail, buildResolvedEmail } = require('./supportEmail');
const { replySchema, statusSchema, ticketIdSchema } = require('./support.validator');
const database = require('../../config/database');
const mailer = require('../../config/mailer');
const controller = require('./support.controller');

const ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';

const ROW = {
  id: ID,
  number: 12,
  userId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  role: 'RECRUITER',
  category: 'VERIFICATION',
  subject: 'Still pending',
  status: 'OPEN',
  lastMessageAt: new Date('2026-11-18T10:00:00Z'),
  resolvedAt: null,
  createdAt: new Date('2026-11-18T09:00:00Z'),
  email: 'riya@acme.example',
  profileName: null,
  companyName: 'Acme',
  recruiterName: 'Riya',
  messageCount: '2',
  lastAuthor: 'USER',
  lastBody: 'Any   update\non this?'
};

test('a list row names the requester, the topic and the reference', () => {
  const t = formatTicketSummary(ROW);
  assert.equal(t.reference, 'SUP-12');
  assert.equal(t.roleLabel, 'Company');
  assert.equal(t.categoryLabel, 'Company verification');
  assert.equal(t.messageCount, 2);
  assert.equal(t.preview, 'Any update on this?');
  assert.deepEqual(t.requester, { userId: ROW.userId, email: ROW.email, name: 'Riya', companyName: 'Acme' });
  assert.equal(t.lastMessageAt, '2026-11-18T10:00:00.000Z');
});

test('requester names: candidate profile name; recruiter name, then company name', () => {
  assert.equal(requesterName({ role: 'STUDENT', profileName: 'Asha', companyName: 'X' }), 'Asha');
  assert.equal(requesterName({ role: 'RECRUITER', recruiterName: null, companyName: 'Acme' }), 'Acme');
  assert.equal(requesterName({ role: 'STUDENT' }), '');
  assert.equal(categoryLabel('STUDENT', 'VERIFICATION'), 'Something else', 'unknown topic for the role');
});

test('details list the conversation oldest first; unknown values fall back safely', () => {
  const t = formatTicketDetail({ ...ROW, status: 'ODD', lastAuthor: 'BOT' }, [
    { id: 'm2', author: 'ADMIN', body: 'Looking', createdAt: new Date('2026-11-18T10:00:00Z') },
    { id: 'm1', author: 'USER', body: 'Help', createdAt: new Date('2026-11-18T09:00:00Z') }
  ]);
  assert.equal(t.status, 'OPEN');
  assert.equal(t.lastAuthor, 'USER');
  assert.deepEqual(t.messages.map((m) => m.id), ['m1', 'm2']);
});

test('counts per status', () => {
  assert.deepEqual(countByStatus([{ status: 'OPEN' }, { status: 'OPEN' }, { status: 'RESOLVED' }, { status: 'PENDING' }]), {
    OPEN: 2, PENDING: 1, RESOLVED: 1, total: 4
  });
});

test('a reply waits on the requester unless it also resolves', () => {
  assert.equal(statusAfterAdminReply(false), 'PENDING');
  assert.equal(statusAfterAdminReply(true), 'RESOLVED');
});

test('the support link adds open=support to an http(s) portal address only', () => {
  assert.equal(supportLink('RECRUITER', { RECRUITER_PORTAL_URL: 'https://r.example/login?x=1' }), 'https://r.example/login?x=1&open=support');
  assert.equal(supportLink('STUDENT', { CANDIDATE_PORTAL_URL: 'javascript:alert(1)' }), '');
  assert.equal(supportLink('STUDENT', {}), '');
  assert.equal(supportLink('STUDENT', { CANDIDATE_PORTAL_URL: 'not a url' }), '');
});

test('emails escape typed values and mention resolving when it happened', () => {
  const reply = buildReplyEmail({ name: '<b>Riya</b>', role: 'RECRUITER', number: 12, subject: '<img src=x>', reply: 'Done & "fixed"', resolved: true });
  assert.match(reply.subject, /\[SUP-12\]/);
  assert.ok(!reply.html.includes('<b>Riya</b>') && reply.html.includes('&lt;b&gt;Riya&lt;/b&gt;'));
  assert.ok(!reply.html.includes('<img src=x>'));
  assert.ok(reply.html.includes('Done &amp; &quot;fixed&quot;'));
  assert.ok(reply.html.includes('marked this ticket as resolved'));
  assert.ok(reply.html.includes('https://recruit.example/login?x=1&amp;open=support'), 'recruiter gets the portal button');

  const candidate = buildResolvedEmail({ name: '', role: 'STUDENT', number: 3, subject: 'S' });
  assert.ok(candidate.html.includes('Hello <strong>there</strong>'));
  assert.ok(!candidate.html.includes('javascript:'), 'an unsafe portal address is left out');
});

test('request checks', () => {
  assert.equal(ticketIdSchema.params.safeParse({ ticketId: 'nope' }).success, false);
  assert.equal(replySchema.body.safeParse({ message: ' ' }).success, false);
  assert.equal(replySchema.body.safeParse({ message: 'x'.repeat(5001) }).success, false);
  assert.deepEqual(replySchema.body.parse({ message: '  Hi\u0000 there ' }), { message: 'Hi there', resolve: false });
  assert.equal(replySchema.body.safeParse({ message: 'Hi', seenLastMessageAt: 'yesterday' }).success, false);
  assert.equal(replySchema.body.safeParse({ message: 'Hi', seenLastMessageAt: '2026-11-18T10:00:00.000Z' }).success, true);
  assert.equal(statusSchema.body.safeParse({ status: 'CLOSED' }).success, false);
  assert.equal(statusSchema.body.safeParse({ status: 'RESOLVED' }).success, true);
});

// ---- Handlers against a fake connection ---------------------------------------------

/** A stand-in for the pg pool: one ticket, records every statement. */
function fakeDb(ticket) {
  const state = { ticket: ticket && { ...ticket }, messages: [], statements: [] };
  const query = async (sql, params = []) => {
    const text = sql.replace(/\s+/g, ' ').trim();
    state.statements.push(text.split(' ').slice(0, 2).join(' '));
    if (/^(BEGIN|COMMIT|ROLLBACK)/.test(text)) return { rows: [] };
    if (text.startsWith('SELECT "id"') && text.includes('FOR UPDATE')) {
      return { rows: state.ticket && params[0] === state.ticket.id ? [{ id: state.ticket.id, status: state.ticket.status, lastMessageAt: state.ticket.lastMessageAt }] : [] };
    }
    if (text.startsWith('INSERT INTO "SupportMessage"')) {
      state.messages.push({ id: `m${state.messages.length}`, ticketId: params[0], author: params[1], body: params[2], createdAt: params[3] });
      return { rows: [] };
    }
    if (text.startsWith('UPDATE "SupportTicket" SET "status" = $1, "lastMessageAt"')) {
      Object.assign(state.ticket, { status: params[0], lastMessageAt: params[1], resolvedAt: params[2] });
      return { rows: [] };
    }
    if (text.startsWith('UPDATE "SupportTicket" SET "status" = $1, "resolvedAt"')) {
      Object.assign(state.ticket, { status: params[0], resolvedAt: params[1] });
      return { rows: [] };
    }
    if (text.startsWith('SELECT t."id"')) {
      if (text.includes('WHERE t."id" = $1')) return { rows: state.ticket && params[0] === state.ticket.id ? [{ ...state.ticket }] : [] };
      return { rows: state.ticket ? [{ ...state.ticket }] : [] };
    }
    if (text.startsWith('SELECT "id", "author"')) return { rows: state.messages.filter((m) => m.ticketId === params[0]) };
    throw new Error(`fake db: unexpected SQL ${text.slice(0, 80)}`);
  };
  state.pool = { query, connect: async () => ({ query, release() {} }) };
  return state;
}

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

async function run(handler, req) {
  const res = fakeRes();
  let failure = null;
  await handler(req, res, (err) => { failure = err; });
  if (failure) throw failure;
  return res;
}

const sent = [];
let mailFails = false;
mailer.sendMail = async (mail) => {
  if (mailFails) throw new Error('SMTP down (test)');
  sent.push(mail);
  return {};
};

test('a reply is saved, the ticket waits on the requester, and the reply is emailed', async () => {
  const db = fakeDb(ROW);
  database.getDB = () => db.pool;
  sent.length = 0;

  const res = await run(controller.replyToTicket, { params: { ticketId: ID }, body: { message: 'We are on it.', resolve: false } });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ticket.status, 'PENDING');
  assert.equal(res.body.emailSent, true);
  assert.deepEqual(db.messages.map((m) => [m.author, m.body]), [['ADMIN', 'We are on it.']]);
  assert.ok(db.statements.includes('BEGIN') && db.statements.includes('COMMIT'));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, ROW.email);
  assert.ok(sent[0].text.includes('We are on it.'));
  assert.ok(!sent[0].text.includes('marked this ticket as resolved'));
});

test('reply and resolve in one step; a failed email is reported, not hidden', async () => {
  const db = fakeDb(ROW);
  database.getDB = () => db.pool;
  mailFails = true;
  const res = await run(controller.replyToTicket, { params: { ticketId: ID }, body: { message: 'Fixed now.', resolve: true } });
  mailFails = false;
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ticket.status, 'RESOLVED');
  assert.ok(res.body.ticket.resolvedAt);
  assert.equal(res.body.emailSent, false);
  assert.match(res.body.emailError, /SMTP down/);
});

test('an unknown ticket is a 404 and nothing is written', async () => {
  const db = fakeDb(ROW);
  database.getDB = () => db.pool;
  const res = await run(controller.replyToTicket, { params: { ticketId: 'cccccccccccccccccccccccc' }, body: { message: 'Hi there', resolve: false } });
  assert.equal(res.statusCode, 404);
  assert.equal(db.messages.length, 0);
  assert.ok(db.statements.includes('COMMIT'));
});

test('status changes: resolving emails the requester, reopening does not, repeating is a 409', async () => {
  const db = fakeDb(ROW);
  database.getDB = () => db.pool;
  sent.length = 0;

  const resolved = await run(controller.updateTicketStatus, { params: { ticketId: ID }, body: { status: 'RESOLVED' } });
  assert.equal(resolved.statusCode, 200);
  assert.equal(resolved.body.ticket.status, 'RESOLVED');
  assert.equal(resolved.body.emailSent, true);
  assert.match(sent[0].subject, /resolved \[SUP-12\]/);

  const again = await run(controller.updateTicketStatus, { params: { ticketId: ID }, body: { status: 'RESOLVED' } });
  assert.equal(again.statusCode, 409);

  const reopened = await run(controller.updateTicketStatus, { params: { ticketId: ID }, body: { status: 'OPEN' } });
  assert.equal(reopened.body.ticket.status, 'OPEN');
  assert.equal(reopened.body.ticket.resolvedAt, null);
  assert.equal(reopened.body.emailSent, null);
  assert.equal(sent.length, 1, 'no email for reopening');
});

test('the list carries counts per status', async () => {
  const db = fakeDb({ ...ROW, status: 'PENDING' });
  database.getDB = () => db.pool;
  const res = await run(controller.listTickets, {});
  assert.equal(res.body.tickets.length, 1);
  assert.deepEqual(res.body.counts, { OPEN: 0, PENDING: 1, RESOLVED: 0, total: 1 });
});

test('acting on an old view of the conversation is refused, and nothing is written', async () => {
  const db = fakeDb(ROW); // lastMessageAt 2026-11-18T10:00:00Z: the requester wrote at 10:00
  database.getDB = () => db.pool;
  sent.length = 0;
  const seenBefore = '2026-11-18T09:30:00.000Z';

  const reply = await run(controller.replyToTicket, { params: { ticketId: ID }, body: { message: 'Done.', resolve: true, seenLastMessageAt: seenBefore } });
  assert.equal(reply.statusCode, 409);
  assert.equal(reply.body.stale, true);
  const resolve = await run(controller.updateTicketStatus, { params: { ticketId: ID }, body: { status: 'RESOLVED', seenLastMessageAt: seenBefore } });
  assert.equal(resolve.statusCode, 409);
  assert.equal(db.messages.length, 0);
  assert.equal(db.ticket.status, 'OPEN');
  assert.equal(sent.length, 0);

  const current = await run(controller.replyToTicket, { params: { ticketId: ID }, body: { message: 'Done.', resolve: true, seenLastMessageAt: ROW.lastMessageAt.toISOString() } });
  assert.equal(current.statusCode, 201);
});

