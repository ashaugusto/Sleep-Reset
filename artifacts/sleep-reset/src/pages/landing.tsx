import { useLocation } from "wouter";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Moon, Shield, ChevronDown, ArrowRight, Lock, Play,
  Sparkles, Headphones, Calculator, FileText, Sunrise,
  Infinity as InfinityIcon, X,
} from "lucide-react";
import { customFetch } from "@/lib/fetch";
import { useToast } from "@/hooks/use-toast";
import { gtm } from "@/lib/gtm";

// ─── Brand & Pricing ────────────────────────────────
const BRAND = "Sleep Wired";
const METHOD = "The Cognitive Shutdown Method";
const CURRENCY = "€";
const PRICE_TODAY = 27;
const PRICE_AFTER = 97;
const GUARANTEE_DAYS = 60;
const BUMP_DATE = new Date("2026-06-30T22:00:00Z");
const BUMP_LABEL = "June 30";

const VIMEO_ID = "1182232180";
const VIMEO_PLAYER_API = "https://player.vimeo.com/api/player.js";

// ─── Stack ──────────────────────────────────────────
const STACK: { icon: typeof Moon; label: string; value: number; note: string }[] = [
  {
    icon: Moon,
    label: `${METHOD}™ — the 7-night protocol`,
    value: 297,
    note: "4 phases — Audit · Compress · Reset · Rewire. Self-guided. You complete it lying in bed.",
  },
  {
    icon: Headphones,
    label: "Sleep-Anchor Audio Sessions (×7)",
    value: 97,
    note: "An 8-minute guided audio session for each of the 7 nights. You press play, lie back, and the protocol runs itself.",
  },
  {
    icon: Calculator,
    label: "Personal Sleep Window Calculator",
    value: 19,
    note: "Type your bedtime + wake time. Get your exact CBT-I sleep window — the same calculation sleep clinics charge €300 to do.",
  },
  {
    icon: FileText,
    label: "The Brain Dump Workbook (PDF)",
    value: 47,
    note: "The 5-minute pre-bed exercise that empties your racing thoughts onto paper. Used in clinical CBT-I to break the rumination loop.",
  },
  {
    icon: Sunrise,
    label: "Morning Recovery Protocol",
    value: 47,
    note: "The first 30 minutes after waking determine tonight's sleep. This is the exact routine — light, water, movement, no phone.",
  },
  {
    icon: InfinityIcon,
    label: "Lifetime access + every future update",
    value: 0,
    note: "Buy once. Every future audio session, workbook, calculator improvement — yours forever, free.",
  },
];
const TOTAL_VALUE = STACK.reduce((a, s) => a + s.value, 0);

const AUTHORITIES = [
  "American College of Physicians",
  "American Academy of Sleep Medicine",
  "JAMA Internal Medicine",
  "NHS England",
  "Mayo Clinic",
];

// ─── Beta testers — early access, no payment, honest feedback ─────
// Disclosure required (FTC US, UK ASA, EU 2019/2161): "Beta tester — received free access for honest feedback"
const TESTIMONIALS = [
  {
    initial: "B",
    name: "Bruno",
    location: "Dublin, Ireland",
    age: 34,
    role: "Software engineer",
    quote: "Used to take me 90 minutes to fall asleep most nights. After the protocol, I'm out in 15. Didn't expect it to work that fast.",
  },
  {
    initial: "C",
    name: "Caio",
    location: "Curitiba, Brazil",
    age: 38,
    role: "Marketing",
    quote: "My mind wouldn't stop. The Cognitive Shutdown thing finally gave me a way to actually disconnect at night. Sleep got deeper too.",
  },
  {
    initial: "G",
    name: "Gustavo",
    location: "Genève, Switzerland",
    age: 41,
    role: "Finance consultant",
    quote: "Tried melatonin, meditation apps, nothing held. This is the first thing that actually stopped the racing thoughts before bed.",
  },
  {
    initial: "M",
    name: "Markus",
    location: "Berlin, Germany",
    age: 36,
    role: "Designer",
    quote: "Felt lighter by night 4. Less tension when I lay down. Hadn't slept like this in years.",
  },
];

// ─── Hook Variants (cold-traffic message match) ─────
// Selected via ?h=<key> query param. Falls back to "default".
// Ad creatives should point to /?h=<key> matching the hook in the video.
type HeroVariant = {
  eyebrow: ReactNode;
  h1: ReactNode;
  sub: ReactNode;
};

