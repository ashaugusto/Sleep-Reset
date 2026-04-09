import { useLocation } from "wouter";
import {
  Moon, CheckCircle2, Star, Shield, Play,
  ChevronDown, AlertTriangle, Clock, Zap, X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

// ─────────────────────────────────────────────────
// 🎬 VSL VIDEO — paste your YouTube or Vimeo embed
//    URL below, then delete the placeholder block.
//
//    YouTube:  https://www.youtube.com/embed/VIDEO_ID
//    Vimeo:    https://player.vimeo.com/video/VIDEO_ID
//
//    Leave as empty string "" to show placeholder.
// ─────────────────────────────────────────────────
const VSL_URL = "";

// ─────────────────────────────────────────────────
// Images — generated for this niche. Swap any path
// with your own image if needed.
// ─────────────────────────────────────────────────
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const IMG = {
  awake:     `${base}/images/sleep-awake-3am.png`,
  peaceful:  `${base}/images/sleep-peaceful.png`,
  refreshed: `${base}/images/sleep-wakeup-refreshed.png`,
  science:   `${base}/images/sleep-brain-science.png`,
  journal:   `${base}/images/sleep-journal.png`,
};

// ─────────────────────────────────────────────────
// Reusable components
// ─────────────────────────────────────────────────
function CtaButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className="inline-block w-full max-w-sm bg-primary text-primary-foreground font-bold text-lg py-5 px-8 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer"
      >
        {children}
      </button>
      <p className="text-xs text-muted-foreground mt-2">One-time $47 · Lifetime access · 7-Night Guarantee</p>
    </div>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-lg mx-auto px-5 ${className}`}>{children}</section>;
}

function Divider() {
  return <div className="border-t border-border/30 my-1" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">{children}</p>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────
export default function Landing() {
  const [, setLocation] = useLocation();
  const { isSignedIn, isLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCTA = () => {
    if (isSignedIn) setLocation("/purchase");
    else setLocation("/sign-up");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* ── Warning banner ── */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-400 text-center text-xs font-semibold py-2.5 px-4">
        <AlertTriangle className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
        LIMITED ACCESS — Introductory price of <strong>$47</strong> may end at any time
      </div>

      {/* ── Nav ── */}
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

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <Section className="pt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star className="w-3 h-3 fill-current" />
          Used by 2,400+ people · Science-backed CBT-I protocol
        </div>

        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">
          Read this if you've tried everything and still can't sleep
        </p>

        <h1 className="text-[2rem] font-extrabold leading-[1.15] mb-5">
          The Only Proven System That{" "}
          <span className="text-primary">Permanently Resets</span>{" "}
          How Your Brain Sleeps — In 7 Nights.
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-7">
          No pills. No noise machines. No luck. Just the{" "}
          <strong className="text-foreground">clinically-proven CBT-I protocol</strong>{" "}
          — the only insomnia treatment recommended by the American College of Physicians over sleeping pills — now available as a self-guided 7-night program.
        </p>

        {/* ── VSL Block ── */}
        <div className="relative rounded-2xl overflow-hidden mb-7 border-2 border-primary/30 shadow-[0_0_60px_rgba(139,92,246,0.18)] bg-card">
          {VSL_URL ? (
            /* ✅ Real video — shows when VSL_URL is filled in */
            <div className="aspect-video">
              <iframe
                src={VSL_URL}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="7-Night Sleep Reset — Watch this first"
              />
            </div>
          ) : (
            /* 🎬 Placeholder — remove when VSL_URL is set */
            <div className="aspect-video flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-card to-background/60 px-8">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center">
                <Play className="w-7 h-7 text-primary fill-primary ml-1" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-bold text-foreground">Your Video Goes Here</p>
                <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                  Set <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-[10px]">VSL_URL</code> at the top of{" "}
                  <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-[10px]">landing.tsx</code> to embed your video
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Night 1 starts tonight</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Results by Night 4</span>
              </div>
            </div>
          )}
        </div>

        <CtaButton onClick={handleCTA}>
          Yes — Start My 7-Night Reset →
        </CtaButton>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          PROBLEM IMAGE (3am scene)
      ════════════════════════════════════ */}
      <Section className="py-8">
        <div className="rounded-2xl overflow-hidden border border-border/40">
          <img
            src={IMG.awake}
            alt="Person lying awake at 3am"
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3 italic">
          Sound familiar? You're not alone — and it's not your fault.
        </p>
      </Section>

      {/* ════════════════════════════════════
          3 SCENARIOS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Sound familiar?</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-8 leading-snug">
          Every night, one of <span className="text-primary">3 scenarios</span> plays out for bad sleepers:
        </h2>

        {[
          {
            num: "1",
            emoji: "😤",
            title: "Scenario #1 — You lie awake for hours",
            desc: "You get into bed on time. You close your eyes. But your brain won't stop. Racing thoughts, replaying conversations, rehearsing tomorrow. You check the clock. 1am. 2am. 3am. You finally sleep — then your alarm goes off.",
            bad: true,
          },
          {
            num: "2",
            emoji: "😰",
            title: "Scenario #2 — You crash, but wake at 3am",
            desc: "You fall asleep quickly — but wake up wide-eyed in the middle of the night. You lie there staring at the ceiling for 2 hours. By the time you finally drift off, it's almost time to get up again. Every. Single. Day.",
            bad: true,
          },
          {
            num: "3",
            emoji: "😴",
            title: "Scenario #3 — You fall asleep easily and stay asleep",
            desc: "You're in bed, relaxed. Sleep comes within 15 minutes. You sleep through the night. You wake up before your alarm — actually feeling rested. This is what the 7-Night Sleep Reset trains your brain to do automatically.",
            bad: false,
          },
        ].map((s) => (
          <div
            key={s.num}
            className={`border rounded-2xl p-5 mb-4 ${
              s.bad
                ? "border-border/50 bg-card/40"
                : "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(139,92,246,0.12)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.emoji}</span>
              <p className={`text-xs font-bold uppercase tracking-widest ${s.bad ? "text-muted-foreground" : "text-primary"}`}>
                {s.title}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            {!s.bad && (
              <p className="text-xs font-semibold text-primary mt-3">← This is achievable. It just takes the right system.</p>
            )}
          </div>
        ))}

        <div className="bg-card border border-border/50 rounded-2xl p-5 mt-2">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>What separates Scenario #3?</strong> It's not genetics. Not luck. Not the right mattress. It's whether your brain has learned the correct{" "}
            <span className="text-primary font-semibold">sleep-wake association</span> — and that's 100% trainable. The science is called <strong>CBT-I</strong>, and it works in 7 nights.
          </p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          WHO THIS IS FOR
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Is this for you?</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          This Program Is for You If…
        </h2>
        <div className="space-y-3 mb-6">
          {[
            "You lie awake for more than 20 minutes before falling asleep",
            "You wake up in the middle of the night and can't get back to sleep",
            "You feel exhausted during the day even after a \"full night\" in bed",
            "You've tried melatonin, apps, or white noise — and still can't sleep",
            "Stress, anxiety, or a racing mind is keeping your brain wired at night",
            "You want a permanent fix, not another temporary patch",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3.5 bg-card/50 border border-border/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary/8 border border-primary/30 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>This is NOT for you if</strong> you have an undiagnosed sleep disorder like sleep apnea or narcolepsy — those require clinical diagnosis first. If you're unsure, speak with your doctor.
          </p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          WHY EVERYTHING FAILS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>The hard truth</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">
          Why Everything You've Tried Has Failed
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-7">
          It's not because you didn't try hard enough. It's because none of it addresses the root cause.
        </p>

        <div className="rounded-2xl overflow-hidden border border-border/40 mb-7">
          <img
            src={IMG.science}
            alt="Sleep science and the brain"
            className="w-full object-cover"
            style={{ aspectRatio: "1/1", maxHeight: "260px" }}
          />
        </div>

        {[
          { title: "Melatonin", why: "Helps you feel drowsy — but doesn't fix the root cause. You're still dependent on it tomorrow night." },
          { title: "Sleep hygiene tips", why: "\"No screens before bed\" has minimal impact on clinical insomnia. It's not enough on its own." },
          { title: "Meditation apps", why: "Great for stress. Poor for insomnia. They don't reprogram the anxiety loop your brain built around sleep." },
          { title: "Alcohol", why: "Disrupts REM sleep. You fall asleep faster but sleep far worse — making the problem worse over time." },
        ].map((f) => (
          <div key={f.title} className="flex gap-3 mb-4 p-4 bg-card/50 border border-border/40 rounded-xl">
            <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-foreground mb-0.5">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.why}</p>
            </div>
          </div>
        ))}

        <div className="bg-primary/8 border border-primary/30 rounded-2xl p-5 mt-2">
          <p className="text-sm leading-relaxed text-foreground">
            <strong>The only treatment proven to work long-term</strong> is{" "}
            <span className="text-primary font-semibold">Cognitive Behavioral Therapy for Insomnia (CBT-I)</span>. Recommended by the American College of Physicians as the{" "}
            <em>first-line treatment over sleeping pills</em>. It permanently reprograms the anxiety and behavioral patterns keeping you awake.
          </p>
          <p className="text-xs text-primary font-semibold mt-3">
            We've turned the CBT-I protocol into a 7-night self-guided program — so you can do it at home, starting tonight.
          </p>
        </div>
      </Section>

      {/* ── CTA mid-page ── */}
      <Section className="py-6">
        <CtaButton onClick={handleCTA}>Get Instant Access — $47</CtaButton>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          7-NIGHT WALKTHROUGH
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>The system</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">
          Here's Exactly What Happens
          <br />Each of the <span className="text-primary">7 Nights</span>
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Each night builds on the last. By Night 7, your brain knows exactly how to sleep.
        </p>

        <div className="rounded-2xl overflow-hidden border border-border/40 mb-8">
          <img
            src={IMG.journal}
            alt="Sleep journal and routine"
            className="w-full object-cover"
            style={{ aspectRatio: "1/1", maxHeight: "260px" }}
          />
        </div>

        {[
          { title: "Sleep Audit", desc: "Map your current patterns. Evening + morning diary. Your personalised sleep window is calculated." },
          { title: "Sleep Restriction", desc: "Temporarily compress your sleep window to build up biological \"sleep pressure\" — the urge to sleep deeply." },
          { title: "Stimulus Control", desc: "Break the association between your bed and wakefulness. Your brain relearns: bed = sleep only." },
          { title: "Cognitive Restructuring", desc: "Identify and dismantle the anxious thought patterns that fire up when you try to sleep." },
          { title: "The Brain Dump Protocol", desc: "A structured technique to offload racing thoughts before bed — used by elite performers and military sleep programs." },
          { title: "Sleep Efficiency Optimization", desc: "Your window expands as efficiency climbs. Most users report their best night of sleep yet on Night 6." },
          { title: "The Maintenance Blueprint", desc: "You lock in a personalised schedule and relapse prevention plan that lasts for life." },
        ].map((n, i) => (
          <div key={n.title} className="flex gap-4 mb-5">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {i + 1}
              </div>
              {i < 6 && <div className="w-px flex-1 min-h-[20px] bg-border/50 mt-2" />}
            </div>
            <div className="pb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Night {i + 1}</p>
              <p className="font-bold text-foreground mb-1">{n.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{n.desc}</p>
            </div>
          </div>
        ))}
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Real results</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2">What People Are Saying</h2>
        <p className="text-center text-sm text-muted-foreground mb-7">
          From people who were exactly where you are now.
        </p>

        {/* Refreshed image */}
        <div className="rounded-2xl overflow-hidden border border-border/40 mb-7">
          <img
            src={IMG.refreshed}
            alt="Waking up refreshed after sleep reset"
            className="w-full object-cover"
            style={{ aspectRatio: "4/3" }}
          />
        </div>

        {[
          {
            name: "Alex M., 28",
            stars: 5,
            text: "I was skeptical about CBT-I. Tried melatonin for 3 years. Night 3 of this protocol I slept 7 hours straight for the first time in a year. By Night 7 I didn't even think about sleep — I just fell asleep.",
          },
          {
            name: "Jordan T., 31",
            stars: 5,
            text: "The brain dump technique on Night 5 alone was worth $47. I used to lie awake for 2 hours replaying my day. Now I'm asleep in under 20 minutes. Every night.",
          },
          {
            name: "Sam K., 24",
            stars: 5,
            text: "Waking up at 3am every night for 6 months. Finished Night 7 two weeks ago. Haven't had a single 3am wake since. Genuinely shocked.",
          },
          {
            name: "Riley P., 33",
            stars: 5,
            text: "Actual science, not wellness fluff. Watching my sleep efficiency go from 62% to 89% in 7 nights using the built-in tracker was insane.",
          },
        ].map((t) => (
          <div key={t.name} className="bg-card border border-border/60 rounded-2xl p-5 mb-4">
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

      {/* ════════════════════════════════════
          PRICING CARD
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Everything you get</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-6">When You Join Today</h2>

        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(139,92,246,0.1)]">
          <div className="flex items-baseline justify-between mb-6 border-b border-border pb-5">
            <div>
              <p className="text-4xl font-extrabold text-foreground">$47</p>
              <p className="text-xs text-muted-foreground mt-0.5">one-time · no subscription</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground line-through">$197</p>
              <p className="text-xs text-primary font-bold">76% off — today only</p>
            </div>
          </div>

          <ul className="space-y-3.5 mb-7">
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
                <span className="text-xs text-primary font-semibold shrink-0 mt-0.5">{item.value}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleCTA}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground font-bold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            Get Instant Access — $47
          </button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Secured by Stripe · Start in 60 seconds
          </p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          GUARANTEE
      ════════════════════════════════════ */}
      <Section className="py-8">
        {/* Peaceful sleep image */}
        <div className="rounded-2xl overflow-hidden border border-border/40 mb-7">
          <img
            src={IMG.peaceful}
            alt="Sleeping peacefully after protocol"
            className="w-full object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <SectionLabel>Zero risk</SectionLabel>
            <h2 className="text-xl font-extrabold mb-3">The 7-Night Sleep Guarantee</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Complete all 7 nights. If you don't notice a measurable improvement in your sleep quality —{" "}
              <strong className="text-foreground">email us for a full refund, no questions asked.</strong>{" "}
              We're confident enough in the science to back it with our money.
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Don't wait another sleepless night</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-3 leading-snug">
          Tonight Could Be the Last Night
          <br />You Lie Awake Staring at the Ceiling.
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-7">
          The protocol takes 7 nights. Most people feel the difference by Night 3. The question is — how many more nights are you willing to lose?
        </p>
        <CtaButton onClick={handleCTA}>
          Yes — Fix My Sleep Tonight →
        </CtaButton>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          FAQ
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="text-xl font-extrabold text-center mb-6">Common Questions</h2>

        {[
          {
            q: "Is this the same as CBT-I therapy with a therapist?",
            a: "It follows the same clinical framework — the exact techniques sleep therapists use. The difference: it's self-paced, costs $47 instead of $300/session, and you can start tonight. Ideal for people who want evidence-based results without a waitlist.",
          },
          {
            q: "What if I've had insomnia for years?",
            a: "CBT-I is specifically designed for chronic insomnia. The longer you've had it, the more entrenched the behavioral patterns — which means CBT-I often produces more dramatic results. Many users had 5–10 years of poor sleep before completing the protocol.",
          },
          {
            q: "Do I need a specific wake-up time to make this work?",
            a: "You'll set a consistent wake time during the protocol — it's central to building sleep pressure. The protocol adapts to your schedule, whether you wake at 6am or 10am.",
          },
          {
            q: "Is there ongoing access after I finish Night 7?",
            a: "Yes — lifetime access. The sleep diary and tracking tools are yours forever. Many users log their sleep indefinitely to maintain their results.",
          },
          {
            q: "What if it doesn't work for me?",
            a: "We back it with a full 7-night money-back guarantee. Complete the protocol and if your sleep doesn't measurably improve, email us for a full refund. No questions asked.",
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

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 text-center px-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Sleep Reset</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-xs text-muted-foreground">
          <button onClick={() => setLocation("/sign-in")} className="hover:text-foreground transition-colors">
            Sign in
          </button>
          <span className="text-border">·</span>
          <button onClick={() => setLocation("/privacy-policy")} className="hover:text-foreground transition-colors">
            Privacy Policy
          </button>
          <span className="text-border">·</span>
          <button onClick={() => setLocation("/terms")} className="hover:text-foreground transition-colors">
            Terms of Service
          </button>
          <span className="text-border">·</span>
          <a href="mailto:support@sleepreset.com" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Sleep Reset. All rights reserved.</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
          This program is for educational purposes only and is not a substitute for professional medical advice. Results vary. If you have a diagnosed sleep disorder, consult your physician before beginning.
        </p>
      </footer>

    </div>
  );
}
