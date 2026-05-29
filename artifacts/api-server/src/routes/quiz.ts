import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { sendCapiEvent } from "../lib/meta-capi";

const router: IRouter = Router();

function clientIp(req: Request): string | null {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || null;
}

// ─── Type & score logic ──────────────────────────────────────────────────────
// Inputs are quiz answer keys (strings). Mapping is explicit and testable.
type Answers = Record<string, string | string[]>;

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function classifyType(a: Answers): "onset" | "maintenance" | "mixed" | "circadian" {
  const shift = asString(a.shift_work);
  if (shift === "yes") return "circadian";
  const main = asString(a.main_problem);
  if (main === "wake_3am") return "maintenance";
  if (main === "cant_fall_asleep") return "onset";
  if (main === "both" || main === "light_all_night") return "mixed";
  return "mixed";
}

function calcScore(a: Answers): number {
  // 0 = severe insomnia, 100 = mild. Lower = more urgent copy.
  let score = 100;

  const dur = asString(a.duration);
  if (dur === "3y_plus") score -= 35;
  else if (dur === "1_3y") score -= 25;
  else if (dur === "3_12mo") score -= 15;
  else if (dur === "lt_3mo") score -= 5;

  const freq = asString(a.frequency);
  if (freq === "every_night") score -= 30;
  else if (freq === "4_6_per_wk") score -= 20;
  else if (freq === "2_3_per_wk") score -= 10;

  const day = asString(a.day_impact);
  if (day === "no_energy" || day === "anxious") score -= 15;
  else if (day === "brain_fog" || day === "bad_mood") score -= 10;

  const stress = asString(a.recent_stress);
  if (stress === "yes" || stress === "always") score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ─── POST /api/quiz/submit ───────────────────────────────────────────────────
// Saves quiz answers, returns assigned type + score + profile id.
// Email/WhatsApp captured separately via /api/quiz/capture.
router.post("/quiz/submit", async (req: Request, res: Response) => {
  const body = req.body as {
    session_id?: string;
    answers?: Answers;
    ad_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    hero_variant?: string;
    fbp?: string;
    fbc?: string;
  };
  if (!body.session_id || !body.answers || typeof body.answers !== "object") {
    return res.status(400).json({ ok: false, error: "session_id and answers required" });
  }
  try {
    const type = classifyType(body.answers);
    const score = calcScore(body.answers);
    const ip = clientIp(req);
    const ua = (req.headers["user-agent"] as string | undefined) ?? null;

    // Upsert by session_id (allow re-submission overwriting prior attempt)
    const { rows } = await pool.query(
      `INSERT INTO sleep_profiles
       (id, session_id, type, score, answers, ad_id, utm_source, utm_medium, utm_campaign, utm_term, hero_variant, fbp, fbc, ip_address, user_agent)
       VALUES (gen_random_uuid()::text, $1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, type, score`,
      [
        body.session_id.slice(0, 64),
        type,
        score,
        JSON.stringify(body.answers),
        body.ad_id?.slice(0, 64) || null,
        body.utm_source?.slice(0, 64) || null,
        body.utm_medium?.slice(0, 64) || null,
        body.utm_campaign?.slice(0, 64) || null,
        body.utm_term?.slice(0, 64) || null,
        body.hero_variant?.slice(0, 32) || null,
        body.fbp?.slice(0, 128) || null,
        body.fbc?.slice(0, 256) || null,
        ip,
        ua?.slice(0, 256) ?? null,
      ],
    );
    const row = rows[0];
    res.json({ ok: true, profile_id: row.id, type: row.type, score: row.score });
  } catch (e) {
    console.error("[quiz/submit] failed:", e);
    res.status(500).json({ ok: false, error: "internal" });
  }
});

// ─── POST /api/quiz/capture ──────────────────────────────────────────────────
// Email + WhatsApp gate before result page. Updates the profile created in /submit.
// Fires server-side CAPI Lead with shared event_id (dedup with browser fbq).
router.post("/quiz/capture", async (req: Request, res: Response) => {
  const { profile_id, email, whatsapp, event_id, fbp, fbc } = req.body as {
    profile_id?: string;
    email?: string;
    whatsapp?: string;
    event_id?: string;
    fbp?: string;
    fbc?: string;
  };
  if (!profile_id || !email) {
    return res.status(400).json({ ok: false, error: "profile_id, email required" });
  }
  const emailClean = email.trim().toLowerCase();
  // WhatsApp optional — removed from quiz to reduce cold-traffic friction (29/05).
  const waClean = whatsapp ? whatsapp.replace(/[^\d+]/g, "") : null;
  if (!/^.+@.+\..+$/.test(emailClean)) {
    return res.status(400).json({ ok: false, error: "invalid email" });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE sleep_profiles
       SET email = $1, whatsapp = $2, captured_at = now()
       WHERE id = $3
       RETURNING id, type, score, email, whatsapp`,
      [emailClean.slice(0, 256), waClean ? waClean.slice(0, 32) : null, profile_id],
    );
    if (rows.length === 0) return res.status(404).json({ ok: false, error: "profile not found" });

    // Fire CAPI Lead — sub-event for Meta learning. Campaign optimization stays Purchase.
    // Dedup via event_id shared with browser fbq('Lead', ..., {eventID}).
    const eventId = event_id || `lead_quiz_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    void sendCapiEvent({
      eventName: "Lead",
      eventId,
      eventSourceUrl: `${process.env.APP_URL || "https://sleepwired.com"}/quiz`,
      userData: {
        email: emailClean,
        phone: waClean,
        clientIp: clientIp(req),
        clientUserAgent: (req.headers["user-agent"] as string | undefined) ?? null,
        fbp: fbp ?? null,
        fbc: fbc ?? null,
      },
      customData: {
        value: 0,
        currency: "EUR",
        contentIds: ["sleep-wired-7night"],
        contentName: "The Cognitive Shutdown Method — Quiz",
        contentType: "product",
      },
    });

    res.json({ ok: true, profile: rows[0], event_id: eventId });
  } catch (e) {
    console.error("[quiz/capture] failed:", e);
    res.status(500).json({ ok: false, error: "internal" });
  }
});

// ─── GET /api/quiz/profile/:id ───────────────────────────────────────────────
// Fetch the profile to render the result page (type, score, email).
router.get("/quiz/profile/:id", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, score, email, whatsapp FROM sleep_profiles WHERE id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ ok: false });
    res.json({ ok: true, profile: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

export default router;
