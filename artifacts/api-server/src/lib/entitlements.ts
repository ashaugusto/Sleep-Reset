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

/** What `rungsOwned` needs off the user record. */
export interface RungCacheColumns {
  purchasedAt: Date | null;
  premiumPurchasedAt: Date | null;
  kitPurchasedAt: Date | null;
  downsellPurchasedAt: Date | null;
  seatCredits: number | null;
}

/**
 * Every rung an account owns, ledger and cache read together.
 *
 * The ledger alone is not the answer, and reading it alone was a live bug: the
 * table only started being written when Hotmart became the till on 9 Aug 2026,
 * so every account bought before that has zero rows and would come back owning
 * nothing. All nine paying accounts were in that state the day /library
 * shipped, which meant the library was locked for one hundred percent of the
 * buyers it was built for, plus the review account we hand to Hotmart.
 *
 * The union is safe in the direction that matters, because the columns are a
 * cache of this same calculation: a refund revokes the row and `recomputeAccess`
 * clears the column, so a rung taken back does not come back through here. The
 * only thing the cache adds is access granted before the ledger existed, which
 * is exactly what we must not lose.
 */
export function rungsOwned(user: RungCacheColumns, rows: Purchase[]): Rung[] {
  const owned = new Set<Rung>();
  for (const row of rows) {
    if (row.revokedAt) continue;
    if (row.rung && row.rung !== "unknown") owned.add(row.rung as Rung);
  }
  for (const [rung, column] of Object.entries(RUNG_COLUMN) as [Rung, keyof RungCacheColumns][]) {
    if (user[column]) owned.add(rung);
  }
  if ((user.seatCredits ?? 0) > 0) owned.add("seat");
  return [...owned];
}

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

// There was an `entitlementsFor(email)` here that answered from the ledger
// alone. It had no callers, which is the only reason it never shipped the
// outage: the same one-table read inside GET /entitlements locked the library
// for all nine buyers, because the ledger only starts on 9 Aug 2026 and
// everything before it lives in the user columns. Removed rather than repaired
// so the next person reaches for `rungsOwned`, which reads both. Anything that
// needs this must pass the user record in too.

export { RUNG_COLUMN };
