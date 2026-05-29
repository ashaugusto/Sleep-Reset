import { Resend } from "resend";
import { pool } from "@workspace/db";
import { getRecoveryEmail, type RecoveryStep } from "./recoveryEmails";
import { getPostPurchaseEmail, getMorningReminderEmail, type PostPurchaseStep } from "./postPurchaseEmails";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

const FROM = process.env.RESEND_FROM || "Sleep Rewire <onboarding@resend.dev>";

// Append to email_log table. Non-fatal — never blocks the email flow.
async function logEmail(args: {
  email: string;
  leadId?: string | null;
  userId?: string | null;
  emailType: string;
  step?: number | null;
  subject?: string | null;
  resendId?: string | null;
  success: boolean;
  error?: string | null;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO email_log (email, lead_id, user_id, email_type, step, subject, resend_id, success, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        args.email.toLowerCase().trim(),
        args.leadId ?? null,
        args.userId ?? null,
        args.emailType,
        args.step ?? null,
        args.subject ?? null,
        args.resendId ?? null,
        args.success,
        args.error ?? null,
      ],
    );
  } catch (e) {
    console.error("[email-log] insert failed (non-fatal):", e);
  }
}

// ─── Recovery email (abandoned checkout sequence) ────────────────────────────
export async function sendRecoveryEmail({
  email,
  name,
  heroVariant,
  step,
}: {
  email: string;
  name?: string | null;
  heroVariant?: string | null;
  step: RecoveryStep;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping recovery email");
    return false;
  }
  const firstName = (name?.split(" ")[0] || "").trim();
  const { subject, html } = getRecoveryEmail(step, { firstName, heroVariant: heroVariant ?? null });
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject, html });
    if (error) {
      console.error(`[email] Recovery step ${step} send error for ${email}:`, error);
      await logEmail({ email, emailType: "recovery", step, subject, success: false, error: JSON.stringify(error).slice(0, 500) });
      return false;
    }
    console.log(`[email] Recovery step ${step} sent to ${email}`);
    await logEmail({ email, emailType: "recovery", step, subject, resendId: data?.id ?? null, success: true });
    return true;
  } catch (err) {
    console.error(`[email] Recovery step ${step} send failed for ${email}:`, err);
    await logEmail({ email, emailType: "recovery", step, subject, success: false, error: (err as Error).message?.slice(0, 500) });
    return false;
  }
}
// ─── Post-purchase engagement email (9-email CBT-I sequence) ─────────────────
export async function sendPostPurchaseEmail({
  email,
  name,
  step,
  leadId,
}: {
  email: string;
  name?: string | null;
  step: PostPurchaseStep;
  leadId?: string | null;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping post-purchase email");
    return false;
  }
  const firstName = (name?.split(" ")[0] || "").trim();
  const { subject, html } = getPostPurchaseEmail(step, { firstName, leadId });
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject, html });
    if (error) {
      console.error(`[email] PostPurchase step ${step} send error for ${email}:`, error);
      await logEmail({ email, leadId, emailType: "post_purchase", step, subject, success: false, error: JSON.stringify(error).slice(0, 500) });
      return false;
    }
    console.log(`[email] PostPurchase step ${step} sent to ${email}`);
    await logEmail({ email, leadId, emailType: "post_purchase", step, subject, resendId: data?.id ?? null, success: true });
    return true;
  } catch (err) {
    console.error(`[email] PostPurchase step ${step} send failed for ${email}:`, err);
    await logEmail({ email, leadId, emailType: "post_purchase", step, subject, success: false, error: (err as Error).message?.slice(0, 500) });
    return false;
  }
}

