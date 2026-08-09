import { pgTable, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per thing somebody paid for, on either processor.
 *
 * The users table only carries flags — purchasedAt, premiumPurchasedAt — and a
 * flag cannot answer the question a refund asks: *which* payment is being
 * taken back. A buyer who owns the platform and the Recovery Pack and then
 * charges back the 19 EUR pack must keep the 27 EUR platform. Without a row
 * per transaction the only options are to revoke everything or to revoke
 * nothing, and both are wrong.
 *
 * So access is derived, never assigned: the webhook writes a row here, and the
 * user flags are recomputed from the rows that are still standing. Stripe
 * writes rows too, so a Hotmart refund can see that the lifetime access came
 * from somewhere else and leave it alone.
 */
export const purchasesTable = pgTable("purchases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** "hotmart" or "stripe". */
  provider: text("provider").notNull().default("hotmart"),
  /** Hotmart's `purchase.transaction`, or the Stripe checkout session id. */
  transactionId: text("transaction_id").notNull(),
  /**
   * provider:transaction:product. Hotmart retries the same notification until
   * it gets a 200 and fires one call per product in the order, so the natural
   * key is the transaction plus the product, not the transaction alone.
   */
  dedupeKey: text("dedupe_key").notNull(),
  email: text("email").notNull(),
  /** Filled once the buyer has an account. Null between webhook and account. */
  userId: text("user_id"),
  /** front | bump | oto1 | downsell | seat | season | backend | unknown */
  rung: text("rung").notNull(),
  offerCode: text("offer_code"),
  productUcode: text("product_ucode"),
  productId: text("product_id"),
  /** approved | refunded | chargeback | canceled */
  status: text("status").notNull().default("approved"),
  priceCents: integer("price_cents"),
  currency: text("currency"),
  /** Hotmart hands this back untouched: our own attribution, see offers.ts. */
  sck: text("sck"),
  /** The event name that last moved this row, for support archaeology. */
  event: text("event"),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  /** Set on refund or chargeback. A revoked row grants nothing. */
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("purchases_dedupe_idx").on(table.dedupeKey),
  index("purchases_email_idx").on(table.email),
  index("purchases_transaction_idx").on(table.transactionId),
]);

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
