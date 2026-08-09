import { db, purchasesTable, usersTable, type Purchase } from "@workspace/db";
import { and, eq, isNull } from "drizzle-orm";
import { logger } from "./logger";
import type { Rung, RungOrUnknown } from "./hotmart";

// ─── What a buyer is allowed to open ─────────────────────────────────────────
// Access is derived from the purchases table, never assigned directly. Write a
// row, then recompute. That is what makes a refund surgical: the refunded row
// is marked revoked, everything is recomputed from what is left, and a lifetime
// access paid in a different transaction is untouched because its row is still
// standing.
//
// The user columns stay as they are — half the app already reads purchasedAt
// and premiumPurchasedAt — but they are now a cache of this calculation.

export interface RecordPurchaseInput {
  provider: "hotmart" | "stripe";
  transactionId: string;
  /** Distinguishes two products bought in one transaction. */
  productKey?: string | null;
  email: string;
  rung: RungOrUnknown;
  offerCode?: string | null;
  productUcode?: string | null;
  productId?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  sck?: string | null;
  event?: string | null;
  purchasedAt?: Date | null;
}

export function dedupeKeyFor(provider: string, transactionId: string, productKey?: string | null): string {
  return `${provider}:${transactionId}:${(productKey || "-").toString().slice(0, 80)}`;
}

/**
 * Write the purchase down. Returns the row and whether this is the first time
 * we have seen it — the caller uses that to decide whether the welcome email
 * and the Purchase pixel fire, since Hotmart retries a notification until it
 * gets a 200 and will happily deliver the same sale five times.
 */
export async function recordPurchase(input: RecordPurchaseInput): Promise<{ purchase: Purchase; isNew: boolean }> {
  const email = input.email.toLowerCase().trim();
  const dedupeKey = dedupeKeyFor(input.provider, input.transactionId, input.productKey);

  const [existing] = await db.select().from(purchasesTable).where(eq(purchasesTable.dedupeKey, dedupeKey)).limit(1);

  if (existing) {
    if (existing.email !== email) {
      // One transaction, two buyers. Hotmart does not do this, so it means our
      // dedupe key is wrong for some payload shape — and the wrong buyer would
      // silently keep the access. Loud, and the row is left with its original
      // owner rather than reassigned.
      logger.error(
        { dedupeKey, existingEmail: existing.email, incomingEmail: email },
        "Purchase ledger: transaction already belongs to a different buyer",
      );
    }
    // A repeat of an approval we already granted changes nothing. A repeat that
    // arrives after a refund does: Hotmart re-approving a transaction it had
    // refunded is rare but real, and the row has to come back to life.
    const [updated] = await db.update(purchasesTable)
      .set({
        status: "approved",
        revokedAt: null,
        event: input.event ?? existing.event,
        sck: input.sck ?? existing.sck,
        rung: input.rung,
        offerCode: input.offerCode ?? existing.offerCode,
        updatedAt: new Date(),
      })
      .where(eq(purchasesTable.id, existing.id))
      .returning();
    return { purchase: updated, isNew: !!existing.revokedAt || existing.status !== "approved" };
  }

  const [inserted] = await db.insert(purchasesTable).values({
    provider: input.provider,
    transactionId: input.transactionId,
    dedupeKey,
    email,
    rung: input.rung,
    offerCode: input.offerCode ?? null,
    productUcode: input.productUcode ?? null,
    productId: input.productId ? String(input.productId) : null,
    status: "approved",
    priceCents: input.priceCents ?? null,
    currency: input.currency ?? null,
    sck: input.sck ?? null,
    event: input.event ?? null,
    purchasedAt: input.purchasedAt ?? new Date(),
  }).returning();

  return { purchase: inserted, isNew: true };
}

/**
 * Mark one transaction as taken back. Only the rows belonging to that
 * transaction move; everything else the buyer owns stays exactly where it is.
 * Returns the emails touched so the caller can recompute their access.
 */
export async function revokeTransaction(
  provider: "hotmart" | "stripe",
  transactionId: string,
  reason: "refunded" | "chargeback" | "canceled",
  event?: string | null,
): Promise<Purchase[]> {
  const rows = await db.update(purchasesTable)
    .set({ status: reason, revokedAt: new Date(), event: event ?? reason, updatedAt: new Date() })
    .where(and(eq(purchasesTable.provider, provider), eq(purchasesTable.transactionId, transactionId)))
    .returning();
  return rows;
}

/** Attach a purchase row to the account that ended up owning it. */
export async function linkPurchasesToUser(email: string, userId: string): Promise<void> {
  await db.update(purchasesTable)
    .set({ userId, updatedAt: new Date() })
    .where(and(eq(purchasesTable.email, email.toLowerCase().trim()), isNull(purchasesTable.userId)));
}

const RUNG_COLUMN: Partial<Record<Rung, "purchasedAt" | "premiumPurchasedAt" | "kitPurchasedAt" | "downsellPurchasedAt">> = {
  front: "purchasedAt",
  bump: "premiumPurchasedAt",
  oto1: "kitPurchasedAt",
  downsell: "downsellPurchasedAt",
};

/**
 * Recompute one account's access from its purchase rows.
 *
 * The one rule that matters is in `next()`: a flag with no rows at all is left
 * alone. Accounts that predate this table were granted by the old Stripe path
 * and have nothing here to justify them; clearing those on an unrelated refund
 * would take away access somebody paid for. Silence is not evidence of a
 * refund.
 */
export async function recomputeAccess(email: string): Promise<void> {
  const emailLower = email.toLowerCase().trim();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, emailLower)).limit(1);
  if (!user) return;

  const rows = await db.select().from(purchasesTable).where(eq(purchasesTable.email, emailLower));

  const next = (rung: Rung, current: Date | null): Date | null => {
    const forRung = rows.filter((r) => r.rung === rung);
    const live = forRung.filter((r) => !r.revokedAt);
    if (live.length) {
      const earliest = live.reduce((a, b) => (a.purchasedAt <= b.purchasedAt ? a : b));
      return earliest.purchasedAt;
    }
    if (forRung.length) return null; // every row for this rung was taken back
    return current;                  // nothing on record either way — not ours to clear
  };

  const seatCredits = rows.filter((r) => r.rung === "seat" && !r.revokedAt).length;

  const patch = {
    purchasedAt: next("front", user.purchasedAt),
    premiumPurchasedAt: next("bump", user.premiumPurchasedAt),
    kitPurchasedAt: next("oto1", user.kitPurchasedAt),
    downsellPurchasedAt: next("downsell", user.downsellPurchasedAt),
    seatCredits: rows.some((r) => r.rung === "seat") ? seatCredits : user.seatCredits,
  };

  await db.update(usersTable).set(patch).where(eq(usersTable.id, user.id));

  logger.info(
    { email: emailLower, userId: user.id, rungs: rows.filter((r) => !r.revokedAt).map((r) => r.rung) },
    "Entitlements recomputed",
  );
}

/** Which rungs this account owns right now. What the app should unlock. */
export async function entitlementsFor(email: string): Promise<RungOrUnknown[]> {
  const rows = await db.select().from(purchasesTable)
    .where(and(eq(purchasesTable.email, email.toLowerCase().trim()), isNull(purchasesTable.revokedAt)));
  return [...new Set(rows.map((r) => r.rung as RungOrUnknown))];
}

export { RUNG_COLUMN };