const HEROES: Record<string, HeroVariant> = {
  default: {
    eyebrow: <>Built on CBT-I — 30+ years of peer-reviewed clinical research</>,
    h1: (
      <>
        Fall asleep in under 15 minutes.<br />
        <em className="italic">Stay asleep</em> until your alarm.<br />
        In 7 nights.
      </>
    ),
    sub: (
      <>
        The Cognitive Shutdown Method™ is a 7-night CBT-I protocol used by sleep clinics — repackaged so you can start tonight, lying in your own bed.{" "}
        <strong className="text-[#0E2541]">No pills. No meditation app. No willpower.</strong>{" "}
        Just the system that retrains an anxious brain to sleep.
      </>
    ),
  },
  hyperarousal: {
    eyebrow: <>What sleep clinics call it — and why supplements can't fix it</>,
    h1: (
      <>
        It's not insomnia.<br />
        It's <em className="italic">cognitive hyperarousal</em>.
      </>
    ),
    sub: (
      <>
        Your brain learned to stay alert at night — and no supplement turns that off.{" "}
        <strong className="text-[#0E2541]">CBT-I is the only protocol clinically shown to retrain it.</strong>{" "}
        7 nights. Self-guided. From your own bed, starting tonight.
      </>
    ),
  },
  melatonin: {
    eyebrow: <>If supplements stopped working — read this first</>,
    h1: (
      <>
        Melatonin doesn't fix this.<br />
        <em className="italic">Here's what does.</em>
      </>
    ),
    sub: (
      <>
        Melatonin signals "it's dark out." Your problem isn't the dark — it's a brain that won't shut down.{" "}
        <strong className="text-[#0E2541]">CBT-I is what sleep clinics use when supplements fail.</strong>{" "}
        7 nights, from your own bed.
      </>
    ),
  },
  wake3am: {
    eyebrow: <>If you wake at 3AM with your mind running</>,
    h1: (
      <>
        Waking at 3AM<br />
        isn't insomnia.<br />
        <em className="italic">It's something else.</em>
      </>
    ),
    sub: (
      <>
        It's a cortisol surge meeting a brain that never fully powered down.{" "}
        <strong className="text-[#0E2541]">CBT-I is the protocol clinics use to break that loop in 7 nights.</strong>{" "}
        Self-guided, from your bed.
      </>
    ),
  },
};

function useHeroVariant() {
  return useMemo(() => {
    if (typeof window === "undefined") return { key: "default", variant: HEROES.default };
    const raw = new URLSearchParams(window.location.search).get("h")?.toLowerCase() ?? "";
    const key = raw in HEROES ? raw : "default";
    try {
      window.sessionStorage.setItem("sw_hero_variant", key);
    } catch {}
    return { key, variant: HEROES[key] };
  }, []);
}

// ─── Helpers ────────────────────────────────────────
function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const diff = target.getTime() - now;
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0 };
  return {
    expired: false,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

function scrollToOrder() {
  document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── VSL Player (click-to-play) ─────────────────────
function VimeoPlayer() {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (document.querySelector(`script[src="${VIMEO_PLAYER_API}"]`)) return;
    const s = document.createElement("script");
    s.src = VIMEO_PLAYER_API;
    s.async = true;
    document.head.appendChild(s);
  }, [playing]);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => { gtm.vslPlay(); setPlaying(true); }}
        className="relative w-full block group rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#0E2541] shadow-[0_6px_30px_rgba(14,37,65,0.10)]"
        style={{ aspectRatio: "16 / 9" }}
        aria-label="Play explainer video"
      >
        <img
          src="/images/sleep-peaceful.png"
          alt=""
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 via-black/10 to-transparent">
          <div className="w-20 h-20 rounded-full bg-[#C9A14A] flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-4 left-5 right-5 text-left">
          <p className="text-white text-sm font-semibold drop-shadow">
            Watch — the 4-minute method overview
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            Why this is the only thing that fixes anxious-brain insomnia long-term
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-[0_6px_30px_rgba(14,37,65,0.10)]" style={{ aspectRatio: "16/9" }}>
      <iframe
        src={`https://player.vimeo.com/video/${VIMEO_ID}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&playsinline=1&byline=0&portrait=0&title=0`}
        frameBorder={0}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        className="w-full h-full"
        title={`${METHOD} — method overview`}
      />
    </div>
  );
}

