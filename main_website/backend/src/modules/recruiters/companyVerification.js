const { prisma } = require('../../infrastructure/database');

// Company verification lifecycle. A recruiter submits their company profile and
// legal documents (PENDING); an administrator in admin_ws approves or rejects
// it. Only APPROVED recruiters may publish opportunities or browse candidates.
const VERIFICATION_STATUS = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

function hasVerificationDocs(company) {
  return Boolean(
    company &&
    ((Array.isArray(company.verificationDocs) && company.verificationDocs.length > 0) || company.docUrl)
  );
}

// Resolves the effective status, including legacy rows created before the
// review workflow existed (verified=true is treated as already approved).
function resolveVerificationStatus(company) {
  if (!company) return VERIFICATION_STATUS.NOT_SUBMITTED;
  if (company.verificationStatus && VERIFICATION_STATUS[company.verificationStatus]) {
    return company.verificationStatus;
  }
  if (company.verified) return VERIFICATION_STATUS.APPROVED;
  if (hasVerificationDocs(company)) return VERIFICATION_STATUS.PENDING;
  return VERIFICATION_STATUS.NOT_SUBMITTED;
}

function withVerificationStatus(company) {
  if (!company) return company;
  return { ...company, verificationStatus: resolveVerificationStatus(company) };
}

// Route guard: caller must be a RECRUITER whose company has been approved.
// Attaches the company to req.company for downstream handlers.
async function requireApprovedRecruiter(req, res, next) {
  if (!req.user || req.user.role !== 'RECRUITER') {
    return res.status(403).json({ error: 'This action is available to recruiters only.' });
  }
  try {
    const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
    const status = resolveVerificationStatus(company);
    if (status !== VERIFICATION_STATUS.APPROVED) {
      return res.status(403).json({
        error: status === VERIFICATION_STATUS.PENDING
          ? 'Your company profile is under admin review. You will be notified by email once it is approved.'
          : 'Your company profile must be approved by an administrator before you can use this feature.',
        code: 'COMPANY_NOT_APPROVED',
        verificationStatus: status
      });
    }
    req.company = company;
    next();
  } catch (err) {
    console.error('Company approval check failed:', err);
    res.status(500).json({ error: 'Server error verifying company approval status' });
  }
}

module.exports = {
  VERIFICATION_STATUS,
  resolveVerificationStatus,
  withVerificationStatus,
  requireApprovedRecruiter
};
