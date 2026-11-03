import { apiFetch } from '../../../services/apiClient';

/**
 * Initiates user registration and sends 6-digit verification PIN to email
 * @param {Object} params - { email, password, role, name }
 * @returns {Promise<Object>}
 */
export async function initiateSignup({ email, password, role, name }) {
  const res = await apiFetch('/auth/signup', {
    method: 'POST',
    json: {
      email: String(email).toLowerCase().trim(),
      password,
      role: String(role).toUpperCase(),
      name: String(name).trim()
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to initiate signup');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * Verifies 6-digit PIN and retrieves authenticated user & JWT token
 * @param {Object} params - { email, pin, role }
 * @returns {Promise<{ token: string, user: Object }>}
 */
export async function verifySignupPin({ email, pin, role }) {
  const res = await apiFetch('/auth/signup/verify', {
    method: 'POST',
    json: {
      email: String(email).toLowerCase().trim(),
      pin: String(pin).trim(),
      role: String(role).toUpperCase()
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Verification failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * Resends a fresh 6-digit PIN to the user's email
 * @param {Object} params - { email, role }
 * @returns {Promise<Object>}
 */
export async function resendSignupPin({ email, role }) {
  const res = await apiFetch('/auth/signup/resend-pin', {
    method: 'POST',
    json: {
      email: String(email).toLowerCase().trim(),
      role: String(role).toUpperCase()
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to resend verification code');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

