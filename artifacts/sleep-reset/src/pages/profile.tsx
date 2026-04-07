import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useClerkUser } from "@/hooks/use-clerk-user";
import { useGetUser, getGetUserQueryKey, useUpdateSleepProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SLEEP_TYPES, SleepTypeId } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return "22:00";
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function Profile() {
  const { userId } = useClerkUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });

  const updateProfile = useUpdateSleepProfile();

  const [eveningRem, setEveningRem] = useState("21:00");
  const [morningRem, setMorningRem] = useState("07:00");

  useEffect(() => {
    if (user) {
      setEveningRem(formatMinutes(user.reminderNightMinutes || 1260));
      setMorningRem(formatMinutes(user.reminderMorningMinutes || 420));
    }
  }, [user]);

  if (isLoading || !user) return <div className="p-6">Loading...</div>;

  const currentSleepType = SLEEP_TYPES[(user.sleepProfileType as SleepTypeId) || "unknown"];

  const handleSave = async () => {
    if (!userId) return;
    try {
      await updateProfile.mutateAsync({
        userId,
        data: {
          reminderNightMinutes: parseMinutes(eveningRem),
          reminderMorningMinutes: parseMinutes(morningRem),
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleSignOut = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    await signOut({ redirectUrl: `${base}/` });
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset your onboarding progress? You will stay signed in but your program will restart.")) {
      if (!userId) return;
      try {
        await updateProfile.mutateAsync({
          userId,
          data: { sleepProfileType: undefined },
        });
        setLocation("/onboarding");
      } catch {
        toast.error("Failed to reset onboarding");
      }
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <h1 className="text-3xl font-serif">Profile</h1>

      <Card className="p-6 space-y-4 border-primary/20 bg-primary/5 shadow-xl shadow-primary/5">
        <div className="space-y-1">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Your Sleep Profile</p>
          <h2 className="text-2xl font-serif">{currentSleepType.name}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {currentSleepType.description}
        </p>
      </Card>

      <div className="space-y-4">
        <h3 className="font-medium px-2">Settings</h3>
        <Card className="p-5 space-y-5 bg-card border-card-border">
          <div className="space-y-2">
            <Label>Evening Reminder</Label>
            <Input type="time" value={eveningRem} onChange={e => setEveningRem(e.target.value)} />
            <p className="text-xs text-muted-foreground">When should we remind you to start your shutdown protocol?</p>
          </div>
          <div className="space-y-2">
            <Label>Morning Check-in</Label>
            <Input type="time" value={morningRem} onChange={e => setMorningRem(e.target.value)} />
            <p className="text-xs text-muted-foreground">When should we ask about your sleep?</p>
          </div>
          <Button className="w-full" onClick={handleSave}>Save Settings</Button>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium px-2">Account</h3>
        <Card className="divide-y divide-border bg-card border-card-border">
          {user.email && (
            <div className="p-5 space-y-2">
              <Label>Email</Label>
              <Input disabled value={user.email} className="bg-muted text-muted-foreground" />
            </div>
          )}
          <div className="p-5 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleReset}
            >
              Reset Onboarding & Start Over
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
