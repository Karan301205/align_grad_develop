const { prisma } = require('../../infrastructure/database');
const { purgeExpiredJobs } = require('../jobs/jobLifecycle.service');
const { deleteS3ObjectFromUrl } = require('../../services/fileCleanup.service');
const { getTopMatchingTalents } = require('../skills/skillMatching.service');

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
            about: 'Recruiter profile at AlignGrade',
            website: '',
            verified: false
          }
        });
      } catch (createErr) {
        company = {
          userId: req.user.id,
          name: defaultName,
          about: 'Recruiter profile at AlignGrade',
          website: '',
          verified: false
        };
      }
    }
    res.json(company);
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
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating company profile' });
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

    res.json({
      ...company,
      stats: {
        totalJobs,
        totalGigs,
        activeOpenings,
        averageRating
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

    if (existingCompany && existingCompany.docUrl && primaryDocUrl && existingCompany.docUrl !== primaryDocUrl) {
      try {
        await deleteS3ObjectFromUrl(existingCompany.docUrl, 'company verification document');
      } catch (deleteErr) {
        console.error('Failed to delete old company doc from S3:', deleteErr);
      }
    }

    const updateData = {
      verified: true
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
    res.json(company);
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
        selectionProcess: selectionProcess ? {
          set: selectionProcess
        } : undefined,
        requirements: {
          set: requirements
        }
      }
    });

    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error posting job' });
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
        return {
          ...app,
          student: studentProfile
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
        selectionProcess: selectionProcess ? {
          set: selectionProcess
        } : undefined,
        requirements: {
          set: requirements
        },
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
  const { roundStatuses } = req.body;

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    let calculatedStatus = 'APPLIED';

    if (roundStatuses && roundStatuses.length > 0) {
      const hasRejected = roundStatuses.some(r => r.status.toUpperCase() === 'REJECTED');
      const allCleared = roundStatuses.every(r => r.status.toUpperCase() === 'CLEARED' || r.status.toUpperCase() === 'QUALIFIED');

      if (hasRejected) {
        calculatedStatus = 'REJECTED';
      } else if (allCleared) {
        calculatedStatus = 'SELECTED';
      } else {
        calculatedStatus = 'IN_PROGRESS';
      }
    }

    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: calculatedStatus,
        roundStatuses: roundStatuses ? {
          set: roundStatuses
        } : undefined
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
