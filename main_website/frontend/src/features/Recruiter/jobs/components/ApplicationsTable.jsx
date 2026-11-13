import { ArrowUpDown, FileText, Mail, UserRound } from 'lucide-react';
import { SelectControl } from '../../components/AccountControls';
import { MUTED } from '../../components/accountStyles';
import { CandidateAvatar } from '../../candidates/components/bits';
import { formatLongDate, formatShortDate } from '../../../../utils/format';
import { PAGE_SIZES, emailOf, locationOf, matchBand, stageLabel } from '../jobsData';

const MATCH_COLOUR = {
  high: 'text-[#17794F]',
  mid: 'text-[#B26A00]',
  low: 'text-[#C4551A]',
  poor: 'text-[#B3261E]',
  none: 'text-[#6B7280]'
};

const STAGE_PILL = {
  APPLIED: 'bg-[#EEF2FE] text-[#1447E6]',
  SHORTLISTED: 'bg-[#EFEAFC] text-[#5B3FB0]',
  INTERVIEW: 'bg-[#FBF1DC] text-[#B26A00]',
  HIRED: 'bg-[#E4F4EC] text-[#17794F]',
  REJECTED: 'bg-[#FDECEA] text-[#B3261E]'
};

const TH = 'whitespace-nowrap border-b border-[#E4E6EA] bg-[#F1F3F6] px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.02em] text-[#0F172A]';
const TD = 'whitespace-nowrap border-b border-[#EEF0F3] bg-white px-3 py-3.5 align-middle group-hover:bg-[#FBFBFA]';
// The actions column stays in view when the table scrolls sideways (narrow screens, open sidebar).
const STICKY = 'sticky right-0 z-[1] shadow-[-1px_0_0_#E4E6EA]';
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';

/** Column header that sorts; `keys` is [descending, ascending] (or the reverse for names). */
function SortHeader({ label, keys, sortBy, onSort, center, ascendingFirst }) {
  const [first, second] = keys;
  const active = keys.includes(sortBy);
  const ariaSort = !active ? 'none' : (sortBy === first) === !ascendingFirst ? 'descending' : 'ascending';
  return (
    <th scope="col" aria-sort={ariaSort} className={`${TH} ${center ? 'text-center' : ''}`}>
      <button
        type="button"
        onClick={() => onSort(sortBy === first ? second : first)}
        className={`inline-flex items-center gap-1 rounded-[4px] font-(family-name:--font-headline) text-xs font-bold uppercase tracking-[0.02em] text-[#0F172A] ${FOCUS}`}
      >
        {label}
        <ArrowUpDown className={`size-[13px] ${active ? 'text-[#1447E6]' : 'text-[#6B7280]'}`} aria-hidden="true" />
      </button>
    </th>
  );
}

/** "1 2 3 … 9" style page list around the current page. */
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap', p] : [p]));
}

const PAGER_BUTTON = `h-8 rounded-[8px] border border-[#E4E6EA] bg-white px-3 text-[12.5px] font-semibold text-[#0F172A] hover:bg-[#F8F8F6] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;

function Pagination({ page, pages, pageSize, total, onPage, onPageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] bg-[#FAFAF9] px-[18px] py-3">
      <span className={`text-[13px] ${MUTED}`} aria-live="polite">
        {total === 0 ? (
          'No applications to show'
        ) : (
          <>
            Showing <b className="text-[#0F172A]">{from}</b>–<b className="text-[#0F172A]">{to}</b> of <b className="text-[#0F172A]">{total}</b> application{total === 1 ? '' : 's'}
          </>
        )}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <span className={`flex items-center gap-2 text-[13px] ${MUTED}`}>
          <span id="rows-per-page">Rows</span>
          <SelectControl size="sm" aria-labelledby="rows-per-page" className="w-[76px]" menuMinWidth={90} value={pageSize} onChange={(value) => onPageSize(Number(value))} options={PAGE_SIZES.map((n) => [n, String(n)])} />
        </span>
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={PAGER_BUTTON} disabled={page <= 1} onClick={() => onPage(page - 1)}>
            ← Previous
          </button>
          {pageList(page, pages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden="true" className={`px-1 ${MUTED}`}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
                className={`h-[34px] min-w-[34px] rounded-[8px] border text-[13px] font-semibold ${FOCUS} ${
                  p === page ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#E4E6EA] bg-white text-[#0F172A] hover:bg-[#F8F8F6]'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button type="button" className={PAGER_BUTTON} disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next →
          </button>
        </nav>
      </div>
    </div>
  );
}

/**
 * Applicant table (design: design/jobs_recruiter/candidate-applications.html). The
 * last column holds Manage (kept from the previous page) and View profile, and stays
 * pinned to the right edge when the table scrolls. `rows` is the current page only.
 */
