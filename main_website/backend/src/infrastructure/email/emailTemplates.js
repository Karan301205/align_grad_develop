/**
 * Generates the HTML and plaintext email template for password reset
 * @param {Object} params
 * @param {string} params.name - User's name or display label
 * @param {string} params.resetUrl - Full URL to reset password
 * @param {string} params.role - "STUDENT" or "RECRUITER"
 * @param {number} [params.expireMinutes=10] - Expiration time in minutes
 * @returns {{ subject: string, html: string, text: string }}
 */
function getPasswordResetTemplate({ name, resetUrl, role, expireMinutes = 10 }) {
  const portalLabel = role === 'RECRUITER' ? 'Recruiter Portal' : 'Candidate Workspace';
  const subject = `AlignGrad — Reset Your Password (${portalLabel})`;

  const text = `Hello ${name || 'User'},

You requested to reset your password for your AlignGrad ${portalLabel} account.

Please click the link below to set a new password:
${resetUrl}

This link is valid for ${expireMinutes} minutes and can only be used once.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
The AlignGrad Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F8F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F9F8F6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #003527; padding: 28px 36px; text-align: left;">
              <span style="display: inline-block; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Align<span style="color: #6ee7b7;">Grad</span>
              </span>
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a7f3d0; margin-top: 4px; font-weight: 600;">
                ${portalLabel}
              </span>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0;">
                Password Reset Request
              </h1>
              <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">
                Hello <strong>${name || 'there'}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 28px 0;">
                We received a request to reset the password for your account associated with this email address. Click the secure button below to choose a new password:
              </p>

              <!-- Action Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #003527;">
                    <a href="${resetUrl}" target="_blank" style="font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 28px; display: inline-block; border-radius: 8px; background-color: #003527; border: 1px solid #003527;">
                      Reset Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #f8fafc; border-left: 4px solid #003527; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #64748b; margin: 0;">
                  ⏳ <strong>Security Note:</strong> This reset link will automatically expire in <strong>${expireMinutes} minutes</strong> and can only be used once.
                </p>
              </div>

              <!-- Fallback Link -->
              <p style="font-size: 12px; color: #94a3b8; margin: 0 0 12px 0;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 11px; word-break: break-all; color: #0284c7; margin: 0;">
                <a href="${resetUrl}" target="_blank" style="color: #0284c7; text-decoration: underline;">
                  ${resetUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 36px; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0 0 6px 0;">
                If you did not request this password reset, please ignore this email. Your current password will remain unchanged.
              </p>
              <p style="font-size: 11px; color: #cbd5e1; margin: 0;">
                © 2026 AlignGrad. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return { subject, html, text };
}

module.exports = {
  getPasswordResetTemplate
};
