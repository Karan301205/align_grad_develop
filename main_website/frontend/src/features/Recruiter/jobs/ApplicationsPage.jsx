import { useMemo, useState } from 'react';
import { ArrowLeft, Download, RefreshCw, Search, Users, X } from 'lucide-react';
import ResumePdfTemplate from '../../../components/ResumePdfTemplate';
import { openResumePdfInNewTab } from '../../../services/resumePdf';
import CandidateProfileModal from '../components/CandidateProfileModal';
import { SelectControl } from '../components/AccountControls';
import { ACCOUNT_PAGE, LINK, MUTED, PAGE_TITLE, SECONDARY_BUTTON } from '../components/accountStyles';
import { externalResumeUrl } from '../candidates/candidateData';
import {
  APPLICATION_SORTS,
  MATCH_FILTERS,
  PAGE_SIZES,
  STAGES,
  applicationRows,
  applicationsCsv,
  averageMatch,
  copyText,
  downloadText,
  filterRows,
  jobLink,
  safeFileName,
  sortRows,
  stageCounts,
  typeLabel
} from './jobsData';
import ApplicationKpis from './components/ApplicationKpis';
import ApplicationsTable from './components/ApplicationsTable';
import ManageApplicationModal from './components/ManageApplicationModal';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';
const resumeElementId = (row) => `applications-resume-${row.app.id}`;

