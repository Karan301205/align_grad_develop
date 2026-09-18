import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  UserPlus,
  Calendar,
  CheckCircle2,
  ArrowRight,
  MoreVertical,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Eye,
  UserCheck
} from 'lucide-react';
import CandidateProfileModal from './CandidateProfileModal';
import {
  getRecentlyViewedCandidates,
  recordViewedCandidate,
  formatViewedTime
} from '../../../utils/recentCandidateViews';

export default function RecruiterDashboard({
  company,
  jobs = [],
  candidates = [],
  topTalents,
  demandProfile,
  goToTab
}) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -344 : 344;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Derive active jobs count
  const activeJobs = (jobs || []).filter(job => {
    if (job.status === 'CLOSED' || job.opportunityType === 'GIG') return false;
    const activeDays = job.activeDays || 30;
    const expiryTime = new Date(job.createdAt).getTime() + activeDays * 24 * 60 * 60 * 1000;
    return Date.now() <= expiryTime;
  });
  const activeJobsCount = activeJobs.length;
  const totalCandidatesCount = candidates.length;

  // Track last 5 recently viewed candidates for current recruiter
  const recruiterId = company?.userId || company?.id || 'recruiter';
  const [recentlyViewed, setRecentlyViewed] = useState(() => getRecentlyViewedCandidates(recruiterId, 5));

  useEffect(() => {
    // Refresh recently viewed when recruiter changes or on initial mount
    setRecentlyViewed(getRecentlyViewedCandidates(recruiterId, 5));

    const handleSync = () => {
      setRecentlyViewed(getRecentlyViewedCandidates(recruiterId, 5));
    };

    window.addEventListener('recently_viewed_candidates_changed', handleSync);
    return () => {
      window.removeEventListener('recently_viewed_candidates_changed', handleSync);
    };
  }, [recruiterId]);

  // Source candidates from backend Demand Profile recommendations (topTalents)
  const talentPool = topTalents !== undefined ? (topTalents || []) : candidates;

  const displayTalent = talentPool.filter(cand => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (cand.name || '').toLowerCase().includes(q) || (cand.username || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in text-left">

      {/* Top Header Action Bar */}
      <header className="bg-surface border border-slate-300 dark:border-slate-700 p-5 sm:p-6 rounded-none shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 mb-2">
            <span>Recruiter Executive Hub</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Recruiter Dashboard
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-sans font-medium mt-1">
            Welcome back, <span className="font-bold text-slate-900 dark:text-slate-100">{company?.name || 'Recruiter'}</span>. Here is your real-time recruitment overview.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input Box */}
          <div className="relative flex-1 md:w-96">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidates..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-700 transition-all font-sans font-medium shadow-2xs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notifications Button */}
          {/* <button
            type="button"
            className="w-9 h-9 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shrink-0 cursor-pointer shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button> */}

          {/* Recruiter Avatar */}
          {/* <div className="w-9 h-9 rounded-none bg-blue-700 text-white border border-blue-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm shadow-2xs font-headline">
            {company?.logo ? (
              <img src={company.logo} alt="Recruiter Avatar" className="w-full h-full object-cover" />
            ) : (
              company?.name?.charAt(0) || 'R'
            )}
          </div> */}
        </div>
      </header>

      {/* KPI Cards Bento Grid (Vibrant 3-Column Layout) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> */}

        {/* Card 1: Active Jobs */}
        {/* <div
          onClick={() => goToTab && goToTab('jobs')}
          className="bg-surface border border-slate-300 dark:border-slate-700 hover:border-blue-700 rounded-none p-5 sm:p-6 shadow-2xs transition-all group cursor-pointer border-t-4 border-t-blue-700 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 rounded-none flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700 transition-all shadow-2xs">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Active Jobs
          </p>
          <p className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-900 dark:text-slate-100">
            {activeJobsCount}
          </p>
        </div> */}

        {/* Card 2: New Candidates */}
        {/* <div
          onClick={() => goToTab && goToTab('candidates')}
          className="bg-surface border border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-none p-5 sm:p-6 shadow-2xs transition-all group cursor-pointer border-t-4 border-t-emerald-600 relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-none flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-2xs">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            New Candidates
          </p>
          <p className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-900 dark:text-slate-100">
            {totalCandidatesCount}
          </p>
        </div> */}

        {/* Card 3: Interviews Today */}
        {/* <div className="bg-surface border border-slate-300 dark:border-slate-700 hover:border-amber-600 rounded-none p-5 sm:p-6 shadow-2xs transition-all group cursor-pointer border-t-4 border-t-amber-600 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-none flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 transition-all shadow-2xs">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-headline font-bold tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Interviews Today
          </p>
          <p className="text-3xl sm:text-4xl font-headline font-extrabold text-slate-900 dark:text-slate-100">
            {recentApplications.length}
          </p>
        </div>

      </div> */}

      {/* Top Verified Talent Carousel Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">Top Matching Talents</h3>
              {/* {demandProfile && demandProfile.skillList && demandProfile.skillList.length > 0 && (
                <span className="text-[10px] font-headline font-bold tracking-wider px-2 py-0.5 rounded-none bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200">
                  {demandProfile.skillList.length} Demand {demandProfile.skillList.length === 1 ? 'Skill' : 'Skills'} Matched
                </span>
              )} */}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium mt-0.5">
              {demandProfile && demandProfile.totalActiveJobs > 0
                ? `Ranked by skill similarity & coverage across your ${demandProfile.totalActiveJobs} active ${demandProfile.totalActiveJobs === 1 ? 'job' : 'jobs'}.`
                : 'Pre-verified candidates matched to your technical stack requirements.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToTab && goToTab('candidates')}
              className="px-2.5 py-1 text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none cursor-pointer flex items-center gap-1 transition-colors shadow-2xs h-8"
              title="Browse all candidates"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="w-8 h-8 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              aria-label="Previous talent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="w-8 h-8 rounded-none border border-slate-300 dark:border-slate-700 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              aria-label="Next talent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div ref={carouselRef} className="flex gap-5 overflow-x-auto pb-3 custom-scrollbar scroll-smooth">
          {displayTalent.length === 0 ? (
            <div className="w-full bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-8 text-center space-y-2 font-sans font-normal">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activeJobsCount === 0 ? 'No active job postings' : 'No matching candidates found'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {activeJobsCount === 0
                  ? 'Post an active job with technical requirements to receive personalized candidate recommendations.'
                  : 'No candidates currently match the skill criteria aggregated across your active job postings.'}
              </p>
            </div>
          ) : (
            displayTalent.slice(0, 15).map((cand, idx) => {
              const targetCandidate = cand.rawCandidate ? cand.rawCandidate : cand;
              return (
                <div
                  key={cand.id || cand._id || idx}
                  onClick={() => {
                    setSelectedCandidate(targetCandidate);
                    recordViewedCandidate(targetCandidate, recruiterId);
                  }}
                  className="min-w-[320px] max-w-[340px] bg-surface border border-slate-300 dark:border-slate-700 hover:border-blue-700 rounded-none p-5 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-md shrink-0"
                >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-none overflow-hidden border border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-sm shrink-0 flex items-center justify-center shadow-2xs font-headline">
                      {cand.avatar || cand.profilePic ? (
                        <img src={cand.avatar || cand.profilePic} alt={cand.name} className="w-full h-full object-cover" />
                      ) : (
                        cand.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors truncate font-headline">
                        {cand.name}
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-sans font-semibold truncate">
                        {cand.title || (cand.username ? `@${cand.username}` : 'Full-Stack Engineer')}
                      </p>
                    </div>
                    <div className="ml-auto shrink-0 flex items-center gap-1.5">
                      {cand.verifiedMatchesCount > 0 ? (
                        <div className="w-6 h-6 rounded-none bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-600 flex items-center justify-center text-emerald-700 dark:text-emerald-300" title={`${cand.verifiedMatchesCount} verified skills`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-300">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Colored Skill Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cand.matchingSkills && cand.matchingSkills.length > 0 ? (
                      cand.matchingSkills.slice(0, 4).map((s, i) => {
                        const pillStyles = s.isVerified
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600'
                          : [
                              'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
                              'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
                              'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                            ][i % 3];

                        return (
                          <span key={s.key || i} className={`text-[11px] px-2 py-0.5 rounded-none border font-headline font-bold flex items-center gap-1 ${pillStyles}`}>
                            <span>{s.name}</span>
                            <span className="font-extrabold">Lvl {s.candidateRating}</span>
                            {s.isVerified && (
                              <span className="w-1.5 h-1.5 rounded-none bg-emerald-600 dark:bg-emerald-400 shrink-0" title="Verified Skill" />
                            )}
                          </span>
                        );
                      })
                    ) : cand.skills && cand.skills.length > 0 ? (
                      cand.skills.slice(0, 4).map((s, i) => {
                        const name = typeof s === 'string' ? s : s.name;
                        const rating = typeof s === 'object' ? (s.verifiedRating || s.rating) : null;
                        const pillStyles = [
                          'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
                          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
                          'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        ][i % 3];

                        return (
                          <span key={i} className={`text-[11px] px-2 py-0.5 rounded-none border font-headline font-bold ${pillStyles}`}>
                            {name} {rating ? <span className="font-extrabold ml-0.5">Lvl {rating}</span> : ''}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-none font-headline font-bold">
                        General Profile
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-sans font-normal">
                  {cand.matchScore !== undefined && cand.matchScore !== null ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none text-[11px] font-headline font-bold bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200">
                      <span>{cand.matchScore}% Match</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-headline font-bold">Pre-verified</span>
                  )}
                  <button
                    type="button"
                    className="text-blue-700 dark:text-blue-400 hover:text-blue-800 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer font-headline"
                  >
                    <span className='text-align-right'>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
          )}
        </div>
      </section>

      {/* Recently Viewed Candidates Section */}
      <section className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100 tracking-wider">
              Recently Viewed Candidates
            </h3>
          </div>
          <button
            type="button"
            onClick={() => goToTab && goToTab('candidates')}
            className="text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Candidate Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">Candidate</th>
                <th className="px-6 py-3 text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">Role & Location</th>
                <th className="px-6 py-3 text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">Key Skills</th>
                <th className="px-6 py-3 text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">Viewed</th>
                <th className="px-6 py-3 text-right text-xs font-headline font-bold tracking-wider text-slate-800 dark:text-slate-200">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentlyViewed.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="w-10 h-10 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <Eye className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-headline">
                        No recently viewed candidate profiles
                      </p>
                      <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 max-w-sm">
                        Profiles you explore from Top Matching Talents or the Candidate Directory will appear here for quick reference.
                      </p>
                      <button
                        type="button"
                        onClick={() => goToTab && goToTab('candidates')}
                        className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 text-xs font-headline font-bold rounded-none hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Explore Candidate Directory</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentlyViewed.slice(0, 5).map((cand) => {
                  const fullCand = candidates.find(c => (c.id || c._id) === (cand.id || cand._id)) || cand;
                  const initial = fullCand.name?.charAt(0)?.toUpperCase() || 'C';
                  const candTitle = fullCand.title || fullCand.designation || 'Software Engineer';
                  const candLocation = fullCand.location || (fullCand.preferredLocations && fullCand.preferredLocations[0]) || (fullCand.preferredWorkModes && fullCand.preferredWorkModes[0]) || 'Available';
                  const topSkills = (fullCand.skills || []).slice(0, 3);

                  return (
                    <tr
                      key={cand.id || cand._id}
                      onClick={() => {
                        setSelectedCandidate(fullCand);
                        recordViewedCandidate(fullCand, recruiterId);
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer border-b border-slate-200 dark:border-slate-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-none bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden font-headline">
                            {fullCand.profilePic ? (
                              <img src={fullCand.profilePic} alt={fullCand.name} className="w-full h-full object-cover" />
                            ) : (
                              initial
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 transition-colors font-headline">
                                {fullCand.name}
                              </p>
                              {fullCand.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 inline shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 font-medium">
                              {fullCand.username ? `@${fullCand.username}` : (fullCand.email || '')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 font-headline">{candTitle}</p>
                        <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 font-medium">{candLocation}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {topSkills.length > 0 ? (
                            topSkills.map((s, idx) => {
                              const sName = typeof s === 'string' ? s : s.name;
                              const sRating = s.verifiedRating || s.rating;
                              const isVerified = Boolean(s.verifiedRating && s.verifiedRating > 0);
                              return (
                                <span
                                  key={idx}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-none border font-headline font-bold ${
                                    isVerified
                                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
                                      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {sName} {sRating ? <span className="font-extrabold ml-0.5">Lvl {sRating}</span> : ''}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400 italic">General Profile</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-sans text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatViewedTime(cand.viewedAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(fullCand);
                            recordViewedCandidate(fullCand, recruiterId);
                          }}
                          className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-xs inline-flex items-center gap-1 font-headline cursor-pointer transition-colors"
                        >
                          <span>View Profile</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
}