// ─── Inline Order Form ──────────────────────────────
function OrderForm({ id, priceToday }: { id?: string; priceToday: number }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast({ title: "Enter your email to continue", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const cookies = typeof document !== "undefined" ? document.cookie : "";
      const cookieValue = (k: string) => {
        const m = cookies.match(new RegExp("(?:^|;\\s*)" + k + "=([^;]+)"));
        return m ? m[1] : "";
      };
      const heroVariant =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("sw_hero_variant") || "default"
          : "default";
      gtm.lead(email.trim());
      const r = await customFetch("/api/checkout/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: null,
          hero_variant: heroVariant,
          fbp: cookieValue("_fbp"),
          fbc: cookieValue("_fbc"),
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({ message: "Could not start checkout." }));
        toast({ title: body.message ?? "Checkout failed", variant: "destructive" });
        return;
      }
      const { url } = await r.json();
      gtm.initiateCheckout(email.trim());
      window.location.href = url;
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id={id} className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_6px_30px_rgba(14,37,65,0.06)] overflow-hidden">
      <div className="bg-[#0E2541] px-5 py-4 text-center">
        <p className="text-xs font-bold text-white uppercase tracking-[0.18em]">
          Lock in your access — instant delivery
        </p>
      </div>

      <div className="px-6 pt-6 pb-5 border-b border-[#F1F2F4] text-center">
        <p className="text-sm text-[#9CA3AF] line-through mb-1">
          From {BUMP_LABEL} · {CURRENCY}{PRICE_AFTER}
        </p>
        <p className="text-6xl font-extrabold text-[#0E2541] leading-none mb-2 tabular-nums">
          {CURRENCY}{priceToday}
        </p>
        <p className="text-sm font-semibold text-[#1F2937]">
          One-time · Lifetime access · No subscription, ever
        </p>
        <div className="inline-flex items-center gap-2 mt-3 bg-[#FAF3E0] border border-[#E8D8A8] rounded-full px-3 py-1">
          <Sparkles className="w-3.5 h-3.5 text-[#8B6F1F]" />
          <span className="text-xs font-bold text-[#8B6F1F] tracking-wide">
            Launch price — save {CURRENCY}{PRICE_AFTER - priceToday} before {BUMP_LABEL}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-3">
        <label className="block">
          <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-[0.14em] mb-1.5">
            Where do we send your access?
          </span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-white border border-[#D1D5DB] rounded-xl px-4 py-3.5 text-base text-[#0E2541] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0E2541] focus:ring-2 focus:ring-[#0E2541]/10 transition-all"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C9A14A] hover:bg-[#B58D38] text-white font-extrabold text-base py-4 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? "Redirecting to secure checkout…" : (
            <>Yes — start tonight for {CURRENCY}{priceToday} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <div className="flex items-center justify-center gap-4 pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]"><Lock className="w-3 h-3" /> Secured by Stripe</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]"><Shield className="w-3 h-3" /> {GUARANTEE_DAYS}-day refund · keep everything</span>
        </div>
      </form>
    </div>
  );
}

// ─── Reusable bits ──────────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-2xl mx-auto px-5 ${className}`}>{children}</section>;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-[#C9A14A] uppercase tracking-[0.22em] text-center mb-3">{children}</p>;
}
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl sm:text-4xl text-center text-[#0E2541] leading-[1.15] tracking-tight"
      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
    >
      {children}
    </h2>
  );
}
function PrimaryCta({ children, priceToday }: { children: React.ReactNode; priceToday: number }) {
  return (
    <div className="text-center">
      <button
        onClick={scrollToOrder}
        className="inline-flex items-center justify-center gap-2 w-full max-w-md bg-[#C9A14A] hover:bg-[#B58D38] text-white font-extrabold text-lg py-5 px-8 rounded-xl shadow-[0_8px_28px_rgba(201,161,74,0.32)] hover:shadow-[0_12px_36px_rgba(201,161,74,0.42)] transition-all"
      >
        {children} <ArrowRight className="w-5 h-5" />
      </button>
      <p className="text-xs text-[#6B7280] mt-3">
        {CURRENCY}{priceToday} today · {CURRENCY}{PRICE_AFTER} from May 24 · {GUARANTEE_DAYS}-day refund · keep everything
      </p>
    </div>
  );
}

