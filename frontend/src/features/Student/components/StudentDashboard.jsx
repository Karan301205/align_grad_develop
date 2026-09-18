import React, { useState, useEffect } from 'react';
import { 
  Briefcase,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import JobFilterBar from './JobFilterBar';
import JobSnapshotCard from './JobSnapshotCard';
import JobDetailsModal from '../../../components/JobDetailsModal';

function extractStipendNumeric(job) {
  if (!job || job.showSalary === false) return 0;
  const raw = job.stipendFullTime || job.stipendFull || job.salary || job.stipendPartTime || job.stipend || 0;
  const clean = String(raw).replace(/[^\d]/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

export default function StudentDashboard({ 
  profile,
  user,
  jobs = [], 
  applications = [],
  skillCount = 0, 
  appliedCount = 0, 
  handleApply, 
  setTestSkill, 
  onRefresh, 
  onOpenCompanyProfile, 
  autoSelectOpportunity, 
  setAutoSelectOpportunity,
  onSelectJob,
  goToTab
}) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sub-tabs inside right container ('all' | 'applied')
  const [mainTab, setMainTab] = useState('all');

  // Filter States (matching JobFilterSidebar)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [minStipend, setMinStipend] = useState('');
  const [maxStipend, setMaxStipend] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (autoSelectOpportunity && autoSelectOpportunity.type === 'job') {
      const job = jobs.find(j => j.id === autoSelectOpportunity.id);
      if (job) {
        handleJobClick(job);
        setAutoSelectOpportunity(null);
      }
    }
  }, [autoSelectOpportunity, jobs, setAutoSelectOpportunity]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsRefreshing(false);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setRoleFilter('all');
    setLocationFilter('all');
    setSelectedSkills('');
    setMinStipend('');
    setMaxStipend('');
    setStatusFilter('all');
    setMainTab('all');
  };

  const handleJobClick = (job) => {
    if (onSelectJob) {
      onSelectJob(job);
    } else {
      window.history.pushState({}, '', `/job_brief?id=${job.id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const totalApplied = jobs.filter(j => j.applied).length;

  // Filter Jobs
  const filteredJobs = jobs.filter(job => {
    // 1. Right container sub-tab
    if (mainTab === 'applied' && !job.applied) return false;

    // 2. Status filter
    if (statusFilter === 'applied' && !job.applied) return false;
    if (statusFilter === 'not_applied' && job.applied) return false;

    // 3. Role filter
    if (roleFilter !== 'all') {
      const typeStr = (job.opportunityType || '').toLowerCase();
      const titleStr = (job.title || '').toLowerCase();
      if (roleFilter === 'internship' && !typeStr.includes('intern') && !titleStr.includes('intern')) return false;
      if (roleFilter === 'fulltime' && !typeStr.includes('full') && !titleStr.includes('developer') && !titleStr.includes('engineer') && !typeStr.includes('job')) return false;
    }

    // 4. Location filter
    if (locationFilter !== 'all') {
      const locStr = (job.location || job.workMode || '').toLowerCase();
      if (locationFilter === 'wfh') {
        if (!locStr.includes('home') && !locStr.includes('remote') && locStr !== 'wfh') return false;
      } else {
        if (!locStr.includes(locationFilter.toLowerCase())) return false;
      }
    }

    // 5. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (job.title || '').toLowerCase().includes(q);
      const companyMatch = (job.companyName || job.company?.name || '').toLowerCase().includes(q);
      const skillMatch = job.requirements?.some(r => (r.skillName || '').toLowerCase().includes(q));
      if (!titleMatch && !companyMatch && !skillMatch) return false;
    }

    // 6. Required Skills Filter
    if (selectedSkills.trim()) {
      const skillsToMatch = selectedSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const jobSkillNames = (job.requirements || []).map(r => (r.skillName || '').toLowerCase());
      const hasMatchedSkill = skillsToMatch.some(target => jobSkillNames.some(js => js.includes(target)));
      if (!hasMatchedSkill) return false;
    }

    // 7. Stipend Range (INR)
    const stipendNum = extractStipendNumeric(job);
    if (minStipend && !isNaN(parseInt(minStipend, 10))) {
      if (stipendNum > 0 && stipendNum < parseInt(minStipend, 10)) return false;
    }
    if (maxStipend && !isNaN(parseInt(maxStipend, 10))) {
      if (stipendNum > 0 && stipendNum > parseInt(maxStipend, 10)) return false;
    }

    return true;
  });

  // Sort Filtered Jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'stipend_desc') {
      return extractStipendNumeric(b) - extractStipendNumeric(a);
    }
    if (sortBy === 'stipend_asc') {
      return extractStipendNumeric(a) - extractStipendNumeric(b);
    }
    if (sortBy === 'title_asc') {
      return (a.title || '').localeCompare(b.title || '');
    }
    // newest first (default)
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16 text-left">
      {/* Top Header & Sync */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Find Your Next Opportunity
          </h1>
          <p className="text-slate-700 dark:text-slate-300 text-xs font-sans font-normal mt-0.5">
            Welcome back, <span className="font-bold text-slate-900 dark:text-slate-100">{profile?.name || user?.name || 'Candidate'}</span> 
          </p>
        </div>
        {/* <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-surface hover:bg-surface-container border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-800 dark:hover:text-blue-300 rounded-none text-xs font-headline font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-700 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button> */}
      </div>

      {/* Top Filter Bar: Horizontal Controls across the top */}
      <JobFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        selectedSkills={selectedSkills}
        setSelectedSkills={setSelectedSkills}
        minStipend={minStipend}
        setMinStipend={setMinStipend}
        maxStipend={maxStipend}
        setMaxStipend={setMaxStipend}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalJobs={sortedJobs.length}
        onReset={handleResetFilters}
      />

      {/* Jobs Container: Sharp Corners with Sub-Tabs & 3-in-a-Row Box Grid */}
      <div className="w-full flex flex-col bg-surface-container border border-slate-300 dark:border-slate-700 rounded-none shadow-xs">
        {/* Sub-Tabs Header inside Container */}
        <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-700 bg-surface px-4 sm:px-6 pt-3">
          <div className="flex items-center gap-6 text-xs font-headline font-bold">
            <button
              type="button"
              onClick={() => setMainTab('all')}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                mainTab === 'all'
                  ? 'border-blue-700 text-blue-800 dark:text-blue-300 font-extrabold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span>All Job Openings</span>
              <span className="ml-1.5 px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] rounded-none">
                {jobs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('applied')}
              className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                mainTab === 'applied'
                  ? 'border-blue-700 text-blue-800 dark:text-blue-300 font-extrabold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span>Your Applications</span>
              {totalApplied > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 text-blue-900 dark:text-blue-200 text-[10px] font-bold rounded-none">
                  {totalApplied}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] font-sans font-medium text-slate-600 dark:text-slate-400 hidden sm:inline">
            Showing {sortedJobs.length} opening{sortedJobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* 3-in-a-Row Box Cards Grid */}
        {sortedJobs.length === 0 ? (
          <div className="text-center py-20 px-6 bg-surface space-y-3">
            <AlertTriangle className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto opacity-70" />
            <h3 className="font-headline font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              No job openings match your filter criteria
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans max-w-sm mx-auto">
              Try adjusting your search terms, clearing specific skill tags, or resetting the filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-headline font-bold rounded-none transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 bg-surface grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedJobs.map((job) => (
              <JobSnapshotCard
                key={job.id}
                job={job}
                onClick={handleJobClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fallback Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          onUpgrade={setTestSkill}
          isStudent={true}
          onOpenCompanyProfile={onOpenCompanyProfile}
        />
      )}
    </div>
  );
}
