import { pgTable, text, integer, real, boolean, timestamp, date, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sleepLogsTable = pgTable("sleep_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  logDate: date("log_date").notNull(),
  bedtimeMinutes: integer("bedtime_minutes"),
  sleepAttemptMinutes: integer("sleep_attempt_minutes"),
  eveningMood: integer("evening_mood"),
  eveningNotes: text("evening_notes"),
  finalWakeTimeMinutes: integer("final_wake_time_minutes"),
  outOfBedMinutes: integer("out_of_bed_minutes"),
  sleepLatencyMinutes: integer("sleep_latency_minutes"),
  wakeCount: integer("wake_count"),
  wakeDurationMinutes: integer("wake_duration_minutes"),
  sleepQuality: integer("sleep_quality"),
  restfulness: integer("restfulness"),
  timeInBedMinutes: integer("time_in_bed_minutes"),
  totalSleepMinutes: integer("total_sleep_minutes"),
  sleepEfficiencyPct: real("sleep_efficiency_pct"),
  sleepScore: integer("sleep_score"),
  morningComplete: boolean("morning_complete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSleepLogSchema = createInsertSchema(sleepLogsTable).omit({ id: true, createdAt: true });
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type SleepLog = typeof sleepLogsTable.$inferSelect;
