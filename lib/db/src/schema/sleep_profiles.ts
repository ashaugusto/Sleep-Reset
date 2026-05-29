import { pgTable, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";

// Quiz-based front-end of funnel. A profile is created on quiz submit (before email/WA).
// Email + WhatsApp captured at gate before result page.
// converted_at is set when this profile's email matches a paid lead (joined via email).
export const sleepProfilesTable = pgTable("sleep_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(), // browser-side id (sw_cid), allows update before email capture
  type: text("type").notNull(),            // onset | maintenance | mixed | circadian
  score: integer("score").notNull(),       // 0-100 severity
  answers: jsonb("answers").notNull(),     // raw {q1: "...", q2: "...", ...}
  email: text("email"),                    // captured after quiz, before result
  whatsapp: text("whatsapp"),
  adId: text("ad_id"),                     // utm_content
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmTerm: text("utm_term"),
  heroVariant: text("hero_variant"),
  fbp: text("fbp"),
  fbc: text("fbc"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  capturedAt: timestamp("captured_at"),    // when email/WA filled
  convertedAt: timestamp("converted_at"),  // when matched a paid lead
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("sleep_profiles_session_idx").on(t.sessionId),
  index("sleep_profiles_email_idx").on(t.email),
  index("sleep_profiles_type_idx").on(t.type),
  index("sleep_profiles_created_idx").on(t.createdAt),
]);

export type SleepProfile = typeof sleepProfilesTable.$inferSelect;
export type InsertSleepProfile = typeof sleepProfilesTable.$inferInsert;
