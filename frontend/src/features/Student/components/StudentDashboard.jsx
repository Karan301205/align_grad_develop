import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ChevronDown, 
  Layers,
  Sparkles,
  Building,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Briefcase
} from 'lucide-react';
import JobDetailsModal from '../../../components/JobDetailsModal';
import { INDIAN_STATES } from '../../../constants/indianStates';

const BG_COLORS = [
  'bg-blue-600',
  'bg-slate-700',
  'bg-rose-700',
  'bg-emerald-700',
  'bg-indigo-600',
  'bg-amber-700',
  'bg-cyan-700',
  'bg-purple-700'
];

function getCompanyInitials(name) {
  if (!name) return 'AG';
  const cleanName = name.replace(/^c_/i, '').trim();
  if (!cleanName) return 'AG';
  const parts = cleanName.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}

function getCompanyColor(name) {
  if (!name) return BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[idx];
}

function formatStipendDisplay(job) {
  if (!job) return 'Stipend Unspecified';

  const full = job.stipendFullTime || job.stipendFull;
  const part = job.stipendPartTime || job.stipendPart;
  const sal = job.salary;
  const st = job.stipend;

  const formatAmount = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (!str) return '';
    const clean = str.replace(/^₹\s*/, '');
    const num = parseInt(clean.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      return num.toLocaleString('en-IN');
    }
    return clean;
  };

  if (full && part) {
    const formattedPart = formatAmount(part);
    const formattedFull = formatAmount(full);
    if (formattedPart === formattedFull) {
      return `₹ ${formattedPart} /mo`;
    }
    return `₹ ${formattedPart} - ${formattedFull} /mo`;
  }

  const singleVal = full || part || sal || st;
  if (singleVal) {
    const formatted = formatAmount(singleVal);
    if (formatted.toLowerCase().includes('/mo') || formatted.toLowerCase().includes('month') || formatted.toLowerCase().includes('k/mo')) {
      return `₹ ${formatted}`;
    }
    return `₹ ${formatted} /mo`;
  }

  return 'Stipend Unspecified';
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
  goToTab
}) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [mainTab, setMainTab] = useState('all'); // 'all' | 'applied'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'applied' | 'not_applied'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'internship' | 'fulltime'
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    if (autoSelectOpportunity && autoSelectOpportunity.type === 'job') {
      const job = jobs.find(j => j.id === autoSelectOpportunity.id);
      if (job) {
        setSelectedJob(job);
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

  // Performance metrics computed dynamically from live response data
  const appliedJobsList = jobs.filter(j => j.applied);
  const totalApplied = appliedJobsList.length;

  let r1Scheduled = 0;
  let r1Cleared = 0;
  let preFinalScheduled = 0;
  let preFinalCleared = 0;

  if (applications && applications.length > 0) {
    r1Scheduled = applications.length;
    applications.forEach(app => {
      const rounds = app.roundStatuses || [];
      const statusUpper = (app.status || '').toUpperCase();

      // R-1 Cleared check
      const r1 = rounds[0];
      const r1Status = (r1?.status || '').toUpperCase();
      const isR1Cleared = r1Status === 'CLEARED' || r1Status === 'QUALIFIED' || statusUpper === 'SELECTED' || statusUpper === 'OFFER_RECEIVED' || rounds.length > 1;
      if (isR1Cleared) {
        r1Cleared++;
      }

      // Pre-final Scheduled check
      if (rounds.length > 1 || statusUpper === 'IN_PROGRESS' || statusUpper === 'SELECTED') {
        const r2 = rounds[1];
        const r2Status = (r2?.status || '').toUpperCase();
        if (r2Status === 'SCHEDULED' || r2Status === 'IN_PROGRESS' || r2Status === 'CLEARED' || r2Status === 'QUALIFIED' || rounds.length > 2) {
          preFinalScheduled++;
        }
      }

      // Pre-final Cleared check
      const isSelected = statusUpper === 'SELECTED' || statusUpper === 'OFFER_RECEIVED';
      const hasClearedPreFinal = rounds.slice(1).some(r => {
        const st = (r.status || '').toUpperCase();
        return st === 'CLEARED' || st === 'QUALIFIED';
      });
      if (isSelected || hasClearedPreFinal) {
        preFinalCleared++;
      }
    });
  } else {
    // Dynamic computation directly from applied jobs list
    r1Scheduled = totalApplied;
    r1Cleared = appliedJobsList.filter(j => {
      const st = (j.status || '').toUpperCase();
      return st === 'CLEARED' || st === 'QUALIFIED' || j.round1Cleared;
    }).length;
    preFinalScheduled = appliedJobsList.filter(j => {
      const st = (j.status || '').toUpperCase();
      return st === 'IN_PROGRESS' || j.round2Scheduled;
    }).length;
    preFinalCleared = appliedJobsList.filter(j => {
      const st = (j.status || '').toUpperCase();
      return st === 'SELECTED' || st === 'OFFER_RECEIVED' || j.offerReceived;
    }).length;
  }

  const clearanceRate = r1Scheduled > 0 ? Math.round((r1Cleared / r1Scheduled) * 100) : 0;

  // Filter Jobs
  const filteredJobs = jobs.filter(job => {
    // Tab Filter
    if (mainTab === 'applied' && !job.applied) return false;

    // Status Filter
    if (statusFilter === 'applied' && !job.applied) return false;
    if (statusFilter === 'not_applied' && job.applied) return false;

    // Role Filter
    if (roleFilter !== 'all') {
      const typeStr = (job.opportunityType || '').toLowerCase();
      const titleStr = (job.title || '').toLowerCase();
      if (roleFilter === 'internship' && !typeStr.includes('intern') && !titleStr.includes('intern')) return false;
      if (roleFilter === 'fulltime' && !typeStr.includes('full') && !titleStr.includes('developer') && !titleStr.includes('engineer')) return false;
    }

    // Location Filter
    if (locationFilter !== 'all') {
      const locStr = (job.location || job.workMode || '').toLowerCase();
      if (locationFilter === 'wfh') {
        if (!locStr.includes('home') && !locStr.includes('remote')) return false;
      } else {
        if (!locStr.includes(locationFilter.toLowerCase())) return false;
      }
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (job.title || '').toLowerCase().includes(q);
      const companyMatch = (job.companyName || job.company?.name || '').toLowerCase().includes(q);
      const skillMatch = job.requirements?.some(r => (r.skillName || '').toLowerCase().includes(q));
      if (!titleMatch && !companyMatch && !skillMatch) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-left">
      {/* Top Header & Refresh */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface">
            Placements
          </h1>
          <p className="text-on-surface-variant text-xs font-mono mt-0.5">
            Welcome back, <span className="font-bold text-on-surface">{profile?.name || user?.name || 'Candidate'}</span> • Top 5% Verified • {skillCount} Verified Stacks
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-mono transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>

      {/* Interview Performance Banner Card */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-sm text-on-surface">Interview Performance</h3>
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
            <span className="text-[11px]">ⓘ Round-1 Clearance</span>
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 font-bold text-xs">
              {/* <div className="w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin"></div> */}
              <span>{clearanceRate}%</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-mono text-on-surface-variant font-medium">R-1 Scheduled</span>
            <span className="font-headline font-extrabold text-lg text-on-surface">{r1Scheduled}</span>
          </div>

          <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-mono text-on-surface-variant font-medium">R-1 Cleared</span>
            <span className="font-headline font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{r1Cleared}</span>
          </div>

          <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-mono text-on-surface-variant font-medium">Pre-final Scheduled</span>
            <span className="font-headline font-extrabold text-lg text-on-surface">{preFinalScheduled}</span>
          </div>

          <div className="bg-surface-container-high/60 border border-outline-variant/60 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-mono text-on-surface-variant font-medium">Pre-final Cleared</span>
            <span className="font-headline font-extrabold text-lg text-on-surface-variant">{preFinalCleared}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="space-y-4 pt-2">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-6 border-b border-outline-variant/60 text-xs font-mono">
          <button
            onClick={() => { setMainTab('all'); setStatusFilter('all'); }}
            className={`pb-3 font-bold border-b-2 transition-all cursor-pointer ${
              mainTab === 'all' && statusFilter === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Job Openings
          </button>
          <button
            onClick={() => { setMainTab('applied'); setStatusFilter('applied'); }}
            className={`pb-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              mainTab === 'applied' || statusFilter === 'applied'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Your Applications</span>
            {totalApplied > 0 && (
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] rounded-full font-bold">
                {totalApplied}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Company or Role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
          />
        </div>

        {/* Filter Pills Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Pill */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant rounded-full px-4 py-1.5 pr-8 text-xs font-mono font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="applied">Status: Applied ({totalApplied})</option>
              <option value="not_applied">Status: Not Applied</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Role Filter Pill */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant rounded-full px-4 py-1.5 pr-8 text-xs font-mono font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">Role: All</option>
              <option value="internship">Role: Internship</option>
              <option value="fulltime">Role: Full-Time / Dev</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Location Filter Pill */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant rounded-full px-4 py-1.5 pr-8 text-xs font-mono font-medium text-on-surface focus:outline-none focus:border-primary transition-all cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">Location: All</option>
              <option value="wfh">Work from home / Remote</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3 bg-surface-container border border-outline-variant rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center mx-auto text-on-surface-variant">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <p className="font-bold text-on-surface text-sm">No job openings match your filter criteria</p>
          <p className="text-xs text-on-surface-variant font-mono">
            Try adjusting your search term or clearing the Status/Role/Location filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => {
            const rawCompanyName = job.companyName || job.company?.name || 'AlignCorp';
            const companyDisplayName = rawCompanyName.replace(/^c_/i, '');
            const logoUrl = job.company?.logoUrl || job.logoUrl || job.companyLogo;
            const initials = getCompanyInitials(rawCompanyName);
            const colorClass = getCompanyColor(companyDisplayName);
            const isApplied = Boolean(job.applied);

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="bg-surface border border-outline-variant/80 hover:border-primary rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group relative border-t-4 border-t-primary/70"
              >
                {/* Top Row: Title, Company Name & Monogram Logo Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm md:text-base text-on-surface group-hover:text-primary transition-colors truncate font-headline">
                      {job.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                      {companyDisplayName}
                    </p>
                  </div>

                  {/* Company Monogram Badge Box */}
                  <div className={`w-14 h-14 rounded-2xl ${colorClass} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs uppercase font-headline overflow-hidden border border-outline-variant/40`}>
                    {logoUrl ? (
                      <img src={logoUrl} alt={companyDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </div>

                {/* Info Row: Stipend & Location */}
                <div className="space-y-1.5 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-mono text-primary font-bold text-sm bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1">
                      {formatStipendDisplay(job)}
                    </span>
                    <span className="flex items-center gap-1 truncate font-sans text-on-surface-variant font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      {job.location || job.workMode || 'Work from home, In'}
                    </span>
                  </div>
                </div>

                {/* Multi-Colored Skill Pills List */}
                <div className="flex flex-wrap gap-1.5">
                  {job.requirements && job.requirements.length > 0 ? (
                    job.requirements.slice(0, 3).map((req, i) => {
                      const pillStyles = [
                        'bg-primary/10 text-primary border-primary/20',
                        'bg-secondary/10 text-secondary border-secondary/20',
                        'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      ][i % 3];
                      return (
                        <span key={i} className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border ${pillStyles}`}>
                          {req.skillName}
                        </span>
                      );
                    })
                  ) : (
                    <>
                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-mono font-bold rounded-lg border border-primary/20">
                        JavaScript
                      </span>
                      <span className="px-2.5 py-1 bg-secondary/10 text-secondary text-[11px] font-mono font-bold rounded-lg border border-secondary/20">
                        Python
                      </span>
                    </>
                  )}
                  {job.requirements && job.requirements.length > 3 && (
                    <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-mono rounded-lg border border-outline-variant font-bold">
                      +{job.requirements.length - 3} More
                    </span>
                  )}
                </div>

                {/* Footer Row: Deadline / Verification Status Badge */}
                <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-mono">
                  {isApplied ? (
                    <span className="px-3 py-1 bg-secondary/15 border border-secondary/30 text-secondary font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied
                    </span>
                  ) : job.matched ? (
                    <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Eligible to Apply
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Test Required
                    </span>
                  )}

                  <span className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[10px] rounded-lg font-bold border border-outline-variant uppercase">
                    {job.opportunityType || 'Job'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Details Modal */}
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
