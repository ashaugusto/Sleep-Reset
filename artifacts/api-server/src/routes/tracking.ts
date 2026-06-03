import { Router, type IRouter, type Request, type Response } from "express";
import { sendCapiEvent } from "../lib/meta-capi";
import { pool } from "@workspace/db";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

function clientIp(req: Request): string | null {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || null;
}

// Meta ad review + crawlers run JS and were inflating page_view ~4-5x vs real ad clicks.
// Drop them silently (200 ok) so the dashboard reflects humans only.
const BOT_UA = /bot|crawler|spider|crawling|facebookexternalhit|meta-externalagent|headless|puppeteer|playwright|lighthouse|pingdom|preview|scrapy|python-requests|curl\/|wget\//i;
function isBot(req: Request): boolean {
  const ua = (req.headers["user-agent"] as string | undefined) ?? "";
  return ua === "" || BOT_UA.test(ua);
}

// ─── Track ViewContent server-side ───────────────────────────────────────────
// Called by the landing page on mount. Browser pixel still fires too (same eventId for dedupe).
router.post("/track/view", async (req: Request, res: Response) => {
  const { fbp, fbc, hero_variant, utm_source, utm_medium, utm_campaign, utm_content, event_id } = req.body as {
    fbp?: string;
    fbc?: string;
    hero_variant?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    event_id?: string;
  };
  const eventId = event_id || `vc_${randomUUID()}`;
  if (isBot(req)) {
    res.json({ ok: true, event_id: eventId }); // don't send bot ViewContent to CAPI (poisons EMQ/optimization)
    return;
  }
  const eventSourceUrl = `${process.env.APP_URL || "https://sleepwired.com"}/${hero_variant ? `?h=${hero_variant}` : ""}`;

  void sendCapiEvent({
    eventName: "ViewContent",
    eventId,
    eventSourceUrl,
    userData: {
      clientIp: clientIp(req),
      clientUserAgent: (req.headers["user-agent"] as string | undefined) ?? null,
      fbp: fbp ?? null,
      fbc: fbc ?? null,
    },
    customData: {
      value: 27,
      currency: "EUR",
      contentIds: ["sleep-wired-7night"],
      contentName: "The Cognitive Shutdown Method",
      contentType: "product",
    },
  });

  res.json({ ok: true, event_id: eventId });
});

// ─── Engagement events (page view + scroll + VSL depth + CTA + form) → engagement_events ───
// Endpoint name kept generic (/api/sw/e) to escape adblocker heuristics.
// Old /api/track/event kept as alias for ~30d so the previously-shipped bundle keeps working.
const ALLOWED_EVENTS = new Set([
  "page_view",
  "scroll_50", "scroll_75",
  "vsl_autoplay", "vsl_play", "vsl_complete",
  "vsl_t30s", "vsl_t1m", "vsl_t2m", "vsl_t5m", "vsl_t10m",
  "vsl_25", "vsl_50", "vsl_75",
  "cta_click",
  "form_submit",
  "quiz_start", "quiz_questions_done", "quiz_complete",
  "quiz_result_view", "quiz_to_checkout",
  "homepage_from_quiz",
]);
async function handleEvent(req: Request, res: Response) {
  const { event, ad_id, hero_variant, client_id } = req.body as {
    event?: string; ad_id?: string; hero_variant?: string; client_id?: string;
  };
  if (!event || !ALLOWED_EVENTS.has(event)) {
    res.status(400).json({ ok: false });
    return;
  }
  if (isBot(req)) {
    res.json({ ok: true }); // ack, don't store
    return;
  }
  try {
    await pool.query(
      "INSERT INTO engagement_events (event, ad_id, hero_variant, client_id) VALUES ($1,$2,$3,$4)",
      [event.slice(0, 32), ad_id?.slice(0, 64) || null, hero_variant?.slice(0, 32) || null, client_id?.slice(0, 64) || null],
    );
  } catch (e) {
    console.error("[sw/e] insert failed:", e);
  }
  res.json({ ok: true });
}
router.post("/sw/e", handleEvent);
router.post("/track/event", handleEvent); // legacy alias

export default router;
