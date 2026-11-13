import { useMemo, useRef, useState } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { BODY, CARD, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL } from '../profile/profileTheme';
import { ErrorBanner, Spinner } from '../profile/ui';
import ApplicationDetail, { StageBadge, Tile } from './ApplicationDetail';
import { GROUPS, STAGE_FILTERS, applyNowJobs, byNewest, companyOf, filterLabel, getApplicationStage, groupOf } from './applicationsData';
import { formatShortDate } from '../../../utils/format';

/**
 * Where a link into the page starts: a stage (Home tiles) or one application, by its
 * id (Home rows) or its job (Jobs page, apply dialog).
 */
function fromFocus(focus) {
  const one = Boolean(focus?.applicationId || focus?.jobId);
  return {
    group: !one && focus?.stage && focus.stage !== 'ALL' ? groupOf(focus.stage) : null,
    stage: one ? 'ALL' : focus?.stage || 'ALL',
    selectedId: focus?.applicationId || null,
    jobId: focus?.jobId || null
  };
}

function OpenJobsLink({ count, goToTab }) {
  if (!count) return null;
  return (
    <button type="button" onClick={() => goToTab?.('opportunities')} className="flex items-center justify-between gap-3 rounded-[14px] bg-[linear-gradient(135deg,#E8EEFF_0%,#F1ECFF_100%)] p-4 text-left text-[15px] font-semibold text-[#0B3FA8] hover:bg-[linear-gradient(135deg,#DCE5FF_0%,#E9E0FF_100%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
      {count === 1 ? '1 job is open to you right now' : `${count} jobs are open to you right now`}
      <ChevronRight aria-hidden="true" className="size-[18px] shrink-0" />
    </button>
  );
}

/**
 * Candidate Applications (design: candidate_application_design/Web — my applications
 * and interview): Active / Closed with the previous page's stage filters, the list and
 * the selected application side by side. `focus` ({ stage, applicationId, jobId }) is
 * a new object each time another page links here.
 */
