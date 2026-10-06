import { apiFetch } from './apiClient';

/**
 * Creates a Razorpay Order from backend
 * @param {string} token - JWT token
 * @param {'STUDENT_LIFETIME' | 'RECRUITER_5_PACK'} planType
 */
export async function createPaymentOrder(token, planType) {
  const res = await apiFetch('/payments/create-order', {
    token,
    method: 'POST',
    json: { planType }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to initiate payment order');
  }
  return res.json();
}

/**
 * Verifies Razorpay payment signature on backend
 * @param {string} token - JWT token
 * @param {Object} verificationData - { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType }
 */
export async function verifyPaymentSignature(token, verificationData) {
  const res = await apiFetch('/payments/verify', {
    token,
    method: 'POST',
    json: verificationData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Payment signature verification failed');
  }
  return res.json();
}

/**
 * Fetches current user's plan and recruiter quota status
 * @param {string} token - JWT token
 */
export async function getPaymentPlanStatus(token) {
  const res = await apiFetch('/payments/status', {
    token,
    method: 'GET'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch plan status');
  }
  return res.json();
}

/**
 * Opens Razorpay standard checkout popup
 */
export function openRazorpayCheckout({
  token,
  order,
  planType,
  user = {},
  onSuccess,
  onFailure,
  onDismiss
}) {
  if (typeof window === 'undefined' || !window.Razorpay) {
    const errorMsg = 'Razorpay SDK is not loaded. Please check your internet connection.';
    if (onFailure) onFailure(new Error(errorMsg));
    return;
  }

  const planTitles = {
    STUDENT_LIFETIME: 'AlignGrade Student Pro — Lifetime Access',
    RECRUITER_5_PACK: 'AlignGrade Recruiter — 5 Job Postings Pack'
  };

  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'AlignGrade',
    description: planTitles[planType] || 'Plan Subscription',
    order_id: order.orderId,
    prefill: {
      name: user.name || '',
      email: user.email || '',
      contact: user.phone || ''
    },
    notes: {
      planType,
      userId: user.id || ''
    },
    theme: {
      color: '#003527' // AlignGrade signature Emerald branding
    },
    handler: async function (response) {
      try {
        const verifyRes = await verifyPaymentSignature(token, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          planType
        });
        if (onSuccess) onSuccess(verifyRes);
      } catch (err) {
        if (onFailure) onFailure(err);
      }
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response) {
    console.error('Payment failed:', response.error);
    if (onFailure) {
      onFailure(new Error(response.error.description || 'Payment transaction failed'));
    }
  });
  rzp.open();
}
