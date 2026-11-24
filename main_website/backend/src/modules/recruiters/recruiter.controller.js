const { prisma } = require('../../infrastructure/database');
const { expiryFrom, isJobOpen } = require('../jobs/jobLifecycle.service');
const { deleteS3ObjectFromUrl } = require('../../services/fileCleanup.service');
const { buildRecruiterDemandProfile } = require('../skills/skillMatching.service');
const { searchCandidates: searchCandidateCards, candidateFacets } = require('./candidateSearch.service');
const { redactCandidateContact } = require('./candidateContact');
const { toCandidateQuestions } = require('../jobs/screeningQuestions');
const { rankProjectsByRequirements } = require('../skills/projectRelevance.service');
const {
  VERIFICATION_STATUS,
  resolveVerificationStatus,
  withVerificationStatus
} = require('./companyVerification');
const {
  MAX_OFFICE_PHOTOS,
  getSubmissionProblems,
  buildJobQuota,
  isOwnUpload
} = require('./companyProfile');
const { getPublicUrl } = require('../../infrastructure/storage/s3');
const { randomUUID } = require('crypto');
const { normalizeQuestions } = require('../jobs/screeningQuestions');
const { PLANS, formatInr } = require('../payments/plans');
const { summarizePool } = require('../jobs/eligiblePool');
const { cached, invalidate } = require('../../shared/cache/ttlCache');
const { getQuizSkills } = require('../skills/quizSkills');

const RECRUITER_PACK = PLANS.RECRUITER_5_PACK;

// Job/internship posts made so far (gigs excluded). Stored on the company and only ever counted
// up (see postJob), so closing, slimming or deleting a job never gives a credit back.
const usedJobCredits = (company) => company.jobsPosted ?? 0;

// Profile ids of candidates who applied to one of this company's jobs: only for them are contact
// details shown to the recruiter (ISSUES A3).
async function applicantProfileIdsFor(companyId) {
  if (!companyId) return new Set();
  const jobs = await prisma.job.findMany({ where: { companyId }, select: { id: true } });
  if (jobs.length === 0) return new Set();
  const applications = await prisma.application.findMany({
    where: { jobId: { in: jobs.map((job) => job.id) } },
    select: { studentId: true }
  });
  return new Set(applications.map((application) => application.studentId));
}

// Company fields only the company's own account may see (verification paperwork, the official
// email and review notes). Anyone else gets the rest (ISSUES S2, G3).
const PRIVATE_COMPANY_FIELDS = [
  'verificationDocs', 'docUrl', 'verificationNote', 'verificationReviewedBy',
  'verificationReviewedAt', 'verificationSubmittedAt', 'officialEmail'
];
const withoutFields = (row, fields) => Object.fromEntries(Object.entries(row).filter(([key]) => !fields.includes(key)));
// Job and gig rows for other people: the screening questions without their answer keys.
const withCandidateQuestions = (row) => ({ ...row, screeningQuestions: toCandidateQuestions(row.screeningQuestions) });

