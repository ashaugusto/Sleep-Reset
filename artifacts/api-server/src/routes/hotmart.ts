import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, usersTable, leadsTable, purchasesTable, consentsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import {
  CLAIM_WINDOW_HOURS,
  GRANTING_EVENTS,
  REVOKING_EVENTS,
  hottokConfigured,
  hottokValid,
  maskEmail,
  parseSck,
  rungForOffer,
  toCents,
  toDate,
  type HotmartPurchasePayload,
} from "../lib/hotmart";
import { linkPurchasesToUser, recomputeAccess, recordPurchase, revokeTransaction, rungsOwned } from "../lib/entitlements";

const router: IRouter = Router();

// ─── The Hotmart side of the till ────────────────────────────────────────────
// Hotmart hosts the checkout, takes the money and is the merchant of record.
// This file is everything that happens after: the notification comes in here,
// the buyer gets an account and the rung they paid for, and a refund takes back
// that transaction and nothing else.
//
// Two endpoints:
//   POST /hotmart/webhook   Hotmart → us. Grants and revokes.
//   GET  /hotmart/claim     the thank-you page → us. "Did this sale land?"
//
// The offer codes are in .env.hotmart.example; the product fiches that produce
// them are in marketing/flu143-hotmart-fichas-produto.md.
//
// Not here yet: the payment token. If the ladder ends up built through the
// Payment Link API rather than the panel, `is_future_billing_allowed` plus
// `link_callback_url` make Hotmart return a token on this notification, and
// that token is what a one-click upsell spends. Nothing below reads or stores
// it — whoever builds the one-click adds that, and the field name should come
// from a payload actually observed, not from a guess.

// ─── Enumeration brake ───────────────────────────────────────────────────────
// Transaction codes are sequential enough to walk. This will not stop a patient
// attacker on its own — the email check does that — but it stops the cheap
// sweep, and it costs one Map.
const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_LIMIT = 30;
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000;

function overClaimLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    if (attempts.size > 5000) {
      for (const [key, value] of attempts) if (now > value.resetAt) attempts.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > ATTEMPT_LIMIT;
}

function clientIp(req: Request): string {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || "unknown";
}

/** The buyer needs somewhere to log in to. Password comes later, or never. */
async function ensureAccount(email: string, name: string | null): Promise<string> {
  const emailLower = email.toLowerCase().trim();
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
  if (existing) {
    if (!existing.name && name) {
      await db.update(usersTable).set({ name }).where(eq(usersTable.id, existing.id));
    }
    return existing.id;
  }

  const id = crypto.randomUUID();
  await db.insert(usersTable).values({
    id,
    email: emailLower,
    name,
    passwordHash: null, // passwordless until they set one at /sign-up or /profile
  });
  logger.info({ email: emailLower, userId: id }, "Hotmart: account created for buyer");
  return id;
}

/** Keep the lead row in step, so recovery email and attribution stay honest. */
async function upsertLead(args: {
  email: string;
  name: string | null;
  phone: string | null;
  sck: string | null;
  ip: string | null;
}): Promise<{ id: string; name: string | null; postPurchaseStep: number; whatsapp: string | null; fbp: string | null; fbc: string | null; ipAddress: string | null; userAgent: string | null } | null> {
  const attribution = parseSck(args.sck);
  try {
    await db.insert(leadsTable).values({
      email: args.email,
      name: args.name,
      whatsapp: args.phone,
      heroVariant: attribution.heroVariant || "hotmart",
      utmSource: attribution.utmSource || null,
      utmContent: attribution.utmContent || null,
      ipAddress: args.ip,
      sck: args.sck,
      purchased: true,
      purchasedAt: new Date(),
    }).onConflictDoUpdate({
      target: leadsTable.email,
      set: {
        purchased: true,
        purchasedAt: new Date(),
        sck: sql`COALESCE(EXCLUDED.sck, ${leadsTable.sck})`,
        name: sql`COALESCE(${leadsTable.name}, EXCLUDED.name)`,
        whatsapp: sql`COALESCE(${leadsTable.whatsapp}, EXCLUDED.whatsapp)`,
        utmSource: sql`COALESCE(${leadsTable.utmSource}, EXCLUDED.utm_source)`,
        utmContent: sql`COALESCE(${leadsTable.utmContent}, EXCLUDED.utm_content)`,
        ipAddress: sql`COALESCE(${leadsTable.ipAddress}, EXCLUDED.ip_address)`,
        updatedAt: new Date(),
      },
    });
    const [lead] = await db.select().from(leadsTable).where(eq(leadsTable.email, args.email)).limit(1);
    return lead ?? null;
  } catch (err) {
    logger.error({ err }, "Hotmart: lead upsert failed (non-fatal)");
    return null;
  }
}

