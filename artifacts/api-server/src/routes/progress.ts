import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sleepLogsTable, nightCompletionsTable } from "@workspace/db";
import { GetProgressParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId/progress", async (req, res) => {
  const { userId } = GetProgressParams.parse(req.params);

  const logs = await db
    .select()
    .from(sleepLogsTable)
    .where(eq(sleepLogsTable.userId, userId))
    .orderBy(sleepLogsTable.logDate);

  const completions = await db
    .select()
    .from(nightCompletionsTable)
    .where(eq(nightCompletionsTable.userId, userId));

  const completedLogs = logs.filter((l) => l.morningComplete);

  let currentStreak = 0;
  let tempStreak = 0;
  const sortedByDate = [...completedLogs].sort(
    (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
  );

  if (sortedByDate.length > 0) {
    currentStreak = 1;
    for (let i = 1; i < sortedByDate.length; i++) {
      const d1 = new Date(sortedByDate[i - 1].logDate);
      const d2 = new Date(sortedByDate[i].logDate);
      const diffDays = Math.round(
        (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  const dailyStats = logs.map((l) => ({
    date: l.logDate,
    sleepScore: l.sleepScore ?? null,
    totalSleepMinutes: l.totalSleepMinutes ?? null,
    sleepEfficiencyPct: l.sleepEfficiencyPct ?? null,
  }));

  const firstSleepScore = completedLogs[0]?.sleepScore ?? null;
  const currentSleepScore =
    completedLogs[completedLogs.length - 1]?.sleepScore ?? null;

  const avgSleepLatencyMinutes =
    completedLogs.length > 0
      ? completedLogs.reduce((sum, l) => sum + (l.sleepLatencyMinutes ?? 0), 0) /
        completedLogs.length
      : null;

  const avgTotalSleepMinutes =
    completedLogs.length > 0
      ? completedLogs.reduce((sum, l) => sum + (l.totalSleepMinutes ?? 0), 0) /
        completedLogs.length
      : null;

  const avgSleepEfficiencyPct =
    completedLogs.length > 0
      ? completedLogs.reduce((sum, l) => sum + (l.sleepEfficiencyPct ?? 0), 0) /
        completedLogs.length
      : null;

  const avgWakeCount =
    completedLogs.length > 0
      ? completedLogs.reduce((sum, l) => sum + (l.wakeCount ?? 0), 0) /
        completedLogs.length
      : null;

  const avgSleepQuality =
    completedLogs.length > 0
      ? completedLogs.reduce((sum, l) => sum + (l.sleepQuality ?? 0), 0) /
        completedLogs.length
      : null;

  const insights: string[] = [];

  if (completedLogs.length >= 2 && currentSleepScore && firstSleepScore) {
    const diff = currentSleepScore - firstSleepScore;
    if (diff > 0) {
      insights.push(
        `Your sleep score improved by ${diff} points since Night 1. Keep going.`
      );
    }
  }

  if (avgSleepEfficiencyPct !== null && avgSleepEfficiencyPct >= 85) {
    insights.push(
      `Your average sleep efficiency is ${Math.round(avgSleepEfficiencyPct)}% — above the healthy 85% threshold.`
    );
  } else if (avgSleepEfficiencyPct !== null) {
    insights.push(
      `Your average sleep efficiency is ${Math.round(avgSleepEfficiencyPct)}%. The goal is 85%+.`
    );
  }

  const weekendLogs = completedLogs.filter((l) => {
    const day = new Date(l.logDate).getDay();
    return day === 0 || day === 6;
  });
  const weekdayLogs = completedLogs.filter((l) => {
    const day = new Date(l.logDate).getDay();
    return day > 0 && day < 6;
  });

  if (weekendLogs.length > 0 && weekdayLogs.length > 0) {
    const weekendScore =
      weekendLogs.reduce((s, l) => s + (l.sleepScore ?? 0), 0) /
      weekendLogs.length;
    const weekdayScore =
      weekdayLogs.reduce((s, l) => s + (l.sleepScore ?? 0), 0) /
      weekdayLogs.length;
    if (weekendScore < weekdayScore - 10) {
      insights.push(
        `Your weekends show lower sleep quality (${Math.round(weekendScore)} vs ${Math.round(weekdayScore)} weekdays). Worth noticing.`
      );
    }
  }

  if (currentStreak >= 3) {
    insights.push(
      `${currentStreak} nights in a row logged. Consistency is your biggest advantage.`
    );
  }

  if (avgSleepLatencyMinutes !== null && avgSleepLatencyMinutes > 30) {
    insights.push(
      `You're averaging ${Math.round(avgSleepLatencyMinutes)} minutes to fall asleep. Night 5's brain dump routine can help.`
    );
  }

  const nightsCompleted = completions.filter((c) => c.completed).length;

  res.json({
    currentSleepScore,
    firstSleepScore,
    logsCount: logs.length,
    currentStreak,
    nightsCompleted,
    dailyStats,
    avgSleepLatencyMinutes,
    avgTotalSleepMinutes,
    avgSleepEfficiencyPct,
    avgWakeCount,
    avgSleepQuality,
    insights,
  });
});

export default router;
