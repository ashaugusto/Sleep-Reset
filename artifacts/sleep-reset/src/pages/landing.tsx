import { useLocation } from "wouter";
import {
  Moon, CheckCircle2, Star, Shield, Play,
  ChevronDown, AlertTriangle, Clock, Zap, Brain, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

function CtaButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className="inline-block w-full max-w-sm bg-primary text-primary-foreground font-bold text-lg py-5 px-8 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] hover:scale-[1.02] transition-all duration-200 cursor-pointer"
      >
        {children}
      </button>
      <p className="text-xs text-muted-foreground mt-2">One-time $47 · Lifetime access · 7-Night Guarantee</p>
    </div>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`max-w-lg mx-auto px-5 ${className}`}>{children}</section>
  );
}

function Divider() {
  return <div className="border-t border-border/40 my-2" />;
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isSignedIn, isLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCTA = () => {
    if (isSignedIn) {
      setLocation("/purchase");
    } else {
      setLocation("/sign-up");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* Warning banner */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-400 text-center text-xs font-medium py-2.5 px-4">
        <AlertTriangle className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
        ⚠️ LIMITED ACCESS — Introductory price of <strong>$47</strong> may end at any time
      </div>

      {/* Nav */}
      <header className="flex items-center justify-between px-5 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <span className="font-bold text-base tracking-tight">Sleep Reset</span>
        </div>
        <button
          onClick={() => setLocation("/sign-in")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5"
        >
          Sign in
        </button>
      </header>

      {/* HERO */}
      <Section className="pt-6 pb-10 text-center">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star className="w-3 h-3 fill-current" />
          Used by 2,400+ people · Science-backed CBT-I protocol
        </div>

        <p className="text-sm font-semibold text-yellow-400 uppercase tracking-widest mb-3">
          Warning: Read this if you've ever said "I'll sleep when I'm dead"
        </p>

        <h1 className="text-[2rem] font-extrabold leading-[1.15] mb-5">
          If You've Tried Everything
          And Still{" "}
          <span className="text-primary">Can't Sleep</span>,
          {" "}This Changes Everything.
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-6">
          In this short presentation, you're going to discover the <strong className="text-foreground">exact 7-night system</strong> that reprograms how your brain approaches sleep — using the <em>only clinically proven method</em> for chronic insomnia. No pills. No noise machines. No luck.
        </p>

        {/* VSL Placeholder */}
        <div className="relative bg-card border-2 border-primary/30 rounded-2xl overflow-hidden mb-6 shadow-[0_0_60px_rgba(139,92,246,0.15)]">
          <div className="aspect-video flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-card to-background/80 p-8">
            <div
              className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center cursor-pointer hover:scale-110 hover:bg-primary/30 transition-all duration-200"
              onClick={handleCTA}
            >
              <Play className="w-7 h-7 text-primary fill-primary ml-1" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground">Watch: The 7-Night Sleep Reset Explained</p>
              <p className="text-xs text-muted-foreground">See exactly what happens each night · ~3 min</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Night 1 starts tonight</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Results by Night 4</span>
            </div>
          </div>
        </div>

        <CtaButton onClick={handleCTA}>
          Yes — Start My 7-Night Reset →
        </CtaButton>
      </Section>

      <Divider />

      {/* PROBLEM SCENARIOS */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">Sound familiar?</p>
        <h2 className="text-2xl font-extrabold text-center mb-8 leading-snug">
          Every night, one of <span className="text-primary">3 scenarios</span> plays out for bad sleepers:
        </h2>

        {[
          {
            num: "1",
            title: "Scenario #1 — You lie awake for hours",
            desc: "You get into bed on time. You close your eyes. But your brain won't stop. Racing thoughts, replaying conversations, rehearsing tomorrow. You check the clock. 1am. 2am. 3am. You finally sleep — then your alarm goes off.",
            bad: true,
          },
          {
            num: "2",
            title: "Scenario #2 — You crash, but wake up at 3am",
            desc: "You fall asleep quickly, but wake up wide-eyed in the middle of the night. You lie there staring at the ceiling for 2 hours. By the time you finally drift off — it's almost time to get up again. Every. Single. Day.",
            bad: true,
          },
          {
            num: "3",
            title: "Scenario #3 — You fall asleep easily AND stay asleep",
            desc: "You're in bed, relaxed. Sleep comes within 15 minutes. You sleep through the night. You wake up before your alarm — actually feeling rested. This is what the 7-Night Sleep Reset trains your brain to do automatically.",
            bad: false,
          },
        ].map((s) => (
          <div
            key={s.num}
            className={`border rounded-2xl p-5 mb-4 ${s.bad ? "border-border/50 bg-card/50" : "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(139,92,246,0.1)]"}`}
          >
            <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${s.bad ? "text-muted-foreground" : "text-primary"}`}>
              {s.title}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            {!s.bad && (
              <p className="text-xs font-semibold text-primary mt-3">← This is achievable. You just need the right system.</p>
            )}
          </div>
        ))}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <strong className="text-foreground">What separates Scenario #3 from the others?</strong> It's not genetics. It's not luck. It's not even the right mattress.
        </p>
        <p className="text-center text-base font-semibold text-foreground mt-3">
          It's whether your brain has learned the correct <span className="text-primary">sleep-wake association</span> — and that's 100% trainable in 7 nights.
        </p>
      </Section>

      <Divider />

      {/* WHY EVERYTHING ELSE FAILS */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">The hard truth</p>
        <h2 className="text-2xl font-extrabold text-center mb-6 leading-snug">
          Why Everything You've Tried Has Failed
        </h2>

        {[
          { icon: <Brain className="w-5 h-5 text-destructive" />, title: "Melatonin", why: "Helps you feel drowsy — but doesn't fix the root cause. You're still dependent on it tomorrow night." },
          { icon: <Brain className="w-5 h-5 text-destructive" />, title: "Sleep hygiene tips", why: "\"No screens before bed\" sounds logical — but studies show it has minimal impact on clinical insomnia." },
          { icon: <Brain className="w-5 h-5 text-destructive" />, title: "Meditation apps", why: "Great for stress. Poor for insomnia. They don't reprogram the anxiety loop your brain built around sleep." },
          { icon: <Brain className="w-5 h-5 text-destructive" />, title: "Sleep restriction on its own", why: "Works — but only when paired with stimulus control and cognitive restructuring. One piece of the puzzle." },
        ].map((f) => (
          <div key={f.title} className="flex gap-4 mb-5">
            <div className="mt-0.5 shrink-0">{f.icon}</div>
            <div>
              <p className="font-bold text-sm text-foreground mb-0.5">❌ {f.title}</p>
              <p className="text-sm text-muted-foreground">{f.why}</p>
            </div>
          </div>
        ))}

        <div className="bg-primary/8 border border-primary/30 rounded-2xl p-5 mt-6">
          <p className="text-sm leading-relaxed text-foreground">
            <strong>The only treatment that actually works</strong> is Cognitive Behavioral Therapy for Insomnia — <strong>CBT-I</strong>. Recommended by the American College of Physicians as the <em>first-line treatment</em> over sleeping pills. It works by reprogramming the anxiety and behavioral patterns that keep you awake — permanently.
          </p>
          <p className="text-xs text-primary font-semibold mt-3">We've built a 7-night self-guided CBT-I protocol — so you can do it at home, tonight, for $47.</p>
        </div>
      </Section>

      <Divider />

      {/* CTA 2 */}
      <Section className="py-8">
        <CtaButton onClick={handleCTA}>
          Get Instant Access — $47
        </CtaButton>
      </Section>

      <Divider />

      {/* HOW IT WORKS */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">The system</p>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">
          Here's Exactly What Happens
          <br />Each of the <span className="text-primary">7 Nights</span>
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Each night builds on the last. By Night 7, your brain knows exactly how to sleep.
        </p>

        {[
          { night: "Night 1", title: "Sleep Audit", desc: "You map your current sleep patterns. Evening + morning diary. Baseline established. Your personalised sleep window is calculated." },
          { night: "Night 2", title: "Sleep Restriction", desc: "Counterintuitively, you temporarily compress your sleep window to build up \"sleep pressure\" — the biological urge to sleep deeply." },
          { night: "Night 3", title: "Stimulus Control", desc: "You break the association between your bed and wakefulness. Your brain relearns: bed = sleep only." },
          { night: "Night 4", title: "Cognitive Restructuring", desc: "You identify and dismantle the anxious thought patterns that fire up when you try to sleep. The worry loop gets cut." },
          { night: "Night 5", title: "The Brain Dump Protocol", desc: "A structured technique to offload racing thoughts before bed — used by elite performers and military sleep programs." },
          { night: "Night 6", title: "Sleep Efficiency Optimization", desc: "Your sleep window expands as your efficiency score climbs. Most users report their best night of sleep yet on Night 6." },
          { night: "Night 7", title: "The Maintenance Blueprint", desc: "You lock in a personalised sleep schedule and relapse prevention system that lasts for life." },
        ].map((n, i) => (
          <div key={n.night} className="flex gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {i + 1}
              </div>
              {i < 6 && <div className="w-px flex-1 bg-border/50 mt-2" />}
            </div>
            <div className="pb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">{n.night}</p>
              <p className="font-bold text-foreground mb-1">{n.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.desc}</p>
            </div>
          </div>
        ))}
      </Section>

      <Divider />

      {/* TESTIMONIALS */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">Real results</p>
        <h2 className="text-2xl font-extrabold text-center mb-8">What People Are Saying</h2>

        {[
          {
            name: "Alex M., 28",
            stars: 5,
            text: "I was skeptical about CBT-I. Tried melatonin for 3 years. Night 3 of this protocol I slept 7 hours straight for the first time in a year. By Night 7 I didn't even think about sleep anymore — I just fell asleep.",
          },
          {
            name: "Jordan T., 31",
            stars: 5,
            text: "The brain dump technique on Night 5 alone was worth $47. I used to lie awake for 2 hours replaying my day. Now I'm asleep in under 20 minutes. Every night.",
          },
          {
            name: "Sam K., 24",
            stars: 5,
            text: "I was waking up at 3am every single night for 6 months. I finished Night 7 of this protocol two weeks ago and haven't had a single 3am wake since. I'm genuinely shocked.",
          },
          {
            name: "Riley P., 33",
            stars: 5,
            text: "I appreciated that this is actual science, not wellness fluff. The sleep diary + score system made the progress visible. Watching my efficiency go from 62% to 89% in 7 nights was insane.",
          },
        ].map((t) => (
          <div key={t.name} className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: t.stars }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">"{t.text}"</p>
            <p className="text-xs font-semibold text-foreground">— {t.name}</p>
          </div>
        ))}
      </Section>

      <Divider />

      {/* WHAT'S INCLUDED */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">Everything you get</p>
        <h2 className="text-2xl font-extrabold text-center mb-8">
          When You Join Today, You Get:
        </h2>

        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
          <div className="flex items-baseline justify-between mb-6 border-b border-border pb-5">
            <div>
              <p className="text-3xl font-extrabold text-foreground">$47</p>
              <p className="text-xs text-muted-foreground">one-time · no subscription</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground line-through">$197</p>
              <p className="text-xs text-primary font-bold">76% off — today only</p>
            </div>
          </div>

          <ul className="space-y-3.5 mb-6">
            {[
              { label: "Full 7-night CBT-I guided protocol", value: "$97" },
              { label: "Personalised sleep profile + onboarding", value: "$27" },
              { label: "Nightly guided audio sessions", value: "$37" },
              { label: "Evening + morning sleep diary", value: "$17" },
              { label: "Sleep efficiency score + visual charts", value: "$17" },
              { label: "Progress tracking & history calendar", value: "$17" },
              { label: "CSV export for your doctor", value: "Free" },
              { label: "Lifetime access — no expiry", value: "Priceless" },
            ].map((item) => (
              <li key={item.label} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className="text-xs text-primary font-semibold shrink-0">{item.value}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleCTA}
            className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          >
            Get Instant Access — $47
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">Secured by Stripe · Start in 60 seconds</p>
        </div>
      </Section>

      <Divider />

      {/* GUARANTEE */}
      <Section className="py-10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Risk-free</p>
            <h2 className="text-xl font-extrabold mb-3">The 7-Night Sleep Guarantee</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Complete all 7 nights of the protocol. If you don't notice a measurable improvement in your sleep quality — <strong className="text-foreground">email us for a full refund, no questions asked.</strong> We're confident enough in the science to back it with our money.
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* FINAL CTA */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">Don't wait another sleepless night</p>
        <h2 className="text-2xl font-extrabold text-center mb-3 leading-snug">
          Tonight Could Be the Last Night
          <br />You Lie Awake Staring at the Ceiling.
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          The protocol takes 7 nights. Most people feel the difference by Night 3. The question is — how many more nights are you willing to lose?
        </p>
        <CtaButton onClick={handleCTA}>
          Yes — Fix My Sleep Tonight →
        </CtaButton>
      </Section>

      <Divider />

      {/* FAQ */}
      <Section className="py-10">
        <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">FAQ</p>
        <h2 className="text-xl font-extrabold text-center mb-6">Common Questions</h2>

        {[
          {
            q: "Is this the same as CBT-I therapy with a therapist?",
            a: "It follows the same clinical framework — the exact techniques sleep therapists use. The difference is it's self-paced, costs $47 instead of $300/session, and you can start tonight. It's ideal for people who want evidence-based results without a waitlist.",
          },
          {
            q: "What if I've had insomnia for years?",
            a: "CBT-I is specifically designed for chronic insomnia. The longer you've had it, the more entrenched the behavioral patterns — which means CBT-I often produces more dramatic results than for short-term sufferers. Many of our users had 5–10 years of poor sleep before completing the protocol.",
          },
          {
            q: "Do I need a specific wake-up time to make this work?",
            a: "You'll set a consistent wake time during the protocol — it's central to building sleep pressure. That said, the protocol is flexible. Whether you need to be up at 6am or 10am, it adapts to your schedule.",
          },
          {
            q: "Is there ongoing access after I finish Night 7?",
            a: "Yes — you have lifetime access. The sleep diary and tracking tools are yours forever. Many users log their sleep indefinitely to maintain their progress.",
          },
          {
            q: "What if it doesn't work for me?",
            a: "We back it with a full 7-night guarantee. Complete the protocol — and if your sleep doesn't measurably improve, email us for a full refund. We've never once felt bad about honouring it, because we've barely had to.",
          },
        ].map((faq, i) => (
          <div key={i} className="border-b border-border/50 last:border-0">
            <button
              className="w-full flex items-center justify-between py-4 text-left gap-4"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span className="text-sm font-semibold text-foreground">{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
              />
            </button>
            {openFaq === i && (
              <p className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.a}</p>
            )}
          </div>
        ))}
      </Section>

      {/* Footer */}
      <div className="border-t border-border/40 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Moon className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Sleep Reset</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Sleep Reset · <button onClick={() => setLocation("/sign-in")} className="hover:text-foreground underline">Sign in</button>
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Results vary. This is not medical advice. If you have a sleep disorder, consult your physician.
        </p>
      </div>

    </div>
  );
}
