import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, sleepLogsTable } from "@workspace/db";
import {
  ListSleepLogsParams,
  CreateSleepLogParams,
  CreateSleepLogBody,
  UpdateSleepLogMorningParams,
  UpdateSleepLogMorningBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function calculateSleepMetrics(
  bedtimeMinutes: number,
  sleepAttemptMinutes: number,
  finalWakeTimeMinutes: number,
  outOfBedMinutes: number,
  sleepLatencyMinutes: number,
  wakeCount: number,
  wakeDurationMinutes: number,
  sleepQuality: number,
  restfulness: number
) {
  const normalizeMinutes = (mins: number) => (mins < 0 ? mins + 1440 : mins);

  let bedNorm = normalizeMinutes(bedtimeMinutes);
  let outNorm = normalizeMinutes(outOfBedMinutes);
  let wakeNorm = normalizeMinutes(finalWakeTimeMinutes);

  if (outNorm < bedNorm) outNorm += 1440;
  if (wakeNorm < bedNorm) wakeNorm += 1440;

  const timeInBedMinutes = outNorm - bedNorm;

  const wakeToGetUpMinutes = Math.max(0, outNorm - wakeNorm);

  const totalSleepMinutes = Math.max(
    0,
    timeInBedMinutes - sleepLatencyMinutes - wakeDurationMinutes - wakeToGetUpMinutes
  );

  const sleepEfficiencyPct =
    timeInBedMinutes > 0
      ? Math.round((totalSleepMinutes / timeInBedMinutes) * 1000) / 10
      : 0;

  const efficiencyScore = Math.min(100, Math.max(0, sleepEfficiencyPct));
  const qualityScore = (sleepQuality / 5) * 100;
  const restScore = (restfulness / 5) * 100;
  const sleepScore = Math.round(
    efficiencyScore * 0.5 + qualityScore * 0.25 + restScore * 0.25
  );

  return {
    timeInBedMinutes,
    totalSleepMinutes,
    sleepEfficiencyPct,
    sleepScore,
  };
}

router.get("/users/:userId/sleep-logs", async (req, res) => {
  const { userId } = ListSleepLogsParams.parse(req.params);

  const logs = await db
    .select()
    .from(sleepLogsTable)
    .where(eq(sleepLogsTable.userId, userId))
    .orderBy(sleepLogsTable.logDate);

  res.json(logs);
});

router.post("/users/:userId/sleep-logs", async (req, res) => {
  const { userId } = CreateSleepLogParams.parse(req.params);
  const body = CreateSleepLogBody.parse(req.body);

  const logDateStr = typeof body.logDate === "string"
    ? body.logDate
    : (body.logDate as Date).toISOString().split("T")[0];

  const [log] = await db
    .insert(sleepLogsTable)
    .values({
      userId,
      logDate: logDateStr,
      bedtimeMinutes: body.bedtimeMinutes,
      sleepAttemptMinutes: body.sleepAttemptMinutes,
      eveningMood: body.eveningMood,
      eveningNotes: body.eveningNotes ?? null,
    })
    .returning();

  res.status(201).json(log);
});

router.put("/users/:userId/sleep-logs/:logId/morning", async (req, res) => {
  const { userId, logId } = UpdateSleepLogMorningParams.parse(req.params);
  const body = UpdateSleepLogMorningBody.parse(req.body);

  const existing = await db
    .select()
    .from(sleepLogsTable)
    .where(
      and(
        eq(sleepLogsTable.id, Number(logId)),
        eq(sleepLogsTable.userId, userId)
      )
    )
    .limit(1);

  if (!existing[0] || existing[0].bedtimeMinutes == null) {
    res.status(404).json({ message: "Sleep log not found or missing night data" });
    return;
  }

  const log = existing[0];

  const { timeInBedMinutes, totalSleepMinutes, sleepEfficiencyPct, sleepScore } =
    calculateSleepMetrics(
      log.bedtimeMinutes!,
      log.sleepAttemptMinutes ?? log.bedtimeMinutes!,
      body.finalWakeTimeMinutes,
      body.outOfBedMinutes,
      body.sleepLatencyMinutes,
      body.wakeCount,
      body.wakeDurationMinutes ?? 0,
      body.sleepQuality,
      body.restfulness
    );

  const [updated] = await db
    .update(sleepLogsTable)
    .set({
      finalWakeTimeMinutes: body.finalWakeTimeMinutes,
      outOfBedMinutes: body.outOfBedMinutes,
      sleepLatencyMinutes: body.sleepLatencyMinutes,
      wakeCount: body.wakeCount,
      wakeDurationMinutes: body.wakeDurationMinutes ?? 0,
      sleepQuality: body.sleepQuality,
      restfulness: body.restfulness,
      timeInBedMinutes,
      totalSleepMinutes,
      sleepEfficiencyPct,
      sleepScore,
      morningComplete: true,
    })
    .where(
      and(
        eq(sleepLogsTable.id, Number(logId)),
        eq(sleepLogsTable.userId, userId)
      )
    )
    .returning();

  res.json(updated);
});

export default router;
