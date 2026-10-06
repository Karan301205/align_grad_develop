const crypto = require('crypto');
const Razorpay = require('razorpay');
const { prisma } = require('../../infrastructure/database');
const env = require('../../config/env');

const PLAN_PRICES = {
  STUDENT_LIFETIME: 250000, // ₹2,500.00 in paise
  RECRUITER_5_PACK: 250000  // ₹2,500.00 in paise
};

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
};

/**
 * Creates a Razorpay Order for Student Lifetime or Recruiter 5-Job Pack
 */
exports.createOrder = async (req, res) => {
  try {
    const { planType } = req.body;
    const amount = PLAN_PRICES[planType];

    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan type specified' });
    }

    const razorpay = getRazorpayInstance();
    const shortUserId = req.user.id.slice(-6);
    const receipt = `rcpt_${shortUserId}_${Date.now()}`.slice(0, 40);

    const orderOptions = {
      amount,
      currency: 'INR',
      receipt,
      notes: {
        userId: req.user.id,
        userRole: req.user.role,
        planType
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    // Save transaction record in database
    await prisma.paymentTransaction.create({
      data: {
        userId: req.user.id,
        orderId: order.id,
        amount,
        currency: 'INR',
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
 * Verifies Razorpay payment signature and updates user plan / job quota
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = req.body;

    // 1. Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('[Payment] Invalid signature for order:', razorpay_order_id);
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    // 2. Mark PaymentTransaction as PAID
    await prisma.paymentTransaction.update({
      where: { orderId: razorpay_order_id },
      data: {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'PAID'
      }
    });

    let updatedUserData = {};
    let quotaInfo = null;

    if (planType === 'STUDENT_LIFETIME') {
      // Upgrade student to PREMIUM lifetime
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          plan: 'PREMIUM',
          planPurchasedAt: new Date()
        },
        select: { id: true, email: true, role: true, plan: true, planPurchasedAt: true }
      });
      updatedUserData = user;
    } else if (planType === 'RECRUITER_5_PACK') {
      // Upgrade recruiter to PREMIUM and increment job quota by 5
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          plan: 'PREMIUM',
          planPurchasedAt: new Date()
        },
        select: { id: true, email: true, role: true, plan: true, planPurchasedAt: true }
      });

      const existingCompany = await prisma.company.findUnique({
        where: { userId: req.user.id }
      });
      const currentQuota = (existingCompany && typeof existingCompany.jobPostingQuota === 'number')
        ? existingCompany.jobPostingQuota
        : 1;
      const newQuota = currentQuota + 5;

      const company = await prisma.company.update({
        where: { userId: req.user.id },
        data: {
          jobPostingQuota: newQuota
        }
      });

      const totalJobs = await prisma.job.count({
        where: {
          companyId: company.id,
          OR: [
            { opportunityType: null },
            { opportunityType: { not: 'GIG' } }
          ]
        }
      });

      quotaInfo = {
        jobPostingQuota: company.jobPostingQuota,
        totalJobs,
        remainingJobs: Math.max(0, company.jobPostingQuota - totalJobs)
      };

      updatedUserData = user;
    }

    return res.json({
      success: true,
      message: 'Payment verified and plan upgraded successfully!',
      plan: updatedUserData.plan,
      quotaInfo
    });
  } catch (err) {
    console.error('[Payment] Error verifying payment:', err);
    return res.status(500).json({ error: 'Server error during payment verification' });
  }
};

/**
 * Retrieves the current user's plan and quota status
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

    let quotaInfo = null;

    if (user.role === 'RECRUITER') {
      const company = await prisma.company.findUnique({
        where: { userId: user.id }
      });

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

      quotaInfo = {
        jobPostingQuota: quota,
        totalJobs,
        remainingJobs: Math.max(0, quota - totalJobs),
        canPostJob: (quota - totalJobs) > 0
      };
    }

    return res.json({
      plan: user.plan || 'FREE',
      planPurchasedAt: user.planPurchasedAt,
      isPremium: (user.plan === 'PREMIUM'),
      role: user.role,
      quotaInfo
    });
  } catch (err) {
    console.error('[Payment] Error fetching plan status:', err);
    return res.status(500).json({ error: 'Server error fetching plan status' });
  }
};
