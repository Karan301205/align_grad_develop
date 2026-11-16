import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPANY_TABS,
  availableDecisions,
  rejectionReasonProblem,
  verificationMeta,
  MIN_REJECTION_REASON
} from './verification.js';

/* ---- verification ---- */

test('verificationMeta labels each status and falls back to Not submitted', () => {
  assert.equal(verificationMeta('PENDING').label, 'Pending review');
  assert.equal(verificationMeta('APPROVED').tone, 'ok');
  assert.equal(verificationMeta('REJECTED').tone, 'bad');
  assert.equal(verificationMeta('SOMETHING_NEW').label, 'Not submitted');
  assert.equal(verificationMeta(undefined).label, 'Not submitted');
});

test('availableDecisions only offers decisions that change something', () => {
  assert.deepEqual(availableDecisions({ verificationStatus: 'PENDING' }), { canApprove: true, canReject: true });
  assert.deepEqual(availableDecisions({ verificationStatus: 'APPROVED' }), { canApprove: false, canReject: true });
  assert.deepEqual(availableDecisions({ verificationStatus: 'REJECTED' }), { canApprove: true, canReject: false });
  assert.deepEqual(availableDecisions({ verificationStatus: 'NOT_SUBMITTED' }), { canApprove: true, canReject: true });
  assert.deepEqual(availableDecisions(null), { canApprove: false, canReject: false });
});

test('rejectionReasonProblem requires a real reason', () => {
  assert.equal(MIN_REJECTION_REASON, 5);
  assert.notEqual(rejectionReasonProblem(''), '');
  assert.notEqual(rejectionReasonProblem('    '), '');
  assert.notEqual(rejectionReasonProblem('no'), '');
  assert.notEqual(rejectionReasonProblem('abcd'), '');
  assert.equal(rejectionReasonProblem('Unreadable GST certificate'), '');
  assert.equal(rejectionReasonProblem('  abcde  '), '');
});

test('company tabs split companies by status', () => {
  const companies = [
    { verificationStatus: 'PENDING' }, { verificationStatus: 'PENDING' },
    { verificationStatus: 'APPROVED' }, { verificationStatus: 'REJECTED' }, { verificationStatus: 'NOT_SUBMITTED' }
  ];
  const count = (key) => companies.filter(COMPANY_TABS.find((t) => t.key === key).test).length;
  assert.deepEqual(['all', 'PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED'].map(count), [5, 2, 1, 1, 1]);
});
