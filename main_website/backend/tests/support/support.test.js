// Help & support tickets (modules/support): validation, role and ownership checks,
// the open-ticket cap, replies reopening a ticket, and the confirmation email.
// Runs against the in-memory test DB; email sending is replaced by a recorder, so
// nothing reaches a real database or mailbox.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';

const test = require('node:test');
const assert = require('node:assert');
const { prisma, isMock } = require('../../src/infrastructure/database');
const email = require('../../src/infrastructure/email');
const controller = require('../../src/modules/support/support.controller');
const { createTicketSchema, replySchema } = require('../../src/modules/support/support.validator');
const { LIMITS, toRequesterTicket, ticketReference } = require('../../src/modules/support/supportRules');
const { buildTicketReceivedEmail, supportPageUrl } = require('../../src/modules/support/supportEmail');

const sent = [];
let failNextEmail = false;
email.sendMail = async (mail) => {
  if (failNextEmail) {
    failNextEmail = false;
    throw new Error('SMTP down (test)');
  }
  sent.push(mail);
  return { messageId: `test-${sent.length}` };
};

function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let seq = 0;
async function makeCandidate(name = 'Asha Rao') {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `cand${seq}@example.test`, password: 'x', role: 'STUDENT' } });
  await prisma.profile.create({ data: { userId: user.id, name } });
  return { id: user.id, role: 'STUDENT', email: user.email };
}

async function makeRecruiter() {
  seq += 1;
  const user = await prisma.user.create({ data: { email: `rec${seq}@acme.example`, password: 'x', role: 'RECRUITER' } });
  await prisma.company.create({ data: { userId: user.id, name: 'Acme', recruiterName: 'Riya Sharma', photos: [] } });
  return { id: user.id, role: 'RECRUITER', email: user.email };
}

async function call(handler, user, { body = {}, params = {} } = {}) {
  const res = fakeRes();
  await handler({ user, body, params }, res);
  return res;
}

const NEW_TICKET = {
  category: 'TESTS',
  subject: 'Test result not showing',
  message: 'I finished the Excel test but my score is missing.'
};

/** Parses a body through the route's schema, as validate() does. */
const parse = (schema, body) => schema.body.parse(body);

test('runs against the mock database', () => {
  assert.strictEqual(isMock(), true);
});

test('validators are plain { body } objects and enforce the limits', () => {
  assert.ok(createTicketSchema.body && replySchema.body && replySchema.params);
  assert.strictEqual(createTicketSchema.body.safeParse({ ...NEW_TICKET, subject: 'Hi' }).success, false);
  assert.strictEqual(createTicketSchema.body.safeParse({ ...NEW_TICKET, message: 'broken' }).success, false);
  assert.strictEqual(createTicketSchema.body.safeParse({ ...NEW_TICKET, subject: 'x'.repeat(LIMITS.subjectMax + 1) }).success, false);
  assert.strictEqual(createTicketSchema.body.safeParse({ ...NEW_TICKET, message: 'x'.repeat(LIMITS.messageMax + 1) }).success, false);
  assert.strictEqual(replySchema.body.safeParse({ message: ' ' }).success, false);
  assert.strictEqual(replySchema.params.safeParse({ ticketId: 'not-an-id' }).success, false);

  const parsed = parse(createTicketSchema, { ...NEW_TICKET, subject: '  Score\u0000 missing  ' });
  assert.strictEqual(parsed.subject, 'Score missing', 'trims and drops NUL characters');
});

test('a candidate raises a ticket: saved as OPEN with the first message, and a confirmation is emailed', async () => {
  const user = await makeCandidate('Asha <b>Rao</b>');
  sent.length = 0;
  const res = await call(controller.createTicket, user, { body: parse(createTicketSchema, NEW_TICKET) });

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.emailSent, true);
  const { ticket } = res.body;
  assert.strictEqual(ticket.status, 'OPEN');
  assert.strictEqual(ticket.reference, ticketReference(ticket.number));
  assert.strictEqual(ticket.categoryLabel, 'Skill tests');
  assert.deepStrictEqual(ticket.messages.map((m) => [m.author, m.body]), [['USER', NEW_TICKET.message]]);

  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].to, user.email);
  assert.match(sent[0].subject, new RegExp(`\\[${ticket.reference}\\]`));
  assert.ok(sent[0].html.includes('Asha &lt;b&gt;Rao&lt;/b&gt;'), 'the name is HTML-escaped');
  assert.ok(!sent[0].html.includes('<b>Rao</b>'));
  assert.ok(sent[0].text.includes(NEW_TICKET.message));
});

test('a recruiter can file under recruiter topics only', async () => {
  const user = await makeRecruiter();
  const wrong = await call(controller.createTicket, user, { body: { ...NEW_TICKET, category: 'TESTS' } });
  assert.strictEqual(wrong.statusCode, 400);

  sent.length = 0;
  const ok = await call(controller.createTicket, user, { body: { ...NEW_TICKET, category: 'VERIFICATION' } });
  assert.strictEqual(ok.statusCode, 201);
  assert.strictEqual(ok.body.ticket.categoryLabel, 'Company verification');
  assert.ok(sent[0].html.includes('Riya Sharma'), 'greets the recruiter by name');
  assert.ok(sent[0].html.includes('Recruiter Portal'));
});

test('other roles are refused', async () => {
  const admin = { id: 'a'.repeat(24), role: 'ADMIN' };
  assert.strictEqual((await call(controller.listTickets, admin)).statusCode, 403);
  assert.strictEqual((await call(controller.createTicket, admin, { body: NEW_TICKET })).statusCode, 403);
});

