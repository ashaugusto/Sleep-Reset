import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";
import { sendWelcomeEmail } from "../emailService";

const router: IRouter = Router();

// ─── Public checkout — no account required ──────────────────────────────────
router.post("/checkout/public", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Payment is not configured yet. Please try again shortly." });
    return;
  }

  const { email, name } = req.body as { email?: string; name?: string };
  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  const emailTrimmed = email.toLowerCase().trim();
  const nameTrimmed = name?.trim() || null;

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
  // In dev the app is mounted at /sleep-reset; in production (APP_URL set) it lives at the root
  const basePath = process.env.APP_URL ? "" : "/sleep-reset";
  const baseUrl = `${appUrl}${basePath}`;

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/`,
    metadata: { email: emailTrimmed, name: nameTrimmed ?? "" },
  });

  res.json({ url: session.url });
});

// ─── Verify payment session (GET — fetch email from Stripe session) ─────────
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

// ─── Claim account after payment (requires Clerk auth) ──────────────────────
router.post("/auth/claim", requireAuth, async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Not configured" });
    return;
  }

  const clerkUserId = req.userId!;
  const { session_id } = req.body as { session_id?: string };

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

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer as { id?: string } | null)?.id ?? null;

    const emailLower = email?.toLowerCase().trim() ?? null;

    const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.id, clerkUserId)).limit(1);

    let user;
    if (existingUser) {
      const [updated] = await db
        .update(usersTable)
        .set({
          purchasedAt: existingUser.purchasedAt ?? new Date(),
          stripeCustomerId: existingUser.stripeCustomerId ?? stripeCustomerId,
          email: existingUser.email ?? emailLower,
          name: existingUser.name ?? name,
        })
        .where(eq(usersTable.id, clerkUserId))
        .returning();
      user = updated;
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({
          id: clerkUserId,
          email: emailLower,
          name,
          purchasedAt: new Date(),
          stripeCustomerId,
        })
        .returning();
      user = created;

      if (user.email) {
        sendWelcomeEmail({ email: user.email, name: user.name }).catch(() => {});
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: user.onboardingComplete,
      purchasedAt: user.purchasedAt,
    });
  } catch (err) {
    console.error("Claim error:", err);
    res.status(400).json({ message: "Invalid or expired session" });
  }
});

// ─── Purchase status ─────────────────────────────────────────────────────────
router.get("/purchase-status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const [user] = await db.select({ purchasedAt: usersTable.purchasedAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ purchased: !!user?.purchasedAt, purchasedAt: user?.purchasedAt ?? null });
});

export default router;
