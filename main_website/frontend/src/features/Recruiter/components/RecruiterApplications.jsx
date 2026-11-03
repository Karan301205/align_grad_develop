import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Briefcase,
  User,
  UserCheck,
  Users,
  Calendar,
  Award,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import CandidateProfileModal from './CandidateProfileModal';
import { getApplicationStage, STAGE_CONFIG } from '../../../utils/hiringProgress';
import { apiFetch } from '../../../services/apiClient';
import { openResumePdfInNewTab } from '../../../services/resumePdf';
import ResumePdfTemplate from '../../../components/ResumePdfTemplate';

/**
 * Calculates a 0-100 match percentage between candidate skills and job requirements.
 * When requirements exist, evaluates candidate ratings against required ratings.
 */
export function calculateJobMatchScore(job, candidate) {
  if (!candidate) return 0;
  if (typeof candidate.matchScore === 'number' && candidate.matchScore > 0) {
    return Math.round(candidate.matchScore);
  }
  const requirements = job?.requirements || [];
  if (!requirements || requirements.length === 0) {
    return 85;
  }
  const candSkills = candidate.skills || [];
  const candSkillMap = new Map();
  candSkills.forEach(s => {
    if (!s || !s.name) return;
    const key = s.name.trim().toLowerCase();
    const rating = (typeof s.verifiedRating === 'number' && s.verifiedRating > 0)
      ? s.verifiedRating
      : (typeof s.rating === 'number' ? s.rating : 1);
    candSkillMap.set(key, rating);
  });

  let totalSim = 0;
  requirements.forEach(req => {
    const reqName = (req.skillName || req.name || '').trim().toLowerCase();
    const reqRating = req.minRating || req.rating || 1;
    const candRating = candSkillMap.get(reqName) || 0;
    const sim = Math.min(1, candRating / reqRating);
    totalSim += sim;
  });

  const percentage = Math.round((totalSim / requirements.length) * 100);
  return Math.max(10, Math.min(100, percentage));
}

/**
 * Formats a date string into standard DD/MM/YYYY format matching Screenshot 3 reference.
 */
