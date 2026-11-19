import nodemailer from 'nodemailer';
import { EmailDeliveryLog } from '../models/EmailDeliveryLog.js';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const service = process.env.SMTP_SERVICE || (user && user.endsWith('@gmail.com') && !host ? 'gmail' : undefined);

  if (service && user && pass) {
    transporter = nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  } else if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  return transporter;
};

const buildTemplate = ({ title, preheader, bodyHtml, ctaText, ctaUrl }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const targetUrl = ctaUrl && ctaUrl.startsWith('http') ? ctaUrl : `${clientUrl}${ctaUrl || ''}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #0b1728; padding: 24px 32px; text-align: left; }
    .logo-text { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .logo-accent { color: #38a3ff; }
    .tagline { color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-top: 2px; }
    .content { padding: 32px; color: #1e293b; line-height: 1.6; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 12px 28px; background-color: #006ce6; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; margin-top: 20px; }
    .footer { padding: 24px 32px; background-color: #f1f5f9; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Uni<span class="logo-accent">Verse</span></div>
      <div class="tagline">Unified Digital Campus Community</div>
    </div>
    <div class="content">
      <h1 class="title">${title}</h1>
      ${bodyHtml}
      ${ctaText && targetUrl ? `<div style="text-align: center; margin-top: 24px;"><a href="${targetUrl}" class="btn">${ctaText}</a></div>` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0;">This email was sent by UniVerse Campus Platform.</p>
      <p style="margin: 4px 0 0 0;">Manage your notification and email settings at <a href="${clientUrl}/settings/notifications" style="color: #006ce6;">Notification Preferences</a>.</p>
    </div>
  </div>
</body>
</html>
`;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  category = 'system',
  entityType = '',
  entityId = null,
  recipientId = null,
}) => {
  try {
    const mailer = await getTransporter();
    const from = process.env.EMAIL_FROM || 'UniVerse Campus <noreply@universe.edu>';

    const info = await mailer.sendMail({
      from,
      to,
      subject,
      html,
      text: text || subject,
    });

    const hasSmtp = Boolean(
      (process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.SMTP_SERVICE || (process.env.SMTP_USER && process.env.SMTP_USER.endsWith('@gmail.com'))) &&
      (process.env.SMTP_USER || process.env.EMAIL_USER) &&
      (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS)
    );
    const isSimulated = !hasSmtp;
    const providerMessageId = info.messageId || `sim-${Date.now()}`;

    await EmailDeliveryLog.create({
      recipient: recipientId,
      recipientEmail: to.toLowerCase().trim(),
      category,
      subject,
      entityType,
      entityId,
      deliveryStatus: isSimulated ? 'simulated' : 'sent',
      providerMessageId,
      attemptCount: 1,
    });

    return { success: true, messageId: providerMessageId, simulated: isSimulated };
  } catch (error) {
    console.error(`[Email Service Error to ${to}]:`, error.message);

    try {
      await EmailDeliveryLog.create({
        recipient: recipientId,
        recipientEmail: to.toLowerCase().trim(),
        category,
        subject,
        entityType,
        entityId,
        deliveryStatus: 'failed',
        errorMessage: error.message,
        attemptCount: 1,
      });
    } catch {}

    return { success: false, error: error.message };
  }
};