// ─── POST /hotmart/webhook ───────────────────────────────────────────────────
router.post("/hotmart/webhook", async (req: Request, res: Response) => {
  if (!hottokConfigured()) {
    logger.error("Hotmart webhook hit but HOTMART_HOTTOK is not set");
    res.status(503).json({ message: "Hotmart webhook not configured" });
    return;
  }

  const hottok = req.headers["x-hotmart-hottok"] ?? (req.body as { hottok?: string } | undefined)?.hottok;
  if (!hottokValid(hottok as string | string[] | undefined)) {
    logger.warn({ ip: clientIp(req) }, "Hotmart webhook rejected: bad hottok");
    res.status(401).json({ message: "Invalid hottok" });
    return;
  }

  const body = (req.body ?? {}) as HotmartPurchasePayload;
  const event = (body.event || "").toUpperCase();
  const purchase = body.data?.purchase;
  const product = body.data?.product;
  const buyer = body.data?.buyer;

  const transaction = purchase?.transaction?.trim();
  const email = buyer?.email?.toLowerCase().trim();

  // Answer 200 to anything we understood but do not act on. Hotmart retries a
  // non-200 for hours, and a retry storm over PURCHASE_BILLET_PRINTED buries
  // the notification that actually matters.
  const granting = (GRANTING_EVENTS as readonly string[]).includes(event);
  const revoking = (REVOKING_EVENTS as readonly string[]).includes(event);

  if (!granting && !revoking) {
    logger.info({ event, transaction }, "Hotmart webhook: event acknowledged, no action");
    res.status(200).json({ received: true, action: "ignored" });
    return;
  }

  if (!transaction) {
    logger.error({ event, body: JSON.stringify(body).slice(0, 500) }, "Hotmart webhook: no transaction id");
    res.status(400).json({ message: "Missing purchase.transaction" });
    return;
  }

  try {
    if (revoking) {
      const reason = event === "PURCHASE_CHARGEBACK" ? "chargeback" : "refunded";
      const revoked = await revokeTransaction("hotmart", transaction, reason, event);

      if (!revoked.length) {
        // A refund for a sale we never recorded. Nothing to take back, and
        // nothing to panic about — but it means a grant went missing, so it is
        // logged loudly rather than swallowed.
        logger.warn({ transaction, event }, "Hotmart webhook: refund for an unknown transaction");
        res.status(200).json({ received: true, action: "nothing_to_revoke" });
        return;
      }

      for (const emailTouched of new Set(revoked.map((r) => r.email))) {
        await recomputeAccess(emailTouched);
      }
      logger.info(
        { transaction, event, rungs: revoked.map((r) => r.rung) },
        "Hotmart webhook: transaction revoked, other purchases untouched",
      );
      res.status(200).json({ received: true, action: "revoked", rungs: revoked.map((r) => r.rung) });
      return;
    }

    // ─── Granting ────────────────────────────────────────────────────────────
    if (!email) {
      logger.error({ event, transaction }, "Hotmart webhook: approved purchase with no buyer email");
      res.status(400).json({ message: "Missing buyer.email" });
      return;
    }

    const offerCode = purchase?.offer?.code ?? null;
    const rung = rungForOffer(offerCode, product?.ucode);
    if (rung === "unknown") {
      // Recorded so support can see the money arrived, but nothing is opened:
      // guessing which product an unmapped code belongs to is how a 9 EUR
      // downsell buyer ends up with the 27 EUR platform.
      logger.error(
        { transaction, offerCode, ucode: product?.ucode, productName: product?.name },
        "Hotmart webhook: offer code is not in the env map — purchase recorded, nothing granted",
      );
    }

    const sck = purchase?.origin?.sck?.slice(0, 200) ?? null;
    const { purchase: row, isNew } = await recordPurchase({
      provider: "hotmart",
      transactionId: transaction,
      productKey: product?.ucode ?? offerCode ?? null,
      email,
      rung,
      offerCode,
      productUcode: product?.ucode ?? null,
      productId: product?.id != null ? String(product.id) : null,
      priceCents: toCents(purchase?.price?.value),
      currency: purchase?.price?.currency_value ?? null,
      sck,
      event,
      purchasedAt: toDate(purchase?.approved_date) ?? toDate(purchase?.order_date) ?? new Date(),
    });

    const buyerName = buyer?.name?.trim() || null;
    const userId = await ensureAccount(email, buyerName);
    await linkPurchasesToUser(email, userId);
    await recomputeAccess(email);

    const lead = await upsertLead({
      email,
      name: buyerName,
      phone: buyer?.checkout_phone?.replace(/[^\d+]/g, "").slice(0, 20) || null,
      sck,
      ip: purchase?.buyer_ip ?? null,
    });

    // Side effects only on a sale we had not seen. Hotmart re-delivers until it
    // gets a 200, and a buyer does not need the same welcome email five times.
    if (isNew && rung !== "unknown") {
      void fireSideEffects({ rung, row, lead, email, name: buyerName, transaction });
    }

    logger.info({ transaction, email, rung, isNew, offerCode }, "Hotmart webhook: purchase granted");
    res.status(200).json({ received: true, action: "granted", rung, isNew, purchaseId: row.id });
  } catch (err) {
    logger.error({ err, event, transaction }, "Hotmart webhook failed");
    // 500 so Hotmart retries: a dropped grant is a buyer with no product.
    res.status(500).json({ message: "Webhook processing error" });
  }
});

