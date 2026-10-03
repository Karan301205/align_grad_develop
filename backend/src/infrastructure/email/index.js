const { sendMail, getTransporter } = require('./emailTransport');
const { getPasswordResetTemplate } = require('./emailTemplates');

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

module.exports = {
  sendMail,
  getTransporter,
  getPasswordResetTemplate,
  sendPasswordResetEmail
};
