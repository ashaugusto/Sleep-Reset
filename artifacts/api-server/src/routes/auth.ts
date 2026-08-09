import { Router, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable, purchasesTable } from "@workspace/db";
import { CLAIM_WINDOW_HOURS } from "../lib/hotmart";
import { linkPurchasesToUser, recomputeAccess, recordPurchase } from "../lib/entitlements";
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
//
// Two proofs of payment are accepted. `sessionId` is a Stripe checkout session,
// verified against Stripe. `transaction` is a Hotmart transaction code, verified
// against the purchases row its webhook wrote — and, because that code is short
// and time-ordered enough to guess, only together with the buyer's own email
// and only inside the claim window. Neither one ever overwrites a password that
// already exists.
router.post("/auth/register", async (req, res) => {
  const { sessionId, transaction, email, name, password } = req.body as {
    sessionId?: string;
    transaction?: string;
    email?: string;
    name?: string;
    password?: string;
  };

  if (password && password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  if (transaction && !sessionId) {
    await registerFromHotmart(req, res, { transaction, email, password });
    return;
  }

  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Not configured" });
    return;
  }

  if (!sessionId || !email || !password) {
    res.status(400).json({ message: "sessionId, email and password are required" });
    return;
  }

  // Verify Stripe payment
  let stripeCustomerId: string | null = null;
  let verifiedEmail: string | null = null;
  let verifiedName: string | null = null;
  let boughtRecoveryPack = false;

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["customer"] });

    if (session.payment_status !== "paid") {
      res.status(402).json({ message: "Payment not completed" });
      return;
    }

    // Order bump bought on the initial checkout → grant Recovery Pack to the new account.
    boughtRecoveryPack = session.metadata?.bump_recovery_pack === "1";

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
    req.session.save((err) => {
      if (err) { res.status(500).json({ message: "Session error. Please try again." }); return; }
      res.json({
        id: existing.id,
        email: existing.email,
        name: existing.name,
        onboardingComplete: existing.onboardingComplete,
        purchasedAt: existing.purchasedAt,
      });
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
      premiumPurchasedAt: boughtRecoveryPack ? new Date() : null,
      stripeCustomerId,
    })
    .returning();

  // Write the Stripe sale into the purchases ledger as well. It is what lets a
  // later Hotmart refund see that this lifetime access was paid somewhere else
  // and leave it standing. Idempotent on the session id, so the Stripe webhook
  // writing the same rows first costs nothing.
  try {
    await recordPurchase({
      provider: "stripe", transactionId: sessionId, productKey: "front",
      email: emailLower, rung: "front", event: "auth.register",
    });
    if (boughtRecoveryPack) {
      await recordPurchase({
        provider: "stripe", transactionId: sessionId, productKey: "bump",
        email: emailLower, rung: "bump", event: "auth.register",
      });
    }
    await linkPurchasesToUser(emailLower, user.id);
  } catch (err) {
    console.error("[auth/register] purchase ledger write failed (non-fatal):", err);
  }

  req.session.userId = user.id;

  req.session.save((err) => {
    if (err) { res.status(500).json({ message: "Session error. Please try again." }); return; }
    sendWelcomeEmail({ email: user.email!, name: user.name }).catch(() => {});
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: user.onboardingComplete,
      purchasedAt: user.purchasedAt,
    });
  });
});

/**
 * Sign-up for a buyer who paid on Hotmart.
 *
 * The account already exists — the webhook created it, passwordless, the moment
 * the sale cleared — so this sets the password and signs them in. What it will
 * not do is set a password on an account that has one: possession of a
 * transaction code is proof of purchase, not proof of identity.
 */
async function registerFromHotmart(
  req: Request,
  res: Response,
  args: { transaction: string; email?: string; password?: string },
): Promise<void> {
  const transaction = args.transaction.trim().slice(0, 64);
  const emailGiven = args.email?.toLowerCase().trim();

  if (!emailGiven || !args.password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const rows = await db.select().from(purchasesTable)
    .where(and(eq(purchasesTable.provider, "hotmart"), eq(purchasesTable.transactionId, transaction)));

  const live = rows.filter((r) => !r.revokedAt);
  if (!live.length) {
    // Same answer for "never existed", "refunded" and "wrong email": the reply
    // must not tell somebody walking transaction codes which of those it was.
    res.status(400).json({ message: "We could not verify this purchase. Check the link in your email." });
    return;
  }

  const purchase = live[0];
  if (purchase.email !== emailGiven) {
    res.status(400).json({ message: "We could not verify this purchase. Check the link in your email." });
    return;
  }

  const ageMs = Date.now() - new Date(purchase.purchasedAt).getTime();
  if (ageMs > CLAIM_WINDOW_HOURS * 60 * 60 * 1000) {
    res.status(410).json({ message: "This link has expired. Use the access link we emailed you, or sign in." });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, emailGiven)).limit(1);

  if (existing?.passwordHash) {
    // The account already has a password, so this is not a first sign-up and a
    // transaction code must not be enough to walk into it. Repeat buyers sign in.
    res.status(409).json({ message: "You already have an account. Sign in instead.", hasAccount: true });
    return;
  }

  let user = existing;
  if (!user) {
    const inserted = await db.insert(usersTable).values({
      id: crypto.randomUUID(),
      email: emailGiven,
      name: null,
      passwordHash: await bcrypt.hash(args.password, 10),
      purchasedAt: purchase.rung === "front" ? purchase.purchasedAt : null,
    }).returning();
    user = inserted[0];
  } else {
    const [updated] = await db.update(usersTable)
      .set({ passwordHash: await bcrypt.hash(args.password, 10) })
      .where(eq(usersTable.id, user.id))
      .returning();
    user = updated;
  }

  await linkPurchasesToUser(emailGiven, user.id);
  await recomputeAccess(emailGiven);

  const [fresh] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);

  req.session.userId = user.id;
  req.session.save((err) => {
    if (err) { res.status(500).json({ message: "Session error. Please try again." }); return; }
    res.json({
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      onboardingComplete: fresh.onboardingComplete,
      purchasedAt: fresh.purchasedAt,
    });
  });
}

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

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ message: "Session error. Please try again." });
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
});

