import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useClerkUser } from "@/hooks/use-clerk-user";
import { useUpdateSleepProfile } from "@workspace/api-client-react";
import { SLEEP_TYPES, SleepTypeId } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const DISRUPTOR_OPTIONS = [
  { id: "racing_thoughts", label: "Racing thoughts" },
  { id: "work_stress", label: "Work stress" },
  { id: "partying_alcohol", label: "Partying & alcohol" },
  { id: "anxiety", label: "Anxiety" },
  { id: "phone_screens", label: "Phone & screens" },
  { id: "unknown", label: "I don't know" },
] as const;

const FREQUENCY_OPTIONS = [
  { id: "every_night", label: "Every night" },
  { id: "most_nights", label: "Most nights (4–6x/week)" },
  { id: "few_times_week", label: "A few times a week" },
  { id: "weekends_mostly", label: "Mostly on weekends" },
] as const;

const SOLUTION_OPTIONS = [
  "Melatonin", "Meditation apps", "White noise", "Sleep podcasts",
  "Alcohol", "Herbal teas", "Limiting caffeine", "Nothing works"
];

function formatTime(minutes: number) {
  const totalMins = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { userId } = useClerkUser();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState<string>("");
  const [q3, setQ3] = useState<number>(1380);
  const [q4, setQ4] = useState<number>(420);
  const [q5, setQ5] = useState<string[]>([]);

  const updateProfile = useUpdateSleepProfile();

  const deriveSleepProfileType = (disruptor: string): SleepTypeId => {
    if (disruptor in SLEEP_TYPES) return disruptor as SleepTypeId;
    return "unknown";
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleSolution = (sol: string) => {
    setQ5(prev => prev.includes(sol) ? prev.filter(s => s !== sol) : [...prev, sol]);
  };

  const handleComplete = async () => {
    if (!userId) return;
    setSubmitting(true);
    setError(null);

    try {
      await updateProfile.mutateAsync({
        userId,
        data: {
          sleepDisruptorPrimary: q1 as "racing_thoughts" | "work_stress" | "partying_alcohol" | "anxiety" | "phone_screens" | "unknown",
          sleepDisruptorFrequency: q2 as "every_night" | "most_nights" | "few_times_week" | "weekends_mostly",
          usualBedtimeMinutes: q3,
          neededWakeUpMinutes: q4,
          triedSolutions: q5,
          sleepProfileType: deriveSleepProfileType(q1),
        },
      });

      setLocation("/dashboard");
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const profileType = deriveSleepProfileType(q1);
  const currentSleepType = SLEEP_TYPES[profileType];

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col px-6 py-12 relative overflow-hidden">
      <AnimatePresence mode="wait">

        {step === 1 && (
          <motion.div key="welcome" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-serif text-primary">You made it.</h1>
              <p className="text-lg text-muted-foreground max-w-sm leading-relaxed">
                Let's fix your nights — starting tonight. This takes 2 minutes.
              </p>
            </div>
            <Button size="lg" className="w-full max-w-xs mt-8" onClick={handleNext}>
              Let's go
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="q1" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col space-y-8">
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Question 1 of 5</p>
              <h2 className="text-2xl font-serif">What usually keeps you up at night?</h2>
            </div>
            <RadioGroup value={q1} onValueChange={setQ1} className="space-y-3 flex-1">
              {DISRUPTOR_OPTIONS.map(opt => (
                <div key={opt.id} className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${q1 === opt.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <RadioGroupItem value={opt.id} id={`q1-${opt.id}`} />
                  <Label htmlFor={`q1-${opt.id}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button size="lg" className="w-full" disabled={!q1} onClick={handleNext}>
              Continue
            </Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="q2" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col space-y-8">
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Question 2 of 5</p>
              <h2 className="text-2xl font-serif">How often does this happen?</h2>
            </div>
            <RadioGroup value={q2} onValueChange={setQ2} className="space-y-3 flex-1">
              {FREQUENCY_OPTIONS.map(opt => (
                <div key={opt.id} className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer transition-colors ${q2 === opt.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <RadioGroupItem value={opt.id} id={`q2-${opt.id}`} />
                  <Label htmlFor={`q2-${opt.id}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleBack}>Back</Button>
              <Button className="flex-1" disabled={!q2} onClick={handleNext}>Continue</Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="q3" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col space-y-8">
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Question 3 of 5</p>
              <h2 className="text-2xl font-serif">What time do you usually go to bed?</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className="text-center">
                <p className="text-5xl font-serif text-primary">{formatTime(q3)}</p>
                <p className="text-sm text-muted-foreground mt-2">Drag to set your usual bedtime</p>
              </div>
              <Slider
                min={840}
                max={1560}
                step={15}
                value={[q3]}
                onValueChange={([v]) => setQ3(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2:00 PM</span>
                <span>2:00 AM</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleBack}>Back</Button>
              <Button className="flex-1" onClick={handleNext}>Continue</Button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="q4" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col space-y-8">
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Question 4 of 5</p>
              <h2 className="text-2xl font-serif">When do you need to wake up?</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className="text-center">
                <p className="text-5xl font-serif text-primary">{formatTime(q4)}</p>
                <p className="text-sm text-muted-foreground mt-2">Your target wake-up time</p>
              </div>
              <Slider
                min={240}
                max={720}
                step={15}
                value={[q4]}
                onValueChange={([v]) => setQ4(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>4:00 AM</span>
                <span>12:00 PM</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleBack}>Back</Button>
              <Button className="flex-1" onClick={handleNext}>Continue</Button>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="q5" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col space-y-8">
            <div className="space-y-2">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Question 5 of 5</p>
              <h2 className="text-2xl font-serif">What have you tried so far?</h2>
              <p className="text-sm text-muted-foreground">Select all that apply</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 content-start">
              {SOLUTION_OPTIONS.map(sol => {
                const checked = q5.includes(sol);
                return (
                  <button
                    key={sol}
                    type="button"
                    onClick={() => toggleSolution(sol)}
                    className={`flex items-center gap-3 border p-3 rounded-xl text-left text-sm transition-colors ${checked ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    {sol}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleBack}>Back</Button>
              <Button className="flex-1" onClick={handleNext}>Continue</Button>
            </div>
          </motion.div>
        )}

        {step === 7 && (
          <motion.div key="reveal" variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col justify-center space-y-8">
            <div className="bg-card border border-card-border p-8 rounded-2xl text-center space-y-6 shadow-2xl">
              <p className="text-sm text-primary font-medium tracking-wider uppercase">Your Sleep Profile</p>
              <h2 className="text-3xl font-serif text-foreground">{currentSleepType.name}</h2>
              <p className="text-muted-foreground leading-relaxed">{currentSleepType.description}</p>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button
              size="lg"
              className="w-full"
              onClick={handleComplete}
              disabled={submitting}
            >
              {submitting ? "Setting up..." : "Start Night 1 →"}
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