export function formatAppliedDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export default function RecruiterApplications({
  job: initialJob = null,
  allJobs = [],
  company,
  token,
  onBack,
  onRefresh
}) {
  // Selected job filter ('ALL' or specific job ID)
  const [selectedJobId, setSelectedJobId] = useState(initialJob?.id || (allJobs[0]?.id || 'ALL'));
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [matchFilter, setMatchFilter] = useState('ALL'); // 'ALL' | '70' | '50'
  const [sortBy, setSortBy] = useState('MATCH_DESC'); // 'MATCH_DESC' | 'MATCH_ASC' | 'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC'
  // Modal inspection states
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedCandidateJob, setSelectedCandidateJob] = useState(null);
  const [managingApp, setManagingApp] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Hidden PDF generator ref
  const pdfRef = useRef(null);
  const [pdfCandidate, setPdfCandidate] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lock body scroll and handle Escape key when Manage modal is open
  useEffect(() => {
    if (managingApp) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setManagingApp(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [managingApp]);

  // Find active job object if a single job is selected
  const activeJob = useMemo(() => {
    if (selectedJobId === 'ALL') return null;
    return allJobs.find(j => j.id === selectedJobId) || initialJob;
  }, [selectedJobId, allJobs, initialJob]);

  // Aggregate all applications across jobs or filter to selected job
  const rawApplications = useMemo(() => {
    if (activeJob) {
      const apps = activeJob.applications || [];
      return apps.map(app => ({
        ...app,
        _jobTitle: activeJob.title,
        _jobOpportunityType: activeJob.opportunityType,
        _jobObject: activeJob,
        _matchScore: calculateJobMatchScore(activeJob, app.student)
      }));
    }

    // All jobs aggregated
    const list = [];
    allJobs.forEach(j => {
      const apps = j.applications || [];
      apps.forEach(app => {
        list.push({
          ...app,
          _jobTitle: j.title,
          _jobOpportunityType: j.opportunityType,
          _jobObject: j,
          _matchScore: calculateJobMatchScore(j, app.student)
        });
      });
    });
    return list;
  }, [activeJob, allJobs]);

  // Filtered and sorted applications list
  const filteredApplications = useMemo(() => {
    let result = [...rawApplications];

    // Search filter (name, username, title, email, phone, skills)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(item => {
        const student = item.student || {};
        const name = (student.name || '').toLowerCase();
        const username = (student.username || '').toLowerCase();
        const title = (student.title || '').toLowerCase();
        const email = (student.email || item.email || '').toLowerCase();
        const phone = (student.phone || '').toLowerCase();
        const jobTitle = (item._jobTitle || '').toLowerCase();
        const skills = (student.skills || []).map(s => (s.name || '').toLowerCase()).join(' ');

        return (
          name.includes(query) ||
          username.includes(query) ||
          title.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          jobTitle.includes(query) ||
          skills.includes(query)
        );
      });
    }

    // Stage filter
    if (stageFilter !== 'ALL') {
      result = result.filter(item => getApplicationStage(item) === stageFilter);
    }

    // Match % filter
    if (matchFilter === '70') {
      result = result.filter(item => item._matchScore >= 70);
    } else if (matchFilter === '50') {
      result = result.filter(item => item._matchScore >= 50);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'MATCH_DESC') {
        return b._matchScore - a._matchScore;
      }
      if (sortBy === 'MATCH_ASC') {
        return a._matchScore - b._matchScore;
      }
      if (sortBy === 'DATE_DESC') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'NAME_ASC') {
        const nameA = (a.student?.name || '').toLowerCase();
        const nameB = (b.student?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [rawApplications, searchTerm, stageFilter, matchFilter, sortBy]);

  // Stage counts for filter chips
  const stageCounts = useMemo(() => {
    const counts = { ALL: rawApplications.length, APPLIED: 0, SHORTLISTED: 0, INTERVIEW: 0, HIRED: 0, REJECTED: 0 };
    rawApplications.forEach(app => {
      const stage = getApplicationStage(app);
      if (counts[stage] !== undefined) counts[stage]++;
    });
    return counts;
  }, [rawApplications]);

  // Average match score
  const avgMatchScore = useMemo(() => {
    if (rawApplications.length === 0) return 0;
    const sum = rawApplications.reduce((acc, app) => acc + (app._matchScore || 0), 0);
    return Math.round(sum / rawApplications.length);
  }, [rawApplications]);

  // Export filtered rows to CSV
  const handleExportCSV = () => {
    if (filteredApplications.length === 0) return;
    const headers = ['Candidate Name', 'Username', 'Title', 'Role / Job', 'Match %', 'Applied On', 'Stage', 'Email', 'Phone', 'Location'];
    const rows = filteredApplications.map(app => {
      const s = app.student || {};
      return [
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${(s.username || '').replace(/"/g, '""')}"`,
        `"${(s.title || '').replace(/"/g, '""')}"`,
        `"${(app._jobTitle || '').replace(/"/g, '""')}"`,
        `${app._matchScore}%`,
        `"${formatAppliedDate(app.createdAt)}"`,
        `"${app.status || 'APPLIED'}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${(s.phone || '').replace(/"/g, '""')}"`,
        `"${(Array.isArray(s.preferredLocations) ? s.preferredLocations.join(', ') : '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AlignGrade_Applications_${selectedJobId === 'ALL' ? 'All' : (activeJob?.title || 'Job')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported applications CSV successfully');
  };

  // View / Print candidate PDF resume
  const handleViewResume = async (student) => {
    if (!student) return;
    if (student.resumeUrl) {
      window.open(student.resumeUrl, '_blank');
      return;
    }
    setPdfCandidate(student);
    setTimeout(async () => {
      if (pdfRef.current) {
        await openResumePdfInNewTab(pdfRef.current, `${student.name || 'Candidate'}_Resume`);
        setPdfCandidate(null);
      }
    }, 150);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-none border shadow-xl flex items-center gap-2.5 transition-all text-xs font-headline font-bold ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> : <Check className="w-4 h-4 shrink-0 text-emerald-600" />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb Navigation */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Breadcrumb + Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Back to Active Jobs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-headline font-bold text-slate-500 dark:text-slate-400">
                <span className="hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer" onClick={onBack}>
                  Active Jobs
                </span>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {activeJob ? activeJob.title : 'All Opportunities'}
                </span>
                <span>/</span>
                <span className="text-blue-700 dark:text-blue-400">Applications</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 flex items-center gap-2.5 flex-wrap">
                <span>Candidate Applications</span>
                {activeJob && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none ${
                      activeJob.opportunityType === 'INTERNSHIP'
                        ? 'bg-amber-100 dark:bg-amber-950/70 border border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200'
                        : 'bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200'
                    }`}
                  >
                    {activeJob.opportunityType === 'INTERNSHIP' ? 'Internship' : 'Full-Time Role'}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Job Switcher Dropdown & Refresh */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-headline font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
                Job Role:
              </label>
              <div className="relative">
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                  }}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-headline font-bold text-slate-900 dark:text-slate-100 px-3 py-2 pr-8 focus:outline-none focus:border-blue-700 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Jobs & Applications ({allJobs.reduce((acc, j) => acc + (j.applications?.length || 0), 0)})</option>
                  {allJobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.applications?.length || 0} applicants)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onRefresh) onRefresh();
                showToast('Refreshing applications list...');
              }}
              className="p-2 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-none transition-all cursor-pointer shadow-2xs hover:scale-105"
              title="Refresh applications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Recruiter Hiring Progress Snapshot KPI Mini-Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3.5 border-t-4 border-t-blue-700 shadow-2xs">
          <p className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Total Applicants</p>
          <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 mt-1">{rawApplications.length}</p>
        </div>
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3.5 border-t-4 border-t-indigo-600 shadow-2xs">
          <p className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Shortlisted</p>
          <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stageCounts.SHORTLISTED}</p>
        </div>
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3.5 border-t-4 border-t-amber-500 shadow-2xs">
          <p className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">In Interviews</p>
          <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stageCounts.INTERVIEW}</p>
        </div>
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3.5 border-t-4 border-t-emerald-600 shadow-2xs">
          <p className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Hires</p>
          <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stageCounts.HIRED}</p>
        </div>
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3.5 border-t-4 border-t-rose-600 shadow-2xs">
          <p className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Rejected</p>
          <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 mt-1">{stageCounts.REJECTED}</p>
        </div>
        <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-3.5 border-t-4 border-t-emerald-700 shadow-2xs">
          <p className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Avg Match %</p>
          <p className="text-2xl font-headline font-extrabold text-slate-900 dark:text-slate-100 mt-1">{avgMatchScore}%</p>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name, @username, title, email, phone, or skill..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none pl-9 pr-9 py-2 text-xs font-sans font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-700 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Match % Filter & Sort By Dropdowns & Export */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Match Filter */}
            <div className="relative">
              <select
                value={matchFilter}
                onChange={(e) => setMatchFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-headline font-bold text-slate-800 dark:text-slate-200 px-3 py-2 pr-8 focus:outline-none focus:border-blue-700 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Match %</option>
                <option value="70">Match ≥ 70%</option>
                <option value="50">Match ≥ 50%</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-headline font-bold text-slate-800 dark:text-slate-200 px-3 py-2 pr-8 focus:outline-none focus:border-blue-700 cursor-pointer shadow-2xs"
              >
                <option value="MATCH_DESC">Match %: High to Low</option>
                <option value="MATCH_ASC">Match %: Low to High</option>
                <option value="DATE_DESC">Applied: Newest First</option>
                <option value="DATE_ASC">Applied: Oldest First</option>
                <option value="NAME_ASC">Name: A to Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredApplications.length === 0}
              className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-none text-xs font-headline font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
              title="Export table to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stage Filter Tabs Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-800">
          {[
            { id: 'ALL', label: 'All Candidates', count: stageCounts.ALL },
            { id: 'APPLIED', label: 'Applied', count: stageCounts.APPLIED },
            { id: 'SHORTLISTED', label: 'Shortlisted', count: stageCounts.SHORTLISTED },
            { id: 'INTERVIEW', label: 'Interviews', count: stageCounts.INTERVIEW },
            { id: 'HIRED', label: 'Hires', count: stageCounts.HIRED },
            { id: 'REJECTED', label: 'Rejected', count: stageCounts.REJECTED },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-headline font-bold rounded-none border transition-all cursor-pointer flex items-center gap-1.5 ${
                stageFilter === tab.id
                  ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-none ${stageFilter === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}

          {(searchTerm || stageFilter !== 'ALL' || matchFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStageFilter('ALL');
                setMatchFilter('ALL');
              }}
              className="ml-auto text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Main Tabular View */}
      <div className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-300 dark:border-slate-700 text-[11px] font-headline font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 select-none">
                {/* 1. Match % */}
                <th
                  onClick={() => setSortBy(sortBy === 'MATCH_DESC' ? 'MATCH_ASC' : 'MATCH_DESC')}
                  className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors whitespace-nowrap w-20"
                  title="Sort by match score"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Match %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. Applied On */}
                <th
                  onClick={() => setSortBy(sortBy === 'DATE_DESC' ? 'DATE_ASC' : 'DATE_DESC')}
                  className="py-2.5 px-2.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors whitespace-nowrap w-24"
                  title="Sort by application date"
                >
                  <div className="flex items-center gap-1">
                    <span>Applied On</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 3. Name */}
                <th
                  onClick={() => setSortBy(sortBy === 'NAME_ASC' ? 'DATE_DESC' : 'NAME_ASC')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 4. Email */}
                <th className="py-2.5 px-2.5 whitespace-nowrap">
                  <span>Email</span>
                </th>

                {/* 5. Phone */}
                <th className="py-2.5 px-2.5 whitespace-nowrap">
                  <span>Phone</span>
                </th>

                {/* 6. Location */}
                <th className="py-2.5 px-2.5 whitespace-nowrap">
                  <span>Location</span>
                </th>

                {/* 7. Resume */}
                <th className="py-2.5 px-2 text-center whitespace-nowrap w-12">
                  <span>Resume</span>
                </th>

                {/* 8. Manage */}
                <th className="py-2.5 px-2.5 text-center whitespace-nowrap w-20">
                  <span>Manage</span>
                </th>

                {/* 9. Profile (Moved to right-most) */}
                <th className="py-2.5 px-2 text-center whitespace-nowrap w-12">
                  <span>Profile</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-sans">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 px-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-10 h-10 mx-auto bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-headline font-bold text-slate-800 dark:text-slate-200">
                        No candidate applications found
                      </p>
                      <p className="text-xs font-sans text-slate-500 dark:text-slate-400">
                        {searchTerm || stageFilter !== 'ALL' || matchFilter !== 'ALL'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'Candidates who apply for this opportunity will appear here in the registry.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const student = app.student || {};
                  const matchScore = app._matchScore || 0;

                  // High-contrast Match % pill color classes matching reference
                  const matchBadgeColor =
                    matchScore >= 70
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold'
                      : matchScore >= 50
                      ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';

                  const locationDisplay = Array.isArray(student.preferredLocations) && student.preferredLocations.length > 0
                    ? student.preferredLocations[0]
                    : (student.nationality || 'Available');

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-[#F3F9FF] dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Match % */}
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-headline rounded-none border ${matchBadgeColor} shadow-2xs`}
                        >
                          {matchScore}%
                        </span>
                      </td>

                      {/* 2. Applied On */}
                      <td className="py-2 px-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300 font-sans font-medium text-xs">
                        {formatAppliedDate(app.createdAt)}
                      </td>

                      {/* 3. Name with Monogram Avatar */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          {/* <div className="w-7 h-7 rounded-none bg-blue-700 text-white border border-blue-800 flex items-center justify-center font-headline font-bold text-xs shrink-0 shadow-2xs overflow-hidden">
                            {student.profilePic ? (
                              <img src={student.profilePic} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              (student.name?.charAt(0) || 'C').toUpperCase()
                            )}
                          </div> */}
                          <div className="min-w-0">
                            <p
                              onClick={() => {
                                setSelectedCandidate(student);
                                setSelectedCandidateJob(app._jobObject || activeJob);
                              }}
                              className="font-headline font-bold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer transition-colors truncate"
                            >
                              {student.name || 'Anonymous Student'}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 truncate">
                                {student.username ? `@${student.username}` : (student.email || '—')}
                              </span>
                              {selectedJobId === 'ALL' && app._jobTitle && (
                                <span className="text-[10px] font-headline font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-1 py-0.2">
                                  {app._jobTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 4. Email */}
                      <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 font-sans text-xs truncate max-w-[180px]">
                        {student.email || app.email ? (
                          <a
                            href={`mailto:${student.email || app.email}`}
                            className="hover:text-blue-700 dark:hover:text-blue-400 hover:underline flex items-center gap-1 truncate"
                            title={student.email || app.email}
                          >
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{student.email || app.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5. Phone */}
                      <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 font-sans text-xs whitespace-nowrap">
                        {student.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{student.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 6. Location */}
                      <td className="py-2 px-2.5 text-slate-700 dark:text-slate-300 font-sans text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{locationDisplay}</span>
                        </div>
                      </td>

                      {/* 7. Resume */}
                      <td className="py-2 px-1.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewResume(student)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-300 dark:border-slate-700 hover:border-blue-700 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 rounded-none transition-all cursor-pointer shadow-2xs"
                          title="View / Download Resume PDF"
                          aria-label="View Resume PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* 8. Manage Rounds & Evaluation */}
                      <td className="py-2 px-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setManagingApp(app)}
                          className="px-2.5 py-1 text-xs font-headline font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-700 rounded-none transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="Manage interview rounds & feedback"
                        >
                          Manage
                        </button>
                      </td>

                      {/* 9. Profile Action (Right-most, icon only) */}
                      <td className="py-2 px-1.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(student);
                            setSelectedCandidateJob(app._jobObject || activeJob);
                          }}
                          className="p-1.5 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-300 dark:border-slate-700 hover:border-blue-700 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 rounded-none transition-all shadow-2xs cursor-pointer active:scale-95"
                          title="View complete candidate dossier"
                          aria-label="View complete candidate dossier"
                        >
                          <User className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-headline font-bold text-slate-600 dark:text-slate-400">
          <div>
            Showing <span className="text-slate-900 dark:text-slate-100">{filteredApplications.length}</span> of{' '}
            <span className="text-slate-900 dark:text-slate-100">{rawApplications.length}</span> total registered applications
          </div>
        </div>
      </div>

      {/* Hidden PDF Generator Container */}
      {pdfCandidate && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '210mm' }}>
          <div ref={pdfRef}>
            <ResumePdfTemplate profile={pdfCandidate} />
          </div>
        </div>
      )}

      {/* Candidate Dossier Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        job={selectedCandidateJob}
        onClose={() => {
          setSelectedCandidate(null);
          setSelectedCandidateJob(null);
        }}
      />

      {/* Manage Progress / Rounds Modal */}
      {managingApp && (
        <div
          onClick={() => setManagingApp(null)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in pointer-events-auto"
          style={{ margin: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar my-auto"
          >
            <div className="flex justify-between items-start pb-3 border-b border-slate-300 dark:border-slate-700">
              <div>
                <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">
                  Manage Candidate Progress
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-sans mt-0.5">
                  Candidate: <strong className="text-slate-900 dark:text-slate-100">{managingApp.student?.name || 'Applicant'}</strong>
                  {managingApp._jobTitle && (
                    <span> • Role: <strong className="text-blue-700 dark:text-blue-400">{managingApp._jobTitle}</strong></span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingApp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Overall Pipeline Status Selector */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <label className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 block">
                    Overall Pipeline Status
                  </label>
                  <span className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
                    Current stage: <strong className="text-slate-900 dark:text-slate-100">{managingApp.status || 'APPLIED'}</strong>
                  </span>
                </div>
                <select
                  value={managingApp.status || 'APPLIED'}
                  onChange={(e) => setManagingApp({ ...managingApp, status: e.target.value })}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-bold text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:border-blue-700 cursor-pointer shadow-2xs"
                >
                  <option value="APPLIED">Applied (Screening Pending)</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="IN_PROGRESS">In Progress / Interview</option>
                  <option value="SELECTED">Hired / Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Candidate Screening Question Responses */}
              {managingApp.answers && managingApp.answers.length > 0 && (
                <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>Screening Responses ({managingApp.answers.length})</span>
                    </h4>
                  </div>
                  <div className="space-y-2.5">
                    {managingApp.answers.map((ans, aIdx) => (
                      <div key={aIdx} className="p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200">
                            Q{aIdx + 1}: {ans.questionText}
                          </span>
                          {ans.type === 'MCQ' && (
                            <span className={`text-[10px] font-headline font-bold px-2 py-0.5 border ${
                              ans.isCorrect
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : ans.isCorrect === false
                                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {ans.isCorrect ? '✓ Correct Answer' : ans.isCorrect === false ? '✗ Incorrect' : 'MCQ'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/70 p-2 border border-slate-200 dark:border-slate-800 rounded-none">
                          <strong className="text-slate-900 dark:text-slate-100 font-medium">Candidate Response:</strong> {ans.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rounds List */}
              <div className="space-y-3">
                <label className="text-xs font-headline font-bold text-slate-800 dark:text-slate-200 block">
                  Interview Rounds Evaluation:
                </label>
                {(!managingApp.roundStatuses || managingApp.roundStatuses.length === 0) ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    No individual interview rounds configured for this job opportunity. Updating overall pipeline status above will notify the candidate.
                  </p>
                ) : (
                  managingApp.roundStatuses.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 rounded-none space-y-2.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-headline font-bold text-slate-900 dark:text-slate-100">
                          Round {r.roundNumber || idx + 1}: {r.roundName}
                        </span>
                        <select
                          value={r.status || 'PENDING'}
                          onChange={(e) => {
                            const updated = [...managingApp.roundStatuses];
                            updated[idx].status = e.target.value;
                            setManagingApp({ ...managingApp, roundStatuses: updated });
                          }}
                          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs font-sans font-semibold text-slate-900 dark:text-slate-100 px-3 py-1.5 focus:outline-none focus:border-blue-700 cursor-pointer"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="CLEARED">Cleared</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                      <textarea
                        value={r.feedback || ''}
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
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setManagingApp(null)}
                className="px-4 py-2 text-xs font-headline font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await apiFetch(`/recruiter/applications/${managingApp.id}/rounds`, {
                      token,
                      method: 'PUT',
                      json: {
                        status: managingApp.status,
                        roundStatuses: managingApp.roundStatuses
                      }
                    });
                    if (res.ok) {
                      showToast('Progress updated successfully!');
                      setManagingApp(null);
                      if (onRefresh) onRefresh();
                    } else {
                      const d = await res.json();
                      showToast(d.error || 'Failed to update progress', 'error');
                    }
                  } catch {
                    showToast('Error updating progress', 'error');
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
    </div>
  );
}
