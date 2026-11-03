const { ObjectId } = require('mongodb');
const { getDbSafe } = require('../../config/database');
const { getS3FileUrl } = require('../../config/s3');
const { sendMail } = require('../../config/mailer');
const { getApprovalEmail, getRejectionEmail } = require('./recruiterVerificationEmail');

// Company verification lifecycle shared with main_website through the Company
// collection: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED". Mirrors
// main_website/backend/src/modules/recruiters/companyVerification.js (kept as a
// copy because admin_ws must not import from main_website).
const VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Pending reviews first, then rejected, unsubmitted and approved.
const STATUS_SORT_ORDER = { PENDING: 0, REJECTED: 1, NOT_SUBMITTED: 2, APPROVED: 3 };

function hasVerificationDocs(company) {
  return Boolean(
    company &&
    ((Array.isArray(company.verificationDocs) && company.verificationDocs.length > 0) || company.docUrl)
  );
}

function resolveVerificationStatus(company) {
  if (!company) return VERIFICATION_STATUS.NOT_SUBMITTED;
  if (company.verificationStatus && VERIFICATION_STATUS[company.verificationStatus]) {
    return company.verificationStatus;
  }
  if (company.verified) return VERIFICATION_STATUS.APPROVED;
  if (hasVerificationDocs(company)) return VERIFICATION_STATUS.PENDING;
  return VERIFICATION_STATUS.NOT_SUBMITTED;
}

function formatRecruiter(recruiter, company, companyJobs = []) {
  const verificationStatus = resolveVerificationStatus(company);
  const docs = Array.isArray(company?.verificationDocs) && company.verificationDocs.length > 0
    ? company.verificationDocs.map(d => ({ docType: d.docType, docUrl: d.docUrl, fileName: d.fileName || '' }))
    : (company?.docUrl ? [{ docType: 'Verification Document', docUrl: company.docUrl, fileName: '' }] : []);

  return {
    id: recruiter._id.toString(),
    email: recruiter.email,
    hasCompanyProfile: Boolean(company),
    companyName: company?.name || 'Recruiter (No Company Profile)',
    verified: verificationStatus === VERIFICATION_STATUS.APPROVED,
    verificationStatus,
    verificationNote: company?.verificationNote || '',
    verificationSubmittedAt: company?.verificationSubmittedAt || null,
    verificationReviewedAt: company?.verificationReviewedAt || null,
    verificationReviewedBy: company?.verificationReviewedBy || '',
    docUrl: company?.docUrl || '',
    verificationDocs: docs,
    company: company ? {
      logoUrl: company.logoUrl || '',
      description: company.description || '',
      industry: company.industry || '',
      companySize: company.companySize || '',
      website: company.website || '',
      location: company.location || '',
      foundedYear: company.foundedYear || '',
      officialEmail: company.officialEmail || '',
      recruiterName: company.recruiterName || '',
      recruiterDesignation: company.recruiterDesignation || '',
      linkedin: company.socialLinks?.linkedin || ''
    } : null,
    jobs: companyJobs
  };
}