// ─── POST /api/auth/access-link ──────────────────────────────────────────────
// "I bought this and I cannot get in."
//
// The Hotmart product's members-area button points at /sign-in, and /sign-in
// asks for a password that most buyers do not have: the webhook creates the
// account passwordless and only /sign-up ever sets one. Before this route the
// only way back in was the magic link inside the post-purchase email, which the
// Kit and the Recovery Pack do not send at all — they are add-ons to a sale
// that already sent it. That left "contact support" as the members area.
//
// The answer is always the same, whatever the email turns out to be. Anything
// else here — "no purchase found", a different status code, a slower reply —
// turns this into a way to ask us which addresses bought.
const linkAttempts = new Map<string, { count: number; resetAt: number }>();
const LINK_LIMIT = 5;
const LINK_WINDOW_MS = 15 * 60 * 1000;

function overLinkLimit(ip: string): boolean {
  const now = Date.now();
  const entry = linkAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    linkAttempts.set(ip, { count: 1, resetAt: now + LINK_WINDOW_MS });
    if (linkAttempts.size > 5000) {
      for (const [key, value] of linkAttempts) if (now > value.resetAt) linkAttempts.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > LINK_LIMIT;
}

router.post("/auth/access-link", async (req, res) => {
  const email = (req.body as { email?: string })?.email?.toLowerCase().trim() || "";
  const dest = (req.body as { dest?: string })?.dest;
  // Same body for the buyer, the typo and the sweep.
  const answer = { ok: true as const };

  if (!email || email.length > 254 || !email.includes("@")) {
    res.status(400).json({ message: "A valid email is required" });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    || req.socket.remoteAddress
    || "unknown";
  if (overLinkLimit(ip)) {
    res.json(answer);
    return;
  }

  try {
    const { leadsTable } = await import("@workspace/db");
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.email, email)).limit(1);

    // No lead row, or a lead that never bought, gets the same silence. The
    // magic route refuses an unpurchased lead anyway, so sending would only
    // mail somebody a link to a 403.
    if (lead?.purchased) {
      const { sendAccessLinkEmail } = await import("../emailService");
      await sendAccessLinkEmail({
        email: lead.email,
        name: lead.name,
        leadId: lead.id,
        dest: dest === "/library" ? "/library" : "/dashboard",
      });
    } else {
      console.log(`[auth/access-link] no purchased lead for ${email} — answered ok anyway`);
    }
  } catch (err) {
    // A Resend outage is ours to see, not the buyer's to debug. They are told
    // to check their inbox either way; support is the fallback on the page.
    console.error("[auth/access-link] failed:", err);
  }

  res.json(answer);
});

// ─── GET /api/auth/magic ─────────────────────────────────────────────────────
// Passwordless login from email. Buyer clicks link → if user exists, sign in;
// if not, create passwordless account from lead data, sign in, redirect.
// Security: lead.id is a v4 UUID (122 bits entropy), only present in our emails.
router.get("/auth/magic", async (req, res) => {
  const lead = (req.query.lead as string | undefined)?.trim();
  const dest = (req.query.dest as string | undefined) || "/dashboard";
  // Allowlist destinations to prevent open redirect
  // /library is on this list because it is where a Kit buyer's audio lives, and
  // the access link is the only thing that puts them in front of it.
  const SAFE_PREFIXES = ["/dashboard", "/sleep-log", "/night", "/progress", "/onboarding", "/profile", "/library"];
  const safeDest = SAFE_PREFIXES.some((p) => dest.startsWith(p)) ? dest : "/dashboard";

  if (!lead || !/^[0-9a-f-]{36}$/i.test(lead)) {
    res.status(400).send("Invalid magic link.");
    return;
  }

  const { db, leadsTable } = await import("@workspace/db");
  const { eq } = await import("drizzle-orm");
  const [leadRow] = await db.select().from(leadsTable).where(eq(leadsTable.id, lead)).limit(1);
  if (!leadRow || !leadRow.purchased) {
    res.status(403).send("Magic link expired or invalid.");
    return;
  }

  const emailLower = leadRow.email.toLowerCase().trim();
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);

  if (!user) {
    // Passwordless account creation from lead
    const id = crypto.randomUUID();
    const inserted = await db.insert(usersTable).values({
      id,
      email: emailLower,
      name: leadRow.name,
      passwordHash: null,                 // passwordless — user can set later via /profile
      purchasedAt: leadRow.purchasedAt ?? new Date(),
    }).returning();
    user = inserted[0];
  }

  req.session.userId = user.id;
  req.session.save((err) => {
    if (err) {
      res.status(500).send("Session error. Please try again.");
      return;
    }
    res.redirect(safeDest);
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// ─── POST /api/admin/reset-password ──────────────────────────────────────────
// Admin-only: reset any user's password. Protected by SESSION_SECRET token.
router.post("/admin/reset-password", async (req, res) => {
  const token = req.headers["x-admin-token"];
  const adminSecret = process.env.SESSION_SECRET;

  if (!adminSecret || token !== adminSecret) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, user.id));

  res.json({ ok: true, email: user.email, name: user.name });
});

export default router;
