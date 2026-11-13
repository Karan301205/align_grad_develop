// Rules for the candidate Applications page (design: candidate_application_design).
// Everything comes from GET /student/applications: status, roundStatuses (one per
// hiring round, set by the recruiter), answers and the job.
import { getApplicationStage } from '../../../utils/hiringProgress';
import { formatShortDate } from '../../../utils/format';
import { roundText } from '../home/homeData';

export { companyOf, initialOf, payText, placeText, tileColor, applyNowJobs, roundText } from '../home/homeData';
export { getApplicationStage };

const up = (value) => String(value || '').toUpperCase().trim();
const CLEARED = ['CLEARED', 'QUALIFIED', 'SELECTED'];
const LIVE = ['SCHEDULED', 'IN_PROGRESS'];

/** Badge per stage (same stages as Home and the previous Job Progress page). */
export const STAGE = {
  APPLIED: { label: 'Applied', tone: 'bg-[#E8EEFF] text-[#0B3FA8]' },
  SHORTLISTED: { label: 'Shortlisted', tone: 'bg-[#F1ECFF] text-[#5B2AA6]' },
  INTERVIEW: { label: 'Interview', tone: 'bg-[#FFF3E0] text-[#8A3F06]' },
  HIRED: { label: 'Selected', tone: 'bg-[#E3F5EE] text-[#0B5E41]' },
  REJECTED: { label: 'Not selected', tone: 'bg-[#EEF0F6] text-[#3B4A6B]' }
};

/* ------------------------------------------------------- groups and filters */

export const GROUPS = [
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' }
];

/** Selected and not-selected applications are finished ("Closed"); the rest are still moving. */
export const groupOf = (stage) => (stage === 'HIRED' || stage === 'REJECTED' ? 'closed' : 'active');

/** The previous page's stage filters, split between the two groups. */
export const STAGE_FILTERS = {
  active: ['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEW'],
  closed: ['ALL', 'HIRED', 'REJECTED']
};

export const filterLabel = (stage) => (stage === 'ALL' ? 'All' : STAGE[stage].label);

/** Newest application first. */
export const byNewest = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

/* ------------------------------------------------------------------ rounds */

/** The hiring rounds the recruiter moves the candidate through (no "Applied" step). */
export const roundsOf = (app) => (Array.isArray(app?.roundStatuses) ? app.roundStatuses : []).filter((round) => !/^applied( for job)?$/i.test(String(round?.name || '').trim()));

const roundLabel = (round, index) => roundText({ ...round, roundNumber: round.roundNumber || index + 1 }) || `Round ${index + 1}`;

/** The round happening now (scheduled or in progress), with what it is about and what comes next. */
export function liveRound(app) {
  const rounds = roundsOf(app);
  const index = rounds.findIndex((round) => LIVE.includes(up(round.status)));
  if (index < 0) return null;
  const round = rounds[index];
  const step = (app.job?.selectionProcess || []).find((item) => Number(item.roundNumber) === Number(round.roundNumber));
  const next = rounds.slice(index + 1).find((item) => up(item.status) === 'PENDING');
  return {
    label: roundLabel(round, index),
    status: up(round.status) === 'SCHEDULED' ? 'Scheduled' : 'In progress',
    about: String(step?.description || '').trim(),
    feedback: String(round.feedback || '').trim(),
    next: next ? roundLabel(next, rounds.indexOf(next)) : ''
  };
}

/**
 * Progress bar: Applied, Shortlisted, each hiring round, Selected.
 * state: 'done' | 'now' | 'failed' | 'todo'; `current` marks the furthest step reached.
 */
export function progressSteps(app) {
  const stage = getApplicationStage(app);
  const rounds = roundsOf(app);
  const moved = rounds.some((round) => CLEARED.includes(up(round.status)) || LIVE.includes(up(round.status)));
  let stopped = false;

  const steps = [
    { key: 'applied', label: 'Applied', state: 'done', note: app?.createdAt ? formatShortDate(app.createdAt) : '' },
    { key: 'shortlisted', label: 'Shortlisted', state: ['SHORTLISTED', 'INTERVIEW', 'HIRED'].includes(stage) || moved ? 'done' : 'todo', note: '' },
    ...rounds.map((round, index) => {
      const status = up(round.status);
      let state = 'todo';
      if (!stopped) {
        if (CLEARED.includes(status) || stage === 'HIRED') state = 'done';
        else if (status === 'REJECTED') {
          state = 'failed';
          stopped = true;
        } else if (LIVE.includes(status)) state = 'now';
      }
      const note = { CLEARED: 'Cleared', QUALIFIED: 'Cleared', SELECTED: 'Cleared', REJECTED: 'Not cleared', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In progress' }[status] || '';
      return { key: `round-${index}`, label: roundLabel(round, index), state, note: stopped && state === 'todo' ? '' : note };
    }),
    { key: 'selected', label: 'Selected', state: stage === 'HIRED' ? 'done' : 'todo', note: '' }
  ];

  let current = 0;
  steps.forEach((step, index) => {
    if (step.state !== 'todo') current = index;
  });
  return steps.map((step, index) => ({ ...step, current: index === current }));
}

/** Rounds where the recruiter left a note for the candidate. */
export const roundFeedback = (app) =>
  roundsOf(app)
    .map((round, index) => ({ label: roundLabel(round, index), status: up(round.status), feedback: String(round.feedback || '').trim() }))
    .filter((round) => round.feedback);

/** One plain sentence on where the application stands. */
export function statusNote(app, company) {
  const stage = getApplicationStage(app);
  const who = company || 'the company';
  const Who = company || 'The company';
  const rounds = roundsOf(app);
  const nextIndex = rounds.findIndex((round) => up(round.status) === 'PENDING');
  const next = nextIndex >= 0 ? ` Next: ${roundLabel(rounds[nextIndex], nextIndex)}.` : '';
  switch (stage) {
    case 'SHORTLISTED':
      return `${Who} shortlisted you.${next}`;
    case 'INTERVIEW':
      return `You’re in the interview rounds.${next}`;
    case 'HIRED':
      return `${Who} selected you for this role. Congratulations!`;
    case 'REJECTED':
      return `${Who} isn’t moving forward with your application. Your scores stay on your profile for other jobs.`;
    default:
      return `Waiting for ${who} to review applications. You’ll see it here when anything changes.`;
  }
}
