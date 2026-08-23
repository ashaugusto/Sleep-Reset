import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per second seat handed to a partner.
 *
 * The fifth rung sells an account for the person who gets woken up. That is two
 * separate things: a seat bought, which is a row in `purchases` like every
 * other rung, and a seat given away, which is this. Keeping them apart is what
 * makes the credit countable — a buyer with two seats and one invite has one
 * left, and nothing has to be decremented anywhere to know that.
 *
 * Nothing here is a source of access. The invite points at the seat purchase it
 * spends (`purchaseId`), and at the purchase row written for the partner when
 * they claim it (`grantedPurchaseId`). Both of those live in the ledger, so a
 * refund is still the ledger's job and still surgical: the granted row carries
 * the *same* transaction id as the seat that paid for it, so revoking that one
 * transaction closes the buyer's credit and the partner's access together, and
 * touches nothing else either of them owns.
 *
 * That is also why there is no `revokedAt` column. An invite is live exactly
 * when the seat purchase behind it is live, and a second copy of that fact
 * would only be a second thing to get wrong.
 */
export const seatInvitesTable = pgTable("seat_invites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** The seat row in `purchases` this invite spends. One invite per seat. */
  purchaseId: text("purchase_id").notNull(),
  /** What travels in the link. 32 random bytes, hex: not guessable. */
  token: text("token").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerUserId: text("owner_user_id"),
  redeemedAt: timestamp("redeemed_at"),
  redeemedByEmail: text("redeemed_by_email"),
  redeemedByUserId: text("redeemed_by_user_id"),
  /** The `purchases` row that carries the partner's own access. */
  grantedPurchaseId: text("granted_purchase_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("seat_invites_token_idx").on(table.token),
  // One invite per seat bought. The unique index is the counter: a double
  // click on "create the invite" loses the race instead of spending two seats.
  uniqueIndex("seat_invites_purchase_idx").on(table.purchaseId),
  index("seat_invites_owner_idx").on(table.ownerEmail),
]);

export const insertSeatInviteSchema = createInsertSchema(seatInvitesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSeatInvite = z.infer<typeof insertSeatInviteSchema>;
export type SeatInvite = typeof seatInvitesTable.$inferSelect;
