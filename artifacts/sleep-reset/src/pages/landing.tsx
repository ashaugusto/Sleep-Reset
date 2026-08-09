import { useLocation } from "wouter";
import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Moon, Shield, ChevronDown, ArrowRight, Lock, Play,
  Sparkles, Headphones, Calculator, FileText, Sunrise,
  Infinity as InfinityIcon, X,
} from "lucide-react";
import { customFetch } from "@/lib/fetch";
import { useToast } from "@/hooks/use-toast";
import { gtm } from "@/lib/gtm";
import { hotmartCheckoutUrl } from "@/lib/offers";

// ─── Brand & Pricing ────────────────────────────────
const BRAND = "Sleep Wired";
const METHOD = "The Cognitive Shutdown Method";
const CURRENCY = "€";
const PRICE_TODAY = 27;
const PRICE_AFTER = 97;
const GUARANTEE_DAYS = 30;
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
    quote: "Most nights it used to take me around 90 minutes to fall asleep. I'd basically accepted that this was just how my brain was and nothing would really change it. By Night 4-5 of the protocol I was usually out in about 15 minutes and staying asleep until my alarm. Waking up without feeling wrecked the next morning is something I hadn't felt in years.",
  },
  {
    initial: "C",
    name: "Caio",
    location: "Curitiba, Brazil",
    age: 38,
    role: "Marketing",
    quote: "I'd lie down and my mind just wouldn't stop, replaying work, bills and conversations late into the night. I'd already tried meditation, sleep podcasts, a bunch of stuff, and nothing really stuck. By Night 3 of the protocol I could actually 'switch off' in under 30 minutes, and my sleep got noticeably deeper. In the mornings I have way more energy and even my patience with people has improved.",
  },
  {
    initial: "G",
    name: "Gustavo",
    location: "Genève, Switzerland",
    age: 41,
    role: "Finance consultant",
    quote: "I was already on the melatonin + meditation app combo; it helped one night and the next I was back to the same racing thoughts before bed. I almost didn't try anything else because it all sounded like the same promise in a different package. In the first few nights of the protocol the racing thoughts started to dial down, and by around Night 5 I could go to bed without that 'tonight I'm not going to sleep' panic. That sense of control over my sleep is something I hadn't felt in a long time.",
  },
  {
    initial: "M",
    name: "Markus",
    location: "Berlin, Germany",
    age: 36,
    role: "Designer",
    quote: "I'd get into bed already tense, like I was about to go into a fight with sleep every night. Honestly, I didn't think a 7-night guided routine would change much, it sounded almost too simple. By around Night 4 I was lying down more relaxed and falling asleep faster, without that full-body tension. It had been years since I woke up with the feeling that I'd actually had a real night's sleep.",
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
    eyebrow: <>For the ones lying awake while the world sleeps</>,
    h1: (
      <>
        Remember what it felt like to<br />
        wake up <em className="italic">actually rested?</em>
      </>
    ),
    sub: (
      <>
        Before the 3 a.m. ceiling-staring. Before dragging through your days on fumes, short with the people you love.{" "}
        <strong className="text-[#0E2541]">That version of you isn't gone — your brain just forgot how to switch off.</strong>{" "}
        In 7 nights, the protocol sleep clinics use teaches it how again. No pills. No willpower.
      </>
    ),
  },
  hyperarousal: {
    eyebrow: <>The real reason you can't switch off at night</>,
    h1: (
      <>
        Your brain forgot<br />
        <em className="italic">how to shut down.</em>
      </>
    ),
    sub: (
      <>
        Chronic stress broke your brain's natural shutdown sequence — so you lie there wired while the world sleeps.{" "}
        <strong className="text-[#0E2541]">CBT-I is the clinically-proven way to rebuild it.</strong>{" "}
        7 nights to reset it, from your own bed.
      </>
    ),
  },
  melatonin: {
    eyebrow: <>If melatonin, magnesium and apps stopped working</>,
    h1: (
      <>
        You've tried everything.<br />
        <em className="italic">You're still awake at 3am.</em>
      </>
    ),
    sub: (
      <>
        Melatonin, magnesium, meditation apps — none of them touch the real cause: a brain that won't shut off.{" "}
        <strong className="text-[#0E2541]">CBT-I is what sleep clinics actually use — not another supplement.</strong>{" "}
        7 nights, from your own bed.
      </>
    ),
  },
  wake3am: {
    eyebrow: <>If your mind sprints the moment the lights go out</>,
    h1: (
      <>
        It's 3:47am.<br />
        The house is asleep.<br />
        <em className="italic">Your brain isn't.</em>
      </>
    ),
    sub: (
      <>
        The replay of your day, tomorrow's what-ifs, the racing you can't switch off — this isn't bad luck, it's a brain stuck in alert mode.{" "}
        <strong className="text-[#0E2541]">CBT-I is the protocol clinics use to quiet it in 7 nights.</strong>{" "}
        From your own bed, starting tonight.
      </>
    ),
  },
  notyourself: {
    eyebrow: <>When broken sleep stops being just a night problem</>,
    h1: (
      <>
        You haven't felt like<br />
        <em className="italic">yourself in months.</em>
      </>
    ),
    sub: (
      <>
        The fog, the irritability, snapping at the people you love — it's not who you are, it's months of broken sleep.{" "}
        <strong className="text-[#0E2541]">CBT-I retrains an anxious brain in 7 nights.</strong>{" "}
        Not a pill. A protocol. Start tonight.
      </>
    ),
  },
  "doctor-cbti": {
    eyebrow: <>What sleep clinics actually prescribe — not pills</>,
    h1: (
      <>
        NHS, Mayo, the AASM and JAMA<br />
        <em className="italic">all recommend the same thing.</em>
      </>
    ),
    sub: (
      <>
        For chronic insomnia, the first-line treatment isn't medication — it's CBT-I.{" "}
        <strong className="text-[#0E2541]">We turned the exact clinical protocol into 7 nights you run from your own bed.</strong>{" "}
        €27. 30-night refund.
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

// Resolve the Facebook click id (fbc). On the first load from an ad the Meta
// pixel may not have written the _fbc cookie yet, so the server-side CAPI was
// receiving an empty fbc (lowers Event Match Quality). Fall back to building it
// from the fbclid URL param (fb.1.<ts>.<fbclid>) and persist it for later events.
function resolveFbc(): string {
  if (typeof window === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
  if (m) return m[1];
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    try { document.cookie = `_fbc=${fbc};path=/;max-age=7776000`; } catch {}
    return fbc;
  }
  return "";
}

function clientId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("sw_cid");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("sw_cid", id);
    }
    return id;
  } catch { return ""; }
}

