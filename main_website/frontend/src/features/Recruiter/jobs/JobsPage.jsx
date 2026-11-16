import { useMemo, useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import JobDetailsDrawer from './components/JobDetailsDrawer';
import EditJobModal from '../components/EditJobModal';
import AccountIcon from '../components/AccountIcon';
import { SelectControl } from '../components/AccountControls';
import { ACCOUNT_PAGE, CARD, LINK, MUTED, PAGE_TITLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/accountStyles';
import useJobCredits from '../postJob/useJobCredits';
import { JOB_SORTS, copyText, isPaused, jobLink, jobMatchesQuery, jobTab, sortJobs } from './jobsData';
import useJobPools from './useJobPools';
import JobCard from './components/JobCard';
import { ConfirmDialog } from './components/Dialog';

const TABS = [
  ['active', 'Active'],
  ['paused', 'Paused'],
  ['closed', 'Closed']
];

function Credits({ credits, onBuy }) {
  const buy = (
    <button type="button" onClick={onBuy} className={LINK}>
      Buy more
    </button>
  );
  if (credits.loading && !credits.quota) return <span className={MUTED}>Checking job credits…</span>;
  if (credits.error) {
    return (
      <span className="text-[#B91C1C]" role="alert">
        Couldn’t load job credits. {credits.error} ·{' '}
        <button type="button" onClick={credits.reload} className={LINK}>
          Try again
        </button>
      </span>
    );
  }
  const left = credits.quota?.remainingJobs ?? 0;
  return (
    <span className={MUTED}>
      {left} job credit{left === 1 ? '' : 's'} left · {buy}
    </span>
  );
}

/**
 * Jobs (design: design/jobs_recruiter/Jobs — all postings-html). Every job the
 * company posted, split into Active / Paused (and Closed, which only older data
 * has), with search, sort, per-job pipeline counts and how many candidates meet
 * the bars. Edit, pause/resume, copy link, details and delete work as before;
 * "Review applicants" opens the Applications view for that job.
 */
export default function JobsPage({ jobs = [], loadError, token, goToTab, onViewApplications, handleUpdateJob, handleDeleteJob, handleTogglePauseJob, onRefresh, setAlertConfig }) {
  const credits = useJobCredits(token);
  const [tab, setTab] = useState('active');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('closing');
  const [detailsJob, setDetailsJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'delete' | 'pause', job }
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const counts = useMemo(() => {
    const result = { active: 0, paused: 0, closed: 0 };
    jobs.forEach((job) => {
      result[jobTab(job)] += 1;
    });
    return result;
  }, [jobs]);
  // "Closed" only shows when older data has such jobs; the portal itself can't close one.
  const tabs = TABS.filter(([id]) => id !== 'closed' || counts.closed > 0);
  const currentTab = tabs.some(([id]) => id === tab) ? tab : 'active';

  const visible = useMemo(
    () => sortJobs(jobs.filter((job) => jobTab(job) === currentTab && jobMatchesQuery(job, query)), sort),
    [jobs, currentTab, query, sort]
  );
  const pools = useJobPools(visible, token);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([onRefresh(), credits.reload()]);
    } finally {
      setRefreshing(false);
    }
  };

  const copyLink = async (job) => {
    const ok = await copyText(jobLink(job));
    setAlertConfig(
      ok
        ? { message: `Link to “${job.title}” copied. Candidates can open it to see the job and apply.`, type: 'success' }
        : { message: `Your browser blocked copying. The link is ${jobLink(job)}`, type: 'error' }
    );
  };

  const runConfirm = async () => {
    const { kind, job } = confirm;
    setBusy(true);
    // The layout shows the result (and the server's error) as a toast.
    const ok = kind === 'delete' ? await handleDeleteJob(job.id) : await handleTogglePauseJob(job.id, isPaused(job));
    setBusy(false);
    if (!ok) return;
    setConfirm(null);
    // Credits are counted from the jobs that exist, so a delete frees one.
    if (kind === 'delete') credits.reload();
  };

  const emptyText = query
    ? `No ${currentTab} jobs match “${query.trim()}”.`
    : currentTab === 'paused'
      ? 'No paused jobs. Pausing a job hides it from candidates without losing its applicants.'
      : currentTab === 'closed'
        ? 'No closed jobs.'
        : 'No active jobs right now.';

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[22px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className={PAGE_TITLE}>
              <span className="font-bold">Jobs</span>
            </h1>
            <p className={`m-0 text-[15px] ${MUTED}`}>Every job, its applicants and how many candidates meet your bars.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Credits credits={credits} onBuy={() => goToTab('billing')} />
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh jobs" title="Refresh jobs" className={`${SECONDARY_BUTTON} size-11`}>
              <RefreshCw className={`size-[18px] ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => goToTab('post-job')} className={`${PRIMARY_BUTTON} h-11 px-[18px]`}>
              <AccountIcon name="plus" size={18} strokeWidth={2} />
              Post a job
            </button>
          </div>
        </header>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#991B1B]">
            <span>Couldn’t load your jobs. {loadError}</span>
            <button type="button" onClick={refresh} disabled={refreshing} className={`${SECONDARY_BUTTON} h-9 px-3`}>
              Try again
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E6EA]">
          <div role="tablist" aria-label="Job status" className="flex flex-wrap gap-1">
            {tabs.map(([id, label]) => {
              const selected = currentTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(id)}
                  className={`-mb-px h-11 border-b-2 px-3.5 font-(family-name:--font-headline) text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0F7A55] ${
                    selected ? 'border-[#0F7A55] text-[#0F7A55]' : 'border-transparent text-[#334155] hover:text-[#023836]'
                  }`}
                >
                  {label} <span className="font-medium text-[#4B5563]">{counts[id]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 pb-2">
            <label className={`flex h-10 items-center gap-2 rounded-[8px] border border-[#E4E6EA] bg-white px-3 focus-within:border-[#0F7A55] focus-within:ring-2 focus-within:ring-[#0F7A55]/20 ${MUTED}`}>
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search jobs"
                placeholder="Search jobs"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-full w-40 min-w-0 border-0 bg-transparent text-sm text-[#023836] placeholder:text-[#6B7280] focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-[4px] p-0.5 hover:text-[#023836]">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <div className="flex h-10 items-center gap-2 rounded-[8px] border border-[#E4E6EA] bg-white pl-3 pr-2 focus-within:border-[#0F7A55]">
              <span id="jobs-sort-label" className={MUTED}>
                Sort
              </span>
              <SelectControl bare aria-labelledby="jobs-sort-label" value={sort} onChange={setSort} options={JOB_SORTS} className="w-[172px]" menuMinWidth={200} />
            </div>
          </div>
        </div>

        {jobs.length === 0 && !loadError ? (
          <div className={`${CARD} flex flex-col items-center gap-2 px-6 py-14 text-center`}>
            <span className="flex size-14 items-center justify-center rounded-[16px] bg-[#E3F1EE] text-[#0F7A55]">
              <AccountIcon name="plus" size={24} strokeWidth={2} />
            </span>
            <h2 className="m-0 text-base">
              <span className="font-bold">You haven’t posted a job yet</span>
            </h2>
            <p className={`m-0 max-w-[420px] ${MUTED}`}>Post a job with skill bars, and candidates who meet them can apply.</p>
            <button type="button" onClick={() => goToTab('post-job')} className={`${PRIMARY_BUTTON} mt-2 h-10 px-4`}>
              Post a job
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className={`${CARD} flex flex-col items-center gap-3 px-6 py-10 text-center`}>
            <p className={`m-0 ${MUTED}`}>{emptyText}</p>
            {query && (
              <button type="button" onClick={() => setQuery('')} className={LINK}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {visible.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                pool={pools[job.id]}
                busy={busy && confirm?.job.id === job.id}
                onReview={() => onViewApplications(job)}
                onTogglePause={() => setConfirm({ kind: 'pause', job })}
                onEdit={() => setEditingJob(job)}
                onDetails={() => setDetailsJob(job)}
                onCopyLink={() => copyLink(job)}
                onDelete={() => setConfirm({ kind: 'delete', job })}
              />
            ))}
          </div>
        )}
      </div>

      {detailsJob && <JobDetailsDrawer job={detailsJob} onClose={() => setDetailsJob(null)} />}
      {editingJob && <EditJobModal job={editingJob} onClose={() => setEditingJob(null)} onUpdate={handleUpdateJob} />}

      {confirm?.kind === 'delete' && (
        <ConfirmDialog title="Delete this job?" tone="danger" confirmLabel="Delete job" busyLabel="Deleting…" busy={busy} onConfirm={runConfirm} onClose={() => setConfirm(null)}>
          <p className="m-0">
            <strong className="font-semibold">{confirm.job.title}</strong> and its {confirm.job.applications?.length || 0} application
            {(confirm.job.applications?.length || 0) === 1 ? '' : 's'} will be deleted, with their review progress and interview rounds.
          </p>
          <p className={`m-0 ${MUTED}`}>This can’t be undone.</p>
        </ConfirmDialog>
      )}

      {confirm?.kind === 'pause' && (
        <ConfirmDialog
          title={isPaused(confirm.job) ? 'Resume this job?' : 'Pause this job?'}
          confirmLabel={isPaused(confirm.job) ? 'Resume job' : 'Pause job'}
          busyLabel={isPaused(confirm.job) ? 'Resuming…' : 'Pausing…'}
          busy={busy}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        >
          <p className="m-0">
            <strong className="font-semibold">{confirm.job.title}</strong>{' '}
            {isPaused(confirm.job)
              ? 'will show to candidates who meet its bars again.'
              : 'will stop showing to candidates. Its applicants, their progress and the skill bars stay as they are.'}
          </p>
          <p className={`m-0 ${MUTED}`}>Pausing doesn’t stop the clock: the job is still removed when its listing period ends.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
