import { Router, type IRouter, type Request, type Response } from "express";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";
import { db, usersTable, leadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { sendCapiEvent } from "../lib/meta-capi";

// ─── What is left of payments once Stripe stops taking money ─────────────────
// FLU-143, decided by Ash on 9 Aug 2026: Stripe is abandoned, the structure and
// the funnel live on Hotmart. Hotmart is a hosted checkout, so there is no
// session for us to create and nothing here builds a checkout any more. The
// three routes that did — /checkout/public, /checkout/express, /checkout/upgrade
// — are gone rather than left returning 503, because a dead route that answers
// politely is a route somebody wires a button to again by accident.
//
// Two things survive, for two different reasons:
//
//   POST /lead          the half of /checkout/public that was never about
//                       Stripe. It writes the visitor down before we hand them
//                       to Hotmart, which is what enrols them in the
//                       abandonment drip and what fires CAPI Lead and
//                       InitiateCheckout from our server instead of from a
//                       redirect we do not control.
//
//   GET  /auth/claim    read-only verification of a Stripe session. Nobody new
//                       can reach it, but the people who bought before today
//                       have success links with ?session_id= in their inbox and
//                       a working /welcome is the difference between them
//                       getting their account and emailing support. It is the
//                       only Stripe call left in the request path, it creates
//                       nothing, and it can be deleted once those links are
//                       older than anyone will click.
//
// Hotmart's own routes live in routes/hotmart.ts. That is where a sale is
// recorded, access is granted, and CAPI Purchase is fired.

const router: IRouter = Router();

function clientIp(req: Request): string | null {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || null;
}

// ─── Lead capture, immediately before the handover to Hotmart ────────────────
// Called by the pages that ask for an email before sending the visitor to the
// checkout. Never blocks the sale: the caller redirects to Hotmart whatever
// this answers, so the worst case is a lost drip enrolment, not a lost buyer.
router.post("/lead", async (req: Request, res: Response) => {
  const { email, name, whatsapp, hero_variant, fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, lead_event_id } = req.body as {
    email?: string;
    name?: string;
    whatsapp?: string;
    hero_variant?: string;
    fbp?: string;
    fbc?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    lead_event_id?: string;
  };
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const emailTrimmed = email.toLowerCase().trim();
  const nameTrimmed = name?.trim() || null;
  const whatsappClean = whatsapp?.trim().replace(/[^\d+]/g, "").slice(0, 20) || null;
  const heroVariantClean = (hero_variant ?? "default").toString().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) || "default";

  let leadId: string | null = null;
  try {
    const rows = await db.insert(leadsTable).values({
      email: emailTrimmed,
      name: nameTrimmed,
      whatsapp: whatsappClean,
      heroVariant: heroVariantClean,
      fbp: fbp || null,
      fbc: fbc || null,
      utmSource: utm_source || null,
      utmMedium: utm_medium || null,
      utmCampaign: utm_campaign || null,
      utmContent: utm_content || null,
      ipAddress: clientIp(req),
      userAgent: (req.headers["user-agent"] as string | undefined)?.slice(0, 500) || null,
    }).onConflictDoUpdate({
      target: leadsTable.email,
      set: {
        name: sql`COALESCE(EXCLUDED.name, ${leadsTable.name})`,
        whatsapp: sql`COALESCE(EXCLUDED.whatsapp, ${leadsTable.whatsapp})`,
        heroVariant: sql`EXCLUDED.hero_variant`,
        fbp: sql`COALESCE(EXCLUDED.fbp, ${leadsTable.fbp})`,
        fbc: sql`COALESCE(EXCLUDED.fbc, ${leadsTable.fbc})`,
        utmSource: sql`COALESCE(EXCLUDED.utm_source, ${leadsTable.utmSource})`,
        utmMedium: sql`COALESCE(EXCLUDED.utm_medium, ${leadsTable.utmMedium})`,
        utmCampaign: sql`COALESCE(EXCLUDED.utm_campaign, ${leadsTable.utmCampaign})`,
        utmContent: sql`COALESCE(EXCLUDED.utm_content, ${leadsTable.utmContent})`,
        ipAddress: sql`COALESCE(EXCLUDED.ip_address, ${leadsTable.ipAddress})`,
        userAgent: sql`COALESCE(EXCLUDED.user_agent, ${leadsTable.userAgent})`,
        updatedAt: new Date(),
      },
    }).returning({ id: leadsTable.id });
    leadId = rows[0]?.id ?? null;
  } catch (e) {
    console.error("[lead] persist failed:", e);
    res.status(200).json({ ok: false });
    return;
  }

  // CAPI Lead + InitiateCheckout — deterministic attribution (immune to ITP and
  // adblockers). Purchase is fired later, by the Hotmart webhook.
  const userData = {
    email: emailTrimmed,
    phone: whatsappClean,
    externalId: leadId,
    clientIp: clientIp(req),
    clientUserAgent: (req.headers["user-agent"] as string | undefined) ?? null,
    fbp: fbp ?? null,
    fbc: fbc ?? null,
  };
  const customData = {
    value: 27,
    currency: "EUR",
    contentIds: ["sleep-wired-7night"],
    contentName: "The Cognitive Shutdown Method",
    contentType: "product",
  };
  const eventSourceUrl = `${process.env.APP_URL || "https://sleepwired.com"}/`;
  try {
    if (leadId) {
      // Prefer the browser-generated event_id so fbq Lead and CAPI Lead dedupe.
      void sendCapiEvent({
        eventName: "Lead",
        eventId: lead_event_id && lead_event_id.length > 0 ? lead_event_id : leadId,
        eventSourceUrl,
        userData,
        customData,
      });
      void sendCapiEvent({
        eventName: "InitiateCheckout",
        eventId: `ic_${leadId}`,
        eventSourceUrl,
        userData,
        customData: { ...customData, numItems: 1 },
      });
    }
  } catch (e) {
    console.error("[lead] CAPI dispatch failed (non-fatal):", e);
  }

  res.json({ ok: true, lead_id: leadId });
});

// ─── Legacy: verify a Stripe session (read-only, pre-Hotmart buyers) ─────────
router.get("/auth/claim", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Not configured" });
    return;
  }

  const { session_id } = req.query as { session_id?: string };
  if (!session_id) {
    res.status(400).json({ message: "session_id is required" });
    return;
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["customer"] });

    if (session.payment_status !== "paid") {
      res.status(402).json({ message: "Payment not completed" });
      return;
    }

    const email =
      (session.customer as { email?: string } | null)?.email ??
      session.customer_details?.email ??
      session.metadata?.email ??
      null;

    const name =
      (session.customer as { name?: string } | null)?.name ??
      session.customer_details?.name ??
      session.metadata?.name ??
      null;

    res.json({ email, name, paymentVerified: true });
  } catch {
    res.status(400).json({ message: "Invalid session" });
  }
});

// ─── Purchase status ──────────────────────────────────────────────────────────
router.get("/purchase-status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const [user] = await db.select({ purchasedAt: usersTable.purchasedAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ purchased: !!user?.purchasedAt, purchasedAt: user?.purchasedAt ?? null });
});

export default router;
