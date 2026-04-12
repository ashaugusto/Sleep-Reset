import { Moon, CheckCircle2, Star, Shield, Truck, MessageCircle, AlertTriangle, Package, Clock, Zap, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { solutionEvents } from "@/lib/gtm";

// ─── Config ───────────────────────────────────────
const BRAND = "Sleep Rewire";
const PRODUCTS = "Xanax 1mg & Valium 10mg";
const CURRENCY = "€";
const WHATSAPP_NUMBER = "353832061519";
const WHATSAPP_MESSAGE = encodeURIComponent(
  `Hi! I'd like to order from Sleep Rewire. Can you tell me about the packs? 🌙`
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const PACKS = [
  { name: "Trial Pack", qty: 4, price: 30, bonus: "", label: "" },
  { name: "Starter Pack", qty: 7, price: 45, bonus: "5 + 2 free", label: "" },
  { name: "Value Pack", qty: 12, price: 70, bonus: "10 + 2 free", label: "POPULAR" },
  { name: "Best Deal", qty: 18, price: 90, bonus: "15 + 3 free", label: "BEST VALUE" },
];

const ALLOWED_COUNTRIES = ["IE", "CH", "BR"];
const REDIRECT_URL = "https://sleepwired.com";

// ─── Tracking — uses centralized gtm events ──────
function trackSolution(event: string, extra?: Record<string, unknown>) {
  try {
    const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (!Array.isArray(dl)) return;
    dl.push({ event, page_type: "solution", product: PRODUCTS, currency: "EUR", ...extra });
  } catch { /* silent */ }
}

// ─── Geo-gate hook ────────────────────────────────
function useGeoGate() {
  const [status, setStatus] = useState<"checking" | "allowed" | "blocked">("checking");

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        const country: string = data?.country_code ?? "";
        if (ALLOWED_COUNTRIES.includes(country)) {
          setStatus("allowed");
        } else {
          setStatus("blocked");
          window.location.replace(REDIRECT_URL);
        }
      } catch {
        setStatus("allowed");
      }
    }
    check();
  }, []);

  return status;
}

// ─── Countdown ────────────────────────────────────
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

// ─── Layout helpers ───────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`max-w-lg mx-auto px-5 ${className}`}>{children}</section>;
}
function Divider() {
  return <div className="border-t border-border/30 my-1" />;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-2">{children}</p>;
}

// ─── Warning banner ───────────────────────────────
function WarningBanner() {
  const { expired } = useMidnightCountdown();
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IE", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="bg-yellow-400 text-gray-900 text-center py-3 px-4">
      <p className="text-sm font-extrabold leading-snug">
        <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
        {expired
          ? `⚠️ WARNING: This offer may have expired — check availability on WhatsApp.`
          : `⚠️ WARNING: Limited stock available. This page may be removed at midnight on ${dateStr}.`}
      </p>
    </div>
  );
}

// ─── Countdown block ──────────────────────────────
function CountdownTimer() {
  const { h, m, s, expired } = useMidnightCountdown();
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center">
      <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">
        {expired ? "Offer may have expired — contact us on WhatsApp" : "⚡ Special price expires at midnight"}
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
    </div>
  );
}

