// Sleep Wired — post-purchase 9-email engagement sequence
// Trigger windows (after lead.purchased_at):
//   step 0 → 1 = T+0      welcome (sent from webhook directly, not via tick)
//   step 1 → 2 = T+24h    Night 1 — The Anchor
//   step 2 → 3 = T+48h    Night 2 — The Bed Reset
//   step 3 → 4 = T+72h    Night 3 — The Sleep Window
//   step 4 → 5 = T+96h    Night 4 — The Quiet Mind
//   step 5 → 6 = T+120h   Night 5 — The Wake Discipline
//   step 6 → 7 = T+144h   Night 6 — The Reinforcement
//   step 7 → 8 = T+168h   Night 7 — The Consolidation
//   step 8 → 9 = T+192h   Day 8 — You did it / what's next

const APP_URL = () => process.env.APP_URL || "https://sleepwired.com";

function loginLink(utmCampaign: string): string {
  const params = new URLSearchParams();
  params.set("utm_source", "email");
  params.set("utm_medium", "post_purchase");
  params.set("utm_campaign", utmCampaign);
  return `${APP_URL()}/sign-in?${params.toString()}`;
}

type Ctx = { firstName: string };

export type PostPurchaseStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function getPostPurchaseEmail(step: PostPurchaseStep, ctx: Ctx): { subject: string; html: string } {
  const g = ctx.firstName ? `${ctx.firstName},` : "Hey,";

  if (step === 1) {
    return {
      subject: "You're in — tonight is Night 1",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Your access to the Cognitive Shutdown Method is active. Tonight you start Night 1: <strong style="color:#e6edf3;">The Anchor</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The protocol works because of one rule the medical literature is unambiguous about: <strong style="color:#e6edf3;">wake time matters more than bedtime</strong>. You'll pick yours tonight. It becomes the anchor everything else hangs on.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Sign in below to set up Night 1. Each evening for the next 7 days I'll send a short email with what's coming and why it works.
        </p>
        ${cta(loginLink("pp_welcome"), "Open Night 1")}
        <p style="margin:28px 0 0;font-size:12px;color:#8b949e;line-height:1.5;">
          60-night money-back. If it doesn't work, keep everything and we refund.
        </p>
      `),
    };
  }

  if (step === 2) {
    return {
      subject: "Night 1 — The Anchor",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight you set your wake time and commit to it — weekends included.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Why this matters: the brain runs on a circadian process (Process C) and a sleep pressure process (Process S). Inconsistent wake times scramble both. One scrambled night takes 3 days to recover from.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The wake time is not negotiable. Bedtime gets flexible later — wake time stays fixed.
        </p>
        ${cta(loginLink("pp_night1"), "Start Night 1")}
        <p style="margin:24px 0 0;font-size:12px;color:#8b949e;">If you already started, log how you slept this morning — that's how the protocol calibrates for Night 2.</p>
      `),
    };
  }

  if (step === 3) {
    return {
      subject: "Night 2 — The Bed Reset",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight is about <strong style="color:#e6edf3;">stimulus control</strong>: rebuilding the link between your bed and sleep.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          If you've spent months lying awake in bed, your brain has learned that bed = thinking, scrolling, worrying. That association has to be broken.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The rule for tonight: if you're not asleep in 15-20 minutes, you get up. No phone, no clock-checking. You return to bed only when sleepy. This feels counterintuitive. It's the most effective intervention in the protocol.
        </p>
        ${cta(loginLink("pp_night2"), "Open Night 2")}
      `),
    };
  }

  if (step === 4) {
    return {
      subject: "Night 3 — The Sleep Window",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight introduces the technique with the strongest evidence base in all of behavioral sleep medicine: <strong style="color:#e6edf3;">sleep restriction therapy</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The premise sounds paradoxical: to sleep more, you spend less time in bed for a few nights. Compressing the window forces your brain to consolidate sleep into a continuous block, instead of fragmenting it.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          You'll feel tired during the day for the next 2–3 nights. That's the engine of the protocol — sleep pressure builds up and forces deeper, faster sleep onset.
        </p>
        ${cta(loginLink("pp_night3"), "Open Night 3")}
      `),
    };
  }

  if (step === 5) {
    return {
      subject: "Night 4 — The Quiet Mind",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          You're halfway through. By now sleep onset should be measurably faster — even if it doesn't feel dramatic yet.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight targets the loop behind 3 AM wake-ups: <strong style="color:#e6edf3;">cognitive arousal during the night</strong>. The thoughts that show up when you wake at 3 AM aren't random — they're the brain's default mode network running unchecked.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight you'll learn the constructive worry technique. 15 minutes earlier in the evening, on paper. The science is unambiguous: written worry empties the buffer that fires at 3 AM.
        </p>
        ${cta(loginLink("pp_night4"), "Open Night 4")}
      `),
    };
  }

  if (step === 6) {
    return {
      subject: "Night 5 — The Wake Discipline",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          By tonight, the wake-time anchor you set on Night 1 has been doing quiet work. Cortisol is starting to spike at the right hour. Melatonin is releasing earlier in the evening.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight focuses on protecting the gains: <strong style="color:#e6edf3;">no weekend drift</strong>. A 1-hour weekend wake time variance produces the same circadian disruption as a 1-hour timezone change. That's why insomnia tends to come back on Sunday nights.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The wake time you set is now permanent. It's also the thing that keeps the protocol working after Night 7.
        </p>
        ${cta(loginLink("pp_night5"), "Open Night 5")}
      `),
    };
  }

  if (step === 7) {
    return {
      subject: "Night 6 — The Reinforcement",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight isn't about adding anything new. It's about making sure the changes from Nights 1–5 are encoded.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The reason CBT-I works long-term where pills don't: <strong style="color:#e6edf3;">it changes how your brain processes the wake-to-sleep transition</strong>, not just what happens that night. Pills create dependence. Protocol creates capacity.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Tonight you review what worked and what didn't. The protocol will adjust the sleep window for the final night based on what you log.
        </p>
        ${cta(loginLink("pp_night6"), "Open Night 6")}
      `),
    };
  }

  if (step === 8) {
    return {
      subject: "Night 7 — The Consolidation",
      html: wrap(`
        <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          The final night. Tonight is consolidation: same wake time, expanded sleep window, all the techniques from Nights 1–6 in one routine.
        </p>
        <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          What clinical trials of CBT-I show at the 6-month mark: 70–80% of people who complete the protocol maintain the gains without needing to repeat it. The remaining 20–30% benefit from a 2–3 night refresher when sleep slips.
        </p>
        <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
          Your access doesn't expire. Come back any time you need to recalibrate.
        </p>
        ${cta(loginLink("pp_night7"), "Open Night 7")}
      `),
    };
  }

  // step 9
  return {
    subject: "You did it. Here's what comes next.",
    html: wrap(`
      <p style="margin:0 0 18px;font-size:18px;color:#e6edf3;font-weight:600;">${g}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
        Eight days ago you started Night 1. Today you've run the full 7-night protocol that sleep clinics charge €300+ to deliver.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:1.6;">
        Three things to keep doing, in order of how much they matter:
      </p>
      <ol style="margin:0 0 16px 20px;padding:0;color:#c9d1d9;font-size:15px;line-height:1.7;">
        <li><strong style="color:#e6edf3;">The wake time</strong>. Same time, every day. Including weekends. Including bad nights.</li>
        <li><strong style="color:#e6edf3;">The 15-minute rule</strong>. If you're not asleep in 15-20 minutes, you get up. No exceptions.</li>
        <li><strong style="color:#e6edf3;">The sleep log</strong>. Two weeks more, then weekly. It's how you'll catch slippage early.</li>
      </ol>
      <p style="margin:0 0 28px;font-size:15px;color:#c9d1d9;line-height:1.6;">
        If your sleep slips in a few weeks or months, that's normal — life happens. Open the app and re-run the Bed Reset (Night 2) and the Sleep Window (Night 3). Two or three nights is usually enough.
      </p>
      ${cta(loginLink("pp_done"), "Open my dashboard")}
      <p style="margin:24px 0 0;font-size:12px;color:#8b949e;">If something worked for you in the protocol — or didn't — I want to hear about it. Just reply to this email.</p>
    `),
  };
}

function cta(href: string, label: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${href}" style="display:inline-block;background-color:#C9A14A;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:10px;letter-spacing:0.2px;">${label}</a>
      </td></tr>
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
        <tr><td style="background-color:#161b22;border:1px solid #30363d;border-radius:16px;padding:36px 32px;">${inner}</td></tr>
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
