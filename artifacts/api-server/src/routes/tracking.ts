import { Router, type IRouter, type Request, type Response } from "express";
import { sendCapiEvent } from "../lib/meta-capi";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

function clientIp(req: Request): string | null {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || null;
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

export default router;
