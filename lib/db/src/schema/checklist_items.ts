import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checklistItemsTable = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  nightNumber: integer("night_number").notNull(),
  key: text("key").notNull(),
  checked: boolean("checked").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItemsTable).omit({ id: true, updatedAt: true, createdAt: true });
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItemsTable.$inferSelect;