/** Pixel and email. Isolated: neither may cost the buyer their access. */
async function fireSideEffects(args: {
  rung: string;
  row: { id: string; priceCents: number | null; currency: string | null };
  lead: { id: string; name: string | null; postPurchaseStep: number; whatsapp: string | null; fbp: string | null; fbc: string | null; ipAddress: string | null; userAgent: string | null } | null;
  email: string;
  name: string | null;
  transaction: string;
}): Promise<void> {
  const { rung, row, lead, email, transaction } = args;
  try {
    const { sendCapiEvent } = await import("../lib/meta-capi");
    void sendCapiEvent({
      eventName: "Purchase",
      eventId: transaction,
      eventSourceUrl: `${process.env.APP_URL || "https://sleepwired.com"}/welcome?transaction=${transaction}`,
      userData: {
        email,
        phone: lead?.whatsapp ?? null,
        externalId: lead?.id ?? null,
        clientIp: lead?.ipAddress ?? null,
        clientUserAgent: lead?.userAgent ?? null,
        fbp: lead?.fbp ?? null,
        fbc: lead?.fbc ?? null,
      },
      customData: {
        value: row.priceCents != null ? row.priceCents / 100 : 0,
        currency: (row.currency || "EUR").toUpperCase(),
        contentIds: [`sleep-wired-${rung}`],
        contentName: rung,
        contentType: "product",
        numItems: 1,
        orderId: transaction,
      },
    });
  } catch (err) {
    logger.error({ err, transaction }, "Hotmart: CAPI Purchase failed (non-fatal)");
  }

  // Only the platform purchase starts the onboarding sequence. The bump and the
  // Kit are add-ons to a sale that already sent it, and Hotmart mails its own
  // receipt for each. The email carries the magic link, which is the way in for
  // any buyer who never reaches the thank-you page.
  // The seventh rung has its own, and it is not marketing: it is the durable
  // medium copy of what the buyer ticked on the offer page.
  if (rung === "backend" || rung === "backendLive") {
    try {
      await confirmRecalibration({ rung, email, name: args.name ?? lead?.name ?? null, transaction });
    } catch (err) {
      logger.error({ err, transaction }, "Hotmart: recalibration confirmation failed (non-fatal)");
    }
    return;
  }

  if (rung !== "front" || !lead || lead.postPurchaseStep !== 0) return;
  try {
    const { sendPostPurchaseEmail } = await import("../emailService");
    const sent = await sendPostPurchaseEmail({ email, name: lead.name, step: 1, leadId: lead.id });
    if (sent) {
      await db.update(leadsTable)
        .set({ postPurchaseStep: 1, postPurchaseLastAt: new Date(), updatedAt: new Date() })
        .where(eq(leadsTable.id, lead.id));
    }
  } catch (err) {
    logger.error({ err, transaction }, "Hotmart: post-purchase email failed (non-fatal)");
  }
}