// ─── Morning reminder email (log last night) ────────────────────────────────
export async function sendMorningReminderEmail({
  email,
  name,
  dayNumber,
  leadId,
}: {
  email: string;
  name?: string | null;
  dayNumber: number;
  leadId?: string | null;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping morning reminder");
    return false;
  }
  const firstName = (name?.split(" ")[0] || "").trim();
  const { subject, html } = getMorningReminderEmail({ firstName, dayNumber, leadId });
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject, html });
    if (error) {
      console.error(`[email] Morning reminder send error for ${email}:`, error);
      await logEmail({ email, leadId, emailType: "morning_reminder", step: dayNumber, subject, success: false, error: JSON.stringify(error).slice(0, 500) });
      return false;
    }
    console.log(`[email] Morning reminder (day ${dayNumber}) sent to ${email}`);
    await logEmail({ email, leadId, emailType: "morning_reminder", step: dayNumber, subject, resendId: data?.id ?? null, success: true });
    return true;
  } catch (err) {
    console.error(`[email] Morning reminder send failed for ${email}:`, err);
    await logEmail({ email, leadId, emailType: "morning_reminder", step: dayNumber, subject, success: false, error: (err as Error).message?.slice(0, 500) });
    return false;
  }
}

const APP_URL = () => process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
// In dev the app is mounted at /sleep-reset; in production it lives at the root
const BASE_PATH = () => (process.env.APP_URL ? "" : "/sleep-reset");

// ─── Welcome email (sent after account activation) ───────────────────────────
export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const firstName = name?.split(" ")[0] || "there";
  const loginUrl = `${APP_URL()}${BASE_PATH()}/sign-in`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to The Sleep Rewire Protocol</title>
</head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Inter',Arial,sans-serif;color:#e6edf3;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1a1f2e;border:1px solid #30363d;border-radius:12px;padding:16px 28px;text-align:center;">
                    <span style="font-size:20px;margin-right:8px;">🌙</span>
                    <span style="font-weight:700;font-size:16px;color:#e6edf3;letter-spacing:-0.3px;">Sleep Rewire</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#161b22;border:1px solid #30363d;border-radius:16px;overflow:hidden;">

              <!-- Green top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#238636;padding:16px 32px;text-align:center;">
                    <span style="font-size:13px;font-weight:700;color:#ffffff;letter-spacing:0.5px;text-transform:uppercase;">
                      ✅ Payment Confirmed — Your Access Is Ready
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 32px;">

                    <p style="margin:0 0 8px;font-size:26px;font-weight:800;color:#e6edf3;line-height:1.2;">
                      Welcome, ${firstName}. 🎉
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;color:#8b949e;line-height:1.6;">
                      Your account for <strong style="color:#e6edf3;">The Sleep Rewire Protocol</strong> is fully activated.
                      Tonight, you start Night 1.
                    </p>

                    <!-- What's included -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;border:1px solid #30363d;border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#58a6ff;text-transform:uppercase;letter-spacing:1px;">What you have access to</p>
                          ${[
                            "7-Night CBT-I Protocol — starts tonight",
                            "Anxiety &amp; Sleep Masterclass (Bonus #1)",
                            "Evening Wind-Down Ritual Guide (Bonus #2)",
                            "Morning Recovery Protocol (Bonus #3)",
                            "Sleep Efficiency Tracker Template (Bonus #4)",
                            "Lifetime Access + All Future Updates (Bonus #5)",
                          ].map(item => `
                          <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                            <tr>
                              <td style="width:20px;vertical-align:top;padding-top:1px;">
                                <span style="color:#3fb950;font-size:14px;">✓</span>
                              </td>
                              <td style="font-size:13px;color:#c9d1d9;line-height:1.5;">${item}</td>
                            </tr>
                          </table>`).join("")}
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}"
                            style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;letter-spacing:0.2px;">
                            Access My Protocol →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 4px;font-size:12px;color:#6e7681;text-align:center;">
                      Or go to: <a href="${loginUrl}" style="color:#58a6ff;">${loginUrl}</a>
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Night 1 reminder -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;border-top:1px solid #30363d;">
                <tr>
                  <td style="padding:24px 32px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#e6edf3;">📅 Tonight — Night 1: Sleep Audit</p>
                    <p style="margin:0;font-size:13px;color:#8b949e;line-height:1.6;">
                      Map your current sleep patterns. Evening + morning diary. Your personalised sleep window is calculated.
                      Takes about 10 minutes. Do it before you go to bed tonight.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#6e7681;">
                Questions? Reply to this email or contact us at
                <a href="mailto:support@sleepwired.com" style="color:#58a6ff;">support@sleepwired.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#484f58;">
                © 2026 Sleep Rewire. All rights reserved.<br />
                This program is for educational purposes only and is not a substitute for professional medical advice.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const subject = "✅ Your Sleep Rewire Protocol access is ready — start tonight";
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject, html });

    if (error) {
      console.error("[email] Resend error:", error);
      await logEmail({ email, emailType: "welcome", subject, success: false, error: JSON.stringify(error).slice(0, 500) });
    } else {
      console.log(`[email] Welcome email sent to ${email}`);
      await logEmail({ email, emailType: "welcome", subject, resendId: data?.id ?? null, success: true });
    }
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err);
    await logEmail({ email, emailType: "welcome", success: false, error: (err as Error).message?.slice(0, 500) });
  }
}