exports.getCompany = async (req, res) => {
  try {
    let company = await prisma.company.findFirst({
      where: { OR: [{ userId: req.user.id }, { id: req.user.id }] }
    });
    if (!company) {
      const defaultName = req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'Recruiter Company');
      try {
        company = await prisma.company.create({
          data: {
            userId: req.user.id,
            name: defaultName,
            website: '',
            verified: false,
            verificationStatus: VERIFICATION_STATUS.NOT_SUBMITTED
          }
        });
      } catch (createErr) {
        company = {
          userId: req.user.id,
          name: defaultName,
          website: '',
          verified: false,
          verificationStatus: VERIFICATION_STATUS.NOT_SUBMITTED
        };
      }
    }
    const usedJobs = usedJobCredits(company);
    res.json({
      ...withVerificationStatus(company),
      jobQuota: buildJobQuota(company.jobPostingQuota, usedJobs)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching company' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const existingCompany = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!existingCompany) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const status = resolveVerificationStatus(existingCompany);
    if (status === VERIFICATION_STATUS.PENDING || status === VERIFICATION_STATUS.APPROVED) {
      return res.status(409).json({
        error: status === VERIFICATION_STATUS.PENDING
          ? 'Your company profile is under admin review and cannot be edited right now.'
          : 'Your company profile has been approved and is locked.',
        verificationStatus: status
      });
    }

    if (req.body.logoUrl && existingCompany.logoUrl && existingCompany.logoUrl !== req.body.logoUrl) {
      try {
        await deleteS3ObjectFromUrl(existingCompany.logoUrl, 'company logo', [req.user.id, existingCompany.id]);
      } catch (deleteErr) {
        console.error('Failed to delete old company logo from S3:', deleteErr);
      }
    }

    const updated = await prisma.company.update({
      where: { userId: req.user.id },
      data: req.body
    });
    res.json(withVerificationStatus(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating company profile' });
  }
};

// Office showcase gallery. Unlike the rest of the profile it stays editable
// while the company is under review or approved: photos are not part of verification.
exports.updateCompanyPhotos = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const current = Array.isArray(company.photos) ? company.photos : [];
    const photos = [...new Set(req.body.photos)];
    const added = photos.filter((url) => !current.includes(url));
    if (added.length > 0 && photos.length > MAX_OFFICE_PHOTOS) {
      return res.status(400).json({ error: `You can add up to ${MAX_OFFICE_PHOTOS} office photos.` });
    }

    // New photos must be files this recruiter uploaded through /upload, so a
    // later removal can never delete someone else's object.
    const ownPrefixes = [getPublicUrl(`docs/${req.user.id}/`), getPublicUrl(`images/${req.user.id}/`)];
    if (added.some((url) => !isOwnUpload(url, ownPrefixes))) {
      return res.status(400).json({ error: 'Photos must be uploaded from this page.' });
    }

    const updated = await prisma.company.update({
      where: { userId: req.user.id },
      data: { photos }
    });

    const removed = current.filter((url) => !photos.includes(url) && isOwnUpload(url, ownPrefixes));
    for (const url of removed) {
      try {
        await deleteS3ObjectFromUrl(url, 'company office photo', [req.user.id, company.id]);
      } catch (deleteErr) {
        console.error('Failed to delete removed office photo from S3:', deleteErr);
      }
    }

    res.json({ photos: updated.photos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating office photos' });
  }
};

exports.getCompanyById = async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Calculate statistics dynamically:
    // 1. Total Jobs Posted (excluding Gigs)
    const totalJobs = await prisma.job.count({
      where: {
        companyId,
        OR: [
          { opportunityType: null },
          { opportunityType: { not: 'GIG' } }
        ]
      }
    });

    // 2. Total Gigs Posted
    const totalGigs = await prisma.gig.count({
      where: { ownerId: company.userId }
    });

    // 3. Active Openings (jobs past their end date stay in the table now, so leave them out)
    const activeJobs = await prisma.job.count({
      where: {
        companyId,
        expiresAt: { gt: new Date() },
        OR: [
          { opportunityType: null },
          { opportunityType: { not: 'GIG' } }
        ]
      }
    });
    const openGigs = await prisma.gig.count({
      where: {
        ownerId: company.userId,
        status: 'OPEN'
      }
    });
    const activeOpenings = activeJobs + openGigs;

    // 4. Average Company Rating (from completed gig reviews)
    const feedbacks = await prisma.gigReview.findMany({
      where: { revieweeId: company.userId }
    });
    let averageRating = 0;
    if (feedbacks.length > 0) {
      const sum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = Number((sum / feedbacks.length).toFixed(1));
    } else {
      averageRating = 5.0; // Default baseline rating for unrated companies
    }

    // 5. Fetch recent opportunities currently posted by this company
    const companyJobs = await prisma.job.findMany({
      where: {
        companyId,
        OR: [
          { opportunityType: null },
          { opportunityType: { not: 'GIG' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const companyGigs = await prisma.gig.findMany({
      where: {
        ownerId: company.userId,
        status: 'OPEN'
      },
      orderBy: { createdAt: 'desc' }
    });

    const quota = company.jobPostingQuota ?? 1;
    const remainingJobs = Math.max(0, quota - totalJobs);
    const isOwner = Boolean(req.user) && req.user.id === company.userId;

    res.json({
      ...(isOwner ? company : withoutFields(company, PRIVATE_COMPANY_FIELDS)),
      jobPostingQuota: quota,
      stats: {
        totalJobs,
        totalGigs,
        activeOpenings,
        averageRating,
        jobPostingQuota: quota,
        remainingJobs
      },
      opportunities: {
        jobs: isOwner ? companyJobs : companyJobs.map(withCandidateQuestions),
        gigs: isOwner ? companyGigs : companyGigs.map(withCandidateQuestions)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error retrieving company profile' });
  }
};

exports.verifyCompany = async (req, res) => {
  const { docUrl, verificationDocs } = req.body;
  const primaryDocUrl = docUrl || (verificationDocs && verificationDocs[0] ? verificationDocs[0].docUrl : null);
  if (!primaryDocUrl && (!verificationDocs || verificationDocs.length === 0)) {
    return res.status(400).json({ error: 'Please provide document URL or verification documents' });
  }

  try {
    const existingCompany = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!existingCompany) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const currentStatus = resolveVerificationStatus(existingCompany);
    if (currentStatus === VERIFICATION_STATUS.PENDING || currentStatus === VERIFICATION_STATUS.APPROVED) {
      return res.status(409).json({
        error: currentStatus === VERIFICATION_STATUS.PENDING
          ? 'Your verification documents are already under admin review.'
          : 'Your company is already verified.',
        verificationStatus: currentStatus
      });
    }

    // The saved profile and the submitted documents must be complete before an
    // admin is asked to review them (the UI checks this too; this is the authority).
    const problems = getSubmissionProblems(existingCompany, verificationDocs);
    if (problems.length > 0) {
      return res.status(400).json({ error: problems[0], problems });
    }

    if (existingCompany.docUrl && primaryDocUrl && existingCompany.docUrl !== primaryDocUrl) {
      try {
        await deleteS3ObjectFromUrl(existingCompany.docUrl, 'company verification document', [req.user.id, existingCompany.id]);
      } catch (deleteErr) {
        console.error('Failed to delete old company doc from S3:', deleteErr);
      }
    }

    // Verification is granted only by an administrator (admin_ws); submitting
    // documents queues the company for review.
    const updateData = {
      verified: false,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      verificationSubmittedAt: new Date(),
      verificationNote: null,
      verificationReviewedAt: null,
      verificationReviewedBy: null
    };
    if (primaryDocUrl) {
      updateData.docUrl = primaryDocUrl;
    }
    if (Array.isArray(verificationDocs) && verificationDocs.length > 0) {
      updateData.verificationDocs = verificationDocs;
    }

    const company = await prisma.company.update({
      where: { userId: req.user.id },
      data: updateData
    });
    res.json(withVerificationStatus(company));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

exports.postJob = async (req, res) => {
  const { 
    title, 
    description, 
    opportunityType,
    workMode,
    requirements,
    companyName,
    officialWebsite,
    preferredEducation,
    desiredExperience,
    designation,
    stipendPartTime,
    stipendFullTime,
    duration,
    roleResponsibilities,
    location,
    locationUrl,
    activeDays,
    joiningMonth,
    openings,
    selectionProcess,
    screeningQuestions,
    showSalary
  } = req.body;

  if (!title || !description || !requirements) {
    return res.status(400).json({ error: 'Please provide title, description, and requirements' });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    // Job quota (1 free job, +5 for each purchased pack). Each job/internship uses one credit for
    // good; gigs posted here use none but still need a credit left, as before.
    const quota = company.jobPostingQuota ?? 1;
    const limitReached = (used) => res.status(403).json({
      error: `Job posting limit reached (${used}/${quota} jobs posted). Please buy ${RECRUITER_PACK.jobCredits} more job credits for ${formatInr(RECRUITER_PACK.amount)} to continue posting.`,
      code: 'UPGRADE_REQUIRED',
      quota,
      currentJobsCount: used
    });
    if (usedJobCredits(company) >= quota) {
      return limitReached(usedJobCredits(company));
    }

    const usesCredit = (opportunityType || 'JOB') !== 'GIG';
    const days = activeDays ? parseInt(activeDays, 10) : 30;
    const postedAt = new Date();
    const createJob = (client) => client.job.create({
      data: {
        companyId: company.id,
        opportunityType: opportunityType || "JOB",
        workMode: workMode || "Work from office",
        title,
        description,
        companyName,
        officialWebsite,
        preferredEducation,
        desiredExperience,
        designation,
        stipendPartTime,
        stipendFullTime,
        duration,
        roleResponsibilities,
        location,
        locationUrl,
        activeDays: days,
        createdAt: postedAt,
        expiresAt: expiryFrom(postedAt, days),
        joiningMonth: joiningMonth || 'Immediate',
        openings: openings ? parseInt(openings, 10) : null,
        showSalary: showSalary !== undefined ? Boolean(showSalary) : true,
        selectionProcess: selectionProcess || undefined,
        screeningQuestions: screeningQuestions !== undefined
          ? normalizeQuestions(screeningQuestions, randomUUID)
          : undefined,
        requirements
      }
    });

    let job;
    if (usesCredit) {
      // Claim the credit and create the job together. The claim only succeeds while a credit is
      // left, so two posts at the same moment can't both use the last one.
      job = await prisma.$transaction(async (tx) => {
        const claim = await tx.company.updateMany({
          where: { id: company.id, jobsPosted: { lt: quota } },
          data: { jobsPosted: { increment: 1 } }
        });
        return claim.count === 1 ? createJob(tx) : null;
      });
      if (!job) return limitReached(quota);
    } else {
      job = await createJob(prisma);
    }

    invalidate('jobs:'); // candidates' cached job list (student.controller openJobsForCandidates)
    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting job' });
  }
};

// Post-a-job sidebar: how many candidates meet the draft's skill bars today, which
// bars actually gate applying, and which single one-point relaxation adds the most.
// Every candidate's skills, read once a minute instead of on each draft change (the form asks
// as the recruiter edits bars). A count up to a minute old is fine for this sidebar.
const CANDIDATE_SKILLS_TTL_MS = 60 * 1000;
const candidateSkills = () => cached('profiles:skills', CANDIDATE_SKILLS_TTL_MS, () => prisma.profile.findMany({ select: { skills: true } }));

exports.getEligibleCandidateCount = async (req, res) => {
  try {
    const [profiles, quizSkills] = await Promise.all([candidateSkills(), getQuizSkills()]);
    res.json(summarizePool(req.body.requirements, profiles, quizSkills, { forGig: req.body.forGig === true }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error counting matching candidates' });
  }
};

exports.getCompanyJobs = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const jobs = await prisma.job.findMany({
      where: { companyId: company.id }
    });

    const jobsWithApps = await Promise.all(jobs.map(async job => {
      const applications = await prisma.application.findMany({
        where: { jobId: job.id }
      });

      const populatedApps = await Promise.all(applications.map(async app => {
        const studentProfile = await prisma.profile.findUnique({
          where: { id: app.studentId }
        });
        let studentWithRankedProjects = studentProfile;
        if (studentProfile && Array.isArray(studentProfile.projects) && studentProfile.projects.length > 0) {
          studentWithRankedProjects = {
            ...studentProfile,
            projects: rankProjectsByRequirements(studentProfile.projects, job.requirements || [])
          };
        }
        return {
          ...app,
          student: studentWithRankedProjects
        };
      }));

      return {
        ...job,
        applications: populatedApps
      };
    }));

    jobsWithApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(jobsWithApps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching company jobs' });
  }
};

// Candidates for the recruiter's Candidates page, dashboard and gig workspace: one page of
// cards from the database (candidateSearch.service.js), never the whole pool. Contact details
// are not on cards; GET /recruiter/candidates/:id gives them only for the company's applicants.
exports.searchCandidates = async (req, res) => {
  try {
    const body = req.body;
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    const [jobs, applicantIds, quizSkills] = await Promise.all([
      company ? prisma.job.findMany({ where: { companyId: company.id } }) : [],
      body.excludeApplicants ? applicantProfileIdsFor(company?.id) : null,
      getQuizSkills()
    ]);
    let job = null;
    if (body.compareJobId) {
      job = jobs.find((item) => item.id === body.compareJobId) || null;
      if (!job) return res.status(404).json({ error: 'That job isn’t one of yours.' });
    }
    // "Recommended": ranked by the skills this company's live jobs and internships ask for.
    const demand = buildRecruiterDemandProfile(jobs.filter((item) => item.opportunityType !== 'GIG' && isJobOpen(item)));
    const result = await searchCandidateCards({
      filters: body,
      page: body.page,
      pageSize: body.pageSize,
      demand,
      job,
      quizSkills,
      ids: body.ids || null,
      excludeProfileIds: applicantIds ? [...applicantIds] : null,
      countTotal: body.countTotal
    });
    res.json({
      ...result,
      page: body.page,
      pageSize: body.pageSize,
      hasMore: result.total === null ? result.items.length === body.pageSize : body.page * body.pageSize < result.total,
      recommended: demand.skillList.length > 0,
      demand: { totalActiveJobs: demand.totalActiveJobs }
    });
  } catch (err) {
    console.error('[candidates] search failed:', err);
    res.status(500).json({ error: 'Server error searching candidates' });
  }
};

// Filter menus for the Candidates page (skills with counts, colleges, degrees, years, total).
exports.getCandidateFacets = async (req, res) => {
  try {
    res.json(await candidateFacets());
  } catch (err) {
    console.error('[candidates] facets failed:', err);
    res.status(500).json({ error: 'Server error loading candidate filters' });
  }
};

// One candidate's full profile (by profile id or user id). Contact details only when the
// candidate applied to one of this company's jobs (ISSUES A3).
exports.getCandidateDetail = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    const [profile, applicantIds] = await Promise.all([
      prisma.profile.findFirst({ where: { OR: [{ id: candidateId }, { userId: candidateId }] } }),
      applicantProfileIdsFor(company?.id)
    ]);
    if (!profile) return res.status(404).json({ error: 'Candidate not found' });
    res.json(redactCandidateContact(profile, applicantIds));
  } catch (err) {
    console.error('[candidates] detail failed:', err);
    res.status(500).json({ error: 'Server error loading the candidate' });
  }
};

exports.updateJob = async (req, res) => {
  const { jobId } = req.params;
  const { 
    title, 
    description, 
    opportunityType,
    workMode,
    requirements,
    companyName,
    officialWebsite,
    preferredEducation,
    desiredExperience,
    designation,
    stipendPartTime,
    stipendFullTime,
    duration,
    roleResponsibilities,
    location,
    locationUrl,
    activeDays,
    joiningMonth,
    openings,
    selectionProcess,
    screeningQuestions,
    showSalary
  } = req.body;

  if (!title || !description || !requirements) {
    return res.status(400).json({ error: 'Please provide title, description, and requirements' });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.companyId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized to update this job' });
    }

    // The listing ends `days` after it was first posted. Without a new value the current one stays.
    const days = activeDays ? parseInt(activeDays, 10) : (job.activeDays || 30);
    const expiresAt = expiryFrom(job.createdAt, days);
    const liveAgain = expiresAt.getTime() > Date.now();

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        opportunityType: opportunityType !== undefined ? opportunityType : job.opportunityType,
        workMode: workMode !== undefined ? workMode : job.workMode,
        title,
        description,
        companyName,
        officialWebsite,
        preferredEducation,
        desiredExperience,
        designation,
        stipendPartTime,
        stipendFullTime,
        duration,
        roleResponsibilities,
        location,
        locationUrl,
        activeDays: days,
        expiresAt,
        // Extending a listing past today makes it live again, so it leaves the retention stages.
        ...(liveAgain ? { archivedAt: null, retainedAt: null } : {}),
        joiningMonth: joiningMonth !== undefined ? joiningMonth : job.joiningMonth,
        openings: openings ? parseInt(openings, 10) : null,
        showSalary: showSalary !== undefined ? Boolean(showSalary) : job.showSalary,
        selectionProcess: selectionProcess || undefined,
        screeningQuestions: screeningQuestions !== undefined
          ? normalizeQuestions(screeningQuestions, randomUUID)
          : undefined,
        requirements,
        edited: true
      }
    });

    invalidate('jobs:');
    res.json(updatedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating job' });
  }
};

exports.deleteJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.companyId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this job' });
    }

    await prisma.application.deleteMany({ where: { jobId } });
    await prisma.job.delete({ where: { id: jobId } });

    invalidate('jobs:');
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting job' });
  }
};

exports.updateApplicationRounds = async (req, res) => {
  const { applicationId } = req.params;
  const { roundStatuses, status: explicitStatus } = req.body;

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Only the company that posted the job may move its applicants (ISSUES A4).
    const [company, job] = await Promise.all([
      prisma.company.findUnique({ where: { userId: req.user.id } }),
      prisma.job.findUnique({ where: { id: application.jobId } })
    ]);
    if (!company || !job || job.companyId !== company.id) {
      return res.status(403).json({ error: 'You can only update applications to your own jobs.' });
    }

    let calculatedStatus = explicitStatus || application.status || 'APPLIED';

    if (roundStatuses && roundStatuses.length > 0) {
      const hasRejected = roundStatuses.some(r => r.status.toUpperCase() === 'REJECTED');
      const allCleared = roundStatuses.every(r => r.status.toUpperCase() === 'CLEARED' || r.status.toUpperCase() === 'QUALIFIED');

      if (hasRejected) {
        calculatedStatus = 'REJECTED';
      } else if (allCleared) {
        calculatedStatus = 'SELECTED';
      } else if (!explicitStatus) {
        calculatedStatus = 'IN_PROGRESS';
      }
    }

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: calculatedStatus,
        roundStatuses: roundStatuses && roundStatuses.length > 0 ? roundStatuses : undefined
      }
    });

    res.json(updatedApp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating application progress' });
  }
};

exports.toggleJobPause = async (req, res) => {
  const { jobId } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.companyId !== company.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this job' });
    }

    const currentPaused = Boolean(job.isPaused || job.status === 'PAUSED');
    let nextPaused;
    if (req.body && typeof req.body.isPaused === 'boolean') {
      nextPaused = req.body.isPaused;
    } else if (req.body && req.body.status) {
      nextPaused = req.body.status === 'PAUSED';
    } else {
      nextPaused = !currentPaused;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        isPaused: nextPaused,
        status: nextPaused ? 'PAUSED' : 'ACTIVE'
      }
    });

    invalidate('jobs:');
    res.json(updatedJob);
  } catch (err) {
    console.error('Error toggling job pause status:', err);
    res.status(500).json({ error: 'Server error updating job status' });
  }
};