// Fire engagement events to our own DB (powers the dashboard), alongside GA4/pixel.
// Endpoint /api/sw/e (generic name) chosen to avoid adblocker heuristics on "track".
function logEvent(event: string) {
  if (typeof window === "undefined") return;
  try {
    const u = new URLSearchParams(window.location.search);
    void fetch("/api/sw/e", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        ad_id: u.get("utm_content") || "",
        hero_variant: window.sessionStorage.getItem("sw_hero_variant") || "default",
        client_id: clientId(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* noop */ }
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
  logEvent("cta_click");
  document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── VSL Player (muted autoplay → tap for sound) ────
// Self-hosted VSL — native player. Autoplay muted (grabs attention), tap to unmute.
// Engagement tracking: ViewVSL on unmute, 25/50/75% progress, and complete.
// While muted, large synced captions carry the pitch (78% of viewers never unmute —
// the muted experience has to sell on its own). Hidden the moment sound comes on.
const MUTED_CAPTIONS: Array<[number, number, string]> = [
  [0, 5.1, "If you've forgotten what it feels like to fall asleep without a fight…"],
  [5.1, 11, "…and wake up without dread — stay with me."],
  [11, 17.3, "I'll show you exactly why you can't sleep…"],
  [17.3, 24.3, "…and the 7-night method the NHS, Mayo Clinic & the AASM recommend before a single sleeping pill."],
  [24.3, 30, "Not a supplement. Not a gadget. Not “trying harder.”"],
  [30, 36.3, "Trying harder is part of the problem — I'll prove it."],
  [36.3, 42.1, "Let's be honest about what this actually does to you."],
  [42.1, 52.3, "It's not just the nights. It's the whole next day."],
  [52.3, 65.2, "Coffee does nothing. Your brain is buffering by 10am."],
  [65.2, 82.1, "You snap at the people you love — over nothing."],
  [82.1, 93.1, "And you know that's not who you are."],
];

function VimeoPlayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [unmuted, setUnmuted] = useState(false);
  const [capIdx, setCapIdx] = useState(0);
  const fired = useRef<Set<string>>(new Set());

  function onTime() {
    const v = ref.current;
    if (!v || !v.duration) return;
    const s = v.currentTime;
    // Sync the muted-state caption to the current second (cheap: index compare).
    const idx = MUTED_CAPTIONS.findIndex(([a, b]) => s >= a && s < b);
    if (idx !== capIdx) setCapIdx(idx);
    // Time-based retention milestones — far more useful than %-quartiles for a 17min VSL.
    // Tells us how deep into the video people actually get (where they drop off).
    for (const [sec, label] of [[30, "30s"], [60, "1m"], [120, "2m"], [300, "5m"], [600, "10m"]] as const) {
      if (s >= sec && !fired.current.has(label)) {
        fired.current.add(label);
        logEvent("vsl_t" + label);
      }
    }
    // Keep %-quartiles too (pixel side, for Meta custom audiences later)
    const p = v.currentTime / v.duration;
    for (const [t, label] of [[0.25, "25"], [0.5, "50"], [0.75, "75"]] as const) {
      if (p >= t && !fired.current.has("q" + label)) {
        fired.current.add("q" + label);
        gtm.vslProgress(Number(label));
      }
    }
  }
  function onPlay() {
    // Fires when the muted autoplay actually starts — "video began" for everyone who reaches the page.
    if (!fired.current.has("auto")) { fired.current.add("auto"); logEvent("vsl_autoplay"); }
  }
  function unmute() {
    const v = ref.current;
    if (v) { v.muted = false; v.volume = 1; if (v.paused) void v.play().catch(() => {}); }
    if (!fired.current.has("play")) { fired.current.add("play"); gtm.vslPlay(); logEvent("vsl_play"); }
    setUnmuted(true);
  }
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#0E2541] shadow-[0_6px_30px_rgba(14,37,65,0.10)]"
      style={{ aspectRatio: "16/9" }}
    >
      <video
        ref={ref}
        src="/videos/vsl_emocional_v3.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onPlay={onPlay}
        onTimeUpdate={onTime}
        onEnded={() => { if (!fired.current.has("done")) { fired.current.add("done"); gtm.vslComplete(); logEvent("vsl_complete"); } }}
        className="w-full h-full object-cover"
      />
      {!unmuted && (
        <button
          type="button"
          onClick={unmute}
          className="absolute inset-0 flex flex-col items-center justify-between text-left"
          aria-label="Tap for sound"
        >
          {/* Big synced captions — the muted pitch. Top-anchored so the video's own
              burned-in captions (bottom) never double up. */}
          <span className="w-full px-4 pt-4 sm:px-8 sm:pt-7 bg-gradient-to-b from-black/55 via-black/25 to-transparent pb-10">
            <span className="block max-w-[34ch] mx-auto text-center text-white font-bold leading-snug text-lg sm:text-2xl [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
              {capIdx >= 0 ? MUTED_CAPTIONS[capIdx][2] : "He's explaining why nothing you tried has worked…"}
            </span>
          </span>
          <span className="mb-4 sm:mb-6 mx-auto flex items-center gap-2.5 rounded-full bg-[#C9A14A] pl-2.5 pr-5 py-2 shadow-2xl animate-pulse">
            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </span>
            <span className="text-white text-sm sm:text-base font-bold tracking-wide whitespace-nowrap">🔊 Tap to listen</span>
          </span>
        </button>
      )}
    </div>
  );
}

// ─── Inline Order Form ──────────────────────────────
function OrderForm({ id, priceToday, prefillEmail, prefillWhatsapp }: {
  id?: string;
  priceToday: number;
  prefillEmail?: string;
  prefillWhatsapp?: string;
}) {
  const [email, setEmail] = useState(prefillEmail || "");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState(prefillWhatsapp || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  // Hydrate after async fetch on parent
  useEffect(() => { if (prefillEmail) setEmail(prefillEmail); }, [prefillEmail]);
  useEffect(() => { if (prefillWhatsapp) setWhatsapp(prefillWhatsapp); }, [prefillWhatsapp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast({ title: "Enter your email to continue", variant: "destructive" });
      return;
    }
    logEvent("form_submit");
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
      const urlParams =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const utm = {
        utm_source: urlParams.get("utm_source") || "",
        utm_medium: urlParams.get("utm_medium") || "",
        utm_campaign: urlParams.get("utm_campaign") || "",
        utm_content: urlParams.get("utm_content") || "",
      };
      // Shared event_id so browser fbq Lead and server-side CAPI Lead dedupe
      const leadEventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      gtm.lead(email.trim(), leadEventId);
      // Hotmart is a hosted checkout: the URL is built here, from the offer
      // codes in the build, and there is no session to ask the API for. If it
      // comes back empty the offer is not configured — say so rather than send
      // a buyer to a dead page.
      const url = hotmartCheckoutUrl("front", {
        email: email.trim(),
        tracking: {
          h: heroVariant,
          s: utm.utm_source,
          c: utm.utm_content,
        },
      });
      if (!url) {
        toast({ title: "Checkout is temporarily unavailable. Please try again shortly.", variant: "destructive" });
        return;
      }

      // Write the lead down first: it is what enrols an abandoned checkout in
      // the follow-up drip and what fires CAPI Lead and InitiateCheckout from
      // our server. It must never hold up the sale, so a failure here is
      // swallowed and the buyer goes to Hotmart anyway.
      try {
        await customFetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim() || null,
            whatsapp: whatsapp.trim() || null,
            hero_variant: heroVariant,
            fbp: cookieValue("_fbp"),
            fbc: resolveFbc(),
            lead_event_id: leadEventId,
            ...utm,
          }),
        });
      } catch { /* noop */ }

      gtm.initiateCheckout(email.trim(), null);
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-white border border-[#D1D5DB] rounded-xl px-4 py-3.5 text-base text-[#0E2541] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0E2541] focus:ring-2 focus:ring-[#0E2541]/10 transition-all"
          />
        </label>

        <p className="text-[11px] text-[#9CA3AF] -mt-1">
          Instant access — you set your password right after checkout.
        </p>

        {/* The Recovery Pack used to be a checkbox here. It is now the native
            order bump on the Hotmart checkout, one screen later, where it is
            one click and no second charge. Ticking it in both places is how a
            buyer pays 19 EUR twice. */}

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
          <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]"><Lock className="w-3 h-3" /> Secure checkout by Hotmart</span>
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
        {CURRENCY}{priceToday} today · {CURRENCY}{PRICE_AFTER} from {BUMP_LABEL} · {GUARANTEE_DAYS}-day refund · keep everything
      </p>
    </div>
  );
}

