import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db, purchasesTable, seatInvitesTable, usersTable, type Purchase, type SeatInvite } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { logger } from "./logger";
import { linkPurchasesToUser, recomputeAccess, recordPurchase } from "./entitlements";

// ─── The fifth rung: the seat you give away ──────────────────────────────────
// Every other rung of the ladder is bought by the person who uses it, which is
// why every other rung needed nothing but a column. This one is bought by one
// person and used by another, and that gap is the whole of this file: a seat
// paid for is not a seat delivered until a second human has an account.
//
// Three states, and they are deliberately three rows in two tables rather than
// a counter that goes up and down:
//
//   bought      a `purchases` row, rung "seat", exactly like the other rungs
//   handed out  a `seat_invites` row pointing at that purchase
//   claimed     a second `purchases` row, rung "front", for the partner
//
// Credits are therefore counted, never decremented: seats available = live seat
// purchases that have no invite. A decrementing counter would be wrong within
// the hour, because `recomputeAccess` rewrites `seatCredits` from the ledger
// every time anything about that buyer changes and would put the spent credit
// straight back.
//
// The refund story is the reason the partner's row carries the *seat's*
// transaction id. Hotmart refunds a transaction; `revokeTransaction` revokes
// every row with that id; the partner's access and the buyer's credit go down
// together, in one webhook, with no code here having to know it happened. And
// nothing else moves: a partner who later buys their own protocol has a second
// row under a different transaction, and it is still standing afterwards.
//
// Known gap, written down rather than half-built: Hotmart re-approving a
// transaction it had refunded revives the seat row (recordPurchase does that by
// dedupe key) but not the partner's granted row, which has a different key and
// no notification of its own. That buyer's partner has to be re-invited by
// hand. It is rare, it is recoverable, and guessing at it in code would mean
// re-granting access off an event we have never actually observed.

/** Minimum the partner's password must be, same as everywhere else. */
const MIN_PASSWORD = 6;

export interface SeatSlot {
  /** The `purchases` row that paid for this seat. */
  purchaseId: string;
  transactionId: string;
  purchasedAt: Date;
  invite: SeatInvite | null;
}

export interface SeatState {
  /** Seats paid for and not refunded. */
  owned: number;
  /** Seats with nobody in them yet. */
  available: number;
  slots: SeatSlot[];
}

/** Live seat purchases for an email, oldest first. */
async function liveSeatRows(email: string): Promise<Purchase[]> {
  const rows = await db.select().from(purchasesTable).where(eq(purchasesTable.email, email));
  return rows
    .filter((r) => r.rung === "seat" && !r.revokedAt)
    .sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime());
}

/**
 * What this buyer has bought and what they have given away.
 *
 * Read from the ledger and the invites together, never from `users.seatCredits`
 * — that column is a cache of "seats bought", so it cannot answer "seats left".
 */
export async function seatStateFor(email: string): Promise<SeatState> {
  const emailLower = email.toLowerCase().trim();
  const seats = await liveSeatRows(emailLower);
  if (!seats.length) return { owned: 0, available: 0, slots: [] };

  const invites = await db.select().from(seatInvitesTable).where(eq(seatInvitesTable.ownerEmail, emailLower));
  const byPurchase = new Map(invites.map((i) => [i.purchaseId, i]));

  const slots: SeatSlot[] = seats.map((s) => ({
    purchaseId: s.id,
    transactionId: s.transactionId,
    purchasedAt: s.purchasedAt,
    invite: byPurchase.get(s.id) ?? null,
  }));

  return { owned: slots.length, available: slots.filter((s) => !s.invite).length, slots };
}

/**
 * Spend one seat on an invite link.
 *
 * Returns null when there is nothing to spend, which the route turns into a 409
 * rather than a silent no-op: a buyer who paid 17 EUR and got no link back is
 * exactly the failure this rung exists to avoid.
 */
export async function createInviteFor(args: { email: string; userId: string | null }): Promise<SeatInvite | null> {
  const email = args.email.toLowerCase().trim();
  const state = await seatStateFor(email);
  const free = state.slots.find((s) => !s.invite);
  if (!free) return null;

  const token = randomBytes(32).toString("hex");
  try {
    const [invite] = await db.insert(seatInvitesTable).values({
      purchaseId: free.purchaseId,
      token,
      ownerEmail: email,
      ownerUserId: args.userId,
    }).returning();
    logger.info({ email, purchaseId: free.purchaseId, inviteId: invite.id }, "Seat: invite created");
    return invite;
  } catch (err) {
    // The unique index on purchase_id is the credit counter. Losing that race
    // means the seat is already spent, which is a 409, not a 500.
    const existing = await db.select().from(seatInvitesTable)
      .where(eq(seatInvitesTable.purchaseId, free.purchaseId)).limit(1);
    if (existing.length) return null;
    throw err;
  }
}