exports.getAllRecruiters = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) {
      console.warn('[DB WARNING] Database connection not initialized. Using fallback data.');
    }

    if (!db) {
      const mockDocUrl = getS3FileUrl('docs/google_verify.pdf');

      // Mock fallback data if DB is offline
      return res.json({
        success: true,
        recruiters: [
          {
            id: 'mock_rec_1',
            email: 'hr@google.com',
            companyName: 'Google',
            verified: true,
            verificationStatus: 'APPROVED',
            docUrl: mockDocUrl,
            verificationDocs: [{ docType: 'Certificate of Incorporation', docUrl: mockDocUrl, fileName: 'google_verify.pdf' }],
            jobs: [
              { id: 'job_1', title: 'SWE Intern', description: 'Google Cloud console team internship.', salaryRange: '₹50,000 - ₹80,000 / month' },
              { id: 'job_2', title: 'Associate Product Manager', description: 'Work on consumer facing services.', salaryRange: '₹12,00,000 - ₹18,00,000 / year' }
            ]
          },
          {
            id: 'mock_rec_2',
            email: 'recruiting@microsoft.com',
            companyName: 'Microsoft',
            verified: false,
            verificationStatus: 'NOT_SUBMITTED',
            docUrl: '',
            verificationDocs: [],
            jobs: [
              { id: 'job_3', title: 'SRE Intern', description: 'Automating server monitoring systems.', salaryRange: '₹40,000 - ₹60,000 / month' }
            ]
          }
        ]
      });
    }

    const recruiters = await db.collection('User').find({ role: 'RECRUITER' }).toArray();
    if (recruiters.length === 0) {
      return res.json({ success: true, recruiters: [] });
    }

    const userIds = recruiters.map(r => r._id);
    const companies = await db.collection('Company').find({ userId: { $in: userIds } }).toArray();

    const companyIds = companies.map(c => c._id);
    const jobs = await db.collection('Job').find({ companyId: { $in: companyIds } }).toArray();

    const recruitersWithJobs = recruiters.map(recruiter => {
      const company = companies.find(c => c.userId.toString() === recruiter._id.toString());
      const companyJobs = company 
        ? jobs.filter(j => j.companyId.toString() === company._id.toString()).map(j => ({
            id: j._id.toString(),
            title: j.title,
            description: j.description,
            salaryRange: j.salaryRange || 'Not Specified',
            location: j.location || 'Remote',
            jobType: j.jobType || 'Full-time'
          }))
        : [];

      return formatRecruiter(recruiter, company, companyJobs);
    });

    recruitersWithJobs.sort((a, b) => {
      const byStatus = STATUS_SORT_ORDER[a.verificationStatus] - STATUS_SORT_ORDER[b.verificationStatus];
      if (byStatus !== 0) return byStatus;
      return new Date(b.verificationSubmittedAt || 0) - new Date(a.verificationSubmittedAt || 0);
    });

    res.json({
      success: true,
      recruiters: recruitersWithJobs
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/recruiter/:recruiterId/verification — approve or reject a
// recruiter's company profile and email them the decision.
exports.reviewRecruiterVerification = async (req, res, next) => {
  try {
    const db = getDbSafe();
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected. Cannot update verification status.' });
    }

    const { recruiterId } = req.params;
    const { decision, reason } = req.body;
    const userId = new ObjectId(recruiterId);

    const recruiter = await db.collection('User').findOne({ _id: userId, role: 'RECRUITER' });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const company = await db.collection('Company').findOne({ userId });
    if (!company) {
      return res.status(400).json({ success: false, error: 'This recruiter has not created a company profile yet.' });
    }

    const currentStatus = resolveVerificationStatus(company);
    const isApproval = decision === 'APPROVE';

    if (isApproval && currentStatus === VERIFICATION_STATUS.APPROVED) {
      return res.status(409).json({ success: false, error: 'This company is already approved.' });
    }
    if (!isApproval && currentStatus === VERIFICATION_STATUS.REJECTED) {
      return res.status(409).json({ success: false, error: 'This company is already rejected.' });
    }
    // Admins may decide even before documents are submitted (e.g. approve a known
    // partner or reject a spam signup); the UI warns when no documents exist.

    const nextStatus = isApproval ? VERIFICATION_STATUS.APPROVED : VERIFICATION_STATUS.REJECTED;
    const reviewUpdate = {
      verified: isApproval,
      verificationStatus: nextStatus,
      verificationNote: isApproval ? null : reason,
      verificationReviewedAt: new Date(),
      verificationReviewedBy: req.user?.email || 'admin'
    };

    await db.collection('Company').updateOne({ _id: company._id }, { $set: reviewUpdate });
    const updatedCompany = { ...company, ...reviewUpdate };

    // The decision is persisted even if the notification email fails; the
    // admin is told so they can follow up manually.
    let emailSent = false;
    let emailError = null;
    try {
      const recipientName = company.recruiterName || company.name;
      const template = isApproval
        ? getApprovalEmail({ recipientName, companyName: company.name })
        : getRejectionEmail({ recipientName, companyName: company.name, reason });
      await sendMail({ to: recruiter.email, ...template });
      emailSent = true;
    } catch (mailErr) {
      console.error('[AdminMailer] Failed to send verification decision email:', mailErr.message);
      emailError = mailErr.message;
    }

    const companyJobs = await db.collection('Job').find({ companyId: company._id }).toArray();

    res.json({
      success: true,
      recruiter: formatRecruiter(recruiter, updatedCompany, companyJobs.map(j => ({
        id: j._id.toString(),
        title: j.title,
        description: j.description,
        salaryRange: j.salaryRange || 'Not Specified',
        location: j.location || 'Remote',
        jobType: j.jobType || 'Full-time'
      }))),
      emailSent,
      emailError
    });
  } catch (err) {
    next(err);
  }
};
