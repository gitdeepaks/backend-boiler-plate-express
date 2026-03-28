import nodemailer from "nodemailer";

/**
 * Mailtrap (Email Testing): use credentials from your Mailtrap inbox → SMTP settings.
 * Defaults match the sandbox host/port (2525). For Mailtrap "Email Sending", set
 * MAILTRAP_HOST=live.smtp.mailtrap.io and the port/host from the dashboard.
 */
const host =
  process.env.MAILTRAP_HOST ||
  process.env.SMTP_HOST ||
  "sandbox.smtp.mailtrap.io";
const port = Number(
  process.env.MAILTRAP_PORT || process.env.SMTP_PORT || 2525,
);
const user = process.env.MAILTRAP_USER || process.env.SMTP_USER;
const pass = process.env.MAILTRAP_PASS || process.env.SMTP_PASS;

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: user && pass ? { user, pass } : undefined,
});

function assertMailConfigured() {
  if (!user || !pass) {
    throw new Error(
      "Email is not configured. Set MAILTRAP_USER and MAILTRAP_PASS (or SMTP_USER / SMTP_PASS) from your Mailtrap inbox.",
    );
  }
}

/** Display name + address for the From header (Mailtrap sandbox accepts most values). */
export function getMailFrom() {
  return process.env.EMAIL_FROM || '"App" <noreply@example.com>';
}

/**
 * @param {string} to - Recipient address
 * @param {string} subject
 * @param {string} html
 * @param {string} [text] - Plain-text fallback (recommended for deliverability)
 */
export async function sendMail(to, subject, html, text) {
  assertMailConfigured();
  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}

/**
 * Sends a verification link. Adjust the path/query to match your frontend route.
 * @param {string} email
 * @param {string} token - Raw (unhashed) token to append to the verification URL
 */
export async function sendVerificationEmail(email, token) {
  const base = (
    process.env.APP_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = "Verify your email";
  const html = `
    <p>Please verify your email by clicking the link below:</p>
    <p><a href="${verifyUrl}">Verify email</a></p>
    <p>Or copy this URL into your browser:</p>
    <p>${verifyUrl}</p>
  `;
  const text = `Verify your email: ${verifyUrl}`;
  await sendMail(email, subject, html, text);
}