export interface InviteView {
  invite: SeatInvite;
  seat: Purchase;
  ownerName: string | null;
}

/**
 * Look an invite up by its token, and refuse it if the seat behind it is gone.
 *
 * This is the only place that decides an invite is dead, and it decides it by
 * reading the purchase row rather than a status of its own.
 */
export async function inviteByToken(token: string): Promise<InviteView | null> {
  const clean = (token || "").trim();
  if (!/^[0-9a-f]{64}$/.test(clean)) return null;

  const [invite] = await db.select().from(seatInvitesTable).where(eq(seatInvitesTable.token, clean)).limit(1);
  if (!invite) return null;

  const [seat] = await db.select().from(purchasesTable).where(eq(purchasesTable.id, invite.purchaseId)).limit(1);
  if (!seat || seat.revokedAt) return null;

  const [owner] = await db.select({ name: usersTable.name })
    .from(usersTable).where(eq(usersTable.email, invite.ownerEmail)).limit(1);

  return { invite, seat, ownerName: owner?.name ?? null };
}

export type ClaimResult =
  | { ok: true; userId: string; email: string; signIn: boolean }
  | { ok: false; code: "invalid" | "taken" | "password" | "email"; message: string };

/**
 * The partner claims the seat.
 *
 * What they get is a `front` purchase row in their own name, carrying the seat's
 * transaction id, and access recomputed from it. Not a flag set by hand: the
 * whole point of the ledger is that the refund path already knows how to undo
 * anything written this way.
 */
export async function claimInvite(
  token: string,
  args: { email?: string; name?: string; password?: string },
): Promise<ClaimResult> {
  const view = await inviteByToken(token);
  if (!view) return { ok: false, code: "invalid", message: "This invitation is no longer valid." };
  if (view.invite.redeemedAt) return { ok: false, code: "taken", message: "This invitation has already been used." };

  const email = (args.email || "").toLowerCase().trim();
  if (!email || email.length > 254 || !email.includes("@")) {
    return { ok: false, code: "email", message: "A valid email is required." };
  }
  if (email === view.invite.ownerEmail) {
    // Claiming your own seat is not a partner, it is a second copy of what you
    // already own, and it would spend the credit for nothing.
    return { ok: false, code: "email", message: "Use the email of the person you are giving the seat to." };
  }
  const password = args.password || "";
  if (password.length < MIN_PASSWORD) {
    return { ok: false, code: "password", message: `Password must be at least ${MIN_PASSWORD} characters.` };
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  let userId: string;
  let signIn: boolean;
  if (!existing) {
    userId = crypto.randomUUID();
    await db.insert(usersTable).values({
      id: userId,
      email,
      name: args.name?.trim() || null,
      passwordHash: await bcrypt.hash(password, 10),
    });
    signIn = true;
  } else if (!existing.passwordHash) {
    // An account exists but has never had a password — a Hotmart buyer's shell,
    // or a lead that was magic-linked in. Setting one here is safe: there is no
    // credential to overwrite.
    userId = existing.id;
    await db.update(usersTable)
      .set({ passwordHash: await bcrypt.hash(password, 10), name: existing.name ?? args.name?.trim() ?? null })
      .where(eq(usersTable.id, existing.id));
    signIn = true;
  } else {
    // They already have a password. Grant the access, but a link in a chat
    // window is not a reason to let anybody past it: they sign in themselves.
    userId = existing.id;
    signIn = false;
  }

  const { purchase } = await recordPurchase({
    provider: view.seat.provider as "hotmart" | "stripe",
    transactionId: view.seat.transactionId,
    // Not the token: the ledger is read by support, and the token is the key to
    // the seat. The invite id says the same thing and opens nothing.
    productKey: `seat:${view.invite.id}`,
    email,
    rung: "front",
    offerCode: view.seat.offerCode,
    productUcode: view.seat.productUcode,
    productId: view.seat.productId,
    priceCents: 0,
    currency: view.seat.currency,
    event: "seat.claim",
    purchasedAt: new Date(),
  });

  await db.update(seatInvitesTable)
    .set({
      redeemedAt: new Date(),
      redeemedByEmail: email,
      redeemedByUserId: userId,
      grantedPurchaseId: purchase.id,
      updatedAt: new Date(),
    })
    .where(and(eq(seatInvitesTable.id, view.invite.id), eq(seatInvitesTable.purchaseId, view.seat.id)));

  await linkPurchasesToUser(email, userId);
  await recomputeAccess(email);

  logger.info(
    { inviteId: view.invite.id, owner: view.invite.ownerEmail, partner: email, transaction: view.seat.transactionId },
    "Seat: invitation claimed, access granted to partner",
  );

  return { ok: true, userId, email, signIn };
}
