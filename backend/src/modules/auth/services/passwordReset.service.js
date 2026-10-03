const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../../../infrastructure/database');
const { sendPasswordResetEmail } = require('../../../infrastructure/email');
const env = require('../../../config/env');

const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_ATTEMPTS = 3;
const TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Handles requesting a password reset email with 3-attempt/15-min rate limiting
 * @param {Object} params
 * @param {string} params.email - User email
 * @param {string} [params.role] - Optional portal role ("STUDENT" or "RECRUITER")
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function requestPasswordReset({ email, role }) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  // Anti-enumeration: If user does not exist, return generic success
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    };
  }

  // Rate Limiting Check (3 attempts within a 15-minute sliding window per user)
  const now = new Date();
  let newAttempts = 1;
  let newWindow = now;

  if (user.resetPasswordWindow && user.resetPasswordAttempts) {
    const windowStart = new Date(user.resetPasswordWindow).getTime();
    const elapsed = now.getTime() - windowStart;

    if (elapsed < RESET_WINDOW_MS) {
      // Within active 15-minute window
      if (user.resetPasswordAttempts >= MAX_RESET_ATTEMPTS) {
        const remainingMs = RESET_WINDOW_MS - elapsed;
        const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
        const error = new Error(`You have reached the maximum of 3 reset attempts. Please wait ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} before trying again.`);
        error.statusCode = 429;
        error.retryAfter = Math.ceil(remainingMs / 1000);
        throw error;
      }
      newAttempts = user.resetPasswordAttempts + 1;
      newWindow = user.resetPasswordWindow;
    } else {
      // Previous window has expired; start a fresh window
      newAttempts = 1;
      newWindow = now;
    }
  }

  // Generate secure unguessable reset token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenExpires = new Date(now.getTime() + TOKEN_EXPIRY_MS);

  // Update user with hashed token and attempt counts
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: tokenExpires,
      resetPasswordAttempts: newAttempts,
      resetPasswordWindow: newWindow
    }
  });

  // Resolve display name for the email template
  let displayName = 'there';
  try {
    if (user.role === 'STUDENT') {
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
      if (profile && profile.name) displayName = profile.name;
    } else {
      const company = await prisma.company.findUnique({ where: { userId: user.id } });
      if (company && company.name) displayName = company.name;
    }
  } catch (err) {
    console.warn('[PasswordResetService] Could not resolve display name:', err.message);
  }

  // Construct reset URL
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}&role=${user.role}`;

  // Dispatch email asynchronously
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: displayName,
      resetUrl,
      role: user.role
    });
  } catch (mailError) {
    console.error('[PasswordResetService] Failed to send email via SMTP:', mailError);
    // Even if sending fails, we don't leak internals to client
    throw new Error('Unable to send password reset email at this moment. Please try again later.');
  }

  return {
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.'
  };
}

/**
 * Resets user password using the provided token
 * @param {Object} params
 * @param {string} params.token - Raw reset token from URL
 * @param {string} params.newPassword - Validated new password
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function resetPassword({ token, newPassword }) {
  if (!token || typeof token !== 'string') {
    const error = new Error('A valid reset token is required.');
    error.statusCode = 400;
    throw error;
  }

  // Hash the incoming token to match what's stored in the database
  const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const now = new Date();

  // Find user with matching active token
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: now
      }
    }
  });

  if (!user) {
    const error = new Error('Password reset link is invalid or has expired. Please request a new link.');
    error.statusCode = 400;
    throw error;
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user and clear reset tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      resetPasswordAttempts: 0,
      resetPasswordWindow: null
    }
  });

  return {
    success: true,
    message: 'Your password has been reset successfully. You can now log in.'
  };
}

module.exports = {
  requestPasswordReset,
  resetPassword
};
