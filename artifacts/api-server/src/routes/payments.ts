import { Router, type IRouter, type Request, type Response } from "express";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";
import { db, usersTable, leadsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

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

  const { email, name, whatsapp, hero_variant, fbp, fbc, utm_source, utm_medium, utm_campaign, utm_content } = req.body as {
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

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
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
    },
  });

  // Stash session_id on lead for later webhook reconciliation
  try {
    await db.update(leadsTable)
      .set({ stripeSessionId: session.id, updatedAt: new Date() })
      .where(eq(leadsTable.email, emailTrimmed));
  } catch (e) {
    console.error("[checkout/public] session_id update failed:", e);
  }

  res.json({ url: session.url });
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

// ─── Purchase status ──────────────────────────────────────────────────────────
router.get("/purchase-status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const [user] = await db.select({ purchasedAt: usersTable.purchasedAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ purchased: !!user?.purchasedAt, purchasedAt: user?.purchasedAt ?? null });
});

export default router;
