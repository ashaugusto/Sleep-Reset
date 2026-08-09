import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Moon, Headphones, BarChart2, Library as LibraryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useEntitlements } from "@/hooks/use-entitlements";
import { PACKS } from "@/lib/library";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { userId } = useAuth();

  const { data: user, isLoading } = useGetUser(userId || "", {
    query: {
      enabled: !!userId,
      queryKey: getGetUserQueryKey(userId || ""),
    },
  });

  // The add-ons a buyer owns had nowhere to be found from here: the Recovery
  // Pack could only be played on the page that sells it, and the Kit nowhere at
  // all. The tile below is the way in, and it only appears once there is
  // something behind it.
  const { owns } = useEntitlements();
  const ownedPacks = PACKS.filter((p) => owns(p.rung));

  useEffect(() => {
    if (user && !user.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [user, setLocation]);

  if (isLoading || !user) {
    return <div className="p-6">Loading...</div>;
  }

  const currentNight = user.currentNight || 1;

  const getDynamicText = (night: number) => {
    if (night === 1) return "Tonight's your first night. Let's set the foundation.";
    if (night === 4) return "You're halfway. Your sleep is already changing.";
    if (night > 7) return "You did it. Now let's keep it going.";
    return "Let's keep building that foundation tonight.";
  };

  return (
    <div className="p-6 space-y-8">
      {/* Top section: Progress bar */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center px-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const nightNum = i + 1;
            const isCompleted = nightNum < currentNight;
            const isCurrent = nightNum === currentNight;
            return (
              <div
                key={nightNum}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-500",
                  isCompleted ? "bg-primary" : isCurrent ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-pulse" : "bg-muted"
                )}
              />
            );
          })}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {getDynamicText(currentNight)}
        </p>
      </div>

      {/* Center: Night Card */}
      <div
        className="bg-card border border-card-border rounded-3xl p-6 space-y-6 shadow-xl cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setLocation(`/night/${currentNight}`)}
      >
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-serif">Night {currentNight}</h2>
          <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
            In progress
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-medium">The Anchor</h3>
          <p className="text-sm text-muted-foreground">Wake time is more important than bedtime.</p>
        </div>
        <Button className="w-full">Start Tonight's Protocol</Button>
      </div>

      {/* Bottom: Quick Access Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="bg-secondary/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => setLocation("/sleep-log")}
        >
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
            <Moon className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium">Sleep Log</span>
        </div>
        
        <div 
          className="bg-secondary/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => setLocation("/progress")}
        >
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium">My Progress</span>
        </div>

        <div
          className="col-span-2 bg-secondary/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => setLocation(`/night/${currentNight}`)}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Tonight's Guided Audio</p>
              <p className="text-xs text-muted-foreground">Night {currentNight} · ~2 min CBT-I</p>
            </div>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Play</span>
        </div>

        {ownedPacks.length > 0 && (
          <div
            className="col-span-2 bg-secondary/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/80 transition-colors"
            onClick={() => setLocation("/library")}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                <LibraryIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Your library</p>
                <p className="text-xs text-muted-foreground">
                  {ownedPacks.map((p) => p.title).join(" · ")}
                </p>
              </div>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Open</span>
          </div>
        )}
      </div>
    </div>
  );
}
