import { pgTable, text, integer, boolean, timestamp, json, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nightCompletionsTable = pgTable("night_completions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  nightNumber: integer("night_number").notNull(),
  checklistItems: json("checklist_items").notNull().default([]),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNightCompletionSchema = createInsertSchema(nightCompletionsTable).omit({ id: true, createdAt: true });
export type InsertNightCompletion = z.infer<typeof insertNightCompletionSchema>;
export type NightCompletion = typeof nightCompletionsTable.$inferSelect;
