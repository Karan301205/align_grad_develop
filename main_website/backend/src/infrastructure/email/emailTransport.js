const nodemailer = require('nodemailer');
const env = require('../../config/env');

let transporter = null;

/**
 * Initializes and returns a singleton nodemailer transporter
 */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for port 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Avoid self-signed certificate rejection issues in various environments
      }
    });
  }
  return transporter;
}

/**
 * Sends an email using the configured SMTP transport
 * @param {Object} options - { to, subject, html, text }
 * @returns {Promise<Object>} info
 */
async function sendMail({ to, subject, html, text }) {
  const mailer = getTransporter();
  const mailOptions = {
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    console.log(`[EmailService] Password reset email dispatched to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

module.exports = {
  getTransporter,
  sendMail
};
