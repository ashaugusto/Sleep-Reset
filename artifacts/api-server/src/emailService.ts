import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

const FROM = process.env.RESEND_FROM || "Sleep Rewire <onboarding@resend.dev>";
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
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "✅ Your Sleep Rewire Protocol access is ready — start tonight",
      html,
    });

    if (error) {
      console.error("[email] Resend error:", error);
    } else {
      console.log(`[email] Welcome email sent to ${email}`);
    }
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err);
  }
}
