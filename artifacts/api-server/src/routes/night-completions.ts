import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, nightCompletionsTable, usersTable, checklistItemsTable } from "@workspace/db";
import {
  ListNightCompletionsParams,
  UpdateNightCompletionParams,
  UpdateNightCompletionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId/night-completions", async (req, res) => {
  const { userId } = ListNightCompletionsParams.parse(req.params);

  const completions = await db
    .select()
    .from(nightCompletionsTable)
    .where(eq(nightCompletionsTable.userId, userId))
    .orderBy(nightCompletionsTable.nightNumber);

  res.json(completions);
});

router.put("/users/:userId/night-completions/:nightNumber", async (req, res) => {
  const { userId, nightNumber } = UpdateNightCompletionParams.parse(req.params);
  const body = UpdateNightCompletionBody.parse(req.body);

  const nightNum = Number(nightNumber);

  const existing = await db
    .select()
    .from(nightCompletionsTable)
    .where(
      and(
        eq(nightCompletionsTable.userId, userId),
        eq(nightCompletionsTable.nightNumber, nightNum)
      )
    )
    .limit(1);

  const isCompleted = body.completed === true;
  const completedAt = isCompleted ? new Date() : null;

  let completion;

  if (existing.length > 0) {
    const [updated] = await db
      .update(nightCompletionsTable)
      .set({
        checklistItems: body.checklistItems,
        completed: isCompleted,
        completedAt,
      })
      .where(
        and(
          eq(nightCompletionsTable.userId, userId),
          eq(nightCompletionsTable.nightNumber, nightNum)
        )
      )
      .returning();
    completion = updated;
  } else {
    const [created] = await db
      .insert(nightCompletionsTable)
      .values({
        userId,
        nightNumber: nightNum,
        checklistItems: body.checklistItems,
        completed: isCompleted,
        completedAt,
      })
      .returning();
    completion = created;
  }

  if (body.checklistItems && Array.isArray(body.checklistItems)) {
    const items = body.checklistItems as Array<{ key: string; checked: boolean }>;
    for (const item of items) {
      if (item.key) {
        await db
          .insert(checklistItemsTable)
          .values({
            userId,
            nightNumber: nightNum,
            key: item.key,
            checked: item.checked ?? false,
          })
          .onConflictDoUpdate({
            target: [checklistItemsTable.userId, checklistItemsTable.nightNumber, checklistItemsTable.key],
            set: { checked: item.checked ?? false, updatedAt: new Date() },
          });
      }
    }
  }

  if (isCompleted) {
    const nextNight = nightNum + 1;
    if (nextNight <= 7) {
      await db
        .update(usersTable)
        .set({ currentNight: nextNight })
        .where(
          and(
            eq(usersTable.id, userId),
          )
        );
    }
  }

  res.json(completion);
});

export default router;
