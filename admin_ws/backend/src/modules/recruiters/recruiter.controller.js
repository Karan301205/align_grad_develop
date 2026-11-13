const { getDB } = require('../../config/database');
const { jobPay, jobPlace, jobType } = require('../../utils/jobDisplay');
const { normalizeId } = require('../../utils/ids');
const { sendMail } = require('../../config/mailer');
const { getApprovalEmail, getRejectionEmail } = require('./recruiterVerificationEmail');

// Company verification lifecycle shared with main_website through the Company
// table: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED". Mirrors
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

// Job summary embedded in each recruiter entry.
function formatCompanyJob(j) {
  return {
    id: j.id,
    title: j.title,
    description: j.description,
    salaryRange: jobPay(j),
    location: jobPlace(j),
    jobType: jobType(j)
  };
}

function formatRecruiter(recruiter, company, companyJobs = []) {
  const verificationStatus = resolveVerificationStatus(company);
  const docs = Array.isArray(company?.verificationDocs) && company.verificationDocs.length > 0
    ? company.verificationDocs.map(d => ({ docType: d.docType, docUrl: d.docUrl, fileName: d.fileName || '' }))
    : (company?.docUrl ? [{ docType: 'Verification Document', docUrl: company.docUrl, fileName: '' }] : []);

  return {
    id: recruiter.id,
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
    const db = getDB();
    // ORDER BY "id" approximates the previous natural (insertion) order: ids are
    // time-prefixed hex strings. The final ordering is the status sort below.
    const { rows: recruiters } = await db.query(
      'SELECT "id", "email" FROM "User" WHERE "role" = $1 ORDER BY "id"',
      ['RECRUITER']
    );
    if (recruiters.length === 0) {
      return res.json({ success: true, recruiters: [] });
    }

    const userIds = recruiters.map(r => r.id);
    const { rows: companies } = await db.query(
      'SELECT * FROM "Company" WHERE "userId" = ANY($1::text[])',
      [userIds]
    );

    const companyIds = companies.map(c => c.id);
    const { rows: jobs } = await db.query(
      'SELECT * FROM "Job" WHERE "companyId" = ANY($1::text[]) ORDER BY "id"',
      [companyIds]
    );

    const recruitersWithJobs = recruiters.map(recruiter => {
      const company = companies.find(c => c.userId === recruiter.id);
      const companyJobs = company
        ? jobs.filter(j => j.companyId === company.id).map(formatCompanyJob)
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
    const db = getDB();
    const { recruiterId } = req.params;
    const { decision, reason } = req.body;
    const userId = normalizeId(recruiterId);

    const { rows: [recruiter] } = await db.query(
      'SELECT "id", "email" FROM "User" WHERE "id" = $1 AND "role" = $2',
      [userId, 'RECRUITER']
    );
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const { rows: [company] } = await db.query(
      'SELECT * FROM "Company" WHERE "userId" = $1',
      [userId]
    );
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

    // "Company" has no updatedAt column, so only the review fields are written.
    await db.query(
      `UPDATE "Company"
          SET "verified" = $1,
              "verificationStatus" = $2,
              "verificationNote" = $3,
              "verificationReviewedAt" = $4,
              "verificationReviewedBy" = $5
        WHERE "id" = $6`,
      [
        reviewUpdate.verified,
        reviewUpdate.verificationStatus,
        reviewUpdate.verificationNote,
        reviewUpdate.verificationReviewedAt,
        reviewUpdate.verificationReviewedBy,
        company.id
      ]
    );
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

    const { rows: companyJobs } = await db.query(
      'SELECT * FROM "Job" WHERE "companyId" = $1 ORDER BY "id"',
      [company.id]
    );

    res.json({
      success: true,
      recruiter: formatRecruiter(recruiter, updatedCompany, companyJobs.map(formatCompanyJob)),
      emailSent,
      emailError
    });
  } catch (err) {
    next(err);
  }
};