// ─── CTA Button → WhatsApp ────────────────────────
function WhatsAppButton({ size = "default" }: { size?: "default" | "large" }) {
  function handleClick() {
    solutionEvents.whatsappClick(size);
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  }
  if (size === "large") {
    return (
      <div className="text-center">
        <button
          onClick={handleClick}
          className="inline-flex items-center justify-center gap-3 w-full max-w-sm bg-[#25D366] text-white font-extrabold text-lg py-5 px-8 rounded-2xl shadow-[0_0_40px_rgba(37,211,102,0.4)] hover:shadow-[0_0_60px_rgba(37,211,102,0.6)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          <MessageCircle className="w-6 h-6" />
          Message us now →
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Packs from {CURRENCY}30 · Delivery included · Dublin
        </p>
      </div>
    );
  }
  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-extrabold text-base py-4 rounded-xl shadow-[0_0_30px_rgba(37,211,102,0.35)] hover:shadow-[0_0_50px_rgba(37,211,102,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
    >
      <MessageCircle className="w-5 h-5" />
      Message us now →
    </button>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────
export default function Solution() {
  const geoStatus = useGeoGate();

  useEffect(() => {
    if (geoStatus === "allowed") {
      solutionEvents.viewSolution();
    }
  }, [geoStatus]);

  if (geoStatus === "checking") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (geoStatus === "blocked") {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      <WarningBanner />

      {/* ── Nav ── */}
      <header className="flex items-center justify-between px-5 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <span className="font-bold text-base tracking-tight">{BRAND}</span>
        </div>
        <button
          onClick={() => { solutionEvents.whatsappClick("nav"); window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer"); }}
          className="flex items-center gap-1.5 text-xs text-[#25D366] hover:text-[#1ebe5a] transition-colors font-semibold"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
      </header>

      {/* ════════════════════════════════════
          HERO
      ════════════════════════════════════ */}
      <Section className="pt-4 pb-8 text-center">

        {/* Promo badge */}
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star className="w-3 h-3 fill-current" />
          Fast & discreet · All prices include delivery
        </div>

        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">
          Sleep Sorted. Delivered.
        </p>

        <h1 className="text-[2rem] font-extrabold leading-[1.15] mb-5">
          Struggling to switch off?{" "}
          <span className="text-primary">We deliver real sleep support straight to your door in Dublin.</span>
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-5">
          <strong className="text-foreground">{PRODUCTS}</strong> — prescribed worldwide for anxiety and sleep disorders. Fast-acting, clinically proven. No waiting lists, no hassle.
        </p>

        {/* ── Pack pricing ── */}
        <div className="space-y-2.5 mb-7">
          {PACKS.map((pack) => (
            <div key={pack.name} className={`flex items-center justify-between p-4 rounded-2xl border ${pack.label === "BEST VALUE" ? "border-primary/50 bg-primary/5 shadow-[0_0_30px_rgba(139,92,246,0.12)]" : pack.label === "POPULAR" ? "border-yellow-400/40 bg-yellow-400/5" : "border-border/50 bg-card/40"}`}>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold text-foreground">{pack.name}</p>
                  {pack.label && <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pack.label === "BEST VALUE" ? "bg-primary/20 text-primary" : "bg-yellow-400/20 text-yellow-400"}`}>{pack.label}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{pack.qty} units{pack.bonus ? ` (${pack.bonus})` : ""} · delivered</p>
              </div>
              <p className="text-xl font-extrabold text-foreground">{CURRENCY}{pack.price}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mb-5">
          All prices include delivery up to 10km from Dublin city centre. Most orders arrive within 30 minutes.
        </p>

        <WhatsAppButton size="large" />
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          3 SCENARIOS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Sound familiar?</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-8 leading-snug">
          Every night, one of these{" "}
          <span className="text-primary">3 scenarios</span> plays out for poor sleepers:
        </h2>

        {[
          {
            emoji: "😤",
            title: "Scenario #1 — Your brain won't switch off",
            desc: "You're exhausted. You lie down. But your mind turns on like a machine — worst-case scenarios, old conversations, tomorrow's problems. Your chest tightens. Your heart won't slow down. The harder you try to force sleep, the wider awake you become. The clock says 3am.",
            bad: true,
          },
          {
            emoji: "😰",
            title: "Scenario #2 — You crash, then wake at 3am",
            desc: "You fall asleep quickly — but bolt awake at 3am with a jolt of anxiety. Your mind immediately starts racing. You lie there staring at the ceiling, adrenaline running. By the time you finally drift off, it's almost time to get up. Every. Single. Night.",
            bad: true,
          },
          {
            emoji: "😴",
            title: "Scenario #3 — You fall asleep and stay asleep",
            desc: "You're in bed, calm. The anxiety fades within minutes. Sleep comes fast. You sleep through the night and wake up actually feeling rested. This is what Xanax 1mg & Valium 10mg reliably deliver.",
            bad: false,
          },
        ].map((s) => (
          <div
            key={s.title}
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
              <p className="text-xs font-semibold text-primary mt-3">
                ← This is what you get. Order now via WhatsApp.
              </p>
            )}
          </div>
        ))}
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          PRODUCTS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>The products</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Clinically Proven,{" "}
          <span className="text-primary">Fast-Acting</span>
        </h2>

        <div className="space-y-4 mb-6">
          <div className="p-5 bg-card/50 border border-primary/30 rounded-2xl">
            <p className="text-base font-extrabold text-foreground mb-1">Xanax 1mg <span className="text-primary">(Alprazolam)</span></p>
            <p className="text-xs text-muted-foreground leading-relaxed">Fast-acting benzodiazepine. Reduces anxiety within 15–30 minutes. Helps the mind quiet down so sleep comes naturally. Widely prescribed for generalised anxiety disorder and panic.</p>
          </div>
          <div className="p-5 bg-card/50 border border-primary/30 rounded-2xl">
            <p className="text-base font-extrabold text-foreground mb-1">Valium 10mg <span className="text-primary">(Diazepam)</span></p>
            <p className="text-xs text-muted-foreground leading-relaxed">Long-acting benzodiazepine. Promotes deep, uninterrupted sleep. Reduces muscle tension and night-time anxiety. Ideal for those who wake repeatedly through the night.</p>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Discreet packaging. No questions asked.</strong> We deliver directly to your address in Dublin. Fast and confidential.
          </p>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          BENEFITS LIST
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Is this for you?</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          This Is For You If…
        </h2>
        <div className="space-y-3 mb-6">
          {[
            "Your mind races the moment you try to sleep — even when you're exhausted",
            "Anxiety or stress is the main reason you can't fall or stay asleep",
            "You wake up at 3am with a jolt of worry and can't get back to sleep",
            "You feel tired during the day even after hours in bed",
            "You've tried melatonin, CBD, and apps — with no results",
            "You want something that actually works, delivered discreetly to your door",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3.5 bg-card/50 border border-border/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          SOCIAL PROOF
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>What customers are saying</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Real People,{" "}
          <span className="text-primary">Real Results</span>
        </h2>

        <div className="space-y-4">
          {[
            {
              name: "Ana R.",
              location: "Dublin 4",
              text: "I hadn't slept more than 4 hours straight in months. First night with Xanax 1mg and I slept through to 7am. I kept going and now I sleep through the night every night. Changed my life.",
              stars: 5,
            },
            {
              name: "Miguel S.",
              location: "Dublin 2",
              text: "I was sceptical but the Valium 10mg made an immediate difference. I fall asleep within 20 minutes and I no longer wake up at 3am panicking. Delivery was fast and discreet.",
              stars: 5,
            },
            {
              name: "Carla M.",
              location: "Dublin 8",
              text: "Finally something that works. No grogginess the next morning. I feel genuinely rested when I wake up for the first time in years. The Buy 1 Get 2 Free offer was a bonus.",
              stars: 5,
            },
          ].map((r) => (
            <div key={r.name} className="bg-card border border-border/50 rounded-2xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3 italic">"{r.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{r.name[0]}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          ORDER BOX
      ════════════════════════════════════ */}
      <Section className="py-8" id="order">
        <div className="bg-card border-2 border-primary/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(139,92,246,0.15)]">

          {/* Header */}
          <div className="bg-primary px-5 py-4 text-center">
            <p className="text-sm font-extrabold text-primary-foreground uppercase tracking-wider">
              Order now — via WhatsApp
            </p>
          </div>

          {/* Pack pricing */}
          <div className="px-5 pt-6 pb-5 border-b border-border/50">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider text-center mb-4">Choose your pack</p>
            <div className="space-y-2.5">
              {PACKS.map((pack) => (
                <div key={pack.name} className={`flex items-center justify-between p-3.5 rounded-xl border ${pack.label === "BEST VALUE" ? "border-primary/50 bg-primary/5" : pack.label === "POPULAR" ? "border-yellow-400/40 bg-yellow-400/5" : "border-border/40 bg-card/30"}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{pack.name}</p>
                      {pack.label && <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${pack.label === "BEST VALUE" ? "bg-primary/20 text-primary" : "bg-yellow-400/20 text-yellow-400"}`}>{pack.label}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{pack.qty} units{pack.bonus ? ` (${pack.bonus})` : ""}</p>
                  </div>
                  <p className="text-lg font-extrabold text-foreground">{CURRENCY}{pack.price}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-3">All prices include delivery · Most orders arrive within 30 minutes</p>
          </div>

          {/* What's included */}
          <div className="px-5 py-5 border-b border-border/50 space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              ✅ Every order includes:
            </p>
            {[
              { icon: Package, label: "Xanax 1mg (Alprazolam) — fast-acting anxiety & sleep relief" },
              { icon: Package, label: "Valium 10mg (Diazepam) — deep, uninterrupted sleep" },
              { icon: Truck,   label: "Delivery included — up to 10km from Dublin city centre" },
              { icon: Clock,   label: "WhatsApp support — response in under 1 hour" },
              { icon: Shield,  label: "Satisfaction guarantee — if it doesn't arrive, we reship" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-5 py-6 space-y-3">
            <WhatsAppButton />
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                Discreet delivery
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Truck className="w-3 h-3" />
                Free Dublin delivery
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                Fast response
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/70 text-center">
              Packs from {CURRENCY}30 · Delivery included · No subscription
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          COUNTDOWN
      ════════════════════════════════════ */}
      <Section className="py-8">
        <CountdownTimer />
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          FAQ
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>Frequently asked questions</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Got Questions?
        </h2>

        <div className="space-y-3">
          {[
            {
              q: "How does the ordering process work?",
              a: "Click the WhatsApp button, choose your pack and we confirm your order. We arrange delivery in Dublin — most orders arrive within 30 minutes.",
            },
            {
              q: "What packs are available?",
              a: "Trial Pack (4 for €30), Starter Pack (7 for €45, includes 2 free), Value Pack (12 for €70, includes 2 free), and our Best Deal (18 for €90, includes 3 free). All prices include delivery.",
            },
            {
              q: "How long does delivery take?",
              a: "We deliver within 10km of Dublin city centre. Most orders arrive within 30 minutes. Same-day delivery available 7 days a week, from 1pm to midnight.",
            },
            {
              q: "Is the delivery discreet?",
              a: "Yes, completely. Packages arrive in plain, unmarked packaging with no indication of the contents.",
            },
            {
              q: "What if my order doesn't arrive?",
              a: "Contact us on WhatsApp and we will reship your order at no extra cost. Your satisfaction is guaranteed.",
            },
            {
              q: "Are delivery costs included?",
              a: "Yes — all prices include delivery up to 10km from Dublin city centre. No hidden fees, no surprises. What you see is what you pay.",
            },
          ].map((item, i) => (
            <FaqItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════ */}
      <Section className="py-10 text-center">
        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-4">
          Don't leave it for another night
        </p>
        <h2 className="text-2xl font-extrabold mb-4 leading-snug">
          Tonight could be{" "}
          <span className="text-primary">the last night</span> you sleep badly.
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-7">
          {PRODUCTS} — Packs from {CURRENCY}30. All prices include delivery in Dublin.
        </p>
        <WhatsAppButton size="large" />
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 mt-4">
        <div className="max-w-lg mx-auto px-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{BRAND}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            For adults only. Keep out of reach of children. Use responsibly.
          </p>
          <p className="text-xs text-muted-foreground">
            Orders and support:{" "}
            <button
              onClick={() => { solutionEvents.whatsappClick("footer"); window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer"); }}
              className="text-[#25D366] hover:underline font-semibold"
            >
              WhatsApp
            </button>
          </p>
        </div>
      </footer>

    </div>
  );
}

// ─── FAQ accordion item ────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-card/80 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        <span className="text-primary text-lg font-bold shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