// ──────────────────── MAIN ─────────────────────────
// Map quiz type → human label for the welcome bar
const TYPE_BADGE: Record<string, string> = {
  onset: "Onset Insomniac",
  maintenance: "3am Waker",
  mixed: "Mixed Pattern",
  circadian: "Circadian Disrupted",
};

export default function Landing() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const cd = useCountdown(BUMP_DATE);
  const priceToday = cd.expired ? PRICE_AFTER : PRICE_TODAY;
  const { key: heroKey, variant: hero } = useHeroVariant();
  const [showSticky, setShowSticky] = useState(false);
  const [quizProfile, setQuizProfile] = useState<{ type: string; email: string; whatsapp: string } | null>(null);

  // Detect ?qp=<profile_id> arrival from /quiz — fetch profile to prefill form + show welcome bar
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search).get("qp");
    if (!qp) return;
    fetch("/api/quiz/profile/" + encodeURIComponent(qp))
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d?.profile) {
          setQuizProfile({ type: d.profile.type, email: d.profile.email || "", whatsapp: d.profile.whatsapp || "" });
          logEvent("homepage_from_quiz");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fired = new Set<string>();
    const onScroll = () => {
      setShowSticky(window.scrollY > 700);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = window.scrollY / max;
      if (pct >= 0.5 && !fired.has("50")) { fired.add("50"); logEvent("scroll_50"); }
      if (pct >= 0.75 && !fired.has("75")) { fired.add("75"); logEvent("scroll_75"); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Shared event_id so browser pixel and server-side CAPI dedupe
    const eventId = `vc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    gtm.viewVSL(eventId);
    logEvent("page_view");
    // Server-side ViewContent (CAPI) — deterministic attribution, immune to ITP/adblocker
    try {
      const cookies = document.cookie;
      const cookieValue = (k: string) => {
        const m = cookies.match(new RegExp("(?:^|;\\s*)" + k + "=([^;]+)"));
        return m ? m[1] : "";
      };
      const urlParams = new URLSearchParams(window.location.search);
      void fetch("/api/track/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fbp: cookieValue("_fbp"),
          fbc: resolveFbc(),
          hero_variant: window.sessionStorage.getItem("sw_hero_variant") || "default",
          utm_source: urlParams.get("utm_source") || "",
          utm_medium: urlParams.get("utm_medium") || "",
          utm_campaign: urlParams.get("utm_campaign") || "",
          utm_content: urlParams.get("utm_content") || "",
          event_id: eventId,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, []);

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
      {/* Quiz welcome bar — only when arriving from /quiz with ?qp= */}
      {quizProfile && (
        <div className="bg-[#C9A14A] text-center py-2 px-4 border-b border-[#B58D38]">
          <p className="text-xs sm:text-sm font-semibold text-white tracking-wide">
            Welcome, <strong>{TYPE_BADGE[quizProfile.type] || "Sleeper"}</strong> — your personalized program is below ↓
          </p>
        </div>
      )}

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

      {/* ═══════════════ EMPATHY ═══════════════ */}
      <section className="bg-[#0E2541] py-16">
        <Section>
          <h2
            className="text-3xl sm:text-4xl text-center text-white leading-[1.15] tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
          >
            You don't just have a sleep problem.<br />
            <span className="italic text-[#C9A14A]">You have a life problem.</span>
          </h2>
          <div className="mt-7 space-y-4 text-[#C7D2E0] text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-center">
            <p>The fog that makes you forget what someone said five minutes ago. The fuse so short you snap at the people you love — and hate yourself for it after. The quiet dread at 10 p.m. because you already know what's coming.</p>
            <p>And lately, the worst part: wondering if this foggy, exhausted person is just <em>who you are now.</em></p>
            <p className="text-white font-semibold text-xl sm:text-2xl pt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              It's not. It's what years of broken sleep do to a brain that never gets to fully power down — and a brain that learned to stay alert can be taught to let go.
            </p>
          </div>
        </Section>
      </section>

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

          <OrderForm
            id="order-form"
            priceToday={priceToday}
            prefillEmail={quizProfile?.email}
            prefillWhatsapp={quizProfile?.whatsapp}
          />

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
              a: "No. Enter your email, pay through our checkout, then set your password right after. Your account is created automatically — zero friction. You're inside the protocol in under 2 minutes.",
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
      <footer className="bg-[#FAFAF7] pt-10 pb-28 px-5 border-t border-[#EFEFEC]">
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

      {/* Sticky CTA — keeps the offer + risk reversal in reach at all times */}
      {showSticky && !cd.expired && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 bg-[#0E2541]/95 backdrop-blur border-t border-[#C9A14A]/40 px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="leading-tight">
              <p className="text-white font-bold text-sm">Start tonight — {CURRENCY}{priceToday}</p>
              <p className="text-white/70 text-[11px]">{GUARANTEE_DAYS}-night refund · keep everything</p>
            </div>
            <button
              onClick={scrollToOrder}
              className="shrink-0 bg-[#C9A14A] hover:bg-[#B58D38] text-white font-extrabold text-sm py-3 px-5 rounded-xl flex items-center gap-1.5"
            >
              Get access <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
