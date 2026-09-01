import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per permission somebody gave us, in the words they were shown.
 *
 * The seventh rung needs two of them and they are not the same kind of thing.
 * `backend_log_reading` is the legal basis for a person here reading a sleep
 * log at all: that log is data concerning health, GDPR art. 9 has no contract
 * exception, and explicit consent under art. 9(2)(a) is the only door in. Money
 * changing hands is not consent. `backend_early_start` is the opposite shape,
 * a right being given up rather than one being granted: dir. 2011/83/UE art.
 * 16(a) takes the 14 day withdrawal away only when the buyer asked us to start
 * early, acknowledged what that costs, and the service was then delivered in
 * full. Both are recorded, neither is assumed.
 *
 * Why this is a table and not a flag on `users` or a column on `purchases`:
 *
 *   - Consent is given *before* the purchase exists. The boxes are on our offer
 *     page, upstream of Hotmart, so there is no transaction to hang them off
 *     yet. `transactionId` is stamped later, by the webhook, once the sale
 *     lands and can be matched by email. A row with a null transaction is a
 *     visitor who ticked and did not buy, which is a fact worth keeping and not
 *     an error.
 *   - What has to survive is not a boolean but the sentence. Two years from
 *     now, proving consent means producing the exact words on the screen at the
 *     time, in the language they were in. So `statement` is stored verbatim and
 *     the text comes from the server, never from the request body: a claim that
 *     somebody agreed to something is not something the client gets to write.
 *   - Withdrawal has to be as easy as giving, and it must not erase the record.
 *     A withdrawn row keeps `grantedAt` and gains `withdrawnAt`, because "they
 *     consented in March and withdrew in May" is the true story and deleting
 *     the row tells a different one.
 *
 * Rows are append-only per grant. The live answer for a user is the newest row
 * for that kind with `withdrawnAt` still null.
 */
export const consentsTable = pgTable("consents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  /** backend_early_start | backend_log_reading */
  kind: text("kind").notNull(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  /** Which rung's page it was given on: backend | backendLive. */
  rung: text("rung"),
  /** en | fr | es | pt. The language the sentence below was shown in. */
  locale: text("locale").notNull(),
  /** The sentence as displayed, word for word. Server side copy, not the client's. */
  statement: text("statement").notNull(),
  /** Stamped by the Hotmart webhook once a matching sale lands. */
  transactionId: text("transaction_id"),
  /** Evidence, not analytics. Who was at the keyboard and on what. */
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  /** Set when the permission is taken back. The row stays. */
  withdrawnAt: timestamp("withdrawn_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("consents_user_kind_idx").on(table.userId, table.kind),
  index("consents_email_idx").on(table.email),
  index("consents_transaction_idx").on(table.transactionId),
]);

export const insertConsentSchema = createInsertSchema(consentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsent = z.infer<typeof insertConsentSchema>;
export type Consent = typeof consentsTable.$inferSelect;
