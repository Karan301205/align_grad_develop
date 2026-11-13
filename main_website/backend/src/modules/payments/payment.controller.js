const crypto = require('crypto');
const Razorpay = require('razorpay');
const { prisma } = require('../../infrastructure/database');
const env = require('../../config/env');
const { PLANS, offerForRole } = require('./plans');

const PAYMENTS_NOT_CONFIGURED = 'Payments are not configured on the server. Please contact support.';

// With an empty secret anyone could compute a valid signature, so refuse to run.
const isConfigured = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

const getRazorpayInstance = () => new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

/** Razorpay checkout signature: HMAC-SHA256(order_id|payment_id), compared in constant time. */
function isValidSignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const given = Buffer.from(String(signature), 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

// Job/internship posts use credits; gigs do not (same filter as recruiter postJob).
async function buildQuotaInfo(userId) {
  const company = await prisma.company.findUnique({ where: { userId } });
  const quota = company?.jobPostingQuota ?? 1;
  const totalJobs = company ? await prisma.job.count({
    where: {
      companyId: company.id,
      OR: [
        { opportunityType: null },
        { opportunityType: { not: 'GIG' } }
      ]
    }
  }) : 0;
  return {
    jobPostingQuota: quota,
    totalJobs,
    remainingJobs: Math.max(0, quota - totalJobs),
    canPostJob: (quota - totalJobs) > 0
  };
}

/**
 * Creates a Razorpay order for the caller's own plan (students: lifetime access,
 * recruiters: the job-credit pack).
 */
exports.createOrder = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({ error: PAYMENTS_NOT_CONFIGURED });
    }

    const { planType } = req.body;
    const plan = PLANS[planType];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan type specified' });
    }
    if (plan.role !== req.user.role) {
      return res.status(403).json({ error: 'This plan is not available for your account type.' });
    }
    if (plan.jobCredits) {
      const company = await prisma.company.findUnique({ where: { userId: req.user.id } });
      if (!company) {
        return res.status(404).json({ error: 'Create your company profile before buying job credits.' });
      }
    }

    const razorpay = getRazorpayInstance();
    const shortUserId = req.user.id.slice(-6);
    const receipt = `rcpt_${shortUserId}_${Date.now()}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt,
      notes: {
        userId: req.user.id,
        userRole: req.user.role,
        planType
      }
    });

    await prisma.paymentTransaction.create({
      data: {
        userId: req.user.id,
        orderId: order.id,
        amount: plan.amount,
        currency: plan.currency,
        planType,
        status: 'CREATED'
      }
    });

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      planType
    });
  } catch (err) {
    console.error('[Payment] Error creating order:', err);
    return res.status(500).json({ error: 'Failed to initiate payment order with gateway' });
  }
};

/**
 * Verifies a Razorpay payment and grants the plan exactly once.
 *
 * The order must belong to the caller and the plan comes from the stored order,
 * never from the request. The CREATED → PAID switch and the grant run in one
 * transaction, and the switch only matches an unpaid order, so replaying the same
 * signature (or racing two requests) can never credit twice (ISSUES P1).
 */
exports.verifyPayment = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({ error: PAYMENTS_NOT_CONFIGURED });
    }

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    } = req.body;

    const transaction = await prisma.paymentTransaction.findUnique({ where: { orderId } });
    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(404).json({ error: 'Payment order not found.' });
    }

    if (!isValidSignature(orderId, paymentId, signature)) {
      console.warn('[Payment] Invalid signature for order:', orderId);
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    const plan = PLANS[transaction.planType];
    if (!plan) {
      return res.status(400).json({ error: 'This order is for an unknown plan.' });
    }
    if (plan.role !== req.user.role) {
      return res.status(403).json({ error: 'This plan is not available for your account type.' });
    }

    let granted = false;
    if (transaction.status === 'CREATED') {
      granted = await prisma.$transaction(async (tx) => {
        const claimed = await tx.paymentTransaction.updateMany({
          where: { orderId, userId: req.user.id, status: 'CREATED' },
          data: { paymentId, signature, status: 'PAID' }
        });
        if (claimed.count !== 1) return false; // a concurrent request got here first

        await tx.user.update({
          where: { id: req.user.id },
          data: { plan: 'PREMIUM', planPurchasedAt: new Date() }
        });
        if (plan.jobCredits) {
          await tx.company.update({
            where: { userId: req.user.id },
            data: { jobPostingQuota: { increment: plan.jobCredits } }
          });
        }
        return true;
      });
    }

    if (!granted) {
      // Already credited. Answer a retry of the same payment as a success without
      // granting again; anything else is a reuse attempt.
      const current = await prisma.paymentTransaction.findUnique({ where: { orderId } });
      if (current?.status !== 'PAID' || current.paymentId !== paymentId) {
        return res.status(409).json({ error: 'This payment order has already been used.' });
      }
    }

    return res.json({
      success: true,
      alreadyProcessed: !granted,
      message: granted ? 'Payment verified and plan upgraded successfully!' : 'This payment was already verified.',
      plan: 'PREMIUM',
      quotaInfo: plan.jobCredits ? await buildQuotaInfo(req.user.id) : null
    });
  } catch (err) {
    console.error('[Payment] Error verifying payment:', err);
    return res.status(500).json({ error: 'Server error during payment verification' });
  }
};

/**
 * The caller's plan, the plan they can buy (price comes from plans.js) and,
 * for recruiters, their job-credit quota.
 */
exports.getPlanStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, plan: true, planPurchasedAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      plan: user.plan || 'FREE',
      planPurchasedAt: user.planPurchasedAt,
      isPremium: (user.plan === 'PREMIUM'),
      role: user.role,
      offer: offerForRole(user.role),
      quotaInfo: user.role === 'RECRUITER' ? await buildQuotaInfo(user.id) : null
    });
  } catch (err) {
    console.error('[Payment] Error fetching plan status:', err);
    return res.status(500).json({ error: 'Server error fetching plan status' });
  }
};

/** The caller's completed payments, newest first. Gateway ids and signatures are not returned. */
exports.getPaymentHistory = async (req, res) => {
  try {
    const rows = await prisma.paymentTransaction.findMany({
      where: { userId: req.user.id, status: 'PAID' },
      orderBy: { updatedAt: 'desc' },
      take: 100
    });

    return res.json({
      payments: rows.map((row) => ({
        id: row.id,
        planType: row.planType,
        label: PLANS[row.planType]?.label || row.planType,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        paidAt: row.updatedAt,
        createdAt: row.createdAt
      }))
    });
  } catch (err) {
    console.error('[Payment] Error fetching payment history:', err);
    return res.status(500).json({ error: 'Server error fetching payment history' });
  }
};
