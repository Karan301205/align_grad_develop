const nodemailer = require('nodemailer');
const env = require('../../config/env');

let transporter = null;

/**
 * Initializes and returns a singleton nodemailer transporter
 */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      // Reuse a few open connections instead of opening (and logging in) a new one per email.
      // Up to EMAIL_QUEUE_CONCURRENCY at once; further emails wait for a free connection.
      pool: true,
      maxConnections: env.EMAIL_QUEUE_CONCURRENCY,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for port 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Avoid self-signed certificate rejection issues in various environments
      },
      // Fail within seconds instead of nodemailer's minutes-long defaults, so a stuck mail
      // server can't hold a request open (callers report a failed email to the user).
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000
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
    console.log(`[EmailService] Email dispatched to ${to} (Subject: "${subject}", MessageId: ${info.messageId})`);
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
