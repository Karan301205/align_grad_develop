// Rules for the candidate Gigs pages (design: candidate_gig_design). Gigs come from
// GET /gigs (open gigs, with pitchCount, hasApplied and missingRequirements: the
// skill bars the candidate is below, by the rule the pitch endpoint enforces) and
// GET /gigs/my-gigs (gigs the candidate pitched for or works on, with their own pitch
// and submission). Search, filters and sorting run here on the list.
import { GIG_CATEGORIES, deliveryDays, money } from '../../Gigs/gigConstants';
import { postedText } from '../jobs/jobsData';

export { GIG_CATEGORIES, money, postedText };
export { fileNameOf, safeLink } from '../../Gigs/gigConstants';
export { initialOf, tileColor } from '../home/homeData';

export const companyOf = (gig) => String(gig?.company?.name || '').replace(/^c_/i, '').trim();
export const budgetText = (gig) => money(gig?.budget, gig?.currency);
export const deliveryText = (gig) => (gig?.deliveryTime ? String(gig.deliveryTime).trim() : '');
export const categoryText = (gig) => ((gig?.categories?.length ? gig.categories : [gig?.category]).filter(Boolean)[0] || '');
export const pitchCountText = (count) => (!count ? 'No pitches yet' : `${count} pitch${count === 1 ? '' : 'es'} so far`);

/** Skill bars of a gig (older gigs only list skill names, all at gig.minRating). */
export const requirementsOf = (gig) =>
  gig?.requirements?.length ? gig.requirements : (gig?.skills || []).map((skillName) => ({ skillName, minRating: gig?.minRating || 1 }));

/** "Excel 3, needs 5" / "Excel not on your profile, needs 5". */
export const gapText = (missing) =>
  missing.onProfile ? `${missing.skillName} ${missing.currentRating}, needs ${missing.requiredRating}` : `${missing.skillName} not on your profile, needs ${missing.requiredRating}`;

/**
 * Each skill bar with the candidate's score. A bar of level 1 ("any level") never
 * blocks a pitch; the others are met unless the server lists them as missing.
 */
export function gigBars(gig, skills) {
  const mine = new Map((skills || []).filter((skill) => skill?.name).map((skill) => [skill.name.toLowerCase(), skill]));
  const missing = new Map((gig?.missingRequirements || []).map((item) => [item.skillName.toLowerCase(), item]));
  return requirementsOf(gig).map((req) => {
    const key = String(req.skillName || '').toLowerCase();
    const skill = mine.get(key);
    const gap = missing.get(key);
    return {
      skillName: req.skillName,
      needs: Number(req.minRating) || 1,
      score: skill ? (skill.verifiedRating > 0 ? skill.verifiedRating : skill.rating || 0) : 0,
      hasSkill: Boolean(skill),
      hasTest: gap ? gap.hasTest : true,
      met: !gap
    };
  });
}

/* ---------------------------------------------------------- browse tabs */

/** 'pitched' | 'can' (meets every bar) | 'away' (one bar short) | 'far'. */
export function gigStatus(gig) {
  if (gig?.hasApplied) return 'pitched';
  const missing = (gig?.missingRequirements || []).length;
  if (missing === 0) return 'can';
  return missing === 1 ? 'away' : 'far';
}

export const TABS = [
  { id: 'can', label: 'You can pitch' },
  { id: 'away', label: '1 skill away' },
  { id: 'all', label: 'All gigs' }
];
export const inTab = (gig, tab) => tab === 'all' || gigStatus(gig) === tab;
export const tabFor = (gig) => (['can', 'away'].includes(gigStatus(gig)) ? gigStatus(gig) : 'all');

/* -------------------------------------------------------------- filters */

export const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'budget_desc', label: 'Budget: high to low' },
  { value: 'budget_asc', label: 'Budget: low to high' },
  { value: 'delivery_asc', label: 'Fastest delivery' }
];
export const DELIVERY = [
  { value: 'all', label: 'Any time' },
  { value: '3', label: '3 days or less' },
  { value: '7', label: 'A week or less' },
  { value: '14', label: '2 weeks or less' },
  { value: 'more', label: 'More than 2 weeks' }
];
export const LEVELS = [
  { value: 'all', label: 'Any level' },
  { value: '3', label: 'Up to 3' },
  { value: '5', label: 'Up to 5' },
  { value: '7', label: 'Up to 7' }
];
export const BUDGET_PRESETS = [
  { label: 'Under ₹5k', min: '', max: '5000' },
  { label: '₹5k – ₹20k', min: '5000', max: '20000' },
  { label: '₹20k – ₹50k', min: '20000', max: '50000' },
  { label: '₹50k+', min: '50000', max: '' }
];

export const EMPTY_FILTERS = { search: '', sort: 'newest', category: '', skills: [], minBudget: '', maxBudget: '', delivery: 'all', level: 'all', verifiedOnly: false };

export const activeFilterCount = (filters) =>
  [filters.sort !== 'newest', Boolean(filters.category), filters.skills.length > 0, Boolean(filters.minBudget || filters.maxBudget), filters.delivery !== 'all', filters.level !== 'all', filters.verifiedOnly].filter(Boolean).length;

/** Highest skill level a gig asks for. */
const levelAsked = (gig) => Math.max(1, ...requirementsOf(gig).map((req) => Number(req.minRating) || 1));

