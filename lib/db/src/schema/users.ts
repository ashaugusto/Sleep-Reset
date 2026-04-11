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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
