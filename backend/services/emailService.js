const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined
});

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildRegistrationEmail = ({ studentName, registration, activity, event, collegeName }) => {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@campusadda.com";

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#0f172a,#2563eb);padding:28px;color:#fff;">
          <div style="font-size:20px;font-weight:700;letter-spacing:.4px;">Campus Adda</div>
          <div style="font-size:13px;opacity:.9;margin-top:6px;">Event Participation Confirmation</div>
        </div>
        <div style="padding:28px;line-height:1.7;">
          <p style="margin:0 0 16px;">Hello ${escapeHtml(studentName)},</p>
          <p style="margin:0 0 18px;">Congratulations! Your registration has been successfully confirmed.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;margin:20px 0;">
            <p style="margin:0 0 8px;"><strong>Registration ID:</strong> ${escapeHtml(registration.registration_id)}</p>
            <p style="margin:0 0 8px;"><strong>Fest:</strong> ${escapeHtml(event.name)}</p>
            <p style="margin:0 0 8px;"><strong>Activity:</strong> ${escapeHtml(activity.activity_name)}</p>
            <p style="margin:0 0 8px;"><strong>College:</strong> ${escapeHtml(collegeName || "Campus Adda")}</p>
            <p style="margin:0 0 8px;"><strong>Venue:</strong> ${escapeHtml(activity.venue)}</p>
            <p style="margin:0 0 8px;"><strong>Date:</strong> ${escapeHtml(activity.event_date_label)}</p>
            <p style="margin:0 0 8px;"><strong>Time:</strong> ${escapeHtml(activity.start_time_label)}</p>
            <p style="margin:0;"><strong>Status:</strong> Registered</p>
          </div>
          <p style="margin:0 0 12px;">We look forward to seeing you at the event.</p>
          <p style="margin:0 0 12px;">Thank you for choosing Campus Adda.</p>
          <p style="margin:0;">Best Regards,<br/>Campus Adda Team</p>
        </div>
        <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
          Support: ${escapeHtml(supportEmail)}
        </div>
      </div>
    </div>
  `;
};

const sendRegistrationConfirmation = async ({ to, studentName, registration, activity, event, collegeName }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP configuration missing. Registration email skipped.");
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Registration Confirmed - Campus Adda",
    html: buildRegistrationEmail({ studentName, registration, activity, event, collegeName })
  });
};

module.exports = {
  sendRegistrationConfirmation
};