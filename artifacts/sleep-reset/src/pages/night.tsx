import { useRoute, useLocation } from "wouter";
import { useUserId } from "@/hooks/use-user-id";
import { useListNightCompletions, useUpdateNightCompletion, getListNightCompletionsQueryKey, useGetUser, getGetUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PlayCircle, CheckCircle2, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { SLEEP_TYPES } from "@/lib/constants";

const NIGHT_CONTENT = {
  1: {
    title: "The Anchor",
    concept: "Wake time is more important than bedtime. Your body has a clock — keep it consistent. A strict wake-up time builds the sleep drive you need to fall asleep naturally.",
    checklist: [
      { id: "alarm", label: "I've set my wake-up alarm", type: "time" },
      { id: "consistent", label: "I'll keep it the same all week including weekends", type: "check" },
      { id: "commit", label: "I commit to this for 7 days", type: "check" }
    ],
    tips: {
      racing_thoughts: "I know weekends feel sacred. But one consistent week will do more for your sleep than sleeping in ever did.",
      work_stress: "I know weekends feel sacred. But one consistent week will do more for your sleep than sleeping in ever did.",
      partying_alcohol: "Even after a late Saturday, set the alarm. One rough Sunday is worth the payoff.",
      anxiety: "I know weekends feel sacred. But one consistent week will do more for your sleep than sleeping in ever did.",
      phone_screens: "I know weekends feel sacred. But one consistent week will do more for your sleep than sleeping in ever did.",
      unknown: "I know weekends feel sacred. But one consistent week will do more for your sleep than sleeping in ever did."
    }
  },
  2: {
    title: "The Shutdown",
    concept: "Screens delay melatonin. Create a 60-min digital curfew before bed to help your brain transition to sleep.",
    checklist: [
      { id: "shutdown_time", label: "I set my shutdown time", type: "time" },
      { id: "phone_away", label: "Phone is out of reach or in airplane mode", type: "check" },
      { id: "alternative", label: "I did something else instead", type: "text" },
      { id: "room_dim", label: "Room was dark or dim", type: "check" }
    ],
    tips: {
      phone_screens: "Put your phone charger in the kitchen tonight. No phone nearby = no temptation.",
      default: "Find a book, a journal, or just sit quietly. Let your brain power down."
    }
  },
  3: {
    title: "The Fuel",
    concept: "Caffeine lasts 5–6 hrs, alcohol fragments sleep, heavy meals delay rest. What you put in your body affects how it rests.",
    checklist: [
      { id: "no_caffeine", label: "No caffeine after 2pm", type: "check" },
      { id: "last_meal", label: "Last meal 2+ hours before bed", type: "check" },
      { id: "alcohol", label: "If I drank, I stopped 3 hours before bed", type: "check" },
      { id: "water", label: "I drank enough water today", type: "check" }
    ],
    tips: {
      partying_alcohol: "Eat something with magnesium today — banana, dark chocolate, spinach. Your body needs it.",
      default: "Hydration is key, but front-load it early in the day so you don't wake up to use the bathroom."
    }
  },
  4: {
    title: "The Cave",
    concept: "Your bedroom should be a sanctuary for sleep. It needs to be dark, cool (16–19°C), and quiet.",
    checklist: [
      { id: "dark_room", label: "Room is dark (blackout or eye mask)", type: "check" },
      { id: "cool_temp", label: "Temperature is cool (16–19°C)", type: "check" },
      { id: "phone_away", label: "Phone is away from bed", type: "check" },
      { id: "no_tv", label: "No TV or bright lights", type: "check" },
      { id: "comfortable", label: "Comfortable pillow and bedding", type: "check" }
    ],
    tips: {
      default: "If you can't control the room temperature, try taking a warm shower before bed — your body temp drops afterward, signaling sleep."
    }
  },
  5: {
    title: "The Download",
    concept: "Your brain needs a 'download' ritual. A brain dump helps offload thoughts so you don't process them in bed.",
    checklist: [
      { id: "brain_dump", label: "Wrote down everything on my mind", type: "check" },
      { id: "next_action", label: "For each worry, wrote one 'next action' for tomorrow", type: "check" },
      { id: "breathing", label: "Did 4-7-8 breathing (4 cycles)", type: "check" },
      { id: "no_force", label: "Lay down without trying to force sleep", type: "check" }
    ],
    tips: {
      racing_thoughts: "The brain dump is your best friend. Get it out of your head and onto paper.",
      anxiety: "Breathe. The paper holds the worries now, not you.",
      default: "Keep a notepad by your bed. If a thought wakes you up, write it down and let it go."
    }
  },
  6: {
    title: "The Protocol",
    concept: "Combine all the pieces into one seamless bedtime routine sequence.",
    checklist: [
      { id: "shutdown", label: "Started shutdown at target time", type: "check" },
      { id: "fuel", label: "Had last meal/caffeine on time", type: "check" },
      { id: "cave", label: "Did room check", type: "check" },
      { id: "download", label: "Did brain dump", type: "check" },
      { id: "breathing", label: "Did breathing exercise", type: "check" },
      { id: "in_bed", label: "In bed at target time", type: "check" },
      { id: "no_phone", label: "No phone in bed", type: "check" }
    ],
    tips: {
      default: "Routine creates predictability. Predictability creates safety. Safety creates sleep."
    }
  },
  7: {
    title: "The Lock-In",
    concept: "Review your progress and pick the 3 habits that made the biggest difference to keep forever.",
    checklist: [
      { id: "review", label: "Reviewed my sleep log and stats", type: "check" },
      { id: "top_3", label: "Identified my top 3 habits to keep", type: "check" },
      { id: "reminders", label: "Set reminders for those habits", type: "check" },
      { id: "next_steps", label: "Decided about next steps", type: "check" }
    ],
    tips: {
      default: "You've built the foundation. Now it's about consistency, not perfection. Keep going."
    }
  }
};

export default function Night() {
  const [, params] = useRoute("/night/:id");
  const [, setLocation] = useLocation();
  const userId = useUserId();
  const queryClient = useQueryClient();
  
  const nightId = parseInt(params?.id || "1", 10);
  const content = NIGHT_CONTENT[nightId as keyof typeof NIGHT_CONTENT] || NIGHT_CONTENT[1];

  const { data: user } = useGetUser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId || "") },
  });

  const { data: completions } = useListNightCompletions(userId || "", {
    query: { enabled: !!userId, queryKey: getListNightCompletionsQueryKey(userId || "") },
  });

  const updateCompletion = useUpdateNightCompletion();
  
  const currentCompletion = completions?.find(c => c.nightNumber === nightId);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (currentCompletion) {
      const checked: Record<string, boolean> = {};
      currentCompletion.checklistItems.forEach(item => {
        checked[item.key] = item.checked;
      });
      setCheckedItems(checked);
    }
  }, [currentCompletion]);

  const allChecked = content.checklist.every(item => checkedItems[item.id]);

  const handleCheck = async (id: string, checked: boolean) => {
    const newChecked = { ...checkedItems, [id]: checked };
    setCheckedItems(newChecked);

    if (userId) {
      const items = Object.entries(newChecked).map(([key, val]) => ({ key, checked: val }));
      await updateCompletion.mutateAsync({
        userId,
        nightNumber: nightId,
        data: { checklistItems: items, completed: content.checklist.every(i => newChecked[i.id]) }
      });
      queryClient.invalidateQueries({ queryKey: getListNightCompletionsQueryKey(userId) });
    }
  };

  const handleComplete = () => {
    setShowCelebration(true);
    setTimeout(() => {
      setLocation("/dashboard");
    }, 2000);
  };

  const sleepProfile = user?.sleepProfileType || "unknown";
  const tip = (content.tips as Record<string, string>)[sleepProfile] || (content.tips as Record<string, string>)["default"] || "Keep going.";

  return (
    <div className="p-6 space-y-8 pb-32 relative">
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-card p-8 rounded-3xl text-center space-y-4 border border-primary/30 shadow-2xl">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-2xl font-serif">Night {nightId} Complete</h2>
              <p className="text-muted-foreground">Great job. See you tomorrow.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Video placeholder */}
      <div className="aspect-video bg-card border border-card-border rounded-2xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        <div className="flex flex-col items-center space-y-3 z-10">
          <PlayCircle className="w-12 h-12 text-primary" />
          <span className="text-sm font-medium">Gabrielle's message for Night {nightId}</span>
        </div>
      </div>

      {/* 2. Text Summary */}
      <div className="space-y-4">
        <h2 className="text-2xl font-serif">{content.title}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {content.concept}
        </p>
      </div>

      {/* 3. Tonight's Mission */}
      <div className={cn(
        "rounded-3xl p-6 space-y-6 transition-all duration-500",
        allChecked ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-transparent"
      )}>
        <h3 className="text-lg font-medium flex items-center gap-2">
          Tonight's Mission
          {allChecked && <CheckCircle2 className="w-5 h-5 text-primary" />}
        </h3>
        
        <div className="space-y-5">
          {content.checklist.map(item => (
            <div key={item.id} className="flex flex-col space-y-2">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id={item.id} 
                  checked={!!checkedItems[item.id]} 
                  onCheckedChange={(c) => handleCheck(item.id, !!c)}
                  className="mt-1"
                />
                <Label htmlFor={item.id} className="leading-snug text-sm cursor-pointer">{item.label}</Label>
              </div>
              {item.type === "time" && (
                <div className="pl-7">
                  <Input 
                    type="time" 
                    className="w-32 bg-background border-border text-sm h-9" 
                    value={textValues[item.id] || ""} 
                    onChange={(e) => setTextValues({ ...textValues, [item.id]: e.target.value })}
                  />
                </div>
              )}
              {item.type === "text" && (
                <div className="pl-7">
                  <Input 
                    type="text" 
                    placeholder="E.g. Read a book"
                    className="w-full bg-background border-border text-sm h-9" 
                    value={textValues[item.id] || ""} 
                    onChange={(e) => setTextValues({ ...textValues, [item.id]: e.target.value })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {allChecked && (
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
            onClick={handleComplete}
          >
            Night {nightId} Complete ✓
          </Button>
        )}
      </div>

      {/* 4. Quick Tip */}
      <div className="bg-card rounded-2xl p-5 border border-card-border space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Quick Tip</span>
        <p className="text-sm text-muted-foreground italic">"{tip}"</p>
      </div>

      {/* 5. Tonight's Audio */}
      <div className="bg-secondary/30 rounded-2xl p-5 border border-secondary flex flex-col items-center text-center space-y-3 opacity-80">
        <span className="text-xs bg-background px-2 py-1 rounded flex items-center gap-1 text-muted-foreground">
          <Lock className="w-3 h-3" /> Locked
        </span>
        <h4 className="font-medium">Deep Sleep Audio Protocol</h4>
        <p className="text-xs text-muted-foreground">Upgrade to unlock guided audio sessions.</p>
        <Button variant="outline" size="sm" className="w-full mt-2" disabled>Unlock Audio</Button>
      </div>
    </div>
  );
}
