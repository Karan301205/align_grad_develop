import { useState } from 'react';
import { Briefcase, User, ShieldCheck, FileText, RefreshCw, X, Pencil, Trash2, PauseCircle, PlayCircle, AlertTriangle, Share2, Check } from 'lucide-react';
import JobDetailsModal from '../../../components/JobDetailsModal';
import EditJobModal from './EditJobModal';
import EmptyState from '../../../components/ui/EmptyState';
import { apiFetch } from '../../../services/apiClient';
import CandidateProfileModal from './CandidateProfileModal';

export default function RecruiterJobs({ jobs = [], company, handleUpdateJob, handleDeleteJob, handleTogglePauseJob, onRefresh, token }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [managingApp, setManagingApp] = useState(null);
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [jobToTogglePause, setJobToTogglePause] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState(null);

  const handleShareJob = (jobId) => {
    const url = `${window.location.origin}/job_brief?id=${jobId}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedJobId(jobId);
    setTimeout(() => {
      setCopiedJobId(prev => (prev === jobId ? null : prev));
    }, 2000);
  };

  const totalApplicants = jobs.reduce((acc, job) => acc + (job.applications?.length || 0), 0);
  const activeRolesCount = jobs.filter(j => j.status !== 'PAUSED' && !j.isPaused).length;
  const pausedRolesCount = jobs.filter(j => j.status === 'PAUSED' || j.isPaused).length;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsRefreshing(false);
  };

  const getRemainingDays = (createdAt, activeDays) => {
    const expiryTime = new Date(createdAt).getTime() + (activeDays || 30) * 24 * 60 * 60 * 1000;
    // eslint-disable-next-line react-hooks/purity
    const remainingMs = expiryTime - Date.now();
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return Math.max(0, remainingDays);
  };

  const [viewSection, setViewSection] = useState('both');

  const sortedAllJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedPausedJobs = sortedAllJobs.filter(j => j.status === 'PAUSED' || Boolean(j.isPaused));

  const renderJobRow = (job) => {
    const isPaused = job.status === 'PAUSED' || Boolean(job.isPaused);
    return (
      <div
        key={job.id}
        className="p-5 sm:p-6 space-y-4 hover:bg-[#F3F9FF] dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            {/* Title & Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4
                onClick={() => setSelectedJob(job)}
                className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer transition-colors tracking-tight"
              >
                {job.title}
              </h4>

              <span
                className={`px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none ${
                  job.opportunityType === 'INTERNSHIP'
                    ? 'bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200'
                    : 'bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200'
                }`}
              >
                {job.opportunityType === 'INTERNSHIP' ? 'Internship' : 'Full-Time Role'}
              </span>

              {/* Paused vs Live Status Indicator */}
              {isPaused ? (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 text-[10px] font-headline font-bold tracking-wider rounded-none flex items-center gap-1">
                  <PauseCircle className="w-3 h-3" />
                  <span>Paused</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 text-[10px] font-headline font-bold tracking-wider rounded-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-600 dark:bg-emerald-400 inline-block animate-pulse" />
                  <span>Live</span>
                </span>
              )}
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {/* Pause/Resume button */}
              <button
                type="button"
                onClick={() => setJobToTogglePause(job)}
                className={`p-1.5 rounded-none border transition-all cursor-pointer hover:scale-105 shadow-2xs ${
                  isPaused
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                }`}
                title={isPaused ? "Resume Job" : "Pause Job"}
              >
                {isPaused ? (
                  <PlayCircle className="w-5 h-5" />
                ) : (
                  <PauseCircle className="w-5 h-5" />
                )}
              </button>

              {/* Edit Role Details with Icon */}
              <button
                type="button"
                onClick={() => setEditingJob(job)}
                className="p-1.5 rounded-none border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                title="Edit Role Details"
              >
                <Pencil className="w-5 h-5" />
              </button>

              {/* Remove Manually with Icon */}
              <button
                type="button"
                onClick={() => setJobToDelete(job)}
                className="p-1.5 rounded-none border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                title="Remove Manually"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              {/* Share Job Link */}
              <button
                type="button"
                onClick={() => handleShareJob(job.id)}
                className="p-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-400 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                title={copiedJobId === job.id ? "Link Copied!" : "Share Job"}
              >
                {copiedJobId === job.id ? (
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Job Description (Darker Shade for Maximum Readability) */}
            <p className="text-xs sm:text-sm font-sans font-medium text-slate-800 dark:text-slate-200 leading-relaxed max-w-4xl">
              {job.description}
            </p>
          </div>

          {/* Right-aligned Metadata & Detail Updated Badge Container */}
          <div className="flex items-center gap-2 shrink-0 self-start flex-wrap sm:flex-nowrap justify-end">
            {/* Detail Updated Tag with Blinking Effect */}
            {job.edited && (
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 text-[10px] sm:text-[11px] font-headline font-bold tracking-wider rounded-none shadow-2xs animate-blink flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-none bg-emerald-600 dark:bg-emerald-400 inline-block" />
                <span>Detail Updated</span>
              </span>
            )}

            {/* Metadata Badge */}
            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-headline font-bold text-slate-800 dark:text-slate-200 shrink-0 shadow-2xs flex items-center gap-2">
              <span>{job.applications?.length || 0} applications</span>
              <span className="text-slate-400 dark:text-slate-600 select-none">•</span>
              <span className="text-slate-700 dark:text-slate-300">{getRemainingDays(job.createdAt, job.activeDays)} days left</span>
            </div>

            {/* Quick Share Button */}
            <button
              type="button"
              onClick={() => handleShareJob(job.id)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-700 text-slate-800 dark:text-slate-200 rounded-none text-xs font-headline font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Copy shareable link"
            >
              {copiedJobId === job.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Applicants Banner within Job Row */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-none flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300">
                Applicants
              </span>
              <span
                className={`w-2 h-2 rounded-none inline-block ${
                  job.applications?.length ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
              />
            </div>
            <p className="text-xs text-slate-900 dark:text-slate-100 font-sans font-semibold mt-0.5">
              {(!job.applications || job.applications.length === 0)
                ? 'No candidates have applied yet.'
                : `${job.applications.length} candidate(s) applied for this role`}
            </p>
          </div>

          {job.applications && job.applications.length > 0 && (
            <button
              type="button"
              onClick={() => setViewingApplicantsJob(job)}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white border border-blue-800 rounded-none text-xs font-headline font-bold tracking-wide transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>View Applicants ({job.applications.length})</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-left">
        {/* Executive Header */}
        <header className="bg-surface border border-slate-300 dark:border-slate-700 p-5 sm:p-6 rounded-none shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-2">
              <Briefcase className="w-3 h-3" />
              <span>Enterprise Job Operations</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Enterprise Job Dashboard
            </h2>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-sans font-medium mt-1">
              Manage posted roles, monitor candidate applications, and review skill alignment scores.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-none text-xs font-headline font-bold shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        </header>

        {/* Metrics Row (Sharp Corner Bento Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Active Roles Metric */}
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 sm:p-6 shadow-2xs transition-all border-t-4 border-t-blue-700 relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded-none flex items-center justify-center shadow-2xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200">
                Live Postings
              </span>
            </div>
            <p className="text-xs font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Active Roles
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-900 dark:text-slate-100">
                {activeRolesCount}
              </p>
              <span className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">
                roles open {pausedRolesCount > 0 && `(${pausedRolesCount} paused)`}
              </span>
            </div>
            <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400 mt-2">
              Positions currently open and actively matching candidates
            </p>
          </div>

          {/* Total Applicants Metric */}
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 sm:p-6 shadow-2xs transition-all border-t-4 border-t-emerald-600 relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-none flex items-center justify-center shadow-2xs">
                <User className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200">
                Candidate Pool
              </span>
            </div>
            <p className="text-xs font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Total Applicants
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-900 dark:text-slate-100">
                {totalApplicants}
              </p>
              <span className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400">candidates</span>
            </div>
            <p className="text-xs font-sans font-medium text-slate-600 dark:text-slate-400 mt-2">
              Verified candidate applications submitted across all roles
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300 dark:border-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Posted Roles
            </h3>
            <span className="px-2 py-0.5 text-xs font-headline font-bold rounded-none bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
              {jobs.length} total
            </span>
            {pausedRolesCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-headline font-bold rounded-none bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {pausedRolesCount} paused
              </span>
            )}
          </div>

          {/* Segmented View Switcher */}
          <div className="inline-flex items-center border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-none self-start sm:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setViewSection('both')}
              className={`px-3 py-1 text-xs font-headline font-bold transition-all cursor-pointer rounded-none ${
                viewSection === 'both'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-300 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Both Sections
            </button>
            <button
              type="button"
              onClick={() => setViewSection('all')}
              className={`px-3 py-1 text-xs font-headline font-bold transition-all cursor-pointer rounded-none ${
                viewSection === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs border border-slate-300 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setViewSection('paused')}
              className={`px-3 py-1 text-xs font-headline font-bold transition-all cursor-pointer rounded-none ${
                viewSection === 'paused'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 shadow-2xs border border-amber-300 dark:border-amber-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Paused Jobs ({pausedRolesCount})
            </button>
          </div>
        </div>

        {/* 2 Distinct Sections Below Posted Roles */}
        <div className="space-y-8">
          {/* Section 1: All Jobs */}
          {(viewSection === 'both' || viewSection === 'all') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-none inline-block" />
                  <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    All Jobs
                  </h4>
                  <span className="px-2 py-0.5 text-xs font-headline font-bold rounded-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                    {sortedAllJobs.length} roles
                  </span>
                </div>
              </div>

              {sortedAllJobs.length === 0 ? (
                <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-10 text-center shadow-2xs">
                  <EmptyState
                    icon={Briefcase}
                    title="No jobs posted yet"
                    description="Click 'Post New Job' in the sidebar to start matching with candidates."
                  />
                </div>
              ) : (
                <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
                  {sortedAllJobs.map(renderJobRow)}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Paused Jobs */}
          {(viewSection === 'both' || viewSection === 'paused') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-amber-500 dark:bg-amber-400 rounded-none inline-block" />
                  <h4 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                    <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Paused Jobs</span>
                  </h4>
                  <span className="px-2 py-0.5 text-xs font-headline font-bold rounded-none bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    {sortedPausedJobs.length} paused
                  </span>
                </div>
              </div>

              {sortedPausedJobs.length === 0 ? (
                <div className="bg-surface border border-dashed border-slate-300 dark:border-slate-700 rounded-none p-8 text-center shadow-2xs">
                  <div className="w-10 h-10 mx-auto mb-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-none flex items-center justify-center">
                    <PauseCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-headline font-bold text-slate-800 dark:text-slate-200">
                    No Paused Jobs
                  </p>
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    All your postings are currently live and visible to candidates. Use the "Pause Job" action on any role to pause applications and move it here.
                  </p>
                </div>
              ) : (
                <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
                  {sortedPausedJobs.map(renderJobRow)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reusable Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          isStudent={false}
        />
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdate={handleUpdateJob}
        />
      )}

      {/* Manage Progress Modal */}
      {managingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none w-full max-w-xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-1.5">
                  Applicant Progress Lab
                </span>
                <h4 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100">
                  Manage Recruitment Progress
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans font-medium mt-0.5">
                  Candidate: <span className="font-bold text-slate-900 dark:text-slate-100">{managingApp.student?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setManagingApp(null)}
                className="p-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-700 dark:text-slate-300 font-sans font-medium leading-relaxed">
                Update the status and add feedback for each round. Completing or rejecting a round updates the candidate's real-time dashboard.
              </p>

              <div className="space-y-3">
                {(managingApp.roundStatuses || []).map((round, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-none border border-slate-300 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">
                        Round {round.roundNumber}: {round.name}
                      </span>
                      <select
                        value={round.status}
                        onChange={(e) => {
                          const updated = [...managingApp.roundStatuses];
                          updated[idx].status = e.target.value;
                          setManagingApp({ ...managingApp, roundStatuses: updated });
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-semibold text-slate-900 dark:text-slate-100 px-3 py-1.5 focus:outline-none focus:border-blue-700"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="CLEARED">Qualified / Cleared</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                        Feedback / Instructions
                      </label>
                      <textarea
                        value={round.feedback || ''}
                        onChange={(e) => {
                          const updated = [...managingApp.roundStatuses];
                          updated[idx].feedback = e.target.value;
                          setManagingApp({ ...managingApp, roundStatuses: updated });
                        }}
                        placeholder="Add round feedback or instructions for candidate..."
                        rows={2}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-medium text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:border-blue-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setManagingApp(null)}
                className="px-4 py-2 text-xs font-headline font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await apiFetch(`/recruiter/applications/${managingApp.id}/rounds`, {
                      token,
                      method: 'PUT',
                      json: {
                        roundStatuses: managingApp.roundStatuses
                      }
                    });
                    if (res.ok) {
                      alert('Progress updated successfully!');
                      setManagingApp(null);
                      if (onRefresh) onRefresh();
                    } else {
                      const d = await res.json();
                      alert(d.error || 'Failed to update progress');
                    }
                  } catch {
                    alert('Error updating progress');
                  }
                }}
                className="px-4 py-2 text-xs font-headline font-bold text-white bg-blue-700 hover:bg-blue-800 border border-blue-800 rounded-none transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicants List Modal */}
      {viewingApplicantsJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none w-full max-w-2xl p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-3">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-1.5">
                  Candidate Submissions
                </span>
                <h4 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100">
                  Applicants for {viewingApplicantsJob.title}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans font-medium mt-0.5">
                  Total applications: <span className="font-bold text-slate-900 dark:text-slate-100">{viewingApplicantsJob.applications?.length || 0}</span>
                </p>
              </div>
              <button
                onClick={() => setViewingApplicantsJob(null)}
                className="p-1.5 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(!viewingApplicantsJob.applications || viewingApplicantsJob.applications.length === 0) ? (
                <p className="text-sm text-slate-700 dark:text-slate-300 text-center font-sans font-medium py-6">
                  No candidates have applied yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {viewingApplicantsJob.applications.map((app, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-none border border-slate-300 dark:border-slate-700 text-left"
                    >
                      <div className="space-y-1.5">
                        <p className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100">
                          {app.student?.name || 'Anonymous Student'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.student?.skills?.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-none font-sans font-semibold"
                            >
                              {s.name}: Lvl {s.rating}/10
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(app.student)}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <User className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          <span>View Profile</span>
                        </button>

                        <a
                          href={app.student?.resumeUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-headline font-bold rounded-none transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>View Resume</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setViewingApplicantsJob(null);
                            setManagingApp(app);
                          }}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white border border-blue-800 text-xs font-headline font-bold rounded-none transition-all active:scale-95 cursor-pointer shadow-2xs"
                        >
                          Manage Progress
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setViewingApplicantsJob(null)}
                className="px-4 py-2 text-xs font-headline font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />

      {/* Custom Delete Confirmation Modal (In place of native alert/confirm) */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-surface border border-slate-300 dark:border-slate-700 w-full max-w-md rounded-none shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-none bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-rose-100 dark:bg-rose-950/70 border border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200 mb-1">
                    Delete Opportunity
                  </span>
                  <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                    Remove Job Manually?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => !actionInProgress && setJobToDelete(null)}
                  disabled={actionInProgress}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-sans text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  Are you sure you want to manually delete <strong className="text-slate-900 dark:text-slate-100">"{jobToDelete.title}"</strong>?
                </p>
                <div className="text-slate-600 dark:text-slate-400 bg-rose-50/50 dark:bg-rose-950/30 p-3 border border-rose-200 dark:border-rose-900/60 text-[11px] leading-relaxed">
                  ⚠️ This action cannot be undone. All applicant records, review progress, and interview rounds associated with this job will be permanently removed.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setJobToDelete(null)}
                  disabled={actionInProgress}
                  className="px-3.5 py-2 text-xs font-headline font-bold rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setActionInProgress(true);
                    await handleDeleteJob(jobToDelete.id);
                    setActionInProgress(false);
                    setJobToDelete(null);
                  }}
                  disabled={actionInProgress}
                  className="px-4 py-2 text-xs font-headline font-bold rounded-none bg-rose-700 hover:bg-rose-800 text-white cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{actionInProgress ? 'Removing...' : 'Confirm & Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Pause / Resume Confirmation Modal */}
      {jobToTogglePause && (() => {
        const isCurrentlyPaused = jobToTogglePause.status === 'PAUSED' || Boolean(jobToTogglePause.isPaused);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-surface border border-slate-300 dark:border-slate-700 w-full max-w-md rounded-none shadow-2xl overflow-hidden animate-scale-up">
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-none border flex items-center justify-center shrink-0 shadow-2xs ${
                    isCurrentlyPaused
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                  }`}>
                    {isCurrentlyPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none border mb-1 ${
                      isCurrentlyPaused
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200'
                    }`}>
                      {isCurrentlyPaused ? 'Resume Role' : 'Pause Role'}
                    </span>
                    <h3 className="text-base font-headline font-bold text-slate-900 dark:text-slate-100">
                      {isCurrentlyPaused ? 'Resume Opportunity Showcase?' : 'Pause Opportunity Showcase?'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => !actionInProgress && setJobToTogglePause(null)}
                    disabled={actionInProgress}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs font-sans text-slate-700 dark:text-slate-300 space-y-2">
                  <p>
                    {isCurrentlyPaused ? (
                      <>Are you ready to resume showcasing <strong className="text-slate-900 dark:text-slate-100">"{jobToTogglePause.title}"</strong>?</>
                    ) : (
                      <>Are you sure you want to pause <strong className="text-slate-900 dark:text-slate-100">"{jobToTogglePause.title}"</strong>?</>
                    )}
                  </p>
                  <div className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed">
                    {isCurrentlyPaused ? (
                      '✨ This role will immediately become visible to matching candidates again. All prior applications, rounds, and requirements remain intact.'
                    ) : (
                      '🛡️ This role will stop showcasing to candidates. None of your candidate applications, applicant progress, or requirements will be lost.'
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setJobToTogglePause(null)}
                    disabled={actionInProgress}
                    className="px-3.5 py-2 text-xs font-headline font-bold rounded-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!handleTogglePauseJob) return;
                      setActionInProgress(true);
                      await handleTogglePauseJob(jobToTogglePause.id, isCurrentlyPaused);
                      setActionInProgress(false);
                      setJobToTogglePause(null);
                    }}
                    disabled={actionInProgress}
                    className={`px-4 py-2 text-xs font-headline font-bold rounded-none text-white cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-60 ${
                      isCurrentlyPaused
                        ? 'bg-emerald-700 hover:bg-emerald-800'
                        : 'bg-amber-700 hover:bg-amber-800'
                    }`}
                  >
                    {isCurrentlyPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span>{actionInProgress ? 'Updating...' : isCurrentlyPaused ? 'Resume Showcase' : 'Pause Showcase'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
