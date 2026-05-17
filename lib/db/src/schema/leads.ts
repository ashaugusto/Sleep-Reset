import { pgTable, text, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  name: text("name"),
  whatsapp: text("whatsapp"),
  heroVariant: text("hero_variant").default("default"),
  fbp: text("fbp"),
  fbc: text("fbc"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  purchased: boolean("purchased").notNull().default(false),
  purchasedAt: timestamp("purchased_at"),
  stripeSessionId: text("stripe_session_id"),
  recoverySentCount: integer("recovery_sent_count").notNull().default(0),
  recoveryLastAt: timestamp("recovery_last_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("leads_email_idx").on(table.email),
]);

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
