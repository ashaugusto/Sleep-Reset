import { useUserId } from "@/hooks/use-user-id";
import { useGetProgress, getGetProgressQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Progress() {
  const userId = useUserId();

  const { data: progress, isLoading } = useGetProgress(userId || "", {
    query: { enabled: !!userId, queryKey: getGetProgressQueryKey(userId || "") }
  });

  if (isLoading) return <div className="p-6">Loading...</div>;

  if (!progress || progress.logsCount === 0) {
    return (
      <div className="p-6 space-y-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl text-muted-foreground">📊</span>
        </div>
        <h2 className="text-xl font-serif">No Data Yet</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Complete your first sleep log to see your progress, sleep score, and insights.
        </p>
      </div>
    );
  }

  const scoreColor = (score?: number | null) => {
    if (!score) return "text-foreground";
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-yellow-500";
    return "text-destructive";
  };

  const chartData = progress.dailyStats.map(stat => ({
    day: format(new Date(stat.date + "T00:00:00"), "EEE"),
    score: stat.sleepScore ? Math.round(stat.sleepScore) : null,
    tst: stat.totalSleepMinutes ? Math.round(stat.totalSleepMinutes / 60 * 10) / 10 : null,
    efficiency: stat.sleepEfficiencyPct ? Math.round(stat.sleepEfficiencyPct) : null,
  })).slice(-7);

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="text-center space-y-2 mt-4">
        <h1 className={cn("text-6xl font-serif transition-colors", scoreColor(progress.currentSleepScore))}>
          {progress.currentSleepScore ? Math.round(progress.currentSleepScore) : "--"}
        </h1>
        <p className="font-medium text-foreground tracking-wide uppercase text-xs">Current Sleep Score</p>
        {progress.firstSleepScore && progress.currentSleepScore && (
          <p className="text-sm text-muted-foreground mt-2">
            Night 1: {Math.round(progress.firstSleepScore)} → Now: {Math.round(progress.currentSleepScore)}.
            {progress.currentSleepScore > progress.firstSleepScore ? " You're improving." : " Keep going."}
          </p>
        )}
      </div>

      <div className="bg-card border border-card-border p-4 rounded-3xl">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4 px-1">Last 7 Nights</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -8 }}>
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis yAxisId="tst" hide domain={[0, 12]} />
              <YAxis yAxisId="pct" orientation="right" hide domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: "hsl(var(--secondary))", opacity: 0.5 }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
                  color: "hsl(var(--foreground))",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "tst") return [`${value}h`, "TST"];
                  if (name === "efficiency") return [`${value}%`, "Efficiency"];
                  if (name === "score") return [value, "Score"];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}
                formatter={(value) => {
                  if (value === "tst") return "TST (hrs)";
                  if (value === "efficiency") return "Efficiency %";
                  if (value === "score") return "Sleep Score";
                  return value;
                }}
              />
              <Bar yAxisId="tst" dataKey="tst" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Line yAxisId="pct" type="monotone" dataKey="efficiency" stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3, fill: "hsl(var(--background))", stroke: "hsl(var(--foreground))", strokeWidth: 1.5 }} connectNulls />
              <Line yAxisId="pct" type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col space-y-1 bg-secondary/30 border-transparent">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Nights Logged</span>
          <span className="text-3xl font-serif">{progress.logsCount}/7</span>
        </Card>
        <Card className="p-5 flex flex-col space-y-1 bg-secondary/30 border-transparent">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Streak</span>
          <span className="text-3xl font-serif text-primary">{progress.currentStreak} 🔥</span>
        </Card>
      </div>

      {progress.logsCount >= 2 && (
        <div className="space-y-4">
          <h3 className="font-medium px-2">Your Averages</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-1">Time to Fall Asleep</p>
              <p className="font-medium">{progress.avgSleepLatencyMinutes ? `${Math.round(progress.avgSleepLatencyMinutes)} min` : "--"}</p>
            </div>
            <div className="bg-card border border-card-border p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-1">Total Sleep</p>
              <p className="font-medium">{progress.avgTotalSleepMinutes ? `${Math.floor(progress.avgTotalSleepMinutes / 60)}h ${Math.round(progress.avgTotalSleepMinutes % 60)}m` : "--"}</p>
            </div>
            <div className="bg-card border border-card-border p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
              <p className={cn("font-medium", progress.avgSleepEfficiencyPct && progress.avgSleepEfficiencyPct >= 85 ? "text-green-500" : progress.avgSleepEfficiencyPct && progress.avgSleepEfficiencyPct >= 70 ? "text-primary" : "")}>
                {progress.avgSleepEfficiencyPct ? `${Math.round(progress.avgSleepEfficiencyPct)}%` : "--"}
              </p>
            </div>
            <div className="bg-card border border-card-border p-4 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-1">Wake Ups</p>
              <p className="font-medium">{progress.avgWakeCount !== null && progress.avgWakeCount !== undefined ? `${Math.round(progress.avgWakeCount * 10) / 10}×` : "--"}</p>
            </div>
          </div>
        </div>
      )}

      {progress.insights && progress.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium px-2">Insights</h3>
          <div className="space-y-3">
            {progress.insights.map((insight, idx) => (
              <Card key={idx} className="p-5 bg-primary/10 border-primary/20">
                <p className="text-sm text-foreground leading-relaxed">{insight}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
