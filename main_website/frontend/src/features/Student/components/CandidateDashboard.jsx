import { useMemo } from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ArrowRight,
  Award,
  Zap,
  MapPin,
  Layers,
  Flame
} from 'lucide-react';
import { getApplicationStage } from '../../../utils/hiringProgress';

export default function CandidateDashboard({
  profile,
  user,
  jobs = [],
  applications = [],
  goToTab,
  onSelectJob,
  setTestSkill
}) {
  const candidateName = profile?.name || user?.name || 'Candidate';

  // 1. Compute Pipeline Stage Metrics across all applications
  const pipelineMetrics = useMemo(() => {
    const counts = {
      applied: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
      total: applications.length
    };

    applications.forEach(app => {
      const stage = getApplicationStage(app);
      if (stage === 'REJECTED') {
        counts.rejected += 1;
      } else if (stage === 'HIRED') {
        counts.hired += 1;
      } else if (stage === 'INTERVIEW') {
        counts.interview += 1;
      } else if (stage === 'SHORTLISTED') {
        counts.shortlisted += 1;
      } else {
        counts.applied += 1;
      }
    });

    return counts;
  }, [applications]);

  // 2. Compute Matching Jobs (recommendation score >= 50% or matched flag)
  const matchingJobsCount = useMemo(() => {
    return jobs.filter(j => j.matched || (j.recommendationScore ?? 0) >= 50).length;
  }, [jobs]);

  // 3. Dynamic In-Demand Market Skills Analysis (across all active jobs)
  const marketDemandAnalysis = useMemo(() => {
    const totalJobs = jobs.length;
    if (totalJobs === 0) {
      return { topSkills: [], candidateMarketCoverage: 0 };
    }

    const skillMap = {};

    jobs.forEach(job => {
      const reqs = Array.isArray(job.requirements) ? job.requirements : [];
      const seenInThisJob = new Set();

      reqs.forEach(req => {
        const rawName = (typeof req === 'string' ? req : req.skillName || req.name || '').trim();
        if (!rawName) return;
        const key = rawName.toLowerCase();
        if (seenInThisJob.has(key)) return;
        seenInThisJob.add(key);

        const rating = (typeof req === 'object' && typeof req.minRating === 'number' && req.minRating > 0)
          ? req.minRating
          : 1;

        if (!skillMap[key]) {
          skillMap[key] = {
            name: rawName,
            key,
            jobCount: 0,
            ratingSum: 0
          };
        }
        skillMap[key].jobCount += 1;
        skillMap[key].ratingSum += rating;
      });
    });

    // Build candidate skill lookup
    const candidateSkillsMap = {};
    (profile?.skills || []).forEach(s => {
      if (!s || !s.name) return;
      candidateSkillsMap[s.name.toLowerCase()] = {
        rating: s.rating || 0,
        verifiedRating: s.verifiedRating || 0,
        isVerified: Boolean(s.verifiedRating && s.verifiedRating > 0)
      };
    });

    const skillList = Object.values(skillMap).map(item => {
      const frequency = totalJobs > 0 ? (item.jobCount / totalJobs) : 0;
      const frequencyPercent = Math.round(frequency * 100);
      const avgRating = Math.round((item.ratingSum / item.jobCount) * 10) / 10;
      const candSkill = candidateSkillsMap[item.key];

      return {
        name: item.name,
        key: item.key,
        jobCount: item.jobCount,
        frequencyPercent,
        avgRating,
        candidateHasSkill: Boolean(candSkill),
        candidateRating: candSkill ? (candSkill.verifiedRating || candSkill.rating) : 0,
        isVerified: Boolean(candSkill?.isVerified)
      };
    });

    // Sort by frequency descending, then jobCount descending
    skillList.sort((a, b) => b.jobCount - a.jobCount || b.avgRating - a.avgRating);

    const topSkills = skillList.slice(0, 6);
    const matchedTopSkills = topSkills.filter(s => s.candidateHasSkill).length;
    const candidateMarketCoverage = topSkills.length > 0
      ? Math.round((matchedTopSkills / topSkills.length) * 100)
      : 0;

    return {
      topSkills,
      candidateMarketCoverage,
      totalDemandSkills: skillList.length
    };
  }, [jobs, profile]);

  // Unapplied jobs, best match first. The first 3 are shown as Top Matches; the
  // full order is handed to the job brief so its Previous/Next can follow it
  // (StudentLayout caps it for free-plan candidates).
  const recommendedJobOrder = useMemo(() => {
    return [...jobs]
      .filter(j => !j.applied)
      .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));
  }, [jobs]);
  const topRecommendedJobs = useMemo(() => recommendedJobOrder.slice(0, 3), [recommendedJobOrder]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in text-left pb-16">
      {/* 1. Header Banner */}
      <header className="bg-surface border border-slate-300 dark:border-slate-700 p-5 sm:p-6 rounded-none shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-headline font-bold tracking-wider rounded-none bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            <span>Candidate Live Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome back, {candidateName}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-sans font-medium mt-1">
            Real-time hiring pipeline metrics, market skill demand analytics, and personalized opportunities.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => goToTab?.('opportunities')}
            className="w-full md:w-auto px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-xs font-headline font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Explore Opportunities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Top Section: Market In-Demand Skills Analytics (Dynamic & Visual) */}
      <section className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Most In-Demand Skills in Current Market
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium mt-0.5">
              Live industry demand aggregated across {jobs.length} active opportunities on AlignGrade.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-surface-container border border-slate-300 dark:border-slate-700 text-xs font-headline font-semibold text-slate-800 dark:text-slate-200 rounded-none flex items-center gap-2">
              <span className="text-slate-500">Your Market Alignment:</span>
              <span className="font-bold text-blue-700 dark:text-blue-300 font-mono">
                {marketDemandAnalysis.candidateMarketCoverage}%
              </span>
            </div>
          </div>
        </div>

        {/* Visual Demand Skills Grid */}
        {marketDemandAnalysis.topSkills.length === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs font-sans">
            No active skill requirements detected in current listings.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketDemandAnalysis.topSkills.map((skill, idx) => {
              const hasSkill = skill.candidateHasSkill;
              const isVerified = skill.isVerified;

              return (
                <div
                  key={skill.key || idx}
                  className="bg-surface-container border border-slate-300 dark:border-slate-700 p-4 rounded-none space-y-3 hover:border-blue-600 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {skill.name}
                      </span>
                      <span className="text-[10px] font-headline font-bold px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/70 border border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200 rounded-none shrink-0">
                        {skill.jobCount} {skill.jobCount === 1 ? 'Job' : 'Jobs'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-sans text-slate-600 dark:text-slate-400">
                      <span>Demand Intensity</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{skill.frequencyPercent}% of roles</span>
                    </div>

                    {/* Visual Demand Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-none overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-emerald-600 h-full rounded-none transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, skill.frequencyPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Candidate Status Row */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-sans">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Your Status:</span>
                    {hasSkill ? (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-headline font-bold px-1.5 py-0.5 rounded-none border ${
                        isVerified
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                          : 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 text-blue-900 dark:text-blue-200'
                      }`}>
                        {isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>Lvl {skill.candidateRating} {isVerified ? '✓ Verified' : ''}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTestSkill?.({ skillName: skill.name, targetRating: Math.round(skill.avgRating) });
                          goToTab?.('tests');
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-headline font-bold px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 rounded-none cursor-pointer transition-colors"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-600" />
                        <span>Take Test</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Recommended Opportunities Preview (Top Matches), directly below market demand */}
      {topRecommendedJobs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Top Matches for Your Profile
              </h3>
            </div>
            <button
              type="button"
              onClick={() => goToTab?.('opportunities', { subTab: 'recommended' })}
              className="text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All Recommendations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topRecommendedJobs.map(job => (
              <div
                key={job.id}
                onClick={() => onSelectJob?.(job, recommendedJobOrder.map(j => j.id))}
                className="bg-surface hover:bg-surface-container border border-slate-300 dark:border-slate-700 hover:border-blue-700 p-5 rounded-none shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 text-left"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-headline font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {job.title}
                    </h4>
                    {job.recommendationScore !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-headline font-bold bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400 text-emerald-900 dark:text-emerald-200 rounded-none shrink-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>{job.recommendationScore}%</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-sans text-slate-600 dark:text-slate-400 font-semibold truncate">
                    {job.companyName || job.company?.name || 'Company'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                    <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate">{job.location || job.workMode || 'Remote'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-blue-700 dark:text-blue-400">
                  <span>View Brief</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Primary Metrics Grid (Separate Boxes for All Dropdown Stages + Matching) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-headline font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recruitment Pipeline & Opportunity Metrics
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-sans font-medium mt-0.5">
              Live status counts with direct navigation to corresponding opportunity stages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Matching Opportunities */}
          <div
            onClick={() => goToTab?.('opportunities', { subTab: 'recommended' })}
            className="group bg-surface border border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-none p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Matching Jobs
                </span>
                <div className="w-8 h-8 rounded-none bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100">
                {matchingJobsCount}
              </div>
              <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                Aligned with your skills & preferences
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 transition-colors">
              <span>View Openings</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Applied (Screening Pending) */}
          <div
            onClick={() => goToTab?.('opportunities', { subTab: 'applied' })}
            className="group bg-surface border border-slate-300 dark:border-slate-700 hover:border-blue-600 rounded-none p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Applied (Pending)
                </span>
                <div className="w-8 h-8 rounded-none bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-700 flex items-center justify-center text-blue-700 dark:text-blue-300">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100">
                {pipelineMetrics.applied}
              </div>
              <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                Submitted applications pending screening
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 transition-colors">
              <span>View Applied</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Shortlisted */}
          <div
            onClick={() => goToTab?.('progress', { stage: 'SHORTLISTED' })}
            className="group bg-surface border border-slate-300 dark:border-slate-700 hover:border-indigo-600 rounded-none p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Shortlisted
                </span>
                <div className="w-8 h-8 rounded-none bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100">
                {pipelineMetrics.shortlisted}
              </div>
              <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                Profile cleared recruiter initial screening
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-indigo-700 dark:text-indigo-400 group-hover:text-indigo-800 transition-colors">
              <span>View Progress</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: In Progress / Interview */}
          <div
            onClick={() => goToTab?.('progress', { stage: 'INTERVIEW' })}
            className="group bg-surface border border-slate-300 dark:border-slate-700 hover:border-amber-600 rounded-none p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-600" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  In Progress
                </span>
                <div className="w-8 h-8 rounded-none bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100">
                {pipelineMetrics.interview}
              </div>
              <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                Active technical or round interviews
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-amber-700 dark:text-amber-400 group-hover:text-amber-800 transition-colors">
              <span>View Rounds</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Hired / Selected */}
          <div
            onClick={() => goToTab?.('progress', { stage: 'HIRED' })}
            className="group bg-surface border border-slate-300 dark:border-slate-700 hover:border-emerald-600 rounded-none p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Hired / Selected
                </span>
                <div className="w-8 h-8 rounded-none bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100">
                {pipelineMetrics.hired}
              </div>
              <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                Successful selections & offer stages
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-800 transition-colors">
              <span>View Offers</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Rejected */}
          <div
            onClick={() => goToTab?.('progress', { stage: 'REJECTED' })}
            className="group bg-surface border border-slate-300 dark:border-slate-700 hover:border-red-600 rounded-none p-4.5 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-headline font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Rejected
                </span>
                <div className="w-8 h-8 rounded-none bg-red-50 dark:bg-red-950/70 border border-red-300 dark:border-red-700 flex items-center justify-center text-red-700 dark:text-red-300">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-headline font-bold text-slate-900 dark:text-slate-100">
                {pipelineMetrics.rejected}
              </div>
              <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-snug">
                Applications closed or not progressed
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-headline font-bold text-red-700 dark:text-red-400 group-hover:text-red-800 transition-colors">
              <span>View Feedback</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Visual Funnel Representation */}
      <section className="bg-surface border border-slate-300 dark:border-slate-700 rounded-none p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <h3 className="text-base sm:text-lg font-headline font-bold text-slate-900 dark:text-slate-100">
              Your Application Funnel & Conversion Rates
            </h3>
          </div>
          <span className="text-xs font-sans text-slate-500 dark:text-slate-400">
            Total Tracked: {pipelineMetrics.total}
          </span>
        </div>

        {pipelineMetrics.total === 0 ? (
          <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs font-sans">
            You haven&apos;t applied to any opportunities yet. Explore open jobs to begin your recruitment journey.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {[
              {
                label: '1. Applied',
                count: pipelineMetrics.total,
                percent: 100,
                color: 'bg-blue-600'
              },
              {
                label: '2. Shortlisted',
                count: pipelineMetrics.shortlisted + pipelineMetrics.interview + pipelineMetrics.hired,
                percent: Math.round(((pipelineMetrics.shortlisted + pipelineMetrics.interview + pipelineMetrics.hired) / pipelineMetrics.total) * 100),
                color: 'bg-indigo-600'
              },
              {
                label: '3. In Interview',
                count: pipelineMetrics.interview + pipelineMetrics.hired,
                percent: Math.round(((pipelineMetrics.interview + pipelineMetrics.hired) / pipelineMetrics.total) * 100),
                color: 'bg-amber-600'
              },
              {
                label: '4. Selected / Hired',
                count: pipelineMetrics.hired,
                percent: Math.round((pipelineMetrics.hired / pipelineMetrics.total) * 100),
                color: 'bg-emerald-600'
              }
            ].map((step, sIdx) => (
              <div key={sIdx} className="bg-surface-container border border-slate-300 dark:border-slate-700 p-4 rounded-none space-y-2">
                <div className="flex justify-between items-center text-xs font-headline font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{step.label}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-mono">{step.count} ({step.percent}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-none overflow-hidden">
                  <div
                    className={`${step.color} h-full transition-all duration-500`}
                    style={{ width: `${Math.max(4, step.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
