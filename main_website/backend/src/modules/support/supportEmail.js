const env = require('../../config/env');
const { ticketReference } = require('./supportRules');

// "We've received your ticket" email, sent when a candidate or recruiter raises a
// ticket. The look follows the other AlignGrad emails (infrastructure/email/
// emailTemplates.js). Every value people typed is HTML-escaped.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Link that opens Help & support after sign-in (App.jsx reads `open=support`): the role's own
 * portal (RECRUITER_PORTAL_URL / CANDIDATE_PORTAL_URL, needed when the two apps run on separate
 * hosts), else CLIENT_URL. '' when none is set or the address isn't http(s), so the email has no button.
 */
function supportPageUrl(role, config = env) {
  const base = (role === 'RECRUITER' ? config.RECRUITER_PORTAL_URL : config.CANDIDATE_PORTAL_URL) || config.CLIENT_URL;
  if (!base) return '';
  try {
    const url = new URL(base);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    url.searchParams.set('open', 'support');
    return url.toString();
  } catch {
    return '';
  }
}

const portalLabel = (role) => (role === 'RECRUITER' ? 'Recruiter Portal' : 'Candidate Workspace');

function detailRow(label, valueHtml) {
  return `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 110px; vertical-align: top;">${label}</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600;">${valueHtml}</td>
                </tr>`;
}

/**
 * @param {Object} params
 * @param {string} [params.name]      the requester's name ('' → "there")
 * @param {string} params.role        "STUDENT" | "RECRUITER"
 * @param {number} params.number      ticket number
 * @param {string} params.subject     ticket subject
 * @param {string} params.categoryLabel
 * @param {string} params.message     the requester's first message
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildTicketReceivedEmail({ name, role, number, subject, categoryLabel, message }) {
  const reference = ticketReference(number);
  const emailSubject = `We've received your request [${reference}]`;
  const greetingName = name && String(name).trim() ? String(name).trim() : 'there';
  const url = supportPageUrl(role);

  const text = `Hello ${greetingName},

Thanks for getting in touch. We've received your request and our team will look into it.
We'll email you when we reply, and you can follow the conversation in Help & support in AlignGrad.

Ticket: ${reference}
Topic: ${categoryLabel}
Subject: ${subject}

Your message:
${message}
${url ? `\nOpen Help & support: ${url}\n` : ''}
To add more details, sign in and reply on the ticket in Help & support. Replies to this email are not added to the ticket.

Best regards,
The AlignGrad Team`;

  const cta = url
    ? `
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 4px 0 24px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #003527;">
                    <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Open Help &amp; support
                    </a>
                  </td>
                </tr>
              </table>`
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(emailSubject)}</title>
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
                ${portalLabel(role)} &middot; Help &amp; support
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">We've received your request</h1>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">Hello <strong>${escapeHtml(greetingName)}</strong>,</p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
                Thanks for getting in touch. Our team will look into it. We'll email you when we reply, and you can follow the conversation in <strong>Help &amp; support</strong> in AlignGrad.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 20px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 8px 0;">
                ${detailRow('Ticket', escapeHtml(reference))}
                ${detailRow('Topic', escapeHtml(categoryLabel))}
                ${detailRow('Subject', escapeHtml(subject))}
              </table>
              <p style="font-size: 13px; color: #64748b; margin: 0 0 6px 0;">Your message</p>
              <div style="font-size: 14px; color: #1e293b; background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 0 0 24px 0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(message)}</div>
              ${cta}
              <p style="font-size: 13px; color: #64748b; margin: 0;">
                To add more details, sign in and reply on the ticket in Help &amp; support. Replies to this email are not added to the ticket.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 36px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} AlignGrad. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: emailSubject, html, text };
}

module.exports = { buildTicketReceivedEmail, escapeHtml, supportPageUrl };