test('the ticket is kept when the confirmation email fails, and the response says so', async () => {
  const user = await makeCandidate();
  failNextEmail = true;
  const res = await call(controller.createTicket, user, { body: NEW_TICKET });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.emailSent, false);
  const list = await call(controller.listTickets, user);
  assert.strictEqual(list.body.tickets.length, 1);
});

test('at most LIMITS.maxOpenTickets unresolved tickets at once', async () => {
  const user = await makeCandidate();
  for (let i = 0; i < LIMITS.maxOpenTickets; i += 1) {
    const res = await call(controller.createTicket, user, { body: { ...NEW_TICKET, subject: `Problem number ${i}` } });
    assert.strictEqual(res.statusCode, 201);
  }
  const blocked = await call(controller.createTicket, user, { body: NEW_TICKET });
  assert.strictEqual(blocked.statusCode, 409);

  // Resolving one (as admin_ws does) frees a slot.
  const [first] = await prisma.supportTicket.findMany({ where: { userId: user.id } });
  await prisma.supportTicket.update({ where: { id: first.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
  const allowed = await call(controller.createTicket, user, { body: NEW_TICKET });
  assert.strictEqual(allowed.statusCode, 201);
});

test('people see only their own tickets, and cannot reply to someone else’s', async () => {
  const owner = await makeCandidate();
  const other = await makeCandidate();
  const created = await call(controller.createTicket, owner, { body: NEW_TICKET });
  const ticketId = created.body.ticket.id;

  const othersList = await call(controller.listTickets, other);
  assert.deepStrictEqual(othersList.body.tickets, []);
  assert.ok(othersList.body.categories.some((c) => c.key === 'TESTS'));

  const intrusion = await call(controller.replyToTicket, other, { params: { ticketId }, body: { message: 'Let me in' } });
  assert.strictEqual(intrusion.statusCode, 404);
  const messages = await prisma.supportMessage.findMany({ where: { ticketId } });
  assert.strictEqual(messages.length, 1, 'nothing was added');
});

test('a reply goes back to OPEN, and reopens a resolved ticket', async () => {
  const user = await makeCandidate();
  const created = await call(controller.createTicket, user, { body: NEW_TICKET });
  const ticketId = created.body.ticket.id;

  // admin_ws answers and resolves it.
  await prisma.supportMessage.create({ data: { ticketId, author: 'ADMIN', body: 'Fixed, please check again.', createdAt: new Date() } });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'RESOLVED', resolvedAt: new Date() } });

  const res = await call(controller.replyToTicket, user, {
    params: { ticketId },
    body: { message: 'Still missing for me.' }
  });
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.reopened, true);
  assert.strictEqual(res.body.ticket.status, 'OPEN');
  assert.strictEqual(res.body.ticket.resolvedAt, null);
  assert.deepStrictEqual(res.body.ticket.messages.map((m) => m.author), ['USER', 'ADMIN', 'USER']);

  const list = await call(controller.listTickets, user);
  assert.strictEqual(list.body.tickets[0].messages.length, 3);
});

test('the list is ordered by latest activity', async () => {
  const user = await makeCandidate();
  const a = await call(controller.createTicket, user, { body: { ...NEW_TICKET, subject: 'First problem' } });
  await call(controller.createTicket, user, { body: { ...NEW_TICKET, subject: 'Second problem' } });
  await prisma.supportTicket.update({ where: { id: a.body.ticket.id }, data: { lastMessageAt: new Date(Date.now() + 60_000) } });
  const list = await call(controller.listTickets, user);
  assert.deepStrictEqual(list.body.tickets.map((t) => t.subject), ['First problem', 'Second problem']);
});

test('toRequesterTicket hides unknown authors and statuses behind safe defaults', () => {
  const ticket = toRequesterTicket({
    id: 'x', number: 7, role: 'STUDENT', category: 'NOPE', subject: 's', status: 'WEIRD',
    createdAt: new Date(), messages: [{ id: 'm', author: 'SYSTEM', body: 'b', createdAt: new Date() }]
  });
  assert.strictEqual(ticket.status, 'OPEN');
  assert.strictEqual(ticket.categoryLabel, 'Something else');
  assert.strictEqual(ticket.messages[0].author, 'USER');
});

test('the email template escapes every typed value', () => {
  const mail = buildTicketReceivedEmail({
    name: '', role: 'STUDENT', number: 3, subject: '<script>x</script>', categoryLabel: 'Payments', message: '"quoted" & <i>'
  });
  assert.ok(!mail.html.includes('<script>'));
  assert.ok(mail.html.includes('&lt;script&gt;'));
  assert.ok(mail.html.includes('&quot;quoted&quot; &amp; &lt;i&gt;'));
  assert.ok(mail.html.includes('Hello <strong>there</strong>'));
});

test('the email button opens Help & support on the requester’s own portal', () => {
  const config = { CLIENT_URL: 'https://app.example', CANDIDATE_PORTAL_URL: 'https://career.example/candidate/login', RECRUITER_PORTAL_URL: '' };
  assert.strictEqual(supportPageUrl('STUDENT', config), 'https://career.example/candidate/login?open=support');
  assert.strictEqual(supportPageUrl('RECRUITER', config), 'https://app.example/?open=support', 'falls back to CLIENT_URL');
  assert.strictEqual(supportPageUrl('STUDENT', { CANDIDATE_PORTAL_URL: 'javascript:alert(1)' }), '');
  assert.strictEqual(supportPageUrl('STUDENT', {}), '');
});