// ─── Tying the two boxes to the sale that followed them ──────────────────────
// The boxes are ticked on our offer page, upstream of the checkout, so at tick
// time there is no transaction to store. This is where the two ends meet: the
// live consent rows for that email get the transaction stamped on them, and the
// buyer gets them back in writing.
//
// Matching is by email, which is the only handle both sides share. A buyer who
// pays with a different address than the one they are signed in with produces
// no match: they get the email with both boxes shown as unticked, which says in
// so many words that nobody has read their log and invites them to reply. That
// is the right failure. Guessing which account a stray address belongs to and
// reading a sleep log on the strength of the guess is not.
async function confirmRecalibration(args: {
  rung: "backend" | "backendLive";
  email: string;
  name: string | null;
  transaction: string;
}): Promise<void> {
  const { rung, email, name, transaction } = args;
  const address = email.toLowerCase().trim();

  const rows = await db
    .select()
    .from(consentsTable)
    .where(and(eq(consentsTable.email, address), isNull(consentsTable.withdrawnAt)))
    .orderBy(desc(consentsTable.grantedAt));

  const newest = (kind: string) => rows.find((r) => r.kind === kind) ?? null;
  const logReading = newest("backend_log_reading");
  const earlyStart = newest("backend_early_start");

  for (const row of [logReading, earlyStart]) {
    if (!row || row.transactionId) continue;
    await db.update(consentsTable)
      .set({ transactionId: transaction, updatedAt: new Date() })
      .where(eq(consentsTable.id, row.id));
  }

  if (!logReading) {
    logger.warn(
      { transaction, email: maskEmail(address), rung },
      "Hotmart: recalibration sold with no log reading consent on file",
    );
  }

  const { sendRecalibrationConfirmationEmail } = await import("../emailService");
  await sendRecalibrationConfirmationEmail({
    email: address,
    userId: logReading?.userId ?? earlyStart?.userId ?? null,
    firstName: name?.split(" ")[0] || "there",
    locale: logReading?.locale ?? earlyStart?.locale ?? "en",
    tier: rung,
    logReading: { granted: !!logReading, at: logReading?.grantedAt ?? null },
    earlyStart: { granted: !!earlyStart, at: earlyStart?.grantedAt ?? null },
  });
}

// ─── GET /hotmart/claim ──────────────────────────────────────────────────────
// The thank-you page asking whether the sale landed. It answers with a masked
// email and the rungs bought — never the address itself, so a guessed
// transaction code cannot be turned into an account takeover at /sign-up.
router.get("/hotmart/claim", async (req: Request, res: Response) => {
  const transaction = (req.query.transaction as string | undefined)?.trim();
  if (!transaction || transaction.length > 64) {
    res.status(400).json({ message: "transaction is required" });
    return;
  }

  if (overClaimLimit(clientIp(req))) {
    res.status(429).json({ message: "Too many attempts. Please wait a moment." });
    return;
  }

  const rows = await db.select().from(purchasesTable)
    .where(and(eq(purchasesTable.provider, "hotmart"), eq(purchasesTable.transactionId, transaction)));

  if (!rows.length) {
    // Most likely the webhook has not landed yet. The page keeps asking.
    res.status(404).json({ message: "Purchase not found yet", pending: true });
    return;
  }

  const live = rows.filter((r) => !r.revokedAt);
  if (!live.length) {
    res.status(410).json({ message: "This purchase was refunded." });
    return;
  }

  const first = live[0];
  const ageMs = Date.now() - new Date(first.purchasedAt).getTime();
  const withinWindow = ageMs <= CLAIM_WINDOW_HOURS * 60 * 60 * 1000;

  const [user] = await db.select({ passwordHash: usersTable.passwordHash })
    .from(usersTable).where(eq(usersTable.email, first.email)).limit(1);

  res.json({
    paymentVerified: true,
    provider: "hotmart",
    maskedEmail: maskEmail(first.email),
    rungs: live.map((r) => r.rung),
    /** False once the code is stale: the buyer is sent to the magic link email. */
    canCreateAccount: withinWindow,
    /** True when they already have a password and should just sign in. */
    hasAccount: !!user?.passwordHash,
  });
});

// ─── GET /entitlements ───────────────────────────────────────────────────────
// What the signed-in account owns. The pages that gate the Kit and the Recovery
// Pack read this instead of inferring access from a single purchasedAt flag.
//
// It answers from the ledger and from the user record together, via rungsOwned.
// Reading only the ledger was wrong for everybody who bought before 9 Aug 2026,
// which on the day /library shipped was every single buyer: the table had zero
// rows and the library came back empty for all of them.
router.get("/entitlements", async (req: Request, res: Response) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user?.email) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const rows = await db.select().from(purchasesTable).where(eq(purchasesTable.email, user.email));

  res.json({
    rungs: rungsOwned(user, rows),
    purchasedAt: user.purchasedAt,
    premiumPurchasedAt: user.premiumPurchasedAt,
    kitPurchasedAt: user.kitPurchasedAt,
    downsellPurchasedAt: user.downsellPurchasedAt,
    seatCredits: user.seatCredits,
  });
});

export default router;
