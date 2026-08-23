import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  GetUserParams,
  UpdateSleepProfileParams,
  UpdateSleepProfileBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── What a user row is allowed to leave the process as ──────────────────────
// These routes answer without a session — an id is the whole credential — so a
// `db.select()` with no columns handed `password_hash` to anyone who asked, and
// production served real bcrypt hashes until this projection landed.
//
// The list is the User schema in lib/api-spec/openapi.yaml, no more: the
// generated client is built from it, so anything past it was never part of the
// contract and nothing reads it. The ladder flags (kitPurchasedAt and friends)
// are deliberately out — they are a cache of the purchases ledger and the app
// reads the ledger through GET /api/entitlements, which does check a session.
//
// Add a column to the users table and it stays private until it is named here.
const publicUserColumns = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  sleepDisruptorPrimary: usersTable.sleepDisruptorPrimary,
  sleepDisruptorFrequency: usersTable.sleepDisruptorFrequency,
  usualBedtimeMinutes: usersTable.usualBedtimeMinutes,
  neededWakeUpMinutes: usersTable.neededWakeUpMinutes,
  triedSolutions: usersTable.triedSolutions,
  sleepProfileType: usersTable.sleepProfileType,
  onboardingComplete: usersTable.onboardingComplete,
  reminderNightMinutes: usersTable.reminderNightMinutes,
  reminderMorningMinutes: usersTable.reminderMorningMinutes,
  currentNight: usersTable.currentNight,
  stripeCustomerId: usersTable.stripeCustomerId,
  purchasedAt: usersTable.purchasedAt,
  createdAt: usersTable.createdAt,
} as const;

router.post("/users", async (req, res) => {
  const body = CreateUserBody.parse(req.body);

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, body.id))
    .limit(1);

  if (existing.length > 0) {
    const updated = await db
      .update(usersTable)
      .set({
        ...(body.email ? { email: body.email } : {}),
        ...(body.name ? { name: body.name } : {}),
      })
      .where(eq(usersTable.id, body.id))
      .returning(publicUserColumns);
    res.json(updated[0]);
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      id: body.id,
      email: body.email ?? null,
      name: body.name ?? null,
    })
    .returning(publicUserColumns);

  res.json(user);
});

router.get("/users/:userId", async (req, res) => {
  const { userId } = GetUserParams.parse(req.params);

  const [user] = await db
    .select(publicUserColumns)
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
    body.sleepDisruptorPrimary !== undefined &&
    body.sleepDisruptorFrequency !== undefined &&
    body.usualBedtimeMinutes !== undefined &&
    body.neededWakeUpMinutes !== undefined
  ) {
    updates.onboardingComplete = true;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning(publicUserColumns);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
