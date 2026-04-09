import { useLocation } from "wouter";
import { Moon, CheckCircle2, Headphones, BarChart2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isSignedIn, isLoading } = useAuth();

  const handleCTA = () => {
    if (isSignedIn) {
      setLocation("/purchase");
    } else {
      setLocation("/sign-up");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <Moon className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg">Sleep Reset</span>
        </div>
        <button
          onClick={() => setLocation("/sign-in")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </button>
      </header>

      <main className="max-w-lg mx-auto px-6 pb-16">
        <section className="pt-12 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Star className="w-3 h-3 fill-current" />
            Science-backed sleep protocol
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Sleep better in<br />
            <span className="text-primary">7 nights</span>, guaranteed.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            A structured program using CBT-I principles to reset your sleep — no pills, no gimmicks. Just proven techniques that work.
          </p>
          <Button
            onClick={handleCTA}
            disabled={isLoading}
            className="w-full max-w-xs text-base py-6 font-semibold"
            size="lg"
          >
            Start your reset — $47
          </Button>
          <p className="text-xs text-muted-foreground mt-3">One-time payment · Lifetime access</p>
        </section>

        <section className="space-y-4 mb-12">
          {[
            {
              icon: <Moon className="w-5 h-5 text-primary" />,
              title: "7-night guided program",
              desc: "Each night builds on the last with a focused concept, checklist, and guided audio session.",
            },
            {
              icon: <Headphones className="w-5 h-5 text-primary" />,
              title: "Guided audio sessions",
              desc: "Expert-crafted audio guides for each night — from sleep restriction to stimulus control.",
            },
            {
              icon: <BarChart2 className="w-5 h-5 text-primary" />,
              title: "Sleep diary + analytics",
              desc: "Track sleep latency, efficiency, and quality with morning check-ins and visual charts.",
            },
            {
              icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
              title: "Personalised to you",
              desc: "5-question onboarding tailors the program to your specific sleep challenges.",
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
              <div className="mt-0.5">{f.icon}</div>
              <div>
                <p className="font-semibold text-sm mb-1">{f.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-center">What's included</h2>
          <ul className="space-y-3">
            {[
              "7 progressive nights with science-backed techniques",
              "Guided audio for each session",
              "Evening + morning sleep diary",
              "Progress charts & sleep efficiency score",
              "History calendar with CSV export",
              "Personalised sleep profile",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="text-center">
          <Button
            onClick={handleCTA}
            disabled={isLoading}
            className="w-full max-w-xs text-base py-6 font-semibold"
            size="lg"
          >
            Get started — $47
          </Button>
          <p className="text-xs text-muted-foreground mt-3">One-time payment · No subscription</p>
        </div>
      </main>
    </div>
  );
}
