import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countTickets, filterTickets, replyProblem, requesterLabel, ticketStatusMeta, timeAgo, toSummary, REPLY_MAX } from './support.js';

const TICKETS = [
  { id: '1', reference: 'SUP-1', status: 'OPEN', role: 'STUDENT', subject: 'Test score missing', categoryLabel: 'Skill tests', requester: { name: 'Asha', email: 'asha@x.test' } },
  { id: '2', reference: 'SUP-2', status: 'PENDING', role: 'RECRUITER', subject: 'Verification pending', categoryLabel: 'Company verification', requester: { name: 'Riya', email: 'riya@acme.test', companyName: 'Acme' } },
  { id: '3', reference: 'SUP-3', status: 'RESOLVED', role: 'STUDENT', subject: 'Login loop', categoryLabel: 'Account and sign-in', requester: { name: '', email: 'b@x.test' } }
];

test('counts per status and in total', () => {
  assert.deepEqual(countTickets(TICKETS), { OPEN: 1, PENDING: 1, RESOLVED: 1, all: 3 });
  assert.deepEqual(countTickets([]), { OPEN: 0, PENDING: 0, RESOLVED: 0, all: 0 });
});

test('filters by tab, requester kind and search', () => {
  assert.deepEqual(filterTickets(TICKETS, { tab: 'OPEN' }).map((t) => t.id), ['1']);
  assert.deepEqual(filterTickets(TICKETS, { role: 'STUDENT' }).map((t) => t.id), ['1', '3']);
  assert.deepEqual(filterTickets(TICKETS, { query: 'acme' }).map((t) => t.id), ['2']);
  assert.deepEqual(filterTickets(TICKETS, { query: 'sup-3' }).map((t) => t.id), ['3']);
  assert.deepEqual(filterTickets(TICKETS, { tab: 'RESOLVED', role: 'RECRUITER' }), []);
  assert.equal(filterTickets(TICKETS).length, 3);
});

test('status labels, with unknown statuses shown as needing a reply', () => {
  assert.deepEqual(ticketStatusMeta('PENDING'), { label: 'Waiting on requester', tone: 'warn' });
  assert.equal(ticketStatusMeta('WHAT').label, 'Needs reply');
});

test('timeAgo counts up, then falls back to the date', () => {
  const now = Date.parse('2026-11-19T12:00:00Z');
  assert.equal(timeAgo('2026-11-19T11:59:40Z', now), 'just now');
  assert.equal(timeAgo('2026-11-19T11:55:00Z', now), '5 min ago');
  assert.equal(timeAgo('2026-11-19T09:00:00Z', now), '3 h ago');
  assert.equal(timeAgo('2026-11-17T12:00:00Z', now), '2 d ago');
  assert.match(timeAgo('2026-10-01T12:00:00Z', now), /2026/);
  assert.equal(timeAgo(null, now), '');
  assert.equal(timeAgo('nope', now), '');
});

test('reply checks', () => {
  assert.equal(replyProblem('  '), 'Write a reply first.');
  assert.equal(replyProblem('ok'), '');
  assert.match(replyProblem('x'.repeat(REPLY_MAX + 1)), /under/);
});

test('requester label prefers the name and adds the company', () => {
  assert.equal(requesterLabel(TICKETS[1].requester), 'Riya (Acme)');
  assert.equal(requesterLabel(TICKETS[2].requester), 'b@x.test');
  assert.equal(requesterLabel({ name: 'Acme', companyName: 'Acme' }), 'Acme');
  assert.equal(requesterLabel(), 'Unknown requester');
});

test('toSummary drops the conversation only', () => {
  assert.deepEqual(toSummary({ id: '1', status: 'OPEN', messages: [{ id: 'm' }] }), { id: '1', status: 'OPEN' });
});
