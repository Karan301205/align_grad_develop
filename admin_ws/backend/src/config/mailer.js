const nodemailer = require('nodemailer');
const env = require('./env');

// SMTP transport for the Admin Portal (independent of main_website's email
// infrastructure, per the admin_ws isolation rule).

let transporter = null;

function isMailerConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  if (!isMailerConfigured()) {
    throw new Error('SMTP is not configured for the Admin Portal (set SMTP_HOST, SMTP_USER, SMTP_PASS).');
  }
  const info = await getTransporter().sendMail({
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
    to,
    subject,
    text,
    html
  });
  console.log(`[AdminMailer] Email dispatched (Subject: "${subject}", MessageId: ${info.messageId})`);
  return info;
}

module.exports = { isMailerConfigured, sendMail };