export const sendOtpEmail = async (email, otp, name = 'Student') => {
  const html = buildTemplate({
    title: 'Your Password Reset OTP',
    bodyHtml: `
      <p>Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset your password on the UniVerse platform. Use the verification code below to complete your password reset:</p>
      <div style="background-color: #f0f7ff; border: 2px dashed #006ce6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #006ce6; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code is valid for <strong>5 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });

  const result = await sendEmail({
    to: email,
    subject: `UniVerse Password Reset Code: ${otp}`,
    html,
    text: `Your UniVerse password reset code is ${otp}. Valid for 5 minutes.`,
    category: 'otp',
  });

  return { ...result, otp };
};

export const sendNewClubEmail = async ({
  to,
  recipientId,
  clubName,
  category,
  description,
  advisorName,
  clubId,
}) => {
  const html = buildTemplate({
    title: `🎉 New Official College Club: ${clubName}`,
    bodyHtml: `
      <p>Exciting campus update! A new official college club has been chartered and approved by the Main College Administration.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #006ce6; padding: 16px; margin: 16px 0; border-radius: 0 12px 12px 0;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #0f172a;">${clubName}</h3>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;"><strong>Category:</strong> ${category}</p>
        ${advisorName ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #475569;"><strong>Faculty Advisor:</strong> ${advisorName}</p>` : ''}
        <p style="margin: 0; font-size: 13px; color: #334155;">${description}</p>
      </div>
      <p>Explore the club leadership hierarchy, meet fellow members, and view upcoming club activities!</p>
    `,
    ctaText: 'Visit Official Club Page',
    ctaUrl: `/clubs/${clubId}`,
  });

  return sendEmail({
    to,
    recipientId,
    subject: `New Official Club Chartered: ${clubName}`,
    html,
    category: 'new_club',
    entityType: 'CollegeClub',
    entityId: clubId,
  });
};

export const sendFormReminderEmail = async ({
  to,
  recipientId,
  formTitle,
  deadlineStr,
  daysRemaining,
  formUrl,
  formId,
}) => {
  const urgencyColor = daysRemaining <= 1 ? '#ef4444' : daysRemaining <= 3 ? '#f59e0b' : '#006ce6';
  const urgencyBadge = daysRemaining === 0 ? 'CLOSES TODAY' : daysRemaining === 1 ? 'CLOSES TOMORROW' : `${daysRemaining} DAYS REMAINING`;

  const html = buildTemplate({
    title: `⏰ Form Deadline Reminder`,
    bodyHtml: `
      <p>Hello,</p>
      <p>This is a reminder for a student opportunity you saved to your UniVerse Form Wishlist:</p>
      <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px; margin: 16px 0;">
        <div style="display: inline-block; background-color: ${urgencyColor}; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; margin-bottom: 12px;">
          ${urgencyBadge}
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 17px; color: #0f172a;">${formTitle}</h3>
        <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Deadline:</strong> ${deadlineStr}</p>
      </div>
      <p>Don't miss the deadline! Click the button below to access the application / submission form directly:</p>
    `,
    ctaText: 'Open Opportunity Form',
    ctaUrl: formUrl,
  });

  return sendEmail({
    to,
    recipientId,
    subject: `Reminder: "${formTitle}" closes in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}!`,
    html,
    category: 'form_reminder',
    entityType: 'StudentForm',
    entityId: formId,
  });
};

export const sendAnnouncementEmail = async ({
  to,
  recipientId,
  title,
  content,
  priority = 'normal',
  announcementId,
}) => {
  const isImportant = priority === 'important';
  const html = buildTemplate({
    title: `${isImportant ? '⚠️ IMPORTANT NOTICE: ' : '📢 College Notice: '}${title}`,
    bodyHtml: `
      <div style="padding: 16px; border-radius: 12px; background-color: ${isImportant ? '#fffbeb' : '#f8fafc'}; border: 1px solid ${isImportant ? '#fde68a' : '#e2e8f0'}; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #1e293b;">${content.replace(/\n/g, '<br>')}</p>
      </div>
      <p style="font-size: 13px; color: #64748b;">Published officially by Campus Administration.</p>
    `,
    ctaText: 'View on UniVerse',
    ctaUrl: `/announcements`,
  });

  return sendEmail({
    to,
    recipientId,
    subject: `${isImportant ? '[IMPORTANT] ' : ''}${title} — UniVerse Campus Notice`,
    html,
    category: 'announcement',
    entityType: 'Announcement',
    entityId: announcementId,
  });
};

