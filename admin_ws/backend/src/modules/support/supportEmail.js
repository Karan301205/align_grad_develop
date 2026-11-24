const env = require('../../config/env');
const { ticketReference, supportLink } = require('./supportTickets');

// Emails to the person who raised a ticket: an admin's reply, and the "resolved"
// notice. Brand styling mirrors main_website's transactional emails and
// modules/recruiters/recruiterVerificationEmail.js. Every typed value is HTML-escaped.

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const portalLabel = (role) => (role === 'RECRUITER' ? 'Recruiter Portal' : 'Candidate Workspace');

const greeting = (name) => (name && String(name).trim() ? String(name).trim() : 'there');

const FOOTNOTE = 'Replies to this email are not added to the ticket. To answer, sign in and reply on the ticket in Help & support.';

function renderLayout({ subject, role, heading, bodyHtml, link }) {
  const cta = link
    ? `
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 8px 0 24px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #003527;">
                    <a href="${escapeHtml(link)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Open Help &amp; support
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
                ${portalLabel(role)} &middot; Help &amp; support
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">${escapeHtml(heading)}</h1>
              ${bodyHtml}
              ${cta}
              <p style="font-size: 13px; color: #64748b; margin: 0;">${escapeHtml(FOOTNOTE)}</p>
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
}

const paragraph = (html) => `<p style="font-size: 14px; color: #475569; margin: 0 0 16px 0;">${html}</p>`;

function ticketLine(reference, subject) {
  return paragraph(`Ticket <strong>${escapeHtml(reference)}</strong>: ${escapeHtml(subject)}`);
}

/**
 * An admin's reply. `resolved` adds the line saying the ticket is now closed and how to reopen it.
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildReplyEmail({ name, role, number, subject, reply, resolved = false }) {
  const reference = ticketReference(number);
  const emailSubject = `AlignGrad support replied [${reference}]`;
  const link = supportLink(role, env);
  const resolvedLine = 'We have marked this ticket as resolved. If you still need help, reply on it in Help & support and it will reopen.';

  const bodyHtml = [
    paragraph(`Hello <strong>${escapeHtml(greeting(name))}</strong>,`),
    ticketLine(reference, subject),
    `<p style="font-size: 13px; color: #64748b; margin: 0 0 6px 0;">Our reply</p>`,
    `<div style="font-size: 14px; color: #1e293b; background-color: #F8FAFC; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 0 0 20px 0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(reply)}</div>`,
    resolved ? paragraph(escapeHtml(resolvedLine)) : paragraph('You can read the whole conversation and reply in <strong>Help &amp; support</strong> in AlignGrad.')
  ].join('\n');

  const text = `Hello ${greeting(name)},

Ticket ${reference}: ${subject}

Our reply:
${reply}

${resolved ? resolvedLine : 'You can read the whole conversation and reply in Help & support in AlignGrad.'}
${link ? `\nOpen Help & support: ${link}\n` : ''}
${FOOTNOTE}

Best regards,
The AlignGrad Team`;

  return { subject: emailSubject, html: renderLayout({ subject: emailSubject, role, heading: 'We replied to your request', bodyHtml, link }), text };
}

/**
 * The ticket was marked resolved without a new reply.
 * @returns {{ subject: string, html: string, text: string }}
 */
function buildResolvedEmail({ name, role, number, subject }) {
  const reference = ticketReference(number);
  const emailSubject = `Your request is resolved [${reference}]`;
  const link = supportLink(role, env);
  const line = 'We have marked this ticket as resolved. If you still need help, reply on it in Help & support and it will reopen.';

  const bodyHtml = [
    paragraph(`Hello <strong>${escapeHtml(greeting(name))}</strong>,`),
    ticketLine(reference, subject),
    paragraph(escapeHtml(line))
  ].join('\n');

  const text = `Hello ${greeting(name)},

Ticket ${reference}: ${subject}

${line}
${link ? `\nOpen Help & support: ${link}\n` : ''}
${FOOTNOTE}

Best regards,
The AlignGrad Team`;

  return { subject: emailSubject, html: renderLayout({ subject: emailSubject, role, heading: 'Your request is resolved', bodyHtml, link }), text };
}

module.exports = { buildReplyEmail, buildResolvedEmail, escapeHtml };