/** The previous Gigs page's filters: search, field, skills, budget, delivery time, level asked, verified companies. */
export function matchesFilters(gig, filters) {
  const query = filters.search.trim().toLowerCase();
  if (query && ![gig.title, gig.description, gig.category, ...(gig.categories || []), ...(gig.skills || []), companyOf(gig)].some((field) => String(field || '').toLowerCase().includes(query))) return false;

  const category = filters.category.trim().toLowerCase();
  if (category && ![gig.category, ...(gig.categories || [])].some((field) => String(field || '').toLowerCase().includes(category))) return false;

  if (filters.skills.length) {
    const names = [...(gig.skills || []), ...requirementsOf(gig).map((req) => req.skillName)].map((name) => String(name || '').toLowerCase());
    if (!filters.skills.some((skill) => names.some((name) => name.includes(skill.toLowerCase())))) return false;
  }

  const budget = Number(gig.budget) || 0;
  const min = parseInt(filters.minBudget, 10);
  const max = parseInt(filters.maxBudget, 10);
  if (!Number.isNaN(min) && budget < min) return false;
  if (!Number.isNaN(max) && budget > max) return false;

  if (filters.delivery !== 'all') {
    const days = deliveryDays(gig.deliveryTime);
    if (days == null) return false;
    if (filters.delivery === 'more' ? days <= 14 : days > Number(filters.delivery)) return false;
  }

  if (filters.level !== 'all' && levelAsked(gig) > Number(filters.level)) return false;
  if (filters.verifiedOnly && !gig.company?.verified) return false;
  return true;
}

export function sortGigs(list, sort) {
  const sorted = [...list];
  const days = (gig) => deliveryDays(gig.deliveryTime) ?? Infinity;
  if (sort === 'budget_desc') return sorted.sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0));
  if (sort === 'budget_asc') return sorted.sort((a, b) => (Number(a.budget) || 0) - (Number(b.budget) || 0));
  if (sort === 'delivery_asc') return sorted.sort((a, b) => days(a) - days(b));
  return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/* -------------------------------------------------------------- my gigs */

/**
 * Where the candidate stands on a gig from "my gigs":
 * waiting / not-picked (pitched, not hired) · working / submitted / changes (hired)
 * · approved (work accepted or gig completed) · ended (hired, gig closed first).
 */
export function myGigState(gig) {
  const closed = gig.status === 'CLOSED' || gig.status === 'COMPLETED';
  if (!gig.isHired) return closed ? 'not-picked' : 'waiting';
  const work = gig.mySubmission?.status;
  if (work === 'ACCEPTED' || gig.status === 'COMPLETED') return 'approved';
  if (gig.status === 'CLOSED') return 'ended';
  if (work === 'PENDING') return 'submitted';
  if (work === 'REJECTED') return 'changes';
  return 'working';
}

export const STATE = {
  working: { label: 'In progress', tone: 'bg-[#E8EEFF] text-[#0B3FA8]' },
  submitted: { label: 'Submitted', tone: 'bg-[#F1ECFF] text-[#5B2AA6]' },
  changes: { label: 'Changes asked', tone: 'bg-[#FFF3E0] text-[#8A3F06]' },
  waiting: { label: 'Waiting', tone: 'bg-[#EEF0F6] text-[#3B4A6B]' },
  'not-picked': { label: 'Not picked', tone: 'bg-[#EEF0F6] text-[#3B4A6B]' },
  approved: { label: 'Approved', tone: 'bg-[#E3F5EE] text-[#0B5E41]' },
  ended: { label: 'Closed', tone: 'bg-[#EEF0F6] text-[#3B4A6B]' }
};

export const GROUPS = [
  { id: 'working', label: 'Working on', states: ['working', 'submitted', 'changes'] },
  { id: 'pitches', label: 'Pitches sent', states: ['waiting', 'not-picked'] },
  { id: 'done', label: 'Done', states: ['approved', 'ended'] }
];

/** Badge on the "My gigs" switch: work in progress plus pitches still waiting. */
export const activeCount = (myGigs) => myGigs.filter((gig) => ['working', 'submitted', 'changes', 'waiting'].includes(myGigState(gig))).length;

/** Progress of hired work: In progress → Submitted → Approved. */
export function workSteps(state) {
  const reached = { working: 0, changes: 0, submitted: 1, approved: 2 }[state] ?? 0;
  return ['In progress', 'Submitted', 'Approved'].map((label, index) => ({ label, done: index <= reached, current: index === reached }));
}

/** "today", "3 days ago", "4 Nov": the posted date for use after a word or a dot. */
export const postedLower = (value) => postedText(value).replace(/^(Today|Yesterday)$/, (word) => word.toLowerCase());

/** "today", "3 days ago", "on 4 Nov" (for use inside a sentence). */
export function whenText(value) {
  const text = postedText(value);
  if (!text) return '';
  return /^(today|yesterday)$|ago$/i.test(text) ? text.toLowerCase() : `on ${text}`;
}

/** One line under a "my gigs" card. */
export function myGigLine(gig, state) {
  if (state === 'waiting') return gig.myPitch?.createdAt ? `Pitched ${whenText(gig.myPitch.createdAt)}` : 'Pitch sent';
  if (state === 'not-picked') return 'The company picked someone else or closed the gig';
  if (state === 'submitted') return ['Work sent', whenText(gig.mySubmission?.createdAt), '· waiting for approval'].filter(Boolean).join(' ');
  if (state === 'changes') return 'They asked for changes. See the chat.';
  if (state === 'approved') return 'Work approved';
  if (state === 'ended') return 'The company closed this gig';
  return deliveryText(gig) ? `Deliver in ${deliveryText(gig)}` : 'In progress';
}
