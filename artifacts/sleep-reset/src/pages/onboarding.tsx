import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/hooks/use-user-id";
import { useCreateUser, useUpdateSleepProfile } from "@workspace/api-client-react";
import { SLEEP_TYPES, SleepTypeId } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const userId = useUserId();
  const [step, setStep] = useState(1);

  // Form state
  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState<string>("");
  const [q3, setQ3] = useState<number>(1380); // 23:00
  const [q4, setQ4] = useState<number>(420); // 07:00
  const [q5, setQ5] = useState<string[]>([]);

  const createUser = useCreateUser();
  const updateProfile = useUpdateSleepProfile();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleComplete = async () => {
    if (!userId) return;

    // Create user
    try {
      await createUser.mutateAsync({
        data: { email: `user-${userId}@example.com` },
      });

      // Update profile
      await updateProfile.mutateAsync({
        userId,
        data: {
          sleepDisruptorPrimary: q1 as any,
          sleepDisruptorFrequency: q2 as any,
          usualBedtimeMinutes: q3,
          neededWakeUpMinutes: q4,
          triedSolutions: q5,
          sleepProfileType: q1 || "unknown", // simplified
        },
      });

      setLocation("/dashboard");
    } catch (e) {
      console.error(e);
      // Even if it fails, maybe redirect?
      setLocation("/dashboard");
    }
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const currentSleepType = SLEEP_TYPES[(q1 as SleepTypeId) || "unknown"];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col px-6 py-12 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center items-center text-center space-y-8"
          >
            <h1 className="text-3xl font-serif text-primary">You made it.</h1>
            <p className="text-lg text-muted-foreground max-w-sm">
              Let's fix your nights — starting tonight.
            </p>
            <Button size="lg" className="w-full max-w-xs mt-8" onClick={handleNext}>
              Let's go
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col space-y-8"
          >
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Step 1 of 5</p>
              <h2 className="text-2xl font-serif">What usually keeps you up at night?</h2>
            </div>
            
            <RadioGroup value={q1} onValueChange={setQ1} className="space-y-3">
              {[
                { id: "racing_thoughts", label: "Racing thoughts" },
                { id: "work_stress", label: "Work stress" },
                { id: "partying_alcohol", label: "Partying & alcohol" },
                { id: "anxiety", label: "Anxiety" },
                { id: "phone_screens", label: "Phone & screens" },
                { id: "unknown", label: "I don't know" },
              ].map((opt) => (
                <div key={opt.id} className="flex items-center space-x-3 border border-border p-4 rounded-xl">
                  <RadioGroupItem value={opt.id} id={`q1-${opt.id}`} />
                  <Label htmlFor={`q1-${opt.id}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>

            <Button size="lg" className="w-full mt-auto" disabled={!q1} onClick={handleNext}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col justify-center space-y-8"
          >
            <div className="bg-card border border-card-border p-8 rounded-2xl text-center space-y-6 shadow-2xl">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Your Sleep Profile</p>
              <h2 className="text-3xl font-serif text-foreground">{currentSleepType.name}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {currentSleepType.description}
              </p>
            </div>
            
            <Button size="lg" className="w-full" onClick={handleComplete}>
              Start Night 1 →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
