// Sleep Wired — 3-step abandoned-checkout email recovery sequence
// Trigger windows (after lead created without purchase):
//   step 0 → 1 = T+30min   soft reminder
//   step 1 → 2 = T+24h     objection handling
//   step 2 → 3 = T+72h     last chance / urgency

const APP_URL = () => process.env.APP_URL || "https://sleepwired.com";

function buildLink(heroVariant: string | null, utmCampaign: string): string {
  const base = APP_URL();
  const params = new URLSearchParams();
  if (heroVariant && heroVariant !== "default") params.set("h", heroVariant);
  params.set("utm_source", "email");
  params.set("utm_medium", "recovery");
  params.set("utm_campaign", utmCampaign);
  return `${base}/?${params.toString()}`;
}

type RecoveryContext = {
  firstName: string;
  heroVariant: string | null;
};

export type RecoveryStep = 1 | 2 | 3;

export function getRecoveryEmail(step: RecoveryStep, ctx: RecoveryContext): { subject: string; html: string } {
  const link1 = buildLink(ctx.heroVariant, "recovery_t30");
  const link2 = buildLink(ctx.heroVariant, "recovery_t24h");
  const link3 = buildLink(ctx.heroVariant, "recovery_t72h");
  const greeting = ctx.firstName ? `${ctx.firstName},` : "Hey,";

  if (step === 1) {
    return {
      subject: "Your sleep window is waiting",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${greeting}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          You almost set up your Sleep Wired protocol — but didn't finish checkout.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The 7-night Cognitive Shutdown Method is ready to go for you. Tonight could be your first proper sleep in weeks.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          €27 today. Locked in until June 30 (€97 after).
        </p>
        ${ctaButton(link1, "Finish my setup — €27")}
        <p style="margin:28px 0 0;font-size:12px;color:#8b949e;line-height:1.5;">
          60-night money-back. Keep everything if it doesn't work.
        </p>
      `),
    };
  }

  if (step === 2) {
    return {
      subject: "Why most insomniacs quit — and how the protocol fixes that",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${greeting}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Most people with chronic insomnia have tried 3+ things by now. Melatonin. Meditation apps. CBD. Sleep hygiene blog posts.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          They quit because nothing addresses the actual cause: <strong style="color:#e6edf3;">cognitive hyperarousal</strong> — a brain that learned to stay alert at night.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          That's why every major sleep authority (NHS, Mayo, AASM, JAMA) recommends CBT-I as first-line treatment. It's the only protocol clinically proven to retrain the brain.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Sleep Wired delivers it in 7 nights, self-guided, from your bed. The same approach a sleep clinic charges €300+ for.
        </p>
        ${ctaButton(link2, "Start tonight — €27")}
        <p style="margin:28px 0 0;font-size:12px;color:#8b949e;line-height:1.5;">
          60-night money-back. No questions. Keep the audio sessions, the calculator, and the workbook either way.
        </p>
      `),
    };
  }

  // step 3
  return {
    subject: "Last chance at €27 before June 30",
    html: wrap(`
      <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
        Quick heads-up — the launch price (€27) ends June 30. After that the protocol moves to €97 permanently.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
        Same product. Same 60-night money-back. Same 7 nights to learn how your brain actually shuts down at bedtime.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
        If you want it at €27, this is the window. After that, I can't bring you back here at this price.
      </p>
      ${ctaButton(link3, "Lock in €27 before June 30")}
      <p style="margin:28px 0 0;font-size:12px;color:#8b949e;line-height:1.5;">
        If you've decided it's not for you, no worries — this is the last email about it. Sleep well either way.
      </p>
    `),
  };
}

function ctaButton(href: string, label: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${href}" style="display:inline-block;background-color:#C9A14A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;letter-spacing:0.2px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function wrap(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:'Inter',Arial,sans-serif;color:#e6edf3;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:18px;font-weight:700;color:#e6edf3;letter-spacing:-0.3px;">Sleep Wired</span>
        </td></tr>
        <tr><td style="background-color:#161b22;border:1px solid #30363d;border-radius:16px;padding:36px 32px;">
          ${inner}
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#484f58;line-height:1.5;">
            Sleep Wired · sleepwired.com · For educational use; not medical advice.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
