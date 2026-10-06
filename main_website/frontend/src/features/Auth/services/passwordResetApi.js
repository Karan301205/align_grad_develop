import { apiFetch } from '../../../services/apiClient';

/**
 * Requests a password reset link for the provided email address
 * @param {string} email 
 * @param {string} role - 'STUDENT' or 'RECRUITER'
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function sendForgotPasswordRequest(email, role) {
  const res = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    json: {
      email: email.trim().toLowerCase(),
      role
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to send reset link.');
    error.status = res.status;
    throw error;
  }

  return data;
}

/**
 * Submits the new password along with the reset token
 * @param {Object} params
 * @param {string} params.token
 * @param {string} params.password
 * @param {string} params.confirmPassword
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function submitPasswordReset({ token, password, confirmPassword }) {
  const res = await apiFetch('/auth/reset-password', {
    method: 'POST',
    json: {
      token,
      password,
      confirmPassword
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to reset password.');
    error.status = res.status;
    throw error;
  }

  return data;
}
