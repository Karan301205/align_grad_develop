const { sendMail, getTransporter } = require('./emailTransport');
const { getPasswordResetTemplate, getVerificationPinTemplate } = require('./emailTemplates');

/**
 * High-level helper to send a password reset email
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - User's name
 * @param {string} params.resetUrl - Full reset password link
 * @param {string} params.role - "STUDENT" or "RECRUITER"
 */
async function sendPasswordResetEmail({ to, name, resetUrl, role }) {
  const { subject, html, text } = getPasswordResetTemplate({
    name,
    resetUrl,
    role,
    expireMinutes: 10
  });

  return sendMail({
    to,
    subject,
    html,
    text
  });
}

/**
 * High-level helper to send a registration PIN verification email
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - User's name
 * @param {string} params.pin - 6-digit numeric verification PIN
 * @param {string} params.role - "STUDENT" or "RECRUITER"
 * @param {number} [params.expireMinutes=10] - Expiration time in minutes
 */
async function sendVerificationPinEmail({ to, name, pin, role, expireMinutes = 10 }) {
  const { subject, html, text } = getVerificationPinTemplate({
    name,
    pin,
    role,
    expireMinutes
  });

  return sendMail({
    to,
    subject,
    html,
    text
  });
}

module.exports = {
  sendMail,
  getTransporter,
  getPasswordResetTemplate,
  getVerificationPinTemplate,
  sendPasswordResetEmail,
  sendVerificationPinEmail
};
