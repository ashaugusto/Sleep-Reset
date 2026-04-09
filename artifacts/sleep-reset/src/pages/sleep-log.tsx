import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListSleepLogs, useCreateSleepLog, useUpdateSleepLogMorning, getListSleepLogsQueryKey } from "@workspace/api-client-react";
import type { SleepLog } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  subMonths,
  addMonths,
} from "date-fns";
import { Moon, Sun, CheckCircle2, Download, ChevronLeft, ChevronRight, List, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return "--";
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function exportCsv(logs: SleepLog[]) {
  const headers = [
    "Date", "Bedtime", "Wake Time", "TST (min)",
    "TIB (min)", "SOL (min)", "WASO (min)",
    "Sleep Efficiency %", "Sleep Score", "Quality", "Restfulness"
  ];
  const rows = logs.map((l: SleepLog) => [
    l.logDate,
    l.bedtimeMinutes !== null ? `${Math.floor((l.bedtimeMinutes ?? 0) / 60)}:${String((l.bedtimeMinutes ?? 0) % 60).padStart(2, "0")}` : "",
    l.finalWakeTimeMinutes !== null ? `${Math.floor((l.finalWakeTimeMinutes ?? 0) / 60)}:${String((l.finalWakeTimeMinutes ?? 0) % 60).padStart(2, "0")}` : "",
    l.totalSleepMinutes ?? "",
    l.timeInBedMinutes ?? "",
    l.sleepLatencyMinutes ?? "",
    l.wakeDurationMinutes ?? "",
    l.sleepEfficiencyPct !== null ? `${l.sleepEfficiencyPct}` : "",
    l.sleepScore ?? "",
    l.sleepQuality ?? "",
    l.restfulness ?? "",
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sleep-log.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function scoreColor(score?: number | null) {
  if (!score) return "bg-secondary/50 text-muted-foreground";
  if (score >= 85) return "bg-green-500/80 text-white";
  if (score >= 70) return "bg-primary/70 text-primary-foreground";
  if (score >= 50) return "bg-yellow-500/70 text-white";
  return "bg-destructive/70 text-white";
}

function CalendarView({ logs }: { logs: SleepLog[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  const logByDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return logs.find(l => l.logDate === dateStr);
  };

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 hover:text-foreground text-muted-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</p>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 hover:text-foreground text-muted-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
        {Array.from({ length: startDow }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const log = logByDate(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition-colors",
                isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : "",
                log?.morningComplete ? scoreColor(log.sleepScore) :
                  log ? "bg-yellow-500/20 text-yellow-400" : "bg-transparent text-muted-foreground"
              )}
              title={log?.morningComplete ? `Score: ${log.sleepScore ?? "--"}` : log ? "Evening only" : ""}
            >
              <span className={cn("font-medium", !log && "text-muted-foreground/60")}>{format(day, "d")}</span>
              {log?.morningComplete && log.sleepScore && (
                <span className="text-[8px] leading-tight">{Math.round(log.sleepScore)}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500/80 inline-block" />85+ great</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/70 inline-block" />70–84 good</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-destructive/70 inline-block" />&lt;70 low</div>
      </div>
    </div>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex justify-between mt-2">
        {[1, 2, 3, 4, 5].map(v => (
          <div key={v} className="flex flex-col items-center">
            <RadioGroupItem value={v.toString()} id={`${label}-${v}`} className="sr-only" />
            <Label
              htmlFor={`${label}-${v}`}
              className={cn(
                "w-10 h-10 rounded-full border border-border flex items-center justify-center cursor-pointer transition-colors text-sm",
                value === v.toString() ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
              )}
            >
              {v}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

export default function SleepLog() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useListSleepLogs(userId || "", {
    query: { enabled: !!userId, queryKey: getListSleepLogsQueryKey(userId || "") }
  });

  const createLog = useCreateSleepLog();
  const updateMorning = useUpdateSleepLogMorning();

  const [bedtime, setBedtime] = useState("22:00");
  const [sleepAttempt, setSleepAttempt] = useState("22:30");
  const [mood, setMood] = useState("3");
  const [notes, setNotes] = useState("");

  const [wakeTime, setWakeTime] = useState("07:00");
  const [outOfBedTime, setOutOfBedTime] = useState("07:15");
  const [latency, setLatency] = useState("15");
  const [wakeCount, setWakeCount] = useState("1");
  const [wakeDuration, setWakeDuration] = useState("10");
  const [quality, setQuality] = useState("3");
  const [restfulness, setRestfulness] = useState("3");
  const [submitting, setSubmitting] = useState(false);

  const [historyView, setHistoryView] = useState<"list" | "calendar">("calendar");

  if (isLoading || !logs) return <div className="p-6">Loading...</div>;

  const logsArray = logs as SleepLog[];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayLog = logsArray.find(l => l.logDate === todayStr);

  const pendingMorningLog = logsArray
    .slice()
    .sort((a, b) => b.logDate.localeCompare(a.logDate))
    .find(l => !l.morningComplete);

  const needsMorningCheckin = !!pendingMorningLog;
  const showEveningForm = !todayLog && !needsMorningCheckin;

  const handleEveningSubmit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await createLog.mutateAsync({
        userId,
        data: {
          logDate: todayStr,
          bedtimeMinutes: timeToMinutes(bedtime),
          sleepAttemptMinutes: timeToMinutes(sleepAttempt),
          eveningMood: parseInt(mood),
          eveningNotes: notes,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListSleepLogsQueryKey(userId) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMorningSubmit = async () => {
    if (!userId || !pendingMorningLog) return;
    setSubmitting(true);
    try {
      await updateMorning.mutateAsync({
        userId,
        logId: pendingMorningLog.id,
        data: {
          finalWakeTimeMinutes: timeToMinutes(wakeTime),
          outOfBedMinutes: timeToMinutes(outOfBedTime),
          sleepLatencyMinutes: parseInt(latency),
          wakeCount: parseInt(wakeCount),
          wakeDurationMinutes: parseInt(wakeDuration),
          sleepQuality: parseInt(quality),
          restfulness: parseInt(restfulness),
        }
      });
      queryClient.invalidateQueries({ queryKey: getListSleepLogsQueryKey(userId) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif">Sleep Log</h1>
        {logsArray.length > 0 && (
          <button
            onClick={() => exportCsv(logsArray)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        )}
      </div>

      {showEveningForm && (
        <Card className="p-6 space-y-6 bg-card border-card-border">
          <div className="flex items-center gap-3">
            <Moon className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-medium">Evening Check-in</h2>
              <p className="text-sm text-muted-foreground">Log this right before bed.</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bedtime</Label>
                <Input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Lights out</Label>
                <Input type="time" value={sleepAttempt} onChange={e => setSleepAttempt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>How are you feeling right now?</Label>
              <RadioGroup value={mood} onValueChange={setMood} className="flex justify-between mt-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <div key={v} className="flex flex-col items-center">
                    <RadioGroupItem value={v.toString()} id={`mood-${v}`} className="sr-only" />
                    <Label
                      htmlFor={`mood-${v}`}
                      className={cn(
                        "w-10 h-10 rounded-full border border-border flex items-center justify-center cursor-pointer transition-colors",
                        mood === v.toString() ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
                      )}
                    >
                      {v}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Wired</span>
                <span>Relaxed</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="What's on your mind?"
                value={notes} onChange={e => setNotes(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <Button className="w-full" onClick={handleEveningSubmit} disabled={submitting}>
              Good night
            </Button>
          </div>
        </Card>
      )}

      {needsMorningCheckin && pendingMorningLog && (
        <Card className="p-6 space-y-6 bg-card border-primary/50 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-3">
            <Sun className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-medium">Morning Check-in</h2>
              <p className="text-sm text-muted-foreground">
                {pendingMorningLog.logDate === todayStr
                  ? "Good morning. How did you sleep?"
                  : `For ${format(new Date(pendingMorningLog.logDate + "T00:00:00"), "EEE, MMM d")} — how did you sleep?`}
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Final wake time</Label>
                <Input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Out of bed</Label>
                <Input type="time" value={outOfBedTime} onChange={e => setOutOfBedTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Time to fall asleep (SOL)</Label>
              <Select value={latency} onValueChange={setLatency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">&lt; 5 min</SelectItem>
                  <SelectItem value="15">5–15 min</SelectItem>
                  <SelectItem value="30">15–30 min</SelectItem>
                  <SelectItem value="60">30–60 min</SelectItem>
                  <SelectItem value="90">&gt; 1 hr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Times woken up</Label>
              <Select value={wakeCount} onValueChange={setWakeCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None</SelectItem>
                  <SelectItem value="1">Once</SelectItem>
                  <SelectItem value="2">2–3 times</SelectItem>
                  <SelectItem value="4">More than 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {parseInt(wakeCount) > 0 && (
              <div className="space-y-2">
                <Label>Total time awake (WASO)</Label>
                <Slider
                  min={0}
                  max={120}
                  step={5}
                  value={[parseInt(wakeDuration)]}
                  onValueChange={([v]) => setWakeDuration(v.toString())}
                />
                <p className="text-sm text-muted-foreground text-center">{wakeDuration} min</p>
              </div>
            )}
            <RatingRow label="Sleep Quality" value={quality} onChange={setQuality} />
            <RatingRow label="How rested do you feel?" value={restfulness} onChange={setRestfulness} />
            <Button className="w-full bg-primary text-primary-foreground" onClick={handleMorningSubmit} disabled={submitting}>
              Log my sleep
            </Button>
          </div>
        </Card>
      )}

      {!needsMorningCheckin && !showEveningForm && (() => {
        const recentLog = logsArray
          .slice()
          .sort((a, b) => b.logDate.localeCompare(a.logDate))
          .find(l => l.morningComplete);
        if (!recentLog) return null;
        return (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-medium text-foreground">All caught up</h3>
            <p className="text-sm text-muted-foreground">
              Last logged: {format(new Date(recentLog.logDate + "T00:00:00"), "EEE, MMM d")}
            </p>
            {recentLog.sleepScore !== null && recentLog.sleepScore !== undefined && (
              <div className="pt-2 flex justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="font-bold text-primary">{Math.round(recentLog.sleepScore)}</p>
                </div>
                {recentLog.totalSleepMinutes && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">TST</p>
                    <p className="font-bold">{formatDuration(recentLog.totalSleepMinutes)}</p>
                  </div>
                )}
                {recentLog.sleepEfficiencyPct && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                    <p className="font-bold">{Math.round(recentLog.sleepEfficiencyPct)}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-medium">History</h3>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
            <button
              onClick={() => setHistoryView("calendar")}
              className={cn("p-1.5 rounded-md transition-colors", historyView === "calendar" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHistoryView("list")}
              className={cn("p-1.5 rounded-md transition-colors", historyView === "list" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-card-border">
          {logsArray.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No logs yet. Start tonight.</p>
          ) : historyView === "calendar" ? (
            <CalendarView logs={logsArray} />
          ) : (
            <div className="space-y-2">
              {logsArray.slice().reverse().map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                  <div>
                    <p className="font-medium text-sm">{format(new Date(log.logDate + "T00:00:00"), "EEE, MMM d")}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.morningComplete
                        ? `${formatDuration(log.totalSleepMinutes)} · ${log.sleepEfficiencyPct ? Math.round(log.sleepEfficiencyPct) + "% eff" : ""} · SOL: ${log.sleepLatencyMinutes ?? "--"}m · WASO: ${log.wakeDurationMinutes ?? "--"}m`
                        : "Evening logged — check in tomorrow morning"}
                    </p>
                  </div>
                  {log.sleepScore !== null && log.sleepScore !== undefined ? (
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ml-2",
                      log.sleepScore >= 85 ? "bg-green-500/20 text-green-500" :
                        log.sleepScore >= 70 ? "bg-primary/20 text-primary" :
                          "bg-destructive/20 text-destructive"
                    )}>
                      {Math.round(log.sleepScore)}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border border-border text-muted-foreground text-xs flex-shrink-0 ml-2">
                      {log.morningComplete ? "--" : "·"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
