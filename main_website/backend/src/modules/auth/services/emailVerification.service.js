const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../../infrastructure/database');
const { sendVerificationPinEmail } = require('../../../infrastructure/email');
const env = require('../../../config/env');

const PIN_EXPIRY_MINUTES = env.VERIFICATION_PIN_EXPIRY_MINUTES || 10;
const PIN_EXPIRY_MS = PIN_EXPIRY_MINUTES * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESEND_ATTEMPTS = 3;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60s minimum interval
const RESEND_WINDOW_MS = 15 * 60 * 1000; // 15m sliding window

/**
 * Generates a cryptographically random 6-digit numeric PIN
 * @returns {string} 6-digit PIN string
 */
function generatePin() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes SHA-256 hash of a PIN string
 * @param {string|number} pin 
 * @returns {string} Hex-encoded SHA-256 digest
 */
function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

/**
 * Initiates user registration by validating inputs, creating/updating an unverified User record,
 * and dispatching a 6-digit verification PIN to the user's email.
 * 
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.role - "STUDENT" | "RECRUITER"
 * @param {string} params.name
 * @returns {Promise<{ success: boolean, message: string, email: string, role: string }>}
 */
async function initiateVerification({ email, password, role, name }) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const requestedRole = String(role).toUpperCase();
  const trimmedName = String(name || '').trim();

  // Check if an account already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    // If account exists and is already verified, reject registration
    if (existingUser.emailVerified) {
      const registeredAs = existingUser.role === 'STUDENT' ? 'Candidate' : 'Recruiter';
      const attemptingAs = requestedRole === 'STUDENT' ? 'Candidate' : 'Recruiter';
      if (existingUser.role !== requestedRole) {
        const error = new Error(
          `An account with email '${normalizedEmail}' is already registered as a ${registeredAs}. Please sign in through the ${registeredAs} portal or use a different email.`
        );
        error.statusCode = 409;
        throw error;
      }
      const error = new Error(`An account with email '${normalizedEmail}' already exists. Please sign in instead.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Generate 6-digit PIN and calculate hash + expiry
  const rawPin = generatePin();
  const hashedPin = hashPin(rawPin);
  const now = new Date();
  const pinExpiry = new Date(now.getTime() + PIN_EXPIRY_MS);
  const hashedPassword = await bcrypt.hash(password, 10);

  let user;

  if (existingUser) {
    // Re-use and update existing unverified user
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        role: requestedRole,
        emailVerified: false,
        verificationPinHash: hashedPin,
        verificationPinExpiry: pinExpiry,
        verificationAttempts: 0,
        verificationResends: 0,
        lastVerificationSent: now,
        pendingName: trimmedName
      }
    });
  } else {
    // Determine registration number
    const count = await prisma.user.count({
      where: { role: requestedRole }
    });
    const prefix = requestedRole === 'STUDENT' ? 'CAN' : 'REC';
    const regNo = `${prefix}${String(count + 1).padStart(3, '0')}`;

    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: requestedRole,
        regNo,
        emailVerified: false,
        verificationPinHash: hashedPin,
        verificationPinExpiry: pinExpiry,
        verificationAttempts: 0,
        verificationResends: 0,
        lastVerificationSent: now,
        pendingName: trimmedName
      }
    });
  }

  // Dispatch email with 6-digit PIN
  try {
    await sendVerificationPinEmail({
      to: normalizedEmail,
      name: trimmedName,
      pin: rawPin,
      role: requestedRole,
      expireMinutes: PIN_EXPIRY_MINUTES
    });
  } catch (err) {
    console.error(`[EmailVerificationService] Failed to send PIN email to ${normalizedEmail}:`, err.message);
    const mailError = new Error('Failed to send verification email. Please check your email address or try again later.');
    mailError.statusCode = 500;
    throw mailError;
  }

  return {
    success: true,
    message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
    email: normalizedEmail,
    role: requestedRole
  };
}

/**
 * Validates the 6-digit PIN, marks user as emailVerified, provisions profile/company,
 * and signs a session JWT token.
 * 
 * @param {Object} params
 * @param {string} params.email
 * @param {string|number} params.pin
 * @param {string} [params.role]
 * @returns {Promise<{ token: string, user: Object }>}
 */
async function verifyPin({ email, pin, role }) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const cleanedPin = String(pin || '').trim();

  if (!cleanedPin || cleanedPin.length !== 6) {
    const error = new Error('Please enter a valid 6-digit verification code.');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    const error = new Error('No account found for this email. Please sign up again.');
    error.statusCode = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error('This account has already been verified. Please sign in.');
    error.statusCode = 400;
    throw error;
  }

  if (role && user.role !== String(role).toUpperCase()) {
    const registeredAs = user.role === 'STUDENT' ? 'Candidate' : 'Recruiter';
    const error = new Error(`Role mismatch. This account was registered for the ${registeredAs} portal.`);
    error.statusCode = 400;
    throw error;
  }

  const attempts = user.verificationAttempts || 0;
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    const error = new Error('Maximum verification attempts exceeded. Please request a new verification code.');
    error.statusCode = 429;
    throw error;
  }

  const now = new Date();
  if (!user.verificationPinExpiry || now > new Date(user.verificationPinExpiry)) {
    const error = new Error('Verification code has expired. Please request a new code.');
    error.statusCode = 410;
    throw error;
  }

  // Compare PIN hashes
  const incomingHash = hashPin(cleanedPin);
  if (incomingHash !== user.verificationPinHash) {
    const newAttempts = attempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationAttempts: newAttempts }
    });

    const remaining = MAX_VERIFY_ATTEMPTS - newAttempts;
    const msg = remaining > 0
      ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      : 'Incorrect verification code. Maximum attempts reached. Please request a new code.';
    const error = new Error(msg);
    error.statusCode = remaining > 0 ? 400 : 429;
    throw error;
  }

  // PIN is correct! Update user state
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationPinHash: null,
      verificationPinExpiry: null,
      verificationAttempts: 0,
      verificationResends: 0
    }
  });

  const displayName = user.pendingName || (user.role === 'STUDENT' ? 'Candidate' : 'Recruiter');

  // Provision domain entity if not already present
  if (user.role === 'STUDENT') {
    const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          name: displayName,
          email: normalizedEmail,
          skills: []
        }
      });
    }
  } else {
    const existingCompany = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!existingCompany) {
      await prisma.company.create({
        data: {
          userId: user.id,
          name: displayName,
          verified: false
        }
      });
    }
  }

  // Clean up pendingName
  if (user.pendingName) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { pendingName: null }
      });
    } catch (ignoreErr) {
      // Non-critical
    }
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: displayName,
      regNo: updatedUser.regNo
    }
  };
}

/**
 * Resends a fresh 6-digit verification PIN with cooldown and sliding window rate limits.
 * 
 * @param {Object} params
 * @param {string} params.email
 * @param {string} [params.role]
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function resendPin({ email, role }) {
  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    const error = new Error('No account found for this email. Please sign up.');
    error.statusCode = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error('This account is already verified. Please sign in.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // Cooldown check (minimum 60s between resends)
  if (user.lastVerificationSent) {
    const elapsed = now.getTime() - new Date(user.lastVerificationSent).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      const error = new Error(`Please wait ${waitSeconds} second${waitSeconds === 1 ? '' : 's'} before requesting another code.`);
      error.statusCode = 429;
      error.retryAfter = waitSeconds;
      throw error;
    }
  }

  // Sliding window check (max 3 resends per 15-minute window)
  let resendCount = (user.verificationResends || 0) + 1;
  if (resendCount > MAX_RESEND_ATTEMPTS) {
    if (user.lastVerificationSent) {
      const elapsedWindow = now.getTime() - new Date(user.lastVerificationSent).getTime();
      if (elapsedWindow < RESEND_WINDOW_MS) {
        const remainingMinutes = Math.max(1, Math.ceil((RESEND_WINDOW_MS - elapsedWindow) / (60 * 1000)));
        const error = new Error(`Maximum resend limit reached. Please wait ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} before requesting a new code.`);
        error.statusCode = 429;
        throw error;
      }
      resendCount = 1;
    }
  }

  // Generate new PIN and hash
  const rawPin = generatePin();
  const hashedPin = hashPin(rawPin);
  const pinExpiry = new Date(now.getTime() + PIN_EXPIRY_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationPinHash: hashedPin,
      verificationPinExpiry: pinExpiry,
      verificationAttempts: 0,
      verificationResends: resendCount,
      lastVerificationSent: now
    }
  });

  const displayName = user.pendingName || (user.role === 'STUDENT' ? 'Candidate' : 'Recruiter');

  try {
    await sendVerificationPinEmail({
      to: normalizedEmail,
      name: displayName,
      pin: rawPin,
      role: user.role,
      expireMinutes: PIN_EXPIRY_MINUTES
    });
  } catch (err) {
    console.error(`[EmailVerificationService] Failed to resend PIN email to ${normalizedEmail}:`, err.message);
    const mailError = new Error('Failed to dispatch verification email. Please try again later.');
    mailError.statusCode = 500;
    throw mailError;
  }

  return {
    success: true,
    message: `A new verification code has been sent to ${normalizedEmail}.`
  };
}

module.exports = {
  generatePin,
  hashPin,
  initiateVerification,
  verifyPin,
  resendPin
};

