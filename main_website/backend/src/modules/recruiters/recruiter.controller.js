const { prisma } = require('../../infrastructure/database');
const { purgeExpiredJobs } = require('../jobs/jobLifecycle.service');
const { deleteS3ObjectFromUrl } = require('../../services/fileCleanup.service');
const { getTopMatchingTalents } = require('../skills/skillMatching.service');
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

const RECRUITER_PACK = PLANS.RECRUITER_5_PACK;

// Job/internship posts count against the quota; gigs do not (same filter as postJob).
const countQuotaJobs = (companyId) => prisma.job.count({
  where: {
    companyId,
    OR: [
      { opportunityType: null },
      { opportunityType: { not: 'GIG' } }
    ]
  }
});

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
    const usedJobs = company.id ? await countQuotaJobs(company.id) : 0;
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
        await deleteS3ObjectFromUrl(existingCompany.logoUrl, 'company logo');
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
        await deleteS3ObjectFromUrl(url, 'company office photo');
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

    // 3. Active Openings
    const activeJobs = await prisma.job.count({
      where: {
        companyId,
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

    res.json({
      ...company,
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
        jobs: companyJobs,
        gigs: companyGigs
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
        await deleteS3ObjectFromUrl(existingCompany.docUrl, 'company verification document');
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

    // Check job quota limit (1 free job, +5 for each purchased pack)
    const quota = company.jobPostingQuota ?? 1;
    const currentJobsCount = await prisma.job.count({
      where: {
        companyId: company.id,
        OR: [
          { opportunityType: null },
          { opportunityType: { not: 'GIG' } }
        ]
      }
    });

    if (currentJobsCount >= quota) {
      return res.status(403).json({
        error: `Job posting limit reached (${currentJobsCount}/${quota} jobs posted). Please buy ${RECRUITER_PACK.jobCredits} more job credits for ${formatInr(RECRUITER_PACK.amount)} to continue posting.`,
        code: 'UPGRADE_REQUIRED',
        quota,
        currentJobsCount
      });
    }

    const job = await prisma.job.create({
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
        activeDays: activeDays ? parseInt(activeDays, 10) : 30,
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

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting job' });
  }
};

// Post-a-job sidebar: how many candidates meet the draft's skill bars today, which
// bars actually gate applying, and which single one-point relaxation adds the most.
exports.getEligibleCandidateCount = async (req, res) => {
  try {
    const [profiles, activeQuestions] = await Promise.all([
      prisma.profile.findMany({ select: { skills: true } }),
      prisma.question.findMany({
        where: { status: 'ACTIVE' },
        select: { skillName: true },
        distinct: ['skillName']
      })
    ]);
    const quizSkills = new Set(activeQuestions.map((q) => q.skillName.toLowerCase()));
    res.json(summarizePool(req.body.requirements, profiles, quizSkills));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error counting matching candidates' });
  }
};

exports.getCompanyJobs = async (req, res) => {
  try {
    // Auto-delete expired jobs
    await purgeExpiredJobs(prisma);

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

exports.getCandidates = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany();
    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching candidates' });
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
        activeDays: activeDays ? parseInt(activeDays, 10) : 30,
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

    res.json(updatedJob);
  } catch (err) {
    console.error('Error toggling job pause status:', err);
    res.status(500).json({ error: 'Server error updating job status' });
  }
};

exports.getTopMatchingTalents = async (req, res) => {
  try {
    // Purge expired jobs first so only active jobs are used for demand matching
    await purgeExpiredJobs(prisma);

    const company = await prisma.company.findFirst({
      where: { OR: [{ userId: req.user.id }, { id: req.user.id }] }
    });
    if (!company) {
      return res.json({
        demandProfile: { totalActiveJobs: 0, skills: {}, skillList: [] },
        topTalents: []
      });
    }

    const allJobs = await prisma.job.findMany({
      where: { companyId: company.id }
    });

    // Exclude closed, paused, or expired jobs and Gigs
    const activeJobs = allJobs.filter(job => {
      if (job.opportunityType === 'GIG') return false;
      if (job.status === 'CLOSED' || job.status === 'PAUSED' || job.isPaused) return false;
      const activeDays = job.activeDays || 30;
      const expiryTime = new Date(job.createdAt).getTime() + activeDays * 24 * 60 * 60 * 1000;
      return Date.now() <= expiryTime;
    });

    const candidates = await prisma.profile.findMany();

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 500;
    const recommendationResult = getTopMatchingTalents(activeJobs, candidates, limit);

    res.json(recommendationResult);
  } catch (err) {
    console.error('Error computing top matching talents:', err);
    res.status(500).json({ error: 'Server error retrieving matching talents' });
  }
};
