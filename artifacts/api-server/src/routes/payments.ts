import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, or } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// ─── Existing authenticated checkout (for returning customers) ──────────────
router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Stripe is not configured" });
    return;
  }

  const userId = req.session.userId!;
  const { priceId } = req.body as { priceId: string };

  if (!priceId) {
    res.status(400).json({ message: "priceId is required" });
    return;
  }

  const stripe = getStripeClient();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  let customerId = user?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { userId }, email: user?.email ?? undefined });
    customerId = customer.id;
    await db.update(usersTable).set({ stripeCustomerId: customerId }).where(eq(usersTable.id, userId));
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const baseUrl = `${appUrl}/sleep-reset`;
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/`,
    metadata: { userId },
  });

  res.json({ url: session.url });
});

// ─── Public checkout — no account required, email-first ────────────────────
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

  // Find or create Stripe customer by email
  const existing = await stripe.customers.list({ email: emailTrimmed, limit: 1 });
  let customer = existing.data[0];
  if (!customer) {
    customer = await stripe.customers.create({ email: emailTrimmed, name: nameTrimmed ?? undefined });
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const baseUrl = `${appUrl}/sleep-reset`;

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: `${baseUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/`,
    metadata: { email: emailTrimmed, name: nameTrimmed ?? "" },
    customer_email: undefined, // already attached to customer
  });

  res.json({ url: session.url });
});

// ─── Claim account after payment (GET — fetch email from session) ──────────
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
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["customer"],
    });

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

    // Check if this email already has a password set (returning user)
    const [existingUser] = await db
      .select({ id: usersTable.id, passwordHash: usersTable.passwordHash, purchasedAt: usersTable.purchasedAt })
      .from(usersTable)
      .where(eq(usersTable.email, email?.toLowerCase().trim() ?? ""))
      .limit(1);

    res.json({
      email,
      name,
      hasPassword: !!existingUser?.passwordHash,
      alreadyPurchased: !!existingUser?.purchasedAt,
    });
  } catch {
    res.status(400).json({ message: "Invalid session" });
  }
});

// ─── Claim account after payment (POST — set password, create session) ─────
router.post("/auth/claim", async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Not configured" });
    return;
  }

  const { session_id, password } = req.body as { session_id?: string; password?: string };

  if (!session_id || !password) {
    res.status(400).json({ message: "session_id and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["customer"],
    });

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

    if (!email) {
      res.status(400).json({ message: "Could not determine email from this session" });
      return;
    }

    const emailLower = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    // Find existing user or create
    const [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, emailLower))
      .limit(1);

    let user;
    if (existingUser) {
      // Update: set password + purchased_at if not already set
      const [updated] = await db
        .update(usersTable)
        .set({
          passwordHash,
          purchasedAt: existingUser.purchasedAt ?? new Date(),
          stripeCustomerId: existingUser.stripeCustomerId ?? stripeCustomerId,
          name: existingUser.name ?? name,
        })
        .where(eq(usersTable.id, existingUser.id))
        .returning();
      user = updated;
    } else {
      // Create new user
      const [created] = await db
        .insert(usersTable)
        .values({
          id: randomUUID(),
          email: emailLower,
          name,
          passwordHash,
          purchasedAt: new Date(),
          stripeCustomerId,
        })
        .returning();
      user = created;
    }

    req.session.userId = user.id;
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

// ─── Purchase status ────────────────────────────────────────────────────────
router.get("/purchase-status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const [user] = await db.select({ purchasedAt: usersTable.purchasedAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.json({ purchased: !!user?.purchasedAt, purchasedAt: user?.purchasedAt ?? null });
});

// ─── Stripe Webhook ─────────────────────────────────────────────────────────
export async function stripeWebhookHandler(req: Request, res: Response, _next: NextFunction) {
  if (!isStripeConfigured()) {
    res.status(503).send("Stripe not configured");
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripe = getStripeClient();
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } else {
      event = JSON.parse((req.body as Buffer).toString());
    }
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { userId?: string; email?: string; name?: string };
      customer_details?: { email?: string; name?: string };
      customer?: string;
      payment_status?: string;
    };

    if (session.payment_status !== "paid") {
      res.json({ received: true });
      return;
    }

    // Existing user flow (authenticated checkout)
    const userId = session.metadata?.userId;
    if (userId) {
      await db.update(usersTable).set({ purchasedAt: new Date() }).where(eq(usersTable.id, userId));
      res.json({ received: true });
      return;
    }

    // New public checkout flow — create user account without password
    const email = session.customer_details?.email ?? session.metadata?.email;
    const name = session.customer_details?.name ?? session.metadata?.name ?? null;
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

    if (email) {
      const emailLower = email.toLowerCase().trim();
      const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);

      if (existing) {
        await db.update(usersTable)
          .set({ purchasedAt: new Date(), stripeCustomerId: stripeCustomerId ?? undefined })
          .where(eq(usersTable.id, existing.id));
      } else {
        await db.insert(usersTable).values({
          id: randomUUID(),
          email: emailLower,
          name,
          purchasedAt: new Date(),
          stripeCustomerId,
        });
      }
    }
  }

  res.json({ received: true });
}

export default router;
