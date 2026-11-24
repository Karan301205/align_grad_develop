// Purchasable plans. The single source of truth for prices and what a purchase
// grants: payment.controller.js charges and credits from here, GET /payments/status
// returns the caller's offer to the UI, and postJob's quota message reads the price.
// Amounts are in paise.

const PLANS = {
  STUDENT_LIFETIME: {
    role: 'STUDENT',
    amount: 250000,
    currency: 'INR',
    label: 'Lifetime access'
  },
  RECRUITER_5_PACK: {
    role: 'RECRUITER',
    amount: 250000,
    currency: 'INR',
    jobCredits: 5,
    label: '5 job credits'
  }
};

const PLAN_TYPES = Object.keys(PLANS);

// Recruiters get as many gig posts as job posts: one of each on the free plan, and each
// pack adds `jobCredits` of each. So Company.jobPostingQuota is the allowance for both
// (recruiter postJob counts jobs, gigs/gig.controller.js createGig counts gigs).

/** The plan a user with `role` can buy, as sent to the client (null if none). */
function offerForRole(role) {
  const planType = PLAN_TYPES.find((type) => PLANS[type].role === role);
  if (!planType) return null;
  const { amount, currency, jobCredits, label } = PLANS[planType];
  return { planType, amount, currency, jobCredits: jobCredits ?? null, label };
}

/** "₹2,500" for an amount in paise. */
function formatInr(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

module.exports = { PLANS, PLAN_TYPES, offerForRole, formatInr };
