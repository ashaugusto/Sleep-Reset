import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, sleepProfilesTable } from "@workspace/db";
import {
  CreateUserBody,
  GetUserParams,
  UpdateSleepProfileParams,
  UpdateSleepProfileBody,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/users", async (req, res) => {
  const body = CreateUserBody.parse(req.body);

  const whereClause = body.id
    ? eq(usersTable.id, body.id)
    : eq(usersTable.email, body.email);

  const existing = await db
    .select()
    .from(usersTable)
    .where(whereClause)
    .limit(1);

  if (existing.length > 0) {
    res.json(existing[0]);
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      id: body.id ?? randomUUID(),
      email: body.email,
      name: body.name ?? null,
    })
    .returning();

  res.json(user);
});

router.get("/users/:userId", async (req, res) => {
  const { userId } = GetUserParams.parse(req.params);

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

router.put("/users/:userId/profile", async (req, res) => {
  const { userId } = UpdateSleepProfileParams.parse(req.params);
  const body = UpdateSleepProfileBody.parse(req.body);

  const updates: Partial<typeof usersTable.$inferSelect> = {};

  if (body.sleepDisruptorPrimary !== undefined)
    updates.sleepDisruptorPrimary = body.sleepDisruptorPrimary;
  if (body.sleepDisruptorFrequency !== undefined)
    updates.sleepDisruptorFrequency = body.sleepDisruptorFrequency;
  if (body.usualBedtimeMinutes !== undefined)
    updates.usualBedtimeMinutes = body.usualBedtimeMinutes;
  if (body.neededWakeUpMinutes !== undefined)
    updates.neededWakeUpMinutes = body.neededWakeUpMinutes;
  if (body.triedSolutions !== undefined)
    updates.triedSolutions = body.triedSolutions;
  if (body.sleepProfileType !== undefined)
    updates.sleepProfileType = body.sleepProfileType;
  if (body.reminderNightMinutes !== undefined)
    updates.reminderNightMinutes = body.reminderNightMinutes;
  if (body.reminderMorningMinutes !== undefined)
    updates.reminderMorningMinutes = body.reminderMorningMinutes;

  if (
    body.sleepDisruptorPrimary &&
    body.sleepDisruptorFrequency &&
    body.usualBedtimeMinutes &&
    body.neededWakeUpMinutes
  ) {
    updates.onboardingComplete = true;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const profileUpdates: Partial<typeof sleepProfilesTable.$inferInsert> = {};
  if (body.sleepDisruptorPrimary !== undefined)
    profileUpdates.sleepDisruptorPrimary = body.sleepDisruptorPrimary;
  if (body.sleepDisruptorFrequency !== undefined)
    profileUpdates.sleepDisruptorFrequency = body.sleepDisruptorFrequency;
  if (body.usualBedtimeMinutes !== undefined)
    profileUpdates.usualBedtimeMinutes = body.usualBedtimeMinutes;
  if (body.neededWakeUpMinutes !== undefined)
    profileUpdates.neededWakeUpMinutes = body.neededWakeUpMinutes;
  if (body.triedSolutions !== undefined)
    profileUpdates.triedSolutions = body.triedSolutions;
  if (body.sleepProfileType !== undefined)
    profileUpdates.sleepProfileType = body.sleepProfileType;
  if (body.reminderNightMinutes !== undefined)
    profileUpdates.reminderNightMinutes = body.reminderNightMinutes;
  if (body.reminderMorningMinutes !== undefined)
    profileUpdates.reminderMorningMinutes = body.reminderMorningMinutes;
  if (updates.onboardingComplete !== undefined)
    profileUpdates.onboardingComplete = updates.onboardingComplete;

  if (Object.keys(profileUpdates).length > 0) {
    await db
      .insert(sleepProfilesTable)
      .values({
        id: randomUUID(),
        userId,
        ...profileUpdates,
      })
      .onConflictDoUpdate({
        target: sleepProfilesTable.userId,
        set: { ...profileUpdates, updatedAt: new Date() },
      });
  }

  res.json(user);
});

export default router;
