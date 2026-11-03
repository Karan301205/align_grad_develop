/**
 * Recruiter Hiring Progress Snapshot Utility
 *
 * Single Responsibility: Categorize applications into canonical pipeline stages
 * and compute aggregate recruiter pipeline metrics (Applicants, Shortlisted, Interviews, Hires).
 * Reuses existing application and round evaluation statuses.
 */

/**
 * Returns the canonical pipeline stage for an application.
 *
 * @param {Object} app - Application object with status and roundStatuses
 * @returns {'HIRED' | 'INTERVIEW' | 'SHORTLISTED' | 'APPLIED' | 'REJECTED'}
 */
export function getApplicationStage(app) {
  if (!app) return 'APPLIED';

  const rawStatus = (app.status || 'APPLIED').toUpperCase().trim();
  const rounds = Array.isArray(app.roundStatuses) ? app.roundStatuses : [];

  // 1. Rejected
  const isExplicitlyRejected = rawStatus === 'REJECTED';
  const hasRejectedRound = rounds.some(r => (r.status || '').toUpperCase().trim() === 'REJECTED');
  if (isExplicitlyRejected || hasRejectedRound) {
    return 'REJECTED';
  }

  // 2. Hired / Selected
  const isExplicitlyHired = ['SELECTED', 'HIRED', 'OFFER_RECEIVED'].includes(rawStatus);
  const allRoundsCleared =
    rounds.length > 0 &&
    rawStatus !== 'SHORTLISTED' &&
    rawStatus !== 'APPLIED' &&
    rounds.every(r => ['CLEARED', 'QUALIFIED', 'SELECTED'].includes((r.status || '').toUpperCase().trim()));

  if (isExplicitlyHired || allRoundsCleared) {
    return 'HIRED';
  }

  // 3. Interview Stage
  const isExplicitInterview = ['INTERVIEW', 'SCHEDULED'].includes(rawStatus);
  const hasInterviewRoundActivity = rounds.some(r => {
    const s = (r.status || '').toUpperCase().trim();
    const name = (r.name || '').toLowerCase();
    const isInterviewName =
      name.includes('interview') ||
      name.includes('discussion') ||
      name.includes('technical') ||
      name.includes('coding') ||
      name.includes('hr');
    const isLaterRound = typeof r.roundNumber === 'number' && r.roundNumber > 1;

    return (
      s === 'SCHEDULED' ||
      s === 'IN_PROGRESS' ||
      ((isInterviewName || isLaterRound) && ['CLEARED', 'QUALIFIED'].includes(s))
    );
  });

  if (isExplicitInterview || (hasInterviewRoundActivity && rawStatus !== 'SHORTLISTED')) {
    return 'INTERVIEW';
  }

  // 4. Shortlisted
  const isExplicitShortlisted = rawStatus === 'SHORTLISTED';
  const hasScreeningCleared = rounds.some(r => {
    const s = (r.status || '').toUpperCase().trim();
    return ['CLEARED', 'QUALIFIED'].includes(s);
  });

  if (isExplicitShortlisted || hasScreeningCleared || rawStatus === 'IN_PROGRESS') {
    return 'SHORTLISTED';
  }

  // 5. Default Applied
  return 'APPLIED';
}

/**
 * Calculates aggregate hiring progress snapshot metrics across all jobs.
 *
 * @param {Array<Object>} jobs - List of jobs containing applications
 * @returns {{
 *   totalApplicants: number,
 *   shortlisted: number,
 *   interviews: number,
 *   hires: number,
 *   rejected: number,
 *   stages: {
 *     applied: number,
 *     shortlisted: number,
 *     interviews: number,
 *     hires: number,
 *     rejected: number
 *   }
 * }}
 */
export function calculateHiringProgressSnapshot(jobs = []) {
  if (!Array.isArray(jobs)) {
    return {
      totalApplicants: 0,
      shortlisted: 0,
      interviews: 0,
      hires: 0,
      rejected: 0,
      stages: { applied: 0, shortlisted: 0, interviews: 0, hires: 0, rejected: 0 }
    };
  }

  const allApplications = jobs.flatMap(job => {
    if (!job) return [];
    if (Array.isArray(job.applications)) return job.applications;
    if (job.jobId || job.studentId) return [job];
    return [];
  });

  let totalApplicants = allApplications.length;
  let shortlisted = 0;
  let interviews = 0;
  let hires = 0;
  let rejected = 0;

  const stages = {
    applied: 0,
    shortlisted: 0,
    interviews: 0,
    hires: 0,
    rejected: 0
  };

  for (const app of allApplications) {
    const stage = getApplicationStage(app);

    switch (stage) {
      case 'HIRED':
        hires++;
        interviews++;
        shortlisted++;
        stages.hires++;
        break;
      case 'INTERVIEW':
        interviews++;
        shortlisted++;
        stages.interviews++;
        break;
      case 'SHORTLISTED':
        shortlisted++;
        stages.shortlisted++;
        break;
      case 'REJECTED':
        rejected++;
        stages.rejected++;
        break;
      case 'APPLIED':
      default:
        stages.applied++;
        break;
    }
  }

  return {
    totalApplicants,
    shortlisted,
    interviews,
    hires,
    rejected,
    stages
  };
}

/**
 * Visual styling token configuration for each pipeline stage.
 */
export const STAGE_CONFIG = {
  APPLIED: {
    label: 'Applied',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200',
    dotClass: 'bg-slate-500'
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badgeClass: 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200',
    dotClass: 'bg-indigo-600'
  },
  INTERVIEW: {
    label: 'In Interview',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200',
    dotClass: 'bg-amber-500'
  },
  HIRED: {
    label: 'Hired / Selected',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200',
    dotClass: 'bg-emerald-600'
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-rose-100 dark:bg-rose-950/70 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-200',
    dotClass: 'bg-rose-600'
  }
};