export default function ApplicationsTable({ rows, total, page, pages, pageSize, onPage, onPageSize, sortBy, onSort, showJob, resumeBusyId, onProfile, onManage, onResume, empty }) {
  return (
    <section aria-labelledby="applicants-title" className="overflow-hidden rounded-[12px] border border-[#E4E6EA] bg-white">
      <h2 id="applicants-title" className="sr-only">
        Applicants
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <SortHeader label="Match %" keys={['MATCH_DESC', 'MATCH_ASC']} sortBy={sortBy} onSort={onSort} center />
              <SortHeader label="Applied on" keys={['DATE_DESC', 'DATE_ASC']} sortBy={sortBy} onSort={onSort} />
              <SortHeader label="Name" keys={['NAME_ASC', 'NAME_DESC']} sortBy={sortBy} onSort={onSort} ascendingFirst />
              <th scope="col" className={TH}>Email</th>
              <th scope="col" className={TH}>Phone</th>
              <th scope="col" className={TH}>Location</th>
              <th scope="col" className={TH}>Status</th>
              <th scope="col" className={TH}>Resume</th>
              <th scope="col" className={`${TH} ${STICKY}`}>Manage · Profile</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-0">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const s = row.student || {};
                const name = s.name || 'Unnamed candidate';
                const email = emailOf(row);
                const location = locationOf(s);
                return (
                  <tr key={row.app.id} className="group">
                    <td className={`${TD} text-center`}>
                      {row.score == null ? (
                        <span className={MATCH_COLOUR.none} title="This job has no skill bars">
                          —
                        </span>
                      ) : (
                        <span className={`text-base font-bold tracking-[-0.01em] ${MATCH_COLOUR[matchBand(row.score)]}`}>{row.score}%</span>
                      )}
                    </td>
                    <td className={`${TD} ${MUTED}`} title={formatLongDate(row.app.createdAt)}>
                      {formatShortDate(row.app.createdAt) || '—'}
                    </td>
                    <td className={`${TD} whitespace-normal`}>
                      <div className="flex min-w-[170px] items-center gap-3">
                        <CandidateAvatar candidate={s} size={36} />
                        <div className="flex min-w-0 flex-col">
                          <button type="button" onClick={() => onProfile(row)} disabled={!row.student} className={`self-start rounded-[4px] text-left font-semibold text-[#0F172A] hover:text-[#1447E6] disabled:hover:text-[#0F172A] ${FOCUS}`}>
                            {name}
                          </button>
                          {s.username && <span className={`text-xs ${MUTED}`}>@{s.username}</span>}
                          {showJob && <span className="mt-0.5 self-start rounded-[6px] bg-[#EEF2FE] px-1.5 py-px text-[11px] font-semibold text-[#1447E6]">{row.job.title}</span>}
                        </div>
                      </div>
                    </td>
                    <td className={`${TD} ${MUTED}`}>
                      {email ? (
                        <a href={`mailto:${email}`} title={email} className={`inline-flex max-w-[200px] items-center gap-1.5 rounded-[4px] hover:text-[#1447E6] hover:underline ${FOCUS}`}>
                          <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{email}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`${TD} ${MUTED}`}>{s.phone || '—'}</td>
                    <td className={TD}>
                      <span className="block max-w-[150px] truncate" title={location}>
                        {location || <span className={MUTED}>—</span>}
                      </span>
                    </td>
                    <td className={TD}>
                      <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${STAGE_PILL[row.stage]}`}>
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                        {stageLabel(row.stage)}
                      </span>
                    </td>
                    <td className={TD}>
                      <button
                        type="button"
                        onClick={() => onResume(row)}
                        disabled={!row.student || resumeBusyId === row.app.id}
                        aria-label={`Resume of ${name}`}
                        className={`inline-flex items-center gap-1.5 rounded-[4px] font-semibold text-[#1447E6] hover:text-[#0F38B8] disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}
                      >
                        <FileText className="size-[15px]" aria-hidden="true" />
                        {resumeBusyId === row.app.id ? 'Opening…' : 'Resume'}
                      </button>
                    </td>
                    <td className={`${TD} ${STICKY}`}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onManage(row)}
                          aria-label={`Manage ${name}'s application`}
                          className={`h-8 rounded-[8px] border border-[#C7D3FB] bg-[#EEF2FE] px-3 font-(family-name:--font-headline) text-[12.5px] font-semibold text-[#1447E6] hover:bg-[#E0E8FD] ${FOCUS}`}
                        >
                          Manage
                        </button>
                        <button
                          type="button"
                          onClick={() => onProfile(row)}
                          disabled={!row.student}
                          aria-label={`View ${name}'s profile`}
                          title="View profile"
                          className={`inline-flex size-8 items-center justify-center rounded-[8px] border border-[#E4E6EA] bg-white text-[#0F172A] hover:bg-[#F8F8F6] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
                        >
                          <UserRound className="size-[15px]" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} pageSize={pageSize} total={total} onPage={onPage} onPageSize={onPageSize} />
    </section>
  );
}
