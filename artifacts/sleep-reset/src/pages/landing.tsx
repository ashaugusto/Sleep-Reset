import { useLocation } from "wouter";
import {
  Moon, CheckCircle2, Star, Shield, Play,
  ChevronDown, AlertTriangle, Clock, Zap, X, Gift, Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { customFetch } from "@/lib/fetch";
import { useToast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────
// 🎬 VSL VIDEO — paste your YouTube or Vimeo embed
//    YouTube:  https://www.youtube.com/embed/VIDEO_ID
//    Vimeo:    https://player.vimeo.com/video/VIDEO_ID
//    Leave as "" to show placeholder.
// ─────────────────────────────────────────────────
const VSL_URL = "";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const IMG = {
  awake:     `${base}/images/sleep-awake-3am.png`,
  peaceful:  `${base}/images/sleep-peaceful.png`,
  refreshed: `${base}/images/sleep-wakeup-refreshed.png`,
  science:   `${base}/images/sleep-brain-science.png`,
  journal:   `${base}/images/sleep-journal.png`,
};

// ─── Utility: countdown to midnight ───────────────
function useMidnightCountdown() {
  function getSecondsLeft() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  }
  const [seconds, setSeconds] = useState(getSecondsLeft);
  useEffect(() => {
    const id = setInterval(() => setSeconds(getSecondsLeft()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return { h, m, s, expired: seconds === 0 };
}

// ─── Reusable layout ──────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-lg mx-auto px-5 ${className}`}>{children}</section>;
}
function Divider() {
  return <div className="border-t border-border/30 my-1" />;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">{children}</p>;
}

// ─── Countdown block ──────────────────────────────
function CountdownTimer() {
  const { h, m, s, expired } = useMidnightCountdown();
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center">
      <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">
        {expired ? "Price has increased" : "⚡ Introductory price expires at midnight"}
      </p>
      <div className="flex items-center justify-center gap-3">
        {[{ label: "HRS", val: h }, { label: "MIN", val: m }, { label: "SEC", val: s }].map(({ label, val }) => (
          <div key={label} className="text-center">
            <div className="bg-background border border-border rounded-xl w-16 py-2">
              <span className="text-2xl font-extrabold tabular-nums text-foreground">{val}</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        After this, price returns to <strong className="text-foreground">{CURRENCY}{PRICE_ORIGINAL}</strong>
      </p>
    </div>
  );
}

// ─── Brand & Pricing — single source of truth ─────
const BRAND = "Sleep Rewire";
const PRODUCT = "The Sleep Rewire Protocol";
const CURRENCY = "€";
const PRICE_TODAY = 47;
const PRICE_ORIGINAL = 197;
const PRICE_SAVINGS = PRICE_ORIGINAL - PRICE_TODAY; // 150

// ─── Bonus list ───────────────────────────────────
const BONUSES = [
  { name: "Anxiety & Sleep Masterclass", desc: "Why anxiety hijacks your sleep — and the exact neuroscience behind why the Rewire Protocol shuts it off", value: "€47" },
  { name: "Evening Wind-Down Ritual Guide", desc: "15 evidence-based habits that calm your nervous system and prime your brain for deep, unbroken sleep", value: "€27" },
  { name: "Morning Recovery Protocol", desc: "Optimise the first 30 minutes of your day to anchor your sleep-wake cycle and reduce night-time anxiety", value: "€27" },
  { name: "Sleep Efficiency Tracker Template", desc: "The same spreadsheet framework used in clinical CBT-I trials — track your progress every night", value: "€27" },
  { name: "Lifetime Access + All Future Updates", desc: "New nights, features, and research added as the protocol evolves — no extra charge, ever", value: "€27" },
];

// ─── Inline Order Form ────────────────────────────
function OrderForm({ id }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast({ title: "Please enter your email", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const r = await customFetch("/api/checkout/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || null }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({ message: "Something went wrong." }));
        toast({ title: body.message ?? "Could not start checkout", variant: "destructive" });
        return;
      }
      const { url } = await r.json();
      window.location.href = url;
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id={id} className="bg-card border-2 border-primary/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.15)]">

      {/* ── Order form header ── */}
      <div className="bg-primary px-5 py-4 text-center">
        <p className="text-sm font-extrabold text-primary-foreground uppercase tracking-wider">
          Enter your details below to get instant access
        </p>
      </div>

      {/* ── Price block — crossed out original, big current price ── */}
      <div className="px-5 pt-6 pb-5 border-b border-border/50 text-center">
        {/* Crossed-out original */}
        <p className="text-base text-muted-foreground line-through mb-1">
          Regular price: {CURRENCY}{PRICE_ORIGINAL}
        </p>
        {/* Hero price */}
        <p className="text-6xl font-extrabold text-foreground leading-none mb-2">
          {CURRENCY}<span className="text-primary">{PRICE_TODAY}</span>
        </p>
        <p className="text-sm font-bold text-foreground mb-3">One-time payment · Instant access · No subscription</p>
        {/* Savings badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
          <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
            You save {CURRENCY}{PRICE_SAVINGS} today — {Math.round((PRICE_SAVINGS / PRICE_ORIGINAL) * 100)}% off
          </span>
        </div>
      </div>

      {/* ── What's included ── */}
      <div className="px-5 py-4 border-b border-border/50 space-y-2.5">
        <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
          ✅ When you order right now, you instantly get:
        </p>
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-sm text-foreground font-semibold">Full 7-Night Rewire Protocol</span>
            <span className="text-xs text-muted-foreground ml-2">({CURRENCY}{PRICE_ORIGINAL} value)</span>
          </div>
        </div>
        {BONUSES.map((b) => (
          <div key={b.name} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-sm text-foreground font-semibold">+ {b.name}</span>
              <span className="text-xs text-muted-foreground ml-2">({b.value} value)</span>
            </div>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Total value</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground line-through">{CURRENCY}352+</span>
            <span className="text-sm font-extrabold text-primary">Your price: {CURRENCY}47</span>
          </div>
        </div>
      </div>

      {/* Form inputs */}
      <form onSubmit={handleSubmit} className="px-5 pt-5 pb-6 space-y-3">
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name (optional)"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Email Address <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your best email"
            required
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-extrabold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 mt-1"
        >
          {loading ? "Redirecting to secure checkout…" : "Yes — Give Me Instant Access →"}
        </button>

        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Secured by Stripe
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            7-Night Guarantee
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/70 text-center">
          One-time payment · No subscription · Immediate access
        </p>
      </form>
    </div>
  );
}

// ─── Warning banner (reference-page style) ────────
function WarningBanner() {
  const { expired } = useMidnightCountdown();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="bg-yellow-400 text-gray-900 text-center py-3 px-4">
      <p className="text-sm font-extrabold leading-snug">
        <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
        {expired
          ? `⚠️ WARNING: This offer has expired. Price is now ${CURRENCY}${PRICE_ORIGINAL}.`
          : `⚠️ WARNING: This page and the ${CURRENCY}${PRICE_TODAY} price may be REMOVED at Midnight on ${dateStr}.`}
      </p>
    </div>
  );
}

// ─── Scroll-to-order helper ────────────────────────
function scrollToOrder() {
  document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center">
      <button
        onClick={scrollToOrder}
        className="inline-block w-full max-w-sm bg-primary text-primary-foreground font-bold text-lg py-5 px-8 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer"
      >
        {children}
      </button>
      <p className="text-xs text-muted-foreground mt-2">One-time {CURRENCY}47 · Lifetime access · 7-Night Guarantee</p>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────
export default function Landing() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* ── WARNING banner — reference style ── */}
      <WarningBanner />

      {/* ── Minimal nav — no Sign In to avoid distraction ── */}
      <header className="flex items-center justify-between px-5 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <span className="font-bold text-base tracking-tight">{BRAND}</span>
        </div>
        <button
          onClick={() => setLocation("/sign-in")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Already purchased? Sign in →
        </button>
      </header>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <Section className="pt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star className="w-3 h-3 fill-current" />
          2,400+ people sleeping through the night · Anxiety-focused CBT-I protocol
        </div>

        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">
          Read this if anxiety is the reason you can't sleep
        </p>

        <h1 className="text-[2rem] font-extrabold leading-[1.15] mb-5">
          Rewire Your Anxious Brain to{" "}
          <span className="text-primary">Sleep Deeply</span>{" "}
          — In 7 Nights.
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-7">
          No pills. No meditation apps. No "just relax" advice. Just the{" "}
          <strong className="text-foreground">clinically-proven CBT-I protocol</strong>{" "}
          — specifically engineered to shut off the anxious loop that keeps your brain wired at night — now available as a self-guided 7-night program.
        </p>

        {/* ── VSL ── */}
        <div className="relative rounded-2xl overflow-hidden mb-7 border-2 border-primary/30 shadow-[0_0_60px_rgba(139,92,246,0.18)] bg-card">
          {VSL_URL ? (
            <div className="aspect-video">
              <iframe
                src={VSL_URL}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="The Sleep Rewire Protocol — Watch this first"
              />
            </div>
          ) : (
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

        <CtaButton>Yes — Rewire My Sleep Tonight →</CtaButton>
      </Section>

      <Divider />

      {/* ── 3am image ── */}
      <Section className="py-8">
        <div className="rounded-2xl overflow-hidden border border-border/40">
          <img src={IMG.awake} alt="Lying awake at 3am" className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
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
          { emoji: "😤", title: "Scenario #1 — Your anxious brain won't switch off", desc: "You're exhausted. You lie down. But your mind turns on like a machine — worst-case scenarios, old conversations, tomorrow's problems. Your chest tightens. Your heart won't slow down. The harder you try to force sleep, the wider awake you become. The clock says 3am.", bad: true },
          { emoji: "😰", title: "Scenario #2 — You crash, but wake at 3am", desc: "You fall asleep quickly — but bolt awake at 3am with a jolt of anxiety. Your mind immediately starts racing. You lie there staring at the ceiling, adrenaline running. By the time you finally drift off, it's almost time to get up. Every. Single. Night.", bad: true },
          { emoji: "😴", title: "Scenario #3 — You fall asleep and stay asleep", desc: "You're in bed, calm. The anxious loop doesn't start. Sleep comes within 15 minutes. You sleep through the night. You wake up before your alarm — actually feeling rested. This is what the Sleep Rewire Protocol trains your brain to do automatically.", bad: false },
        ].map((s) => (
          <div key={s.title} className={`border rounded-2xl p-5 mb-4 ${s.bad ? "border-border/50 bg-card/40" : "border-primary/40 bg-primary/5 shadow-[0_0_30px_rgba(139,92,246,0.12)]"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.emoji}</span>
              <p className={`text-xs font-bold uppercase tracking-widest ${s.bad ? "text-muted-foreground" : "text-primary"}`}>{s.title}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            {!s.bad && <p className="text-xs font-semibold text-primary mt-3">← This is achievable. It just takes the right system.</p>}
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
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">This Program Is for You If…</h2>
        <div className="space-y-3 mb-6">
          {[
            "Your mind races the moment you try to sleep — even when you're exhausted",
            "Anxiety or stress is the main reason you can't fall or stay asleep",
            "You wake up at 3am with a jolt of worry and can't get back to sleep",
            "You feel exhausted during the day even after hours in bed",
            "You've tried melatonin, apps, or deep breathing — and still can't sleep",
            "You want to stop depending on sleep aids and fix the root cause permanently",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3.5 bg-card/50 border border-border/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary/8 border border-primary/30 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>This is NOT for you if</strong> you have an undiagnosed sleep disorder like sleep apnea or narcolepsy — those require clinical diagnosis first.
          </p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          WHY EVERYTHING FAILS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>The hard truth</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">Why Everything You've Tried Has Failed</h2>
        <p className="text-center text-sm text-muted-foreground mb-7">It's not because you didn't try hard enough. It's because none of it addresses the root cause.</p>

        <div className="rounded-2xl overflow-hidden border border-border/40 mb-7">
          <img src={IMG.science} alt="Sleep science" className="w-full object-cover" style={{ aspectRatio: "1/1", maxHeight: "260px" }} />
        </div>

        {[
          { title: "Melatonin", why: "Helps you feel drowsy — but doesn't fix the root cause. You're still dependent on it tomorrow night." },
          { title: "Sleep hygiene tips", why: "\"No screens before bed\" has minimal impact on clinical insomnia. It's not enough on its own." },
          { title: "Meditation & breathing apps", why: "Great for general stress. Poor for anxiety-driven insomnia. They don't break the conditioned fear response your brain has built around sleep." },
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
            <span className="text-primary font-semibold">Cognitive Behavioral Therapy for Insomnia (CBT-I)</span>.
            Recommended by the American College of Physicians as the{" "}
            <em>first-line treatment over sleeping pills</em>.
          </p>
          <p className="text-xs text-primary font-semibold mt-3">
            We've turned the CBT-I protocol into a 7-night self-guided program — starting tonight.
          </p>
        </div>
      </Section>

      {/* ── Mid-page CTA ── */}
      <Section className="py-6">
        <CtaButton>Start My Sleep Rewire — {CURRENCY}47</CtaButton>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          7-NIGHT WALKTHROUGH
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>The system</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">
          Here's Exactly What Happens Each of the <span className="text-primary">7 Nights</span>
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">Each night builds on the last. By Night 7, your brain knows exactly how to sleep.</p>

        <div className="rounded-2xl overflow-hidden border border-border/40 mb-8">
          <img src={IMG.journal} alt="Sleep journal" className="w-full object-cover" style={{ aspectRatio: "1/1", maxHeight: "260px" }} />
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
        <p className="text-center text-sm text-muted-foreground mb-7">From people who were exactly where you are now.</p>

        <div className="rounded-2xl overflow-hidden border border-border/40 mb-7">
          <img src={IMG.refreshed} alt="Waking up refreshed" className="w-full object-cover" style={{ aspectRatio: "4/3" }} />
        </div>

        {[
          { name: "Alex M., 28", stars: 5, text: "My anxiety would kick in the moment I got into bed. I'd tried everything. Night 3 of this protocol I slept 7 hours straight for the first time in a year. By Night 7 I didn't even think about sleep — I just fell asleep." },
          { name: "Jordan T., 31", stars: 5, text: "The brain dump technique on Night 5 alone was worth every cent. I used to lie awake for 2 hours replaying my day, heart pounding with anxiety. Now I'm asleep in under 20 minutes. Every night." },
          { name: "Sam K., 24", stars: 5, text: "Waking up at 3am every night for 6 months. Finished Night 7 two weeks ago. Haven't had a single 3am wake since. Genuinely shocked." },
          { name: "Riley P., 33", stars: 5, text: "Actual science, not wellness fluff. Watching my sleep efficiency go from 62% to 89% in 7 nights using the built-in tracker was insane." },
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
          BONUSES SECTION
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Free bonuses</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">
          Order Right Now and Get{" "}
          <span className="text-primary">5 Exclusive Bonuses</span>
          {" "}— Free
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-7">
          Total bonus value: <strong className="text-foreground">{CURRENCY}155+</strong> — included at no extra cost.
        </p>

        <div className="space-y-3 mb-6">
          {BONUSES.map((b, i) => (
            <div key={b.name} className="flex gap-4 p-4 bg-card border border-border/50 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">Bonus #{i + 1}: {b.name}</p>
                  <span className="text-xs font-extrabold text-primary shrink-0 bg-primary/10 px-2 py-0.5 rounded-lg">{b.value}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/8 border border-primary/30 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-foreground">
            Total value: <span className="line-through text-muted-foreground">{CURRENCY}352+</span>
          </p>
          <p className="text-2xl font-extrabold text-primary mt-1">Your price today: {CURRENCY}{PRICE_TODAY}</p>
          <p className="text-xs text-muted-foreground mt-1">You save <strong className="text-foreground">{CURRENCY}{PRICE_SAVINGS}</strong> — {Math.round((PRICE_SAVINGS / PRICE_ORIGINAL) * 100)}% off the program alone</p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          GUARANTEE
      ════════════════════════════════════ */}
      <Section className="py-8">
        <div className="rounded-2xl overflow-hidden border border-border/40 mb-7">
          <img src={IMG.peaceful} alt="Sleeping peacefully" className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
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
          MAIN ORDER FORM
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Don't wait another sleepless night</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-2 leading-snug">
          Tonight Could Be the Last Night<br />You Lie Awake Staring at the Ceiling.
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-6">
          The protocol takes 7 nights. Most people feel the difference by Night 3. The question is — how many more nights are you willing to lose?
        </p>

        {/* Countdown timer */}
        <div className="mb-6">
          <CountdownTimer />
        </div>

        {/* The main order form */}
        <OrderForm id="order-form" />
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          UPSELL / WHAT'S NEXT
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Optional upgrade</SectionLabel>
        <h2 className="text-xl font-extrabold text-center mb-3 leading-snug">
          Want to Go Deeper? Add the 90-Day Mastery Pack
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-5">
          After completing your 7-night reset, continue with our 90-day advanced protocol — habit stacking, sleep architecture optimisation, and monthly check-ins.
        </p>
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-foreground">90-Day Sleep Mastery Pack</p>
              <p className="text-xs text-muted-foreground">Advanced protocol · 3-month access</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold text-foreground">{CURRENCY}37</p>
              <p className="text-xs text-muted-foreground line-through">{CURRENCY}97</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic mb-4">
            * This offer will be available to you immediately after your purchase — no need to decide now.
          </p>
          <button
            onClick={scrollToOrder}
            className="w-full border border-primary/40 text-primary font-semibold py-3 rounded-xl text-sm hover:bg-primary/5 transition-colors"
          >
            Start with the 7-Night Rewire First →
          </button>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          FAQ
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="text-xl font-extrabold text-center mb-6">Common Questions</h2>

        {[
          { q: "Do I need to create an account before buying?", a: "No. Just enter your email and name, pay securely through Stripe, and you'll immediately be prompted to create your password. Your account is created automatically after payment — no sign-up friction." },
          { q: "Does this work specifically for anxiety-related insomnia?", a: "Yes — this is exactly what CBT-I was designed for. Anxiety-driven insomnia (lying awake with a racing mind, waking at 3am with a jolt of worry) responds extremely well to the techniques in this protocol. The Cognitive Restructuring and Brain Dump sessions directly target the anxiety loop." },
          { q: "Is this the same as CBT-I therapy with a therapist?", a: "It follows the same clinical framework — the exact techniques sleep therapists use. The difference: it's self-paced, costs €47 instead of €300/session, and you can start tonight." },
          { q: "What if I've had insomnia for years?", a: "CBT-I is specifically designed for chronic insomnia. The longer you've had it, the more entrenched the behavioral patterns — which means CBT-I often produces more dramatic results." },
          { q: "Do I need a specific wake-up time to make this work?", a: "You'll set a consistent wake time during the protocol — it's central to building sleep pressure. The protocol adapts to your schedule, whether you wake at 6am or 10am." },
          { q: "Is there ongoing access after I finish Night 7?", a: "Yes — lifetime access. The sleep diary and tracking tools are yours forever. Many users log their sleep indefinitely to maintain their results." },
          { q: "What if it doesn't work for me?", a: "We back it with a full 7-night money-back guarantee. Complete the protocol and if your sleep doesn't measurably improve, email us for a full refund. No questions asked." },
        ].map((faq, i) => (
          <div key={i} className="border-b border-border/50 last:border-0">
            <button
              className="w-full flex items-center justify-between py-4 text-left gap-4"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span className="text-sm font-semibold text-foreground">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
            </button>
            {openFaq === i && (
              <p className="text-sm text-muted-foreground leading-relaxed pb-4">{faq.a}</p>
            )}
          </div>
        ))}
      </Section>

      {/* ── Footer CTA ── */}
      <Section className="py-6">
        <CtaButton>Yes — Fix My Sleep Tonight →</CtaButton>
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 text-center px-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">{BRAND}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-xs text-muted-foreground">
          <button onClick={() => setLocation("/sign-in")} className="hover:text-foreground transition-colors">Sign in</button>
          <span className="text-border">·</span>
          <button onClick={() => setLocation("/privacy-policy")} className="hover:text-foreground transition-colors">Privacy Policy</button>
          <span className="text-border">·</span>
          <button onClick={() => setLocation("/terms")} className="hover:text-foreground transition-colors">Terms of Service</button>
          <span className="text-border">·</span>
          <a href="mailto:support@sleepwire.com" className="hover:text-foreground transition-colors">Contact</a>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Sleep Rewire. All rights reserved.</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
          This program is for educational purposes only and is not a substitute for professional medical advice. Results vary. If you have a diagnosed sleep disorder, consult your physician before beginning.
        </p>
      </footer>

    </div>
  );
}
