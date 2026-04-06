import { useState } from "react";
import { useUserId } from "@/hooks/use-user-id";
import { useListSleepLogs, useCreateSleepLog, useUpdateSleepLogMorning, getListSleepLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Moon, Sun, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function SleepLog() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useListSleepLogs(userId || "", {
    query: { enabled: !!userId, queryKey: getListSleepLogsQueryKey(userId || "") }
  });

  const createLog = useCreateSleepLog();
  const updateMorning = useUpdateSleepLogMorning();

  // Evening Check-in state
  const [bedtime, setBedtime] = useState("22:00");
  const [sleepAttempt, setSleepAttempt] = useState("22:30");
  const [mood, setMood] = useState("3");
  const [notes, setNotes] = useState("");

  // Morning Check-in state
  const [wakeTime, setWakeTime] = useState("07:00");
  const [outOfBedTime, setOutOfBedTime] = useState("07:15");
  const [latency, setLatency] = useState("15");
  const [wakeCount, setWakeCount] = useState("1");
  const [wakeDuration, setWakeDuration] = useState("10");
  const [quality, setQuality] = useState("3");
  const [restfulness, setRestfulness] = useState("3");

  if (isLoading || !logs) return <div className="p-6">Loading...</div>;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayLog = logs.find(l => l.logDate === todayStr);

  const needsMorningCheckin = todayLog && !todayLog.morningComplete;
  const showEveningForm = !todayLog;

  const handleEveningSubmit = async () => {
    if (!userId) return;
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
  };

  const handleMorningSubmit = async () => {
    if (!userId || !todayLog) return;
    await updateMorning.mutateAsync({
      userId,
      logId: todayLog.id,
      data: {
        finalWakeTimeMinutes: timeToMinutes(wakeTime),
        outOfBedMinutes: timeToMinutes(outOfBedTime),
        sleepLatencyMinutes: parseInt(latency),
        wakeCount: parseInt(wakeCount),
        wakeDurationMinutes: parseInt(wakeDuration),
        sleepQuality: parseInt(quality),
        restfulness: parseInt(restfulness)
      }
    });
    queryClient.invalidateQueries({ queryKey: getListSleepLogsQueryKey(userId) });
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-serif">Sleep Log</h1>

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
                {[1,2,3,4,5].map(v => (
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

            <Button className="w-full" onClick={handleEveningSubmit}>
              Good night
            </Button>
          </div>
        </Card>
      )}

      {needsMorningCheckin && (
        <Card className="p-6 space-y-6 bg-card border-primary/50 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-3">
            <Sun className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-medium">Morning Check-in</h2>
              <p className="text-sm text-muted-foreground">Good morning. How did you sleep?</p>
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
              <Label>Time to fall asleep</Label>
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
                  <SelectItem value="2">2-3 times</SelectItem>
                  <SelectItem value="4">More than 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sleep Quality</Label>
              <RadioGroup value={quality} onValueChange={setQuality} className="flex justify-between mt-2">
                {[1,2,3,4,5].map(v => (
                  <div key={v} className="flex flex-col items-center">
                    <RadioGroupItem value={v.toString()} id={`q-${v}`} className="sr-only" />
                    <Label 
                      htmlFor={`q-${v}`} 
                      className={cn(
                        "w-10 h-10 rounded-full border border-border flex items-center justify-center cursor-pointer transition-colors",
                        quality === v.toString() ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
                      )}
                    >
                      {v}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button className="w-full bg-primary text-primary-foreground" onClick={handleMorningSubmit}>
              Log my sleep
            </Button>
          </div>
        </Card>
      )}

      {todayLog && todayLog.morningComplete && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
          <h3 className="font-medium text-foreground">All caught up</h3>
          <p className="text-sm text-muted-foreground">You've logged your sleep for today.</p>
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="font-medium px-2">History</h3>
        <div className="bg-card rounded-2xl p-4 border border-card-border space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No logs yet. Start tonight.</p>
          ) : (
            <div className="space-y-2">
              {logs.slice().reverse().map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-secondary/30">
                  <div>
                    <p className="font-medium text-sm">{format(new Date(log.logDate), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.morningComplete ? `${log.totalSleepMinutes ? Math.floor(log.totalSleepMinutes / 60) + 'h ' + (log.totalSleepMinutes % 60) + 'm' : ''}` : 'Incomplete'}
                    </p>
                  </div>
                  {log.sleepScore && (
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      log.sleepScore >= 85 ? "bg-green-500/20 text-green-500" :
                      log.sleepScore >= 70 ? "bg-primary/20 text-primary" :
                      "bg-destructive/20 text-destructive"
                    )}>
                      {log.sleepScore}
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
