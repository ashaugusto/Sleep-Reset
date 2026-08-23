import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  passwordHash: text("password_hash"),
  sleepDisruptorPrimary: text("sleep_disruptor_primary"),
  sleepDisruptorFrequency: text("sleep_disruptor_frequency"),
  usualBedtimeMinutes: integer("usual_bedtime_minutes"),
  neededWakeUpMinutes: integer("needed_wake_up_minutes"),
  triedSolutions: text("tried_solutions").array(),
  sleepProfileType: text("sleep_profile_type"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  reminderNightMinutes: integer("reminder_night_minutes"),
  reminderMorningMinutes: integer("reminder_morning_minutes"),
  currentNight: integer("current_night").notNull().default(1),
  stripeCustomerId: text("stripe_customer_id"),
  purchasedAt: timestamp("purchased_at"),
  premiumPurchasedAt: timestamp("premium_purchased_at"),
  // The rest of the ladder. These are projections of the purchases table, not
  // the source of truth: routes read them, the entitlements module writes them,
  // and a refund recomputes them from the rows that survived.
  /** The 3AM Relapse Kit, the one-click offer after the platform purchase. */
  kitPurchasedAt: timestamp("kit_purchased_at"),
  /** The single 3AM protocol, for whoever declined the Kit. */
  downsellPurchasedAt: timestamp("downsell_purchased_at"),
  /**
   * Second seats bought. Bought, not remaining: `recomputeAccess` rewrites this
   * from the live seat rows in the ledger, so anything decremented here comes
   * straight back. Seats still free are counted in `seat_invites` instead, and
   * `seatStateFor` in the API is the only thing that should be asked.
   */
  seatCredits: integer("seat_credits").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