function EmptyState({ title, text, children }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center whitespace-normal">
      <span className="mb-1.5 flex size-14 items-center justify-center rounded-[16px] bg-[#EEF2FE] text-[#1447E6]">
        <Users className="size-6" aria-hidden="true" />
      </span>
      <h3 className="m-0 text-base">
        <span className="font-bold">{title}</span>
      </h3>
      <p className={`m-0 max-w-[420px] ${MUTED}`}>{text}</p>
      {children && <div className="mt-2.5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * Candidate applications (design: design/jobs_recruiter/candidate-applications.html)
 * for one job, or every job. Keeps what the previous page did: job switcher,
 * stage tabs, search, match filter, sort, CSV export, resume, profile, and the
 * Manage panel for status, rounds and feedback. Data: the layout's jobs
 * (GET /recruiter/jobs, with applications and each candidate's profile).
 */
export default function ApplicationsPage({ job: initialJob = null, jobs = [], loadError, token, onBack, onRefresh, setAlertConfig }) {
  const [jobId, setJobId] = useState(initialJob?.id || 'ALL');
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('ALL');
  const [match, setMatch] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [profile, setProfile] = useState(null); // { candidate, job }
  const [managingId, setManagingId] = useState(null);
  const [resumeBusyId, setResumeBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const job = jobId === 'ALL' ? null : jobs.find((item) => item.id === jobId) || null;
  const missingJob = jobId !== 'ALL' && !job;

  const rows = useMemo(() => applicationRows(jobs, jobId), [jobs, jobId]);
  const counts = useMemo(() => stageCounts(rows), [rows]);
  const filtered = useMemo(() => sortRows(filterRows(rows, { query, stage, match }), sortBy), [rows, query, stage, match, sortBy]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const filtersOn = Boolean(query.trim()) || stage !== 'ALL' || match !== 'ALL';
  // Found again after every refresh, so the panel always shows the saved data.
  const managing = managingId ? rows.find((row) => row.app.id === managingId) || null : null;

  // Any change to what is listed starts again at page 1.
  const update = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const resetFilters = () => {
    setQuery('');
    setStage('ALL');
    setMatch('ALL');
    setPage(1);
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const exportCsv = () => {
    const name = job ? safeFileName(job.title) : 'All_jobs';
    downloadText(applicationsCsv(filtered), `AlignGrad_Applications_${name}_${new Date().toISOString().slice(0, 10)}.csv`);
    setAlertConfig({ message: `Exported ${filtered.length} application${filtered.length === 1 ? '' : 's'} to CSV.`, type: 'success' });
  };

  const copyLink = async () => {
    const ok = await copyText(jobLink(job));
    setAlertConfig(ok ? { message: 'Job link copied. Share it to start receiving applications.', type: 'success' } : { message: `Your browser blocked copying. The link is ${jobLink(job)}`, type: 'error' });
  };

  // Drive/Docs/Dropbox links open as they are; otherwise the standard resume is built
  // from the profile (the layouts for the rows on this page are rendered below).
  const openResume = async (row) => {
    const external = externalResumeUrl(row.student);
    if (external) {
      window.open(external, '_blank', 'noopener,noreferrer');
      return;
    }
    const element = document.getElementById(resumeElementId(row));
    if (!element) {
      setAlertConfig({ message: 'The resume is still being prepared. Please try again in a moment.', type: 'warning' });
      return;
    }
    setResumeBusyId(row.app.id);
    try {
      await openResumePdfInNewTab(element, `${row.student?.name || 'Candidate'}_Resume`);
    } catch (err) {
      console.error('[resume] Could not open the resume PDF:', err);
      setAlertConfig({ message: 'Couldn’t open the resume. Allow pop-ups for AlignGrad and try again.', type: 'error' });
    } finally {
      setResumeBusyId(null);
    }
  };

  const onSaved = async (message) => {
    await onRefresh();
    setManagingId(null);
    setAlertConfig({ message, type: 'success' });
  };

  const jobOptions = [
    ['ALL', `All jobs (${jobs.reduce((sum, item) => sum + (item.applications?.length || 0), 0)} applicants)`],
    ...jobs.map((item) => [item.id, `${item.title} (${item.applications?.length || 0} applicant${item.applications?.length === 1 ? '' : 's'})`])
  ];

  const tabs = [['ALL', 'All candidates'], ...STAGES.map(([id, label]) => [id, id === 'INTERVIEW' ? 'Interviews' : id === 'HIRED' ? 'Hires' : label])];

  let empty;
  if (missingJob) {
    empty = (
      <EmptyState title="This job is no longer in your list" text="It may have been deleted, or its listing period ended and it was removed.">
        <button type="button" onClick={() => update(setJobId)('ALL')} className={`${SECONDARY_BUTTON} h-8 px-3 text-[12.5px]`}>
          Show all applications
        </button>
      </EmptyState>
    );
  } else if (rows.length === 0) {
    empty = (
      <EmptyState
        title="No candidate applications yet"
        text={job ? 'Candidates who apply for this job will appear here. Share the job link to start receiving applications.' : 'Candidates who apply for your jobs will appear here.'}
      >
        {job && (
          <button type="button" onClick={copyLink} className={`h-8 rounded-[8px] border border-[#C7D3FB] bg-[#EEF2FE] px-3 text-[12.5px] font-semibold text-[#1447E6] hover:bg-[#E0E8FD] ${FOCUS}`}>
            Copy job link
          </button>
        )}
      </EmptyState>
    );
  } else {
    empty = (
      <EmptyState title="No applications match these filters" text="Try a different search, stage or match range.">
        <button type="button" onClick={resetFilters} className={`${SECONDARY_BUTTON} h-8 px-3 text-[12.5px]`}>
          Reset filters
        </button>
      </EmptyState>
    );
  }

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-3.5">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to jobs"
              className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-[#E4E6EA] bg-white text-[#0F172A] hover:bg-[#F8F8F6] ${FOCUS}`}
            >
              <ArrowLeft className="size-[18px]" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-[13px] ${MUTED}`}>
                <button type="button" onClick={onBack} className={LINK}>
                  Active jobs
                </button>
                <span aria-hidden="true" className="text-[#9CA3AF]">
                  /
                </span>
                <span className="max-w-[320px] truncate">{job ? job.title : 'All jobs'}</span>
                <span aria-hidden="true" className="text-[#9CA3AF]">
                  /
                </span>
                <span aria-current="page" className="font-semibold text-[#1447E6]">
                  Applications
                </span>
              </nav>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <h1 className={PAGE_TITLE}>
                  <span className="font-bold">Candidate applications</span>
                </h1>
                {job && <span className="inline-flex h-6 items-center rounded-full bg-[#EEF2FE] px-2.5 text-xs font-semibold text-[#1447E6]">{typeLabel(job)}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span id="job-switch-label" className={`text-[13px] font-medium ${MUTED}`}>
              Job
            </span>
            <SelectControl aria-labelledby="job-switch-label" className="w-[280px] max-w-full" menuMinWidth={300} value={jobId} onChange={update(setJobId)} options={jobOptions} />
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Refresh applications" title="Refresh applications" className={`${SECONDARY_BUTTON} size-11`}>
              <RefreshCw className={`size-[18px] ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </header>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[#991B1B]">
            <span>Couldn’t load your jobs and applications. {loadError}</span>
            <button type="button" onClick={refresh} disabled={refreshing} className={`${SECONDARY_BUTTON} h-9 px-3`}>
              Try again
            </button>
          </div>
        )}

        <ApplicationKpis counts={counts} average={averageMatch(rows)} allJobs={!job} hasBars={job ? (job.requirements || []).length > 0 : jobs.some((item) => (item.requirements || []).length > 0)} />

        <section aria-label="Filters" className="flex flex-col gap-3.5 rounded-[12px] border border-[#E4E6EA] bg-white px-[18px] py-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className={`flex h-11 min-w-0 flex-[1_1_360px] items-center gap-2.5 rounded-[8px] border border-[#E4E6EA] bg-[#F8F8F6] px-3.5 focus-within:border-[#1447E6] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${MUTED}`}>
              <Search className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="sr-only">Search applicants</span>
              <input
                type="search"
                value={query}
                onChange={(event) => update(setQuery)(event.target.value)}
                placeholder="Search by name, username, title, email, phone or skill"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => update(setQuery)('')} aria-label="Clear search" className="rounded-[4px] p-0.5 hover:text-[#0F172A]">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <SelectControl aria-label="Match score" className="w-[170px]" value={match} onChange={update(setMatch)} options={MATCH_FILTERS} />
            <SelectControl aria-label="Sort applicants" className="w-[210px]" value={sortBy} onChange={update(setSortBy)} options={APPLICATION_SORTS} />
            <button type="button" onClick={exportCsv} disabled={filtered.length === 0} className={`${SECONDARY_BUTTON} h-11 px-4`} title="Download the applications listed below as a CSV file">
              <Download className="size-[18px]" aria-hidden="true" />
              Export CSV
            </button>
          </div>
          <div role="tablist" aria-label="Application status" className="flex flex-wrap items-center gap-1.5 border-t border-[#EEF0F3] pt-3.5">
            {tabs.map(([id, label]) => {
              const selected = stage === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => update(setStage)(id)}
                  className={`inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 font-(family-name:--font-headline) text-[13px] font-semibold transition-colors ${FOCUS} ${
                    selected ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#E4E6EA] bg-white text-[#334155] hover:bg-[#F8F8F6]'
                  }`}
                >
                  {label}
                  <span className={`grid h-5 min-w-6 place-items-center rounded-full px-1.5 text-xs ${selected ? 'bg-white/20 text-white' : 'bg-[#F1F3F6] text-[#4B5563]'}`}>{counts[id]}</span>
                </button>
              );
            })}
            {filtersOn && (
              <button type="button" onClick={resetFilters} className={`ml-auto text-[13px] ${LINK}`}>
                Reset filters
              </button>
            )}
          </div>
        </section>

        <ApplicationsTable
          rows={missingJob ? [] : pageRows}
          total={missingJob ? 0 : filtered.length}
          page={currentPage}
          pages={pages}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={update(setPageSize)}
          sortBy={sortBy}
          onSort={update(setSortBy)}
          showJob={!job}
          resumeBusyId={resumeBusyId}
          onProfile={(row) => setProfile({ candidate: row.student, job: row.job })}
          onManage={(row) => setManagingId(row.app.id)}
          onResume={openResume}
          empty={empty}
        />
      </div>

      {/* Off-screen resume layouts for the rows on this page, so Resume can open a PDF straight away. */}
      <div aria-hidden="true" style={{ position: 'fixed', left: '-10000px', top: 0, width: '210mm' }}>
        {pageRows
          .filter((row) => row.student && !externalResumeUrl(row.student))
          .map((row) => (
            <ResumePdfTemplate key={row.app.id} id={resumeElementId(row)} candidate={row.student} />
          ))}
      </div>

      <CandidateProfileModal candidate={profile?.candidate || null} job={profile?.job || null} onClose={() => setProfile(null)} />

      {managing && <ManageApplicationModal key={managing.app.id} row={managing} token={token} onClose={() => setManagingId(null)} onSaved={onSaved} />}
    </div>
  );
}