// ─── Account pending email (paid but no account or incomplete onboarding) ───
export async function sendAccountPendingEmail({
  email,
  name,
  leadId,
  stage,
}: {
  email: string;
  name?: string | null;
  leadId?: string | null;
  stage: "no_account" | "onboarding_incomplete";
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping account-pending email");
    return false;
  }
  const firstName = (name?.split(" ")[0] || "").trim() || "there";
  const signUrl = `${APP_URL()}${BASE_PATH()}/sign-up`;
  const onboardUrl = `${APP_URL()}${BASE_PATH()}/onboarding`;
  const isNoAccount = stage === "no_account";
  const subject = isNoAccount
    ? "Your Sleep Wired access is waiting — 1 step left"
    : "Finish your Sleep Wired setup — you're almost there";
  const msg = isNoAccount
    ? `You paid for The Cognitive Shutdown Method but haven't created your account yet. Without the account, the 7-night protocol can't unlock. Takes 60 seconds:`
    : `Your account is created, but you haven't finished the short onboarding (5 questions). The protocol needs your sleep window calibrated to start working tonight.`;
  const cta = isNoAccount ? "Create my account" : "Finish onboarding";
  const ctaUrl = isNoAccount ? signUrl : onboardUrl;
  const html = `<!DOCTYPE html><html><body style="font-family:Inter,Arial,sans-serif;background:#0d1117;color:#e6edf3;margin:0;padding:32px;">
<div style="max-width:560px;margin:0 auto;background:#161b22;border:1px solid #30363d;border-radius:14px;padding:32px;">
  <p style="font-size:18px;font-weight:600;margin:0 0 16px;">Hey ${firstName},</p>
  <p style="font-size:15px;color:#c9d1d9;line-height:1.6;margin:0 0 20px;">${msg}</p>
  <p style="text-align:center;margin:24px 0;">
    <a href="${ctaUrl}" style="display:inline-block;background:#238636;color:#fff;padding:14px 28px;border-radius:8px;font-weight:700;text-decoration:none;">${cta} →</a>
  </p>
  <p style="font-size:13px;color:#8b949e;line-height:1.5;margin:20px 0 0;">
    You already paid €27. This is just the final access step. Any issues, reply to this email and we'll sort it out.
  </p>
  <p style="font-size:11px;color:#6e7681;margin:28px 0 0;border-top:1px solid #30363d;padding-top:16px;">
    Sleep Wired · support@sleepwired.com · 60-night money-back guarantee
  </p>
</div></body></html>`;
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to: email, subject, html });
    if (error) {
      console.error(`[email] AccountPending(${stage}) send error for ${email}:`, error);
      await logEmail({ email, leadId, emailType: "account_pending", subject, success: false, error: JSON.stringify(error).slice(0, 500) });
      return false;
    }
    console.log(`[email] AccountPending(${stage}) sent to ${email}`);
    await logEmail({ email, leadId, emailType: "account_pending", subject, resendId: data?.id ?? null, success: true });
    return true;
  } catch (err) {
    console.error(`[email] AccountPending(${stage}) failed for ${email}:`, err);
    await logEmail({ email, leadId, emailType: "account_pending", subject, success: false, error: (err as Error).message?.slice(0, 500) });
    return false;
  }
}
