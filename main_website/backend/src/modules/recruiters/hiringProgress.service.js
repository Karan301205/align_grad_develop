/**
 * Hiring Progress Snapshot Service
 *
 * Single Responsibility: Categorize application progression and calculate
 * real-time recruitment pipeline metrics (Applicants, Shortlisted, Interviews, Hires)
 * from existing application statuses and round evaluations.
 */

/**
 * Categorizes an individual application into its canonical hiring stage.
 * Reuses existing application and round statuses without requiring schema mutations.
 *
 * @param {Object} app - Application object containing status and optional roundStatuses
 * @returns {'HIRED' | 'INTERVIEW' | 'SHORTLISTED' | 'APPLIED' | 'REJECTED'}
 */
function getApplicationStage(app) {
  if (!app) return 'APPLIED';

  const rawStatus = (app.status || 'APPLIED').toUpperCase().trim();
  const rounds = Array.isArray(app.roundStatuses) ? app.roundStatuses : [];

  // 1. Rejected (explicit rejection on status or any round)
  const isExplicitlyRejected = rawStatus === 'REJECTED';
  const hasRejectedRound = rounds.some(r => (r.status || '').toUpperCase().trim() === 'REJECTED');

  if (isExplicitlyRejected || hasRejectedRound) {
    return 'REJECTED';
  }

  // 2. Hired / Selected (explicit selection, or all multiple rounds cleared without being in early stage)
  const isExplicitlyHired = ['SELECTED', 'HIRED', 'OFFER_RECEIVED'].includes(rawStatus);
  const allRoundsCleared =
    rounds.length > 0 &&
    rawStatus !== 'SHORTLISTED' &&
    rawStatus !== 'APPLIED' &&
    rounds.every(r => ['CLEARED', 'QUALIFIED', 'SELECTED'].includes((r.status || '').toUpperCase().trim()));

  if (isExplicitlyHired || allRoundsCleared) {
    return 'HIRED';
  }

  // 3. Interview Stage (active/scheduled rounds, or beyond initial screening)
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

  // 4. Shortlisted (passed initial screening / explicitly shortlisted)
  const isExplicitShortlisted = rawStatus === 'SHORTLISTED';
  const hasScreeningCleared = rounds.some(r => {
    const s = (r.status || '').toUpperCase().trim();
    return ['CLEARED', 'QUALIFIED'].includes(s);
  });

  if (isExplicitShortlisted || hasScreeningCleared || rawStatus === 'IN_PROGRESS') {
    return 'SHORTLISTED';
  }

  // 5. Default: Initial Application Submitted
  return 'APPLIED';
}

/**
 * Calculates hiring progress metrics across a collection of jobs or applications.
 *
 * @param {Array<Object>} jobs - Array of job objects with optional embedded applications
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
function calculateHiringProgressSnapshot(jobs = []) {
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

  // Extract all applications across the supplied jobs
  const allApplications = jobs.flatMap(job => {
    if (!job) return [];
    if (Array.isArray(job.applications)) return job.applications;
    // Handle case if a list of applications was passed directly
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

module.exports = {
  getApplicationStage,
  calculateHiringProgressSnapshot
};
