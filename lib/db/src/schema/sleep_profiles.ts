import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sleepProfilesTable = pgTable("sleep_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  sleepDisruptorPrimary: text("sleep_disruptor_primary"),
  sleepDisruptorFrequency: text("sleep_disruptor_frequency"),
  usualBedtimeMinutes: integer("usual_bedtime_minutes"),
  neededWakeUpMinutes: integer("needed_wake_up_minutes"),
  triedSolutions: text("tried_solutions").array(),
  sleepProfileType: text("sleep_profile_type"),
  reminderNightMinutes: integer("reminder_night_minutes"),
  reminderMorningMinutes: integer("reminder_morning_minutes"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSleepProfileSchema = createInsertSchema(sleepProfilesTable).omit({ updatedAt: true, createdAt: true });
export type InsertSleepProfile = z.infer<typeof insertSleepProfileSchema>;
export type SleepProfile = typeof sleepProfilesTable.$inferSelect;
