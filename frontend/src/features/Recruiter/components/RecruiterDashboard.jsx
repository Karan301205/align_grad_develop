import React, { useState, useRef } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import CandidateProfileModal from './CandidateProfileModal';

export default function RecruiterDashboard({ company, jobs = [], candidates = [], goToTab }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -344 : 344;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Derive counts & live metrics from database props
  const activeJobsCount = jobs.filter(j => j.status !== 'CLOSED').length;
  const totalCandidatesCount = candidates.length;

  // Compile live applications queue across all posted jobs
  const recentApplications = [];
  (jobs || []).forEach(job => {
    const apps = job.applications || job.applicants || [];
    apps.forEach(app => {
      const candidateProfile = app.student || candidates.find(c => c.id === app.studentId || c.userId === app.studentId);
      recentApplications.push({
        id: app.id || app._id || `${job.id}-${app.studentId || Math.random()}`,
        candidateName: candidateProfile?.name || app.name || 'Candidate',
        email: candidateProfile?.email || app.email || 'N/A',
        profilePic: candidateProfile?.profilePic || app.profilePic,
        position: job.title || 'Job Opening',
        department: job.domain || 'Technology',
        appliedDate: app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
        status: app.status || 'Applied',
        rawCandidate: candidateProfile
      });
    });
  });

  // Gather all required technical skills across recruiter's current & past job postings
  const recruiterSkillSet = new Set();
  (jobs || []).forEach(job => {
    if (job.requirements && Array.isArray(job.requirements)) {
      job.requirements.forEach(req => {
        const skillName = (typeof req === 'string' ? req : req.skillName || req.name || '').trim().toLowerCase();
        if (skillName) {
          recruiterSkillSet.add(skillName);
        }
      });
    }
  });

  // Filter top verified candidates to ONLY include those matching recruiter's job skills
  const topTalent = candidates.filter(cand => {
    const candSkills = cand.skills || [];

    // Check if candidate has at least one skill matching recruiter's posted job requirements
    const matchingSkills = candSkills.filter(s => {
      const sName = (typeof s === 'string' ? s : s.name || '').trim().toLowerCase();
      return recruiterSkillSet.has(sName);
    });

    // If recruiter has posted jobs with requirements, ONLY show candidates who match at least one required skill
    if (recruiterSkillSet.size > 0 && matchingSkills.length === 0) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (cand.name || '').toLowerCase().includes(q) || (cand.username || '').toLowerCase().includes(q);
  }).map(cand => {
    const candSkills = cand.skills || [];
    const matchingSkills = candSkills.filter(s => {
      const sName = (typeof s === 'string' ? s : s.name || '').trim().toLowerCase();
      return recruiterSkillSet.has(sName);
    });

    const matchScoreVal = recruiterSkillSet.size > 0
      ? Math.min(99, Math.max(70, Math.round((matchingSkills.length / Math.min(recruiterSkillSet.size, 5)) * 100)))
      : 85;

    return {
      ...cand,
      matchScore: `${matchScoreVal}%`,
      matchingSkillsCount: matchingSkills.length
    };
  }).sort((a, b) => b.matchingSkillsCount - a.matchingSkillsCount);

  // Fallback top talent only when no recruiter jobs or candidates are loaded
  const displayTalent = topTalent;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in text-left">

      {/* Top Header Action Bar */}
      <header className="bg-surface border border-outline-variant/80 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Recruiter Executive Hub</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">
            Recruiter Dashboard
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant font-medium mt-1">
            Welcome back, <span className="font-bold text-on-surface">{company?.name || 'Sarah'}</span>. Here is your real-time recruitment overview.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidates..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Notifications Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-all shrink-0 cursor-pointer shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 text-on-surface-variant" />
          </button>

          {/* Recruiter Avatar */}
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary border border-primary/30 overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm shadow-sm font-headline">
            {company?.logo ? (
              <img src={company.logo} alt="Recruiter Avatar" className="w-full h-full object-cover" />
            ) : (
              company?.name?.charAt(0) || 'R'
            )}
          </div>
        </div>
      </header>

      {/* KPI Cards Bento Grid (Vibrant 3-Column Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Active Jobs */}
        <div
          onClick={() => goToTab && goToTab('jobs')}
          className="bg-surface border border-outline-variant/80 hover:border-primary rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer border-t-4 border-t-primary relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-xs">
              <Briefcase className="w-6 h-6" />
            </div>
            {/* <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
              
            </span> */}
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1 font-bold">
            Active Jobs
          </p>
          <p className="text-4xl font-headline font-black text-on-surface">
            {activeJobsCount}
          </p>
        </div>

        {/* Card 2: New Candidates */}
        <div
          onClick={() => goToTab && goToTab('candidates')}
          className="bg-surface border border-outline-variant/80 hover:border-secondary rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer border-t-4 border-t-secondary relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-all shadow-xs">
              <UserPlus className="w-6 h-6" />
            </div>
            {/* <span className="text-xs font-mono font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg border border-secondary/20">
              New
            </span> */}
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1 font-bold">
            New Candidates
          </p>
          <p className="text-4xl font-headline font-black text-on-surface">
            {totalCandidatesCount}
          </p>
        </div>

        {/* Card 3: Interviews Today */}
        <div className="bg-surface border border-outline-variant/80 hover:border-warning rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer border-t-4 border-t-warning relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-xl flex items-center justify-center group-hover:bg-warning group-hover:text-on-warning transition-all shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            {/* <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
              Priority
            </span> */}
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1 font-bold">
            Interviews Today
          </p>
          <p className="text-4xl font-headline font-black text-on-surface">
            {recentApplications.length}
          </p>
        </div>

      </div>

      {/* Top Verified Talent Carousel Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-headline font-bold text-on-surface tracking-tight">Top Verified Talent</h3>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Pre-verified candidates matched to your technical stack requirements.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="w-9 h-9 rounded-full border border-outline-variant bg-surface hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-all cursor-pointer shadow-2xs"
              aria-label="Previous talent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="w-9 h-9 rounded-full border border-outline-variant bg-surface hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-all cursor-pointer shadow-2xs"
              aria-label="Next talent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div ref={carouselRef} className="flex gap-6 overflow-x-auto pb-3 custom-scrollbar scroll-smooth">
          {displayTalent.length === 0 ? (
            <div className="w-full bg-surface border border-outline-variant/80 rounded-2xl p-8 text-center space-y-2 font-mono">
              <p className="text-sm font-bold text-on-surface">No matching verified candidates</p>
              <p className="text-xs text-on-surface-variant">No candidates currently match the technical skill requirements from your active or past job postings.</p>
            </div>
          ) : (
            displayTalent.map((cand, idx) => (
              <div
                key={cand.id || idx}
                onClick={() => cand.rawCandidate ? setSelectedCandidate(cand.rawCandidate) : setSelectedCandidate(cand)}
                className="min-w-[320px] max-w-[340px] bg-surface border border-outline-variant/80 hover:border-primary/80 rounded-2xl p-6 flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:shadow-md hover:-translate-y-0.5 shrink-0"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 bg-primary/10 text-primary font-bold text-sm shrink-0 flex items-center justify-center shadow-2xs font-headline">
                      {cand.avatar || cand.profilePic ? (
                        <img src={cand.avatar || cand.profilePic} alt={cand.name} className="w-full h-full object-cover" />
                      ) : (
                        cand.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate font-headline">
                        {cand.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-mono truncate">
                        {cand.title || cand.username ? `@${cand.username}` : 'Full-Stack Engineer'}
                      </p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <div className="w-7 h-7 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Colored Skill Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cand.skills && cand.skills.length > 0 ? (
                      cand.skills.slice(0, 4).map((s, i) => {
                        const name = typeof s === 'string' ? s : s.name;
                        const rating = typeof s === 'object' ? s.rating : null;
                        const pillStyles = [
                          'bg-primary/10 text-primary border-primary/20',
                          'bg-secondary/10 text-secondary border-secondary/20',
                          'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        ][i % 3];

                        return (
                          <span key={i} className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono font-bold ${pillStyles}`}>
                            {name} {rating ? <span className="underline ml-0.5">Lvl {rating}</span> : ''}
                          </span>
                        );
                      })
                    ) : (
                      <>
                        <span className="text-[11px] px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg font-mono font-bold">TypeScript</span>
                        <span className="text-[11px] px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg font-mono font-bold">Rust</span>
                        <span className="text-[11px] px-2.5 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-lg font-mono font-bold">AWS</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/60 flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant font-medium">
                    Match Score: <span className="font-bold text-primary font-sans text-sm">{cand.matchScore || `${98 - idx * 3}%`}</span>
                  </span>
                  <button
                    type="button"
                    className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform cursor-pointer font-headline"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recent Applications Table Section */}
      <section className="bg-surface border border-outline-variant/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low">
          <h3 className="text-lg font-headline font-bold text-on-surface tracking-tight">Recent Applications</h3>
          <button
            type="button"
            onClick={() => goToTab && goToTab('candidates')}
            className="text-xs font-mono font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-high/60 border-b border-outline-variant/60">
              <tr>
                <th className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">Candidate</th>
                <th className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">Position</th>
                <th className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">Applied Date</th>
                <th className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">Status</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {recentApplications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center font-mono text-xs text-on-surface-variant font-medium">
                    no registration right now
                  </td>
                </tr>
              ) : (
                recentApplications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => app.rawCandidate && setSelectedCandidate(app.rawCandidate)}
                    className="hover:bg-primary/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden font-headline">
                          {app.profilePic ? (
                            <img src={app.profilePic} alt={app.candidateName} className="w-full h-full object-cover" />
                          ) : (
                            app.candidateName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors font-headline">{app.candidateName}</p>
                          <p className="text-[11px] font-mono text-on-surface-variant">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-on-surface">{app.position}</p>
                      <p className="text-[11px] font-mono text-on-surface-variant">{app.department}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">
                      {app.appliedDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${app.status === 'Offer'
                        ? 'bg-secondary/15 text-secondary border border-secondary/30'
                        : app.status === 'Interviewing'
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
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
