import { useMemo, useState } from 'react';
import { Briefcase, ChevronRight, Plus, RefreshCw, Search } from 'lucide-react';
import { ACCOUNT_PAGE, CARD, LINK, MUTED, PAGE_TITLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/accountStyles';
import { STATUS_FILTERS, categoryLine, createdLabel, deliveryLabel, gigMatches, hiredIds, money, statusOf } from './gigsData';

const PAGE_SIZE = 8;
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';
const TH = 'whitespace-nowrap border-b border-[#E4E6EA] bg-[#F1F3F6] px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.03em] text-[#0F172A]';
const TD = 'whitespace-nowrap border-b border-[#EEF0F3] px-4 py-3.5 align-middle';

function Stat({ label, value }) {
  return (
    <div className={`${CARD} min-w-0 px-[18px] py-4`}>
      <div className={`text-[13px] font-semibold ${MUTED}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-[-0.01em] tabular-nums">{value.toLocaleString('en-IN')}</div>
    </div>
  );
}

function pages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = [...new Set([1, total, current - 1, current, current + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return keep.flatMap((p, i) => (i > 0 && p - keep[i - 1] > 1 ? ['gap', p] : [p]));
}

/**
 * Gigs (design: design/gigs_recruiter/gigs-directory.html): every gig the recruiter
 * posted, with totals, search, status filters and a paged table. A row opens the
 * gig workspace; "New gig" opens Post a gig.
 */
export default function GigsDirectory({ gigs, loading, loadError, onRetry, refreshing, onOpen, onNew }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const c = { ALL: gigs.length };
    gigs.forEach((g) => {
      c[g.status] = (c[g.status] || 0) + 1;
    });
    return c;
  }, [gigs]);
  const totals = useMemo(
    () => ({
      applicants: gigs.reduce((sum, g) => sum + (g.applicants || []).length, 0),
      selected: gigs.reduce((sum, g) => sum + hiredIds(g).length, 0)
    }),
    [gigs]
  );
  const visible = gigs.filter((g) => (filter === 'ALL' || g.status === filter) && gigMatches(g, query));
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = visible.length ? (current - 1) * PAGE_SIZE + 1 : 0;

  const clear = () => {
    setQuery('');
    setFilter('ALL');
    setPage(1);
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className={PAGE_TITLE}>
              <span className="font-bold">Gigs</span>
            </h1>
            <p className={`m-0 text-[15px] ${MUTED}`}>All gigs you have posted. Open a gig to see its pitches, hired freelancers and chat.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onRetry} disabled={refreshing} aria-label="Refresh gigs" title="Refresh gigs" className={`${SECONDARY_BUTTON} size-11`}>
              <RefreshCw className={`size-[18px] ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button type="button" onClick={onNew} className={`${PRIMARY_BUTTON} h-11 px-[18px]`}>
              <Plus className="size-[18px]" aria-hidden="true" />
              New gig
            </button>
          </div>
        </header>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#991B1B]">
            <span>Couldn’t load your gigs. {loadError}</span>
            <button type="button" onClick={onRetry} disabled={refreshing} className={`${SECONDARY_BUTTON} h-9 px-3`}>
              Try again
            </button>
          </div>
        )}

        <section aria-label="Gig totals" className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Stat label="Total gigs" value={gigs.length} />
          <Stat label="Open" value={counts.OPEN || 0} />
          <Stat label="Applicants" value={totals.applicants} />
          <Stat label="Selected freelancers" value={totals.selected} />
        </section>

        <section aria-label="All gigs" className={`${CARD} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E6EA] px-[18px] py-4">
            <label className={`flex h-10 min-w-0 max-w-[380px] flex-[1_1_260px] items-center gap-2 rounded-[10px] border border-[#E4E6EA] bg-[#F8F8F6] px-3 focus-within:border-[#1447E6] focus-within:bg-white ${MUTED}`}>
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search gigs"
                placeholder="Search gigs by title or category"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none"
              />
            </label>
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(([value, label]) => {
                const on = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setFilter(value);
                      setPage(1);
                    }}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${FOCUS} ${on ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#E4E6EA] bg-white text-[#4B5563] hover:bg-[#F8F8F6]'}`}
                  >
                    {label} <b className={on ? 'text-white' : 'text-[#0F172A]'}>{counts[value] || 0}</b>
                  </button>
                );
              })}
            </div>
          </div>

          {loading && gigs.length === 0 ? (
            <p className={`m-0 px-6 py-14 text-center ${MUTED}`}>Loading your gigs…</p>
          ) : gigs.length === 0 ? (
            !loadError && (
              <div className="flex flex-col items-center gap-2 px-6 py-[52px] text-center">
                <span className="mb-1.5 flex size-[60px] items-center justify-center rounded-[16px] bg-[#EEF2FE] text-[#1447E6]">
                  <Briefcase className="size-[26px]" aria-hidden="true" />
                </span>
                <h2 className="m-0 text-[17px]">
                  <span className="font-bold">No gigs yet</span>
                </h2>
                <p className={`m-0 max-w-[380px] ${MUTED}`}>Post your first gig to start receiving pitches from candidates who meet your bars.</p>
                <button type="button" onClick={onNew} className={`${PRIMARY_BUTTON} mt-2 h-10 px-4`}>
                  <Plus className="size-4" aria-hidden="true" />
                  Create your first gig
                </button>
              </div>
            )
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <h2 className="m-0 text-[17px]">
                <span className="font-bold">No gigs match</span>
              </h2>
              <p className={`m-0 ${MUTED}`}>Try a different search term or filter.</p>
              <button type="button" onClick={clear} className={`${SECONDARY_BUTTON} mt-2 h-9 px-3`}>
                Clear search and filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={TH}>Gig</th>
                      <th scope="col" className={TH}>Status</th>
                      <th scope="col" className={TH}>Budget</th>
                      <th scope="col" className={TH}>Delivery</th>
                      <th scope="col" className={TH}>Applicants</th>
                      <th scope="col" className={TH}>Selected</th>
                      <th scope="col" className={TH}>Created</th>
                      <th scope="col" className={TH}>
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((g) => {
                      const status = statusOf(g);
                      return (
                        <tr
                          key={g.id}
                          tabIndex={0}
                          aria-label={`Open ${g.title}`}
                          onClick={() => onOpen(g)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onOpen(g);
                            }
                          }}
                          className="group cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1447E6]"
                        >
                          <td className={`${TD} group-hover:bg-[#FBFBFA]`}>
                            <div className="flex max-w-[360px] flex-col">
                              <b className="truncate text-[15px] font-semibold">{g.title}</b>
                              <span className={`truncate text-[13px] ${MUTED}`}>{categoryLine(g)}</span>
                            </div>
                          </td>
                          <td className={`${TD} group-hover:bg-[#FBFBFA]`}>
                            <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-[0.06em] ${status.pill}`}>
                              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                              {status.label}
                            </span>
                          </td>
                          <td className={`${TD} tabular-nums group-hover:bg-[#FBFBFA]`}>{money(g.budget, g.currency)}</td>
                          <td className={`${TD} group-hover:bg-[#FBFBFA]`}>{deliveryLabel(g.deliveryTime)}</td>
                          <td className={`${TD} tabular-nums group-hover:bg-[#FBFBFA]`}>{(g.applicants || []).length}</td>
                          <td className={`${TD} tabular-nums group-hover:bg-[#FBFBFA]`}>{hiredIds(g).length}</td>
                          <td className={`${TD} ${MUTED} group-hover:bg-[#FBFBFA]`}>{createdLabel(g)}</td>
                          <td className={`${TD} w-8 ${MUTED} group-hover:bg-[#FBFBFA]`}>
                            <ChevronRight className="size-[18px]" aria-hidden="true" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E6EA] bg-[#FAFAF9] px-[18px] py-3 text-[13px] ${MUTED}`}>
                <span>
                  Showing {from}–{Math.min(current * PAGE_SIZE, visible.length)} of {visible.length}
                </span>
                {pageCount > 1 && (
                  <nav aria-label="Pages" className="flex flex-wrap items-center gap-1.5">
                    <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className={`${SECONDARY_BUTTON} h-[34px] px-3 text-[13px]`}>
                      ← Previous
                    </button>
                    {pages(current, pageCount).map((p, i) =>
                      p === 'gap' ? (
                        <span key={`gap-${i}`} aria-hidden="true">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          aria-label={`Page ${p}`}
                          aria-current={p === current ? 'page' : undefined}
                          onClick={() => setPage(p)}
                          className={`h-[34px] min-w-[34px] rounded-[8px] border text-[13px] font-semibold ${FOCUS} ${p === current ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#E4E6EA] bg-white text-[#0F172A] hover:bg-[#F8F8F6]'}`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button type="button" disabled={current >= pageCount} onClick={() => setPage(current + 1)} className={`${SECONDARY_BUTTON} h-[34px] px-3 text-[13px]`}>
                      Next →
                    </button>
                  </nav>
                )}
              </div>
            </>
          )}
        </section>
        {gigs.length > 0 && filter !== 'ALL' && (
          <button type="button" onClick={clear} className={`self-start text-[13px] ${LINK}`}>
            Show all gigs
          </button>
        )}
      </div>
    </div>
  );
}
