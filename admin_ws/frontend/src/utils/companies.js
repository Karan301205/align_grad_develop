// Sorting and filtering for the Companies list. Pure functions, tested in companies.test.js.
import { matchesQuery } from './collections.js';
import { COMPANY_TABS } from './verification.js';

/** Newest registered company first: what the list shows until you pick another order. */
export const DEFAULT_SORT = { key: 'registered', dir: 'desc' };
export const DEFAULT_FILTERS = { jobs: 'all', submitted: 'all' };

// Pending first, then rejected, not submitted, approved: the order that puts work at the top.
const STATUS_RANK = { PENDING: 0, REJECTED: 1, NOT_SUBMITTED: 2, APPROVED: 3 };

const timeOf = (iso) => {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? null : time;
};
const jobCount = (company) => (company.jobs || []).length;
export const contactName = (company) => String(company.company?.recruiterName || '').trim();

// A company with no registration date counts as the oldest. Ties go by id, which starts with the creation
// time in hex, so the order is total and stable.
const idOrder = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
function compareAge(a, b) {
  const ta = timeOf(a.registeredAt) ?? -Infinity;
  const tb = timeOf(b.registeredAt) ?? -Infinity;
  return ta !== tb ? (ta < tb ? -1 : 1) : idOrder(a, b);
}
const newestFirst = (a, b) => compareAge(b, a);

// `get` returns the value to sort by; null means "nothing to sort by" and sorts last in either direction.
const COLUMNS = {
  registered: { get: (c) => timeOf(c.registeredAt) },
  name: { get: (c) => String(c.companyName || '').toLowerCase(), text: true },
  contact: { get: (c) => contactName(c).toLowerCase() || null, text: true },
  status: { get: (c) => STATUS_RANK[c.verificationStatus] ?? 99 },
  jobs: { get: jobCount },
  submitted: { get: (c) => timeOf(c.verificationSubmittedAt) }
};

/** A sorted copy. Ties and blanks fall back to newest first, so the order is always stable. */
export function sortCompanies(list, sort = DEFAULT_SORT) {
  const { get, text } = COLUMNS[sort.key] || COLUMNS.registered;
  const direction = sort.dir === 'asc' ? 1 : -1;
  const blank = (company) => get(company) === null || get(company) === undefined;
  const compare = (a, b) => {
    const base = text ? get(a).localeCompare(get(b)) : get(a) - get(b);
    return base * direction || newestFirst(a, b);
  };
  return [...list.filter((c) => !blank(c))].sort(compare).concat([...list.filter(blank)].sort(newestFirst));
}

/** The tab (status), the search box and the two column filters, all together. */
export function filterCompanies(list, { tab = 'all', query = '', jobs = 'all', submitted = 'all' } = {}) {
  const inTab = (COMPANY_TABS.find((t) => t.key === tab) || COMPANY_TABS[0]).test;
  return list.filter((company) => {
    if (!inTab(company)) return false;
    if (jobs === 'with' && jobCount(company) === 0) return false;
    if (jobs === 'none' && jobCount(company) > 0) return false;
    if (submitted === 'yes' && !company.verificationSubmittedAt) return false;
    if (submitted === 'no' && company.verificationSubmittedAt) return false;
    return matchesQuery([company.companyName, company.email, contactName(company), company.company?.industry, company.company?.location], query);
  });
}

const SORT_LABELS = {
  'registered:desc': 'newest registered first',
  'registered:asc': 'oldest registered first',
  'name:asc': 'company A → Z',
  'name:desc': 'company Z → A',
  'contact:asc': 'contact A → Z',
  'contact:desc': 'contact Z → A',
  'status:asc': 'needs review first',
  'status:desc': 'approved first',
  'jobs:desc': 'most jobs first',
  'jobs:asc': 'fewest jobs first',
  'submitted:desc': 'newest submission first',
  'submitted:asc': 'oldest submission first'
};

/** "newest registered first": the order, in words, for the line above the table. */
export const describeSort = (sort) => SORT_LABELS[`${sort.key}:${sort.dir}`] || SORT_LABELS['registered:desc'];

/** True when the list is in its default order with no column filter and no status tab. */
export const isDefaultView = ({ sort, filters, tab }) =>
  sort.key === DEFAULT_SORT.key && sort.dir === DEFAULT_SORT.dir && filters.jobs === 'all' && filters.submitted === 'all' && tab === 'all';
