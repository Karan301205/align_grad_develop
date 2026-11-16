import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeAge,
  formatBudgets,
  gigStatusRows,
  listedSlices,
  listedTotal,
  popularKind,
  postingSeries,
  responseSeries,
  seriesHaveData,
  shareRows,
  weeklyLabels,
  weeklyRanges
} from './opportunities.js';

test('listedSlices has jobs, internships and gigs, and "Other" only when something else exists', () => {
  assert.deepEqual(listedSlices({ jobs: 18, internships: 6, gigs: 26 }).map((s) => [s.label, s.value]), [['Jobs', 18], ['Internships', 6], ['Gigs', 26]]);
  assert.equal(listedSlices({ jobs: 1, other: 2 }).at(-1).label, 'Other');
  assert.equal(listedSlices({}).length, 3);
  assert.equal(listedTotal({ jobs: 18, internships: 6, gigs: 26, other: 1 }), 51);
  assert.equal(listedTotal(undefined), 0);
});

const weekly = [
  { weekStart: '2026-10-26', jobs: 1, internships: 0, gigs: 2, applications: 5, pitches: 1 },
  { weekStart: '2026-11-02', jobs: 0, internships: 3, gigs: 0, applications: 0, pitches: 0 }
];

test('weekly labels and ranges follow the weeks', () => {
  assert.deepEqual(weeklyLabels(weekly), ['26 Oct', '2 Nov']);
  assert.deepEqual(weeklyRanges(weekly), ['26 Oct–1 Nov', '2–8 Nov']);
  assert.deepEqual(weeklyLabels(undefined), []);
});

test('postingSeries and responseSeries line each series up with the weeks', () => {
  assert.deepEqual(postingSeries(weekly).map((s) => [s.key, s.values]), [['jobs', [1, 0]], ['internships', [0, 3]], ['gigs', [2, 0]]]);
  assert.deepEqual(responseSeries(weekly).map((s) => [s.key, s.values]), [['applications', [5, 0]], ['pitches', [1, 0]]]);
  assert.deepEqual(postingSeries(undefined).map((s) => s.values), [[], [], []]);
});

test('seriesHaveData tells an empty chart from a busy one', () => {
  assert.equal(seriesHaveData(postingSeries(weekly)), true);
  assert.equal(seriesHaveData(postingSeries([{ weekStart: '2026-11-02', jobs: 0, internships: 0, gigs: 0 }])), false);
  assert.equal(seriesHaveData([]), false);
});

test('gigStatusRows always shows open, in progress and completed, in pipeline order', () => {
  assert.deepEqual(gigStatusRows([]).map((r) => [r.status, r.count]), [['OPEN', 0], ['IN_PROGRESS', 0], ['COMPLETED', 0]]);
  const rows = gigStatusRows([{ status: 'CLOSED', count: 1 }, { status: 'OPEN', count: 25 }]);
  assert.deepEqual(rows.map((r) => [r.label, r.count]), [['Open', 25], ['In progress', 0], ['Completed', 0], ['Closed', 1]]);
});

test('gigStatusRows hides unused extra statuses and humanises unknown ones', () => {
  assert.equal(gigStatusRows([{ status: 'PAUSED', count: 0 }]).some((r) => r.status === 'PAUSED'), false);
  assert.equal(gigStatusRows([{ status: 'PAUSED', count: 2 }]).some((r) => r.status === 'PAUSED'), true);
  const odd = gigStatusRows([{ status: 'ON_HOLD', count: 4 }]).at(-1);
  assert.deepEqual([odd.label, odd.count, odd.tone], ['On hold', 4, 'neutral']);
});

test('shareRows adds percentages and scales the bars to the biggest row', () => {
  const rows = shareRows([{ name: 'Remote', count: 6 }, { name: 'Hybrid', count: 9 }, { name: 'Office', count: 9 }]);
  assert.deepEqual(rows.map((r) => r.percent), [25, 38, 38]);
  assert.deepEqual(rows.map((r) => Math.round(r.bar)), [67, 100, 100]);
  assert.deepEqual(shareRows([]), []);
  assert.equal(shareRows([{ name: 'x', count: 0 }])[0].bar, 0);
});

test('shareRows can take the real total, so a partial list does not inflate every share', () => {
  const topThree = [{ name: 'Web', count: 3 }, { name: 'DevOps', count: 2 }, { name: 'AI', count: 1 }];
  assert.deepEqual(shareRows(topThree).map((r) => r.percent), [50, 33, 17]); // out of the rows shown
  assert.deepEqual(shareRows(topThree, 26).map((r) => r.percent), [12, 8, 4]); // out of all 26 gigs
  assert.deepEqual(shareRows(topThree, 26).map((r) => Math.round(r.bar)), [100, 67, 33]); // bars still scale to the biggest row
  assert.deepEqual(shareRows(topThree, 0).map((r) => r.percent), [0, 0, 0]);
});

test('formatBudgets shows rupees in the Indian style and joins several currencies', () => {
  assert.equal(formatBudgets([{ currency: 'INR', total: 125000, count: 4 }]), '₹1,25,000');
  assert.equal(formatBudgets([{ currency: 'INR', total: 5000, count: 1 }, { currency: 'USD', total: 7000, count: 1 }]), '₹5,000 · $7,000');
  assert.equal(formatBudgets([]), '');
  assert.equal(formatBudgets([{ currency: 'INR', total: 0, count: 1 }]), '');
});

test('formatBudgets falls back to a plain code for a currency it does not know', () => {
  assert.match(formatBudgets([{ currency: 'XXXX!', total: 1500, count: 1 }]), /XXXX! 1,?500/);
});

test('popularKind labels each kind and defaults to a job', () => {
  assert.equal(popularKind('GIG').label, 'Gig');
  assert.deepEqual(popularKind('GIG').unit, ['pitch', 'pitches']);
  assert.equal(popularKind('INTERNSHIP').label, 'Internship');
  assert.equal(popularKind('???').label, 'Job');
});

test('describeAge gives a short human age', () => {
  const now = Date.parse('2026-11-16T10:00:00Z');
  const ago = (s) => new Date(now - s * 1000).toISOString();
  assert.equal(describeAge(ago(1), now), 'just now');
  assert.equal(describeAge(ago(12), now), '12 s ago');
  assert.equal(describeAge(ago(125), now), '2 min ago');
  assert.equal(describeAge(ago(7300), now), '2 h ago');
  assert.equal(describeAge(ago(-30), now), 'just now');
  assert.equal(describeAge('garbage', now), '');
  assert.equal(describeAge(undefined, now), '');
});
