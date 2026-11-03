const env = require('../../config/env');

// Email templates for the admin's company verification decision. Brand styling
// mirrors main_website's transactional emails. All user-supplied values are
// HTML-escaped because company names and rejection notes are free text.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLayout({ subject, heading, accent, bodyHtml }) {
  const portalUrl = env.RECRUITER_PORTAL_URL;
  const cta = portalUrl
    ? `
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 8px 0 24px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #003527;">
                    <a href="${escapeHtml(portalUrl)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Open Recruiter Portal
                    </a>
                  </td>
                </tr>
              </table>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F8F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9F8F6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="background-color: #003527; padding: 28px 36px; text-align: left;">
              <span style="display: inline-block; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Align<span style="color: #6ee7b7;">Grad</span>
              </span>
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a7f3d0; margin-top: 4px; font-weight: 600;">
                Recruiter Portal
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 600; color: ${accent}; margin: 0 0 16px 0;">
                ${escapeHtml(heading)}
              </h1>
              ${bodyHtml}
              ${cta}
              <p style="font-size: 13px; color: #64748b; margin: 0;">
                Best regards,<br>The AlignGrad Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getApprovalEmail({ recipientName, companyName }) {
  const subject = 'AlignGrad — Your company profile has been approved';
  const name = recipientName || 'there';
  const portalLine = env.RECRUITER_PORTAL_URL ? `\nSign in here: ${env.RECRUITER_PORTAL_URL}\n` : '';

  const text = `Hello ${name},

Good news! Our team has reviewed and approved the company profile for ${companyName}.

You now have full access to the AlignGrad Recruiter Portal: you can post jobs and gigs, browse verified candidates, and manage your hiring pipeline.
${portalLine}
Best regards,
The AlignGrad Team`;

  const bodyHtml = `
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
                Hello <strong>${escapeHtml(name)}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
                Our team has reviewed and <strong style="color: #047857;">approved</strong> the company profile for
                <strong>${escapeHtml(companyName)}</strong>.
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
                You now have full access to the Recruiter Portal: post jobs and gigs, browse verified candidates, and manage your hiring pipeline.
              </p>`;

  return {
    subject,
    text,
    html: renderLayout({ subject, heading: 'Company Profile Approved', accent: '#047857', bodyHtml })
  };
}

function getRejectionEmail({ recipientName, companyName, reason }) {
  const subject = 'AlignGrad — Action required on your company profile';
  const name = recipientName || 'there';
  const portalLine = env.RECRUITER_PORTAL_URL ? `\nSign in to update your profile: ${env.RECRUITER_PORTAL_URL}\n` : '';

  const text = `Hello ${name},

Our team reviewed the company profile for ${companyName}, but we could not approve it yet.

Reason: ${reason}

Please sign in, update your company details or verification documents, and resubmit them for review.
${portalLine}
Best regards,
The AlignGrad Team`;

  const bodyHtml = `
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
                Hello <strong>${escapeHtml(name)}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">
                Our team reviewed the company profile for <strong>${escapeHtml(companyName)}</strong>, but we could not approve it yet.
              </p>
              <div style="padding: 14px 16px; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; margin: 0 0 20px 0;">
                <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #be123c; font-weight: 600; margin-bottom: 4px;">Reason</span>
                <span style="font-size: 14px; color: #881337; white-space: pre-line;">${escapeHtml(reason)}</span>
              </div>
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
                Please sign in, update your company details or verification documents, and resubmit them for review.
              </p>`;

  return {
    subject,
    text,
    html: renderLayout({ subject, heading: 'Company Profile Not Approved', accent: '#be123c', bodyHtml })
  };
}

module.exports = { getApprovalEmail, getRejectionEmail };
