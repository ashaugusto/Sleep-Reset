import { Router, type IRouter, type Request, type Response } from "express";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";
import { db, usersTable, leadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { sendCapiEvent } from "../lib/meta-capi";

const router: IRouter = Router();

function clientIp(req: Request): string | null {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || null;
}

// ─── Public checkout — no account required ───────────────────────────────────
router.post("/checkout/public", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Payment is not configured yet. Please try again shortly." });
    return;
  }

  const { email, name, whatsapp, hero_variant, fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, lead_event_id, bump } = req.body as {
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
    bump?: boolean;
  };
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const emailTrimmed = email.toLowerCase().trim();
  const nameTrimmed = name?.trim() || null;
  const whatsappClean = whatsapp?.trim().replace(/[^\d+]/g, "").slice(0, 20) || null;
  const heroVariantClean = (hero_variant ?? "default").toString().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) || "default";

  // Persist lead (upsert on email — non-blocking for checkout flow)
  try {
    await db.insert(leadsTable).values({
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
    });
  } catch (e) {
    console.error("[checkout/public] lead persist failed:", e);
    // continue — don't block Stripe flow on DB issue
  }

  const stripe = getStripeClient();
  const priceId = process.env.STRIPE_PRICE_ID || process.env.VITE_STRIPE_PRICE_ID;

  if (!priceId) {
    res.status(503).json({ message: "Product not configured. Please contact support." });
    return;
  }

  const existing = await stripe.customers.list({ email: emailTrimmed, limit: 1 });
  let customer = existing.data[0];
  if (!customer) {
    customer = await stripe.customers.create({ email: emailTrimmed, name: nameTrimmed ?? undefined });
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const basePath = process.env.APP_URL ? "" : "/sleep-reset";
  const baseUrl = `${appUrl}${basePath}`;

  // Order bump: the Recovery Pack (€19) added as a 2nd line item if the buyer checked it.
  const bumpPriceId = process.env.STRIPE_PRICE_PREMIUM;
  const wantsBump = bump === true && !!bumpPriceId;
  const lineItems: { price: string; quantity: number }[] = [{ price: priceId, quantity: 1 }];
  if (wantsBump) lineItems.push({ price: bumpPriceId as string, quantity: 1 });

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/`,
    metadata: {
      email: emailTrimmed,
      name: nameTrimmed ?? "",
      whatsapp: whatsappClean ?? "",
      hero_variant: heroVariantClean,
      fbp: fbp ?? "",
      fbc: fbc ?? "",
      utm_source: utm_source ?? "",
      utm_campaign: utm_campaign ?? "",
      bump_recovery_pack: wantsBump ? "1" : "",
    },
  });

  // Stash session_id on lead for later webhook reconciliation
  let leadId: string | null = null;
  try {
    const updated = await db.update(leadsTable)
      .set({ stripeSessionId: session.id, updatedAt: new Date() })
      .where(eq(leadsTable.email, emailTrimmed))
      .returning({ id: leadsTable.id });
    leadId = updated[0]?.id ?? null;
  } catch (e) {
    console.error("[checkout/public] session_id update failed:", e);
  }

  // CAPI Lead + InitiateCheckout — deterministic attribution (immune to ITP/adblocker)
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
      // Prefer browser-generated event_id so fbq Lead and CAPI Lead dedupe; fallback to leadId
      void sendCapiEvent({
        eventName: "Lead",
        eventId: lead_event_id && lead_event_id.length > 0 ? lead_event_id : leadId,
        eventSourceUrl,
        userData,
        customData,
      });
    }
    // IC event_id = session.id; browser fbq IC fires with eventID=transaction_id (also session.id) → dedupe
    void sendCapiEvent({
      eventName: "InitiateCheckout",
      eventId: session.id,
      eventSourceUrl,
      userData,
      customData: { ...customData, numItems: 1 },
    });
  } catch (e) {
    console.error("[checkout/public] CAPI Lead/IC dispatch failed (non-fatal):", e);
  }

  res.json({ url: session.url, session_id: session.id });
});

// ─── Express checkout — Start → Stripe directly (email collected by Stripe) ───
// No pre-payment email/lead capture (product decision: optimize for Purchase,
// not intermediate Lead/IC). Stripe collects the email on its hosted page; the
// /api/stripe/webhook handler upserts the lead and fires CAPI Purchase from
// customer_details.email + the fbp/fbc/utm we stash in the session metadata.
router.post("/checkout/express", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Payment is not configured yet. Please try again shortly." });
    return;
  }

  const { fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content, hero_variant } = req.body as {
    fbp?: string; fbc?: string; utm_source?: string; utm_medium?: string;
    utm_campaign?: string; utm_content?: string; hero_variant?: string;
  };

  const stripe = getStripeClient();
  const priceId = process.env.STRIPE_PRICE_ID || process.env.VITE_STRIPE_PRICE_ID;
  if (!priceId) {
    res.status(503).json({ message: "Product not configured. Please contact support." });
    return;
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const basePath = process.env.APP_URL ? "" : "/sleep-reset";
  const baseUrl = `${appUrl}${basePath}`;
  const heroVariantClean = (hero_variant ?? "watch").toString().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) || "watch";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    customer_creation: "always",
    success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/watch`,
    metadata: {
      source: "watch_express",
      hero_variant: heroVariantClean,
      fbp: (fbp ?? "").slice(0, 200),
      fbc: (fbc ?? "").slice(0, 200),
      utm_source: (utm_source ?? "").slice(0, 100),
      utm_medium: (utm_medium ?? "").slice(0, 100),
      utm_campaign: (utm_campaign ?? "").slice(0, 100),
      utm_content: (utm_content ?? "").slice(0, 100),
      ip: clientIp(req) ?? "",
      ua: ((req.headers["user-agent"] as string | undefined) ?? "").slice(0, 480),
    },
  });

  res.json({ url: session.url, session_id: session.id });
});

// ─── Verify payment session (GET — returns email/name from Stripe) ────────────
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

// ─── Upgrade checkout (Recovery Pack €19) ────────────────────────────────────
router.post("/checkout/upgrade", requireAuth, async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Payment is not configured yet." });
    return;
  }
  const priceId = process.env.STRIPE_PRICE_PREMIUM;
  if (!priceId) {
    res.status(503).json({ message: "Premium product not configured." });
    return;
  }

  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || !user.email) {
    res.status(400).json({ message: "User not found." });
    return;
  }
  if (user.premiumPurchasedAt) {
    res.status(409).json({ message: "Already upgraded." });
    return;
  }

  const stripe = getStripeClient();
  const existing = await stripe.customers.list({ email: user.email, limit: 1 });
  let customer = existing.data[0];
  if (!customer) {
    customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined });
  }

  const appUrl = process.env.APP_URL || "https://sleepwired.com";
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/upgrade?canceled=1`,
    metadata: {
      product: "recovery_pack",
      user_id: userId,
      email: user.email,
    },
  });

  res.json({ url: session.url });
});

// ─── Purchase status ──────────────────────────────────────────────────────────
router.get("/purchase-status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const [user] = await db.select({ purchasedAt: usersTable.purchasedAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ purchased: !!user?.purchasedAt, purchasedAt: user?.purchasedAt ?? null });
});

export default router;
