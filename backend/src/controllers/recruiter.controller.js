const { prisma } = require('../config/db');
const { purgeExpiredJobs } = require('../services/jobLifecycle.service');
const { deleteS3ObjectFromUrl } = require('../services/fileCleanup.service');

exports.getCompany = async (req, res) => {
  try {
    const company = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching company' });
  }
};

exports.verifyCompany = async (req, res) => {
  const { docUrl } = req.body;
  if (!docUrl) {
    return res.status(400).json({ error: 'Please provide document URL' });
  }

  try {
    const existingCompany = await prisma.company.findUnique({
      where: { userId: req.user.id }
    });

    if (existingCompany && existingCompany.docUrl && existingCompany.docUrl !== docUrl) {
      try {
        await deleteS3ObjectFromUrl(existingCompany.docUrl, 'company verification document');
      } catch (deleteErr) {
        console.error('Failed to delete old company doc from S3:', deleteErr);
      }
    }

    const company = await prisma.company.update({
      where: { userId: req.user.id },
      data: {
        docUrl,
        verified: true // Simulate instant trust validation upon upload
      }
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
    selectionProcess
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
        joiningMonth,
        openings: openings ? parseInt(openings, 10) : null,
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
    selectionProcess
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
        joiningMonth,
        openings: openings ? parseInt(openings, 10) : null,
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