export default function ApplicationsPage({ applications = [], loading, error, onRetry, profile, jobs = [], focus, goToTab }) {
  const [view, setView] = useState(() => fromFocus(focus));
  const [handledFocus, setHandledFocus] = useState(focus);
  const detailRef = useRef(null);

  if (focus !== handledFocus) {
    setHandledFocus(focus);
    setView(fromFocus(focus));
  }

  const rows = useMemo(() => [...applications].sort(byNewest).map((app) => ({ app, stage: getApplicationStage(app) })), [applications]);
  const groupCounts = { active: rows.filter((row) => groupOf(row.stage) === 'active').length, closed: rows.filter((row) => groupOf(row.stage) === 'closed').length };
  const target = rows.find((row) => row.app.id === view.selectedId || (view.jobId && row.app.jobId === view.jobId)) || null;
  // Otherwise open on Active, unless only closed applications exist.
  const group = view.group || (target ? groupOf(target.stage) : groupCounts.active > 0 || groupCounts.closed === 0 ? 'active' : 'closed');
  const inGroup = rows.filter((row) => groupOf(row.stage) === group);
  const stage = STAGE_FILTERS[group].includes(view.stage) ? view.stage : 'ALL';
  const stageCount = (id) => (id === 'ALL' ? inGroup.length : inGroup.filter((row) => row.stage === id).length);
  const list = stage === 'ALL' ? inGroup : inGroup.filter((row) => row.stage === stage);
  const selected = (target && list.includes(target) ? target : null) || list[0] || null;
  const openCount = applyNowJobs(jobs).length;

  const pick = (id) => {
    setView((prev) => ({ ...prev, selectedId: id, jobId: null }));
    if (window.innerWidth < 1024) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  let body;
  if (loading && applications.length === 0) {
    body = (
      <div className={`${CARD} flex items-center justify-center gap-3 p-10 ${BODY}`} role="status">
        <Spinner className="size-5 text-[#0167F6]" /> Loading your applications…
      </div>
    );
  } else if (error && applications.length === 0) {
    body = (
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <p role="alert" className="m-0 font-medium text-[#8C1D14]">
          {error}
        </p>
        <button type="button" onClick={onRetry} className={`${SECONDARY} ${SMALL}`}>
          <RotateCcw aria-hidden="true" className="size-4" /> Try again
        </button>
      </div>
    );
  } else if (applications.length === 0) {
    body = (
      <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-6`}>
        <p className={`m-0 ${BODY}`}>You haven’t applied to any jobs yet. Your applications and their progress will show here.</p>
        <button type="button" onClick={() => goToTab?.('opportunities')} className={`${PRIMARY} ${SMALL}`}>
          Find a job
        </button>
      </div>
    );
  } else if (list.length === 0) {
    body = (
      <div className="flex flex-col gap-2.5 lg:max-w-[440px]">
        <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-5`}>
          <p className={`m-0 ${BODY}`}>{inGroup.length === 0 ? (group === 'active' ? 'No applications are in progress right now.' : 'No applications have closed yet.') : 'No applications at this stage.'}</p>
          {inGroup.length > 0 && (
            <button type="button" onClick={() => setView((prev) => ({ ...prev, stage: 'ALL' }))} className={`${SECONDARY} ${SMALL}`}>
              Show all
            </button>
          )}
        </div>
        <OpenJobsLink count={openCount} goToTab={goToTab} />
      </div>
    );
  } else {
    body = (
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 max-w-full flex-[1_1_340px] flex-col gap-2.5 lg:max-w-[440px]">
          <ul aria-label="Applications" className="m-0 flex list-none flex-col gap-2.5 p-0">
            {list.map(({ app, stage: rowStage }) => {
              const on = app.id === selected?.app.id;
              const company = companyOf(app.job);
              return (
                <li key={app.id}>
                  <button
                    type="button"
                    aria-current={on ? 'true' : undefined}
                    onClick={() => pick(app.id)}
                    className={`flex w-full flex-col gap-2.5 rounded-[14px] bg-white p-4 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? 'border-2 border-[#0167F6] p-[15px] shadow-[0_12px_28px_-18px_rgba(1,103,246,0.8)]' : 'border border-[#E1E5F2] hover:border-[#6378F9]'}`}
                  >
                    <span className="flex items-center gap-3">
                      <Tile name={company || app.job?.title} size={40} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={`text-[15px] font-bold ${INK}`}>{app.job?.title || 'Job'}</span>
                        <span className={`text-[14px] ${MUTED}`}>{[company, app.createdAt && `applied ${formatShortDate(app.createdAt)}`].filter(Boolean).join(' · ')}</span>
                      </span>
                    </span>
                    <StageBadge stage={rowStage} />
                  </button>
                </li>
              );
            })}
          </ul>
          {group === 'closed' && <OpenJobsLink count={openCount} goToTab={goToTab} />}
        </div>
        <div ref={detailRef} className="min-w-0 flex-[999_1_520px] scroll-mt-20">
          {selected && <ApplicationDetail key={selected.app.id} app={selected.app} profile={profile} />}
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-1">
            <h1 className="m-0 text-[28px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>Applications</span>
            </h1>
            <p className={`m-0 text-[15.5px] ${MUTED}`}>Where each application stands, and what happens next.</p>
          </div>
          {applications.length > 0 && (
            <div role="group" aria-label="Show" className="flex rounded-[12px] bg-[#DCE4FB] p-1">
              {GROUPS.map((item) => {
                const on = item.id === group;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setView((prev) => ({ ...prev, group: item.id, stage: 'ALL' }))}
                    className={`h-10 rounded-[9px] px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${on ? 'bg-white text-[#0B3FA8] shadow-[0_2px_6px_rgba(14,27,61,0.18)]' : 'text-[#1B2B55] hover:bg-white/50'}`}
                  >
                    {item.label} · {groupCounts[item.id]}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {error && applications.length > 0 && <ErrorBanner message={error} />}

        {applications.length > 0 && (
          <div role="group" aria-label="Filter by stage" className="flex flex-wrap gap-2">
            {STAGE_FILTERS[group].map((id) => {
              const on = id === stage;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setView((prev) => ({ ...prev, stage: id }))}
                  className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14.5px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6] ${
                    on ? 'border-transparent bg-[linear-gradient(135deg,#0E1B3D_0%,#1E3A8A_60%,#5B3FD0_100%)] text-white shadow-[0_8px_18px_-10px_rgba(30,58,138,0.9)]' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'
                  }`}
                >
                  {filterLabel(id)}
                  <span className={`min-w-[22px] rounded-full px-1.5 text-center text-[12px] font-bold ${on ? 'bg-white/20 text-white' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>{stageCount(id)}</span>
                </button>
              );
            })}
          </div>
        )}

        {body}
      </div>
    </div>
  );
}
