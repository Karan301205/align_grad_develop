import { CARD, MUTED } from '../../components/accountStyles';
import { barLabels, closingInfo, jobCounts, jobMetaLine, jobTab } from '../jobsData';
import JobActionsMenu from './JobActionsMenu';

const SOFT_BUTTON =
  'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[8px] border border-[#BFE0D8] bg-[#E3F1EE] px-3.5 font-(family-name:--font-headline) text-sm font-semibold text-[#0F7A55] transition-colors hover:bg-[#D3E8E3] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]';

const VISIBLE_BARS = 3; // skill chips shown on a card; the rest are in the job details drawer

function Stat({ label, value, first }) {
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 px-3 py-2.5 ${first ? '' : 'border-l border-[#EEF0F3]'}`}>
      <span className={`text-xs font-bold ${MUTED}`}>{label}</span>
      <span className="text-xl font-bold leading-tight tabular-nums">{value}</span>
    </div>
  );
}

function PoolLine({ pool }) {
  if (pool.status === 'none') return <span className={MUTED}>No skill bars on this job</span>;
  if (pool.status === 'loading') return <span className={MUTED}>Counting candidates who meet your bars…</span>;
  if (pool.status === 'error') {
    return (
      <span role="alert" className="text-[13px] text-[#B91C1C]">
        Couldn’t count candidates. {pool.error}
      </span>
    );
  }
  return (
    <span className="text-[#334155]" title={`${pool.eligible.toLocaleString('en-IN')} of ${pool.total.toLocaleString('en-IN')} candidates on AlignGrad`}>
      <strong className="font-bold">{pool.eligible.toLocaleString('en-IN')}</strong> candidate{pool.eligible === 1 ? '' : 's'} meet{pool.eligible === 1 ? 's' : ''} your bars
    </span>
  );
}

/**
 * One job on the Jobs page (design: design/jobs_recruiter/Jobs — all postings-html):
 * title, details and bars; applied / shortlisted / interview / hired; how many
 * candidates meet the bars; when it closes; the main action and the "⋯" menu.
 */
export default function JobCard({ job, pool, busy, onReview, onTogglePause, onEdit, onDetails, onCopyLink, onDelete }) {
  const counts = jobCounts(job);
  const closing = closingInfo(job);
  const bars = barLabels(job);
  const tab = jobTab(job);
  const paused = tab === 'paused';
  const openings = Number(job.openings) || 0;
  const titleId = `job-title-${job.id}`;

  // The main button is "Resume job" for paused jobs, so the menu offers their applicants instead.
  const menu = [
    paused && { id: 'review', label: 'Review applicants', onSelect: onReview },
    tab === 'active' && { id: 'pause', label: 'Pause job', onSelect: onTogglePause },
    { id: 'details', label: 'View job details', onSelect: onDetails },
    { id: 'edit', label: 'Edit job', onSelect: onEdit },
    { id: 'copy', label: 'Copy job link', onSelect: onCopyLink },
    { id: 'delete', label: 'Delete job', onSelect: onDelete, danger: true }
  ].filter(Boolean);

  return (
    <article aria-labelledby={titleId} className={`${CARD} flex flex-wrap items-center gap-x-7 gap-y-5 p-5`}>
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={titleId} className="m-0 min-w-0 text-[17px] leading-snug">
            <button
              type="button"
              onClick={onDetails}
              title="View job details"
              className="rounded-[4px] text-left font-semibold text-[#023836] hover:text-[#0F7A55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]"
            >
              {job.title}
            </button>
          </h2>
          {counts.newApplicants > 0 && (
            <span title="Applied in the last 7 days" className="rounded-full bg-[#023836] px-2 py-0.5 text-xs font-semibold text-white">
              {counts.newApplicants} new
            </span>
          )}
          {paused && <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E]">Paused</span>}
          {job.edited && <span className="rounded-full bg-[#F1F3F6] px-2 py-0.5 text-xs font-medium text-[#334155]">Details updated</span>}
        </div>
        <span className={MUTED}>{jobMetaLine(job)}</span>
        {bars.length > 0 && (
          <ul aria-label="Skill bars" className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
            {bars.slice(0, VISIBLE_BARS).map((bar) => (
              <li key={bar} className="rounded-[6px] bg-[#F1F3F6] px-2 py-[3px] text-xs font-medium text-[#334155]">
                {bar}
              </li>
            ))}
            {bars.length > VISIBLE_BARS && (
              <li>
                <button type="button" onClick={onDetails} className="rounded-[4px] px-1 text-xs font-semibold text-[#0F7A55] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]">
                  +{bars.length - VISIBLE_BARS} more · View details
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="grid min-w-0 flex-[1_1_360px] grid-cols-4 rounded-[10px] border border-[#EEF0F3]">
        <Stat first label="Applied" value={counts.applied} />
        <Stat label="Shortlisted" value={counts.shortlisted} />
        <Stat label="Interview" value={counts.interviews} />
        <Stat label="Hired" value={openings ? `${counts.hires} of ${openings}` : counts.hires} />
      </div>

      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5">
        <PoolLine pool={pool} />
        {closing.tone === 'warn' ? (
          <span className="self-start rounded-full bg-[#FFF1E8] px-2.5 py-[3px] text-[13px] font-semibold text-[#9A3412]">{closing.text}</span>
        ) : (
          <span className={`text-[13px] ${MUTED}`}>{closing.text}</span>
        )}
        <div className="flex gap-2">
          {paused ? (
            <button type="button" onClick={onTogglePause} disabled={busy} className={SOFT_BUTTON}>
              Resume job
            </button>
          ) : (
            <button type="button" onClick={onReview} className={SOFT_BUTTON}>
              Review applicants
            </button>
          )}
          <JobActionsMenu label={`More actions for ${job.title}`} items={menu} />
        </div>
      </div>
    </article>
  );
}
