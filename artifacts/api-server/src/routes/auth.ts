import { Router } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { sendWelcomeEmail } from "../emailService";

const router = Router();

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    purchasedAt: user.purchasedAt,
  });
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
// Called from the sign-up page after payment. Creates user + sets session.
router.post("/auth/register", async (req, res) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Not configured" });
    return;
  }

  const { sessionId, email, name, password } = req.body as {
    sessionId?: string;
    email?: string;
    name?: string;
    password?: string;
  };

  if (!sessionId || !email || !password) {
    res.status(400).json({ message: "sessionId, email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  // Verify Stripe payment
  let stripeCustomerId: string | null = null;
  let verifiedEmail: string | null = null;
  let verifiedName: string | null = null;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["customer"] });

    if (session.payment_status !== "paid") {
      res.status(402).json({ message: "Payment not completed" });
      return;
    }

    verifiedEmail =
      (session.customer as { email?: string } | null)?.email ??
      session.customer_details?.email ??
      session.metadata?.email ??
      null;

    verifiedName =
      (session.customer as { name?: string } | null)?.name ??
      session.customer_details?.name ??
      session.metadata?.name ??
      null;

    stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : (session.customer as { id?: string } | null)?.id ?? null;
  } catch {
    res.status(400).json({ message: "Invalid or expired payment session" });
    return;
  }

  const emailLower = (verifiedEmail ?? email).toLowerCase().trim();
  const finalName = verifiedName ?? name?.trim() ?? null;

  // Check if already registered
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, emailLower))
    .limit(1);

  if (existing) {
    // Already registered — just sign them in
    req.session.userId = existing.id;
    res.json({
      id: existing.id,
      email: existing.email,
      name: existing.name,
      onboardingComplete: existing.onboardingComplete,
      purchasedAt: existing.purchasedAt,
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      email: emailLower,
      name: finalName,
      passwordHash,
      purchasedAt: new Date(),
      stripeCustomerId,
    })
    .returning();

  req.session.userId = user.id;

  sendWelcomeEmail({ email: user.email!, name: user.name }).catch(() => {});

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    purchasedAt: user.purchasedAt,
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    purchasedAt: user.purchasedAt,
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;