// ──────────────────── MAIN ─────────────────────────
export default function Landing() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const cd = useCountdown(BUMP_DATE);
  const priceToday = cd.expired ? PRICE_AFTER : PRICE_TODAY;
  const { key: heroKey, variant: hero } = useHeroVariant();

  useEffect(() => { gtm.viewVSL(); }, []);

  useEffect(() => {
    try {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: "hero_variant", hero: heroKey });
    } catch {}
  }, [heroKey]);

  useEffect(() => {
    const el = document.documentElement;
    const had = el.classList.contains("dark");
    if (had) el.classList.remove("dark");
    return () => { if (had) el.classList.add("dark"); };
  }, []);

  return (
    <div
      className="min-h-[100dvh]"
      style={{ background: "#FAFAF7", color: "#1F2937", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Urgency strip */}
      <div className="bg-[#0E2541] text-center py-2.5 px-4">
        <p className="text-xs sm:text-sm font-semibold text-white tracking-wide">
          {cd.expired ? (
            <>Launch pricing has ended · today {CURRENCY}{PRICE_AFTER}</>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#C9A14A] mr-2 align-middle animate-pulse" />
              Launch price ends in{" "}
              <strong className="tabular-nums">{cd.days}d {cd.hours}h {cd.minutes}m</strong>
              {" "}· then {CURRENCY}{PRICE_AFTER} forever
            </>
          )}
        </p>
      </div>

      {/* Header */}
      <header className="border-b border-[#EFEFEC] bg-[#FAFAF7]">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#0E2541]" />
            <span className="font-bold text-base text-[#0E2541] tracking-tight">{BRAND}</span>
          </div>
          <button
            onClick={() => setLocation("/sign-in")}
            className="text-xs text-[#6B7280] hover:text-[#0E2541] underline-offset-4 hover:underline"
          >
            Already a member? Sign in →
          </button>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <Section className="pt-10 pb-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-white border border-[#E5E7EB] text-[#0E2541] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Shield className="w-3 h-3 text-[#166534]" />
            {hero.eyebrow}
          </div>

          <h1
            className="text-[2.2rem] sm:text-[2.8rem] leading-[1.06] tracking-tight text-[#0E2541] mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            {hero.h1}
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-xl mx-auto mb-8">
            {hero.sub}
          </p>

          <div className="max-w-xl mx-auto mb-8">
            <VimeoPlayer />
          </div>

          <PrimaryCta priceToday={priceToday}>
            Start tonight — {CURRENCY}{priceToday}
          </PrimaryCta>
        </div>

        {/* Authority strip */}
        <div className="mt-14 pt-8 border-t border-[#EFEFEC]">
          <p className="text-center text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.22em] mb-4">
            The same framework recommended by
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-7 gap-y-3 text-[#6B7280]">
            {AUTHORITIES.map((src) => (
              <span key={src} className="text-xs font-semibold tracking-wide">{src}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════ BETA TESTERS — early access feedback ═══════════════ */}
      <section className="bg-[#FAFAF7] border-y border-[#EFEFEC] py-14">
        <Section>
          <Eyebrow>What our beta testers said</Eyebrow>
          <H2>Real people. Real nights. <span className="italic">Honest feedback.</span></H2>
          <p className="text-center text-[#6B7280] text-sm mt-3 mb-10 max-w-xl mx-auto">
            We gave early access to a handful of friends in 4 countries — no payment, just honest feedback after the 7-night protocol.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.initial}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-[0_2px_12px_rgba(14,37,65,0.04)] flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-[#0E2541] text-white font-bold text-base flex items-center justify-center tracking-wider">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-[#0E2541] font-bold text-sm leading-tight">{t.name} · {t.location}</p>
                    <p className="text-[#6B7280] text-xs leading-tight mt-0.5">{t.age} · {t.role}</p>
                  </div>
                </div>
                <p
                  className="text-[#1F2937] text-[15px] leading-[1.55] italic mb-4 flex-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A14A] pt-3 border-t border-[#F1F2F4]">
                  Beta tester · early access for honest feedback
                </p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* ═══════════════ 3 SCENARIOS ═══════════════ */}
      <section className="bg-white border-y border-[#EFEFEC] py-14">
        <Section>
          <Eyebrow>One of these is your night</Eyebrow>
          <H2>Every night, one of <span className="italic">three</span> scenarios runs.</H2>
          <div className="mt-10 space-y-4">
            {[
              {
                n: "01",
                bad: true,
                title: "Your brain won't switch off.",
                text:
                  "You lie down at 11. By 1am your mind is still racing — tomorrow's problems, that conversation last week, the email you forgot. Your chest is tight. The harder you try to force sleep, the more awake you become. You finally pass out at 4. The alarm goes off at 7. You start the day broken.",
              },
              {
                n: "02",
                bad: true,
                title: "You crash, then bolt awake at 3am.",
                text:
                  "You fall asleep at 11. By 3am you're upright — heart pounding, brain in panic mode, no reason. You stare at the ceiling until 6:30, exhausted but wired. The day ahead feels impossible before it has even started.",
              },
              {
                n: "03",
                bad: false,
                title: "Sleep comes in 15 minutes — and stays.",
                text:
                  "You read for 10 minutes. You feel naturally sleepy. By 11:15 you're out. You sleep through every single hour of the night. You wake at 6:55 — before the alarm — actually rested. This isn't luck. It's what CBT-I retrains your brain to do, in 7 nights.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className={cx(
                  "rounded-2xl p-6 border",
                  s.bad ? "bg-[#FAFAF7] border-[#E5E7EB]" : "bg-white border-[#0E2541]/15 shadow-[0_6px_24px_rgba(14,37,65,0.08)]"
                )}
              >
                <span className={cx(
                  "text-[11px] font-extrabold tracking-[0.22em]",
                  s.bad ? "text-[#9CA3AF]" : "text-[#C9A14A]"
                )}>
                  SCENARIO {s.n}
                </span>
                <p className="text-base font-bold text-[#0E2541] mt-2 mb-2">{s.title}</p>
                <p className="text-sm text-[#4B5563] leading-relaxed">{s.text}</p>
                {!s.bad && (
                  <p className="text-xs font-semibold text-[#C9A14A] mt-3">
                    ← Trainable. Not genetics. Not luck. A system you run for 7 nights.
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* ═══════════════ WHY ELSE FAILED ═══════════════ */}
      <Section className="py-14">
        <Eyebrow>Why nothing else has worked</Eyebrow>
        <H2>You haven't failed.<br /> Everything you tried was the wrong tool.</H2>
        <p className="text-center text-[#6B7280] text-sm mt-4 mb-10 max-w-md mx-auto">
          The root cause of anxious-brain insomnia isn't poor habits. It's a <em>conditioned fear response</em> your brain built around sleep. None of these break that loop.
        </p>

        <div className="space-y-3 mb-8">
          {[
            { what: "Melatonin",          why: "Makes you drowsy for a few hours. Never fixes the cause. You wake up depending on it again tomorrow." },
            { what: "Sleeping pills (Z-drugs)", why: "Knock you out, but the moment you stop, the insomnia comes back worse. Plus dependency, tolerance, and morning fog." },
            { what: "Sleep hygiene tips", why: '"No screens before bed" makes almost no difference for clinical anxiety insomnia. Necessary but nowhere near sufficient.' },
            { what: "Meditation apps",    why: "Excellent for general stress. Poor for an anxious brain at 3am — it doesn't break the conditioned loop that connects bed = fear." },
            { what: "Alcohol",            why: "Knocks you out, then destroys your REM. You wake at 3am with rebound anxiety — the exact thing you're trying to escape." },
            { what: "CBD, weighted blankets", why: "Mild placebo effect on falling asleep. Zero effect on the 3am bolt-awake. Cute hack — not a system." },
          ].map((f) => (
            <div key={f.what} className="flex gap-3 p-4 bg-white border border-[#EFEFEC] rounded-xl">
              <X className="w-4 h-4 text-[#B23B2A] shrink-0 mt-1" />
              <div>
                <p className="font-bold text-[#0E2541] text-sm">{f.what}</p>
                <p className="text-sm text-[#4B5563]">{f.why}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#FAF3E0] border border-[#E8D8A8] rounded-2xl p-6">
          <p className="text-sm text-[#1F2937] leading-relaxed">
            <strong>The only treatment with peer-reviewed long-term results</strong> is{" "}
            <span className="font-semibold text-[#8B6F1F]">Cognitive Behavioral Therapy for Insomnia (CBT-I)</span> — the first-line treatment recommended by the American College of Physicians, the NHS, and the AASM, ahead of every sleep medication on the market.
          </p>
          <p className="text-xs font-semibold text-[#8B6F1F] mt-3">
            {METHOD}™ takes that exact clinical framework, strips out the €300/session pricing, and turns it into a 4-phase self-guided system you complete in 7 nights — starting the night you order.
          </p>
        </div>
      </Section>

      {/* ═══════════════ NIGHT 7 PROMISE ═══════════════ */}
      <section className="bg-white border-y border-[#EFEFEC] py-14">
        <Section>
          <Eyebrow>What changes by Night 7</Eyebrow>
          <H2>The exact outcomes CBT-I delivers in clinical trials.</H2>
          <p className="text-center text-[#6B7280] text-sm mt-4 mb-10 max-w-md mx-auto">
            Specific. Measurable. Repeatable. The numbers below are pulled from peer-reviewed meta-analysis — not marketing.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { stat: "≤ 15 min",  label: "Time from head-to-pillow to asleep",  source: "JAMA meta-analysis · 87 studies · −19 min avg" },
              { stat: "0 wakeups", label: "Average 3am bolt-awakes by Phase 3",   source: "CBT-I Phase 3 protocol metric" },
              { stat: "+30 min",   label: "Extra sleep per night, sustained 12 months", source: "JAMA Internal Med · 3,724 participants" },
            ].map((s) => (
              <div key={s.label} className="bg-[#FAFAF7] rounded-2xl p-6 text-center border border-[#EFEFEC]">
                <p className="text-3xl font-extrabold text-[#0E2541] mb-1 tabular-nums">{s.stat}</p>
                <p className="text-sm font-semibold text-[#1F2937]">{s.label}</p>
                <p className="text-[11px] text-[#9CA3AF] mt-2">{s.source}</p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* ═══════════════ STACK ═══════════════ */}
      <Section className="py-14">
        <Eyebrow>Everything you get the moment you order</Eyebrow>
        <H2>{CURRENCY}{TOTAL_VALUE} of CBT-I tools.<br /> {CURRENCY}{priceToday} today.</H2>
        <p className="text-center text-[#6B7280] text-sm mt-4 mb-10 max-w-md mx-auto">
          One-time payment. Lifetime access. No subscription, ever. Every future update — yours forever, free.
        </p>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-[0_6px_30px_rgba(14,37,65,0.04)] mb-6">
          <div className="space-y-4">
            {STACK.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex gap-4 items-start pb-4 border-b border-[#F1F2F4] last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF3E0] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#8B6F1F]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-[#0E2541] leading-snug">{s.label}</p>
                      <span className="text-xs font-bold text-[#9CA3AF] shrink-0 tabular-nums">
                        {s.value > 0 ? `${CURRENCY}${s.value}` : "priceless"}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{s.note}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t-2 border-[#0E2541] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-bold">Total value</p>
              <p className="text-base font-extrabold text-[#0E2541] line-through tabular-nums">{CURRENCY}{TOTAL_VALUE}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#C9A14A] uppercase tracking-wider font-bold">You pay today</p>
              <p className="text-3xl font-extrabold text-[#0E2541] tabular-nums">{CURRENCY}{priceToday}</p>
            </div>
          </div>
        </div>

        <PrimaryCta priceToday={priceToday}>
          Yes — give me access
        </PrimaryCta>
      </Section>

      {/* ═══════════════ SCIENCE ═══════════════ */}
      <section className="bg-white border-y border-[#EFEFEC] py-14">
        <Section>
          <Eyebrow>This isn't an opinion</Eyebrow>
          <H2>Three decades of peer-reviewed evidence.</H2>
          <div className="mt-10 space-y-4">
            {[
              {
                who: "American College of Physicians",
                text: "CBT-I is recommended as the first-line treatment for chronic insomnia in adults — over sleeping pills, including Z-drugs.",
                cite: "Annals of Internal Medicine, 2016",
              },
              {
                who: "NHS England · Mind & Body guidelines",
                text: "CBT-I is the recommended first treatment for long-term insomnia. Sleeping medication should only be a short-term option after CBT-I has been tried.",
                cite: "NHS — Insomnia clinical guidance",
              },
              {
                who: "Meta-analysis · 87 studies · 3,724 participants",
                text: "CBT-I improves sleep onset by an average of 19 minutes and total sleep time by 30+ minutes — with effects sustained at 12-month follow-up.",
                cite: "JAMA Internal Medicine, 2015",
              },
              {
                who: "American Academy of Sleep Medicine",
                text: "CBT-I produces long-lasting improvements in sleep without the side effects, dependency, or rebound insomnia caused by sleep medication.",
                cite: "Clinical Practice Guideline, 2021",
              },
            ].map((c) => (
              <div key={c.who} className="bg-[#FAFAF7] border-l-4 border-[#C9A14A] rounded-r-xl p-5">
                <p className="text-[11px] font-bold text-[#8B6F1F] uppercase tracking-wider mb-2">{c.who}</p>
                <p className="text-sm text-[#1F2937] leading-relaxed">{c.text}</p>
                <p className="text-xs text-[#6B7280] italic mt-2">— {c.cite}</p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* ═══════════════ GUARANTEE ═══════════════ */}
      <Section className="py-14">
        <div className="bg-white border-2 border-[#166534]/25 rounded-2xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#DEF7E0] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#166534]" />
          </div>
          <Eyebrow>Zero risk to you</Eyebrow>
          <H2>{GUARANTEE_DAYS} nights to try it.<br /> Keep everything either way.</H2>
          <p className="text-base text-[#4B5563] leading-relaxed max-w-md mx-auto mt-5 mb-3">
            Try {METHOD}™ for {GUARANTEE_DAYS} full nights. If your sleep hasn't measurably improved by Night 7 — for any reason, no reason needed —
            <strong className="text-[#0E2541]"> email us and get every cent back.</strong>
          </p>
          <p className="text-sm text-[#6B7280] max-w-md mx-auto">
            You keep every audio session. Every workbook. The calculator. The morning protocol. All of it — yours forever.
          </p>
          <p className="text-sm text-[#166534] font-semibold mt-5 max-w-md mx-auto">
            There is no scenario where you lose money on this. The protocol is on us if it doesn't work.
          </p>
        </div>
      </Section>

      {/* ═══════════════ MAIN ORDER FORM ═══════════════ */}
      <section className="bg-white border-y border-[#EFEFEC] py-14">
        <Section>
          <Eyebrow>Don't wait another sleepless night</Eyebrow>
          <H2>Tonight could be the last night<br /> you lie awake staring at the ceiling.</H2>
          <p className="text-center text-sm text-[#6B7280] mt-4 mb-8 max-w-md mx-auto">
            The protocol runs for 7 nights. Most people feel a clear difference by Night 3. You have {GUARANTEE_DAYS} nights to try it — full refund if it doesn't work, and you keep every bonus regardless.
          </p>

          <OrderForm id="order-form" priceToday={priceToday} />

          {!cd.expired && (
            <p className="text-center text-xs text-[#B23B2A] font-semibold mt-5 tracking-wide tabular-nums">
              ⚠ Price increases to {CURRENCY}{PRICE_AFTER} in {cd.days}d {cd.hours}h {cd.minutes}m — permanently
            </p>
          )}
        </Section>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <Section className="py-14">
        <Eyebrow>Common questions</Eyebrow>
        <H2>Before you order.</H2>

        <div className="mt-8">
          {[
            {
              q: "Do I need to create an account before paying?",
              a: "No. Enter your email, pay through Stripe, then set your password right after. Your account is created automatically — zero friction. You're inside the protocol in under 2 minutes.",
            },
            {
              q: "Does this really work for anxiety-driven insomnia?",
              a: "Anxiety-driven insomnia is exactly what CBT-I was designed for. The Cognitive Restructuring sessions and the Brain Dump Workbook directly dismantle the racing-thoughts loop. Peer-reviewed meta-analyses show 19+ minutes faster sleep onset and 30+ extra minutes per night — sustained at 12-month follow-up.",
            },
            {
              q: "How is this different from CBT-I with a real therapist?",
              a: "Same clinical framework, same techniques. The differences: you start tonight (no waitlist), it costs less than one therapy session (€27 vs €300), and you complete it self-paced from your bed. Therapist CBT-I is genuinely excellent — and genuinely inaccessible for most people. This closes that gap.",
            },
            {
              q: "Is this safe if I'm currently taking sleep medication?",
              a: "Yes — CBT-I is regularly used alongside medication. The protocol won't conflict with anything you're taking. Most users find that once they complete the 7 nights, they need their medication less or not at all. If you're on prescription sleep meds, don't stop suddenly — talk to your doctor about tapering as your sleep improves.",
            },
            {
              q: "How much willpower does this require?",
              a: "Very little. The audio sessions tell you what to do each night — you press play, lie back, and the protocol runs itself. The Brain Dump takes 5 minutes. The Morning Protocol takes 30 minutes. That's it. The reason CBT-I works isn't discipline — it's that it rewires the underlying conditioned response.",
            },
            {
              q: "I've had insomnia for years. Will 7 nights really fix it?",
              a: "CBT-I was specifically designed for chronic, long-term insomnia. The longer the conditioned fear-of-sleep response has been entrenched, the more dramatic the change once you break it. The 7 nights aren't a guess — they're the standard CBT-I protocol used in clinics, only faster because it's already structured.",
            },
            {
              q: "Is there ongoing access after Night 7?",
              a: "Lifetime. Every audio session, the workbook, the calculator, the tracker — yours forever. Many users keep logging indefinitely, both to maintain results and because the calculator becomes a permanent tool.",
            },
            {
              q: "What if it doesn't work for me?",
              a: `${GUARANTEE_DAYS}-day "keep everything" guarantee. Email support@sleepwired.com within ${GUARANTEE_DAYS} days, get a full refund, and keep every bonus. No questions, no forms, no waiting. There is no scenario where you lose money on this.`,
            },
            {
              q: `Why does the price jump to €97 after ${BUMP_LABEL}?`,
              a: `We're locking in early customers at €27 before the full audio library and clinical advisor review go live on July 1. After that the price moves to €97 permanently — the protocol itself stays identical. If you wait, you pay €70 more for the same product. No fake countdown, no reset — the date is fixed.`,
            },
          ].map((faq, i) => (
            <div key={i} className="border-b border-[#EFEFEC] last:border-0">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left gap-4 group"
              >
                <span className="text-sm sm:text-base font-semibold text-[#0E2541] group-hover:text-[#C9A14A] transition-colors">{faq.q}</span>
                <ChevronDown className={cx(
                  "w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform",
                  openFaq === i ? "rotate-180" : ""
                )} />
              </button>
              {openFaq === i && (
                <p className="text-sm text-[#4B5563] leading-relaxed pb-5 -mt-1">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="bg-[#0E2541] py-14">
        <Section>
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A14A] mb-3">
              Last chance at launch price
            </p>
            <h2
              className="text-3xl sm:text-4xl text-white leading-[1.1] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              Fix your sleep tonight — for less than dinner.
            </h2>
            <p className="text-sm text-white/70 mt-5 mb-8 max-w-md mx-auto">
              {CURRENCY}{priceToday} now. {CURRENCY}{PRICE_AFTER} from {BUMP_LABEL}, permanently. {GUARANTEE_DAYS}-night money back. Lifetime access. The protocol starts the night you order.
            </p>
            <button
              onClick={scrollToOrder}
              className="inline-flex items-center justify-center gap-2 bg-[#C9A14A] hover:bg-[#B58D38] text-white font-extrabold text-lg py-5 px-10 rounded-xl shadow-[0_8px_28px_rgba(201,161,74,0.40)] hover:shadow-[0_12px_36px_rgba(201,161,74,0.55)] transition-all"
            >
              Yes — fix my sleep tonight <ArrowRight className="w-5 h-5" />
            </button>
            {!cd.expired && (
              <p className="text-xs text-[#C9A14A] mt-5 font-semibold tracking-wide tabular-nums">
                Price increases in {cd.days}d {cd.hours}h {cd.minutes}m — permanently
              </p>
            )}
          </div>
        </Section>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAFAF7] py-10 px-5 border-t border-[#EFEFEC]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Moon className="w-4 h-4 text-[#0E2541]" />
            <span className="font-bold text-sm text-[#0E2541]">{BRAND}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-xs text-[#6B7280]">
            <button onClick={() => setLocation("/sign-in")} className="hover:text-[#0E2541] transition-colors">Sign in</button>
            <span>·</span>
            <button onClick={() => setLocation("/privacy-policy")} className="hover:text-[#0E2541] transition-colors">Privacy</button>
            <span>·</span>
            <button onClick={() => setLocation("/terms")} className="hover:text-[#0E2541] transition-colors">Terms</button>
            <span>·</span>
            <a href="mailto:support@sleepwired.com" className="hover:text-[#0E2541] transition-colors">Contact</a>
          </div>
          <p className="text-xs text-[#9CA3AF]">© 2026 {BRAND}. All rights reserved.</p>
          <p className="text-[11px] text-[#9CA3AF] mt-2 max-w-md mx-auto leading-relaxed">
            For educational purposes only. Not a substitute for professional medical advice. Results vary. If you have a diagnosed sleep disorder, consult your physician first.
          </p>
        </div>
      </footer>
    </div>
  );
}
