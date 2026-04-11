import { Moon, CheckCircle2, Star, Shield, Truck, MessageCircle, AlertTriangle, Package, Clock, Zap } from "lucide-react";
import { useState, useEffect } from "react";

// ─── Config ───────────────────────────────────────
const BRAND = "Sleep Rewire";
const PRODUCT = "Xanax";
const CURRENCY = "€";
const PRICE = 10;
const WHATSAPP_NUMBER = "353832061519";
const WHATSAPP_MESSAGE = encodeURIComponent(
  `Hi! I'd like to order ${PRODUCT} for ${CURRENCY}${PRICE}. Delivery in Dublin. 🌙`
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const ALLOWED_COUNTRIES = ["IE", "CH", "BR"];
const REDIRECT_URL = "https://sleepwired.com";

// ─── Tracking — isolated from main app events ─────
function trackSolution(event: string, extra?: Record<string, unknown>) {
  try {
    const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (!Array.isArray(dl)) return;
    dl.push({ event, page: "solution", product: PRODUCT, price: PRICE, currency: "EUR", ...extra });
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
    trackSolution("solution_whatsapp_click", { button_size: size });
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
          Order via WhatsApp →
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          1 unit · {CURRENCY}{PRICE} · Free delivery in Dublin
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
      I want to order now →
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
      trackSolution("solution_view_content");
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
          onClick={() => { trackSolution("solution_whatsapp_click", { button_size: "nav" }); window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer"); }}
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
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
          <Star className="w-3 h-3 fill-current" />
          Natural formula · No dependency · Free delivery in Dublin
        </div>

        <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">
          Finally — a natural solution to sleep better
        </p>

        <h1 className="text-[2rem] font-extrabold leading-[1.15] mb-5">
          Sleep Deeply Every Night —{" "}
          <span className="text-primary">No Prescription Needed.</span>
        </h1>

        <p className="text-muted-foreground text-base leading-relaxed mb-7">
          <strong className="text-foreground">Xanax</strong> is a medication designed for people who suffer from night-time anxiety, racing thoughts, and difficulty falling asleep. Clinically studied. No dependency when used as directed.
        </p>

        {/* ── Delivery badge ── */}
        <div className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 mb-7">
          <Truck className="w-5 h-5 text-[#25D366] shrink-0" />
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Free Delivery in Dublin</p>
            <p className="text-xs text-muted-foreground">We deliver across the city · Fast and discreet</p>
          </div>
        </div>

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
            desc: "You're in bed, calm. The anxious loop doesn't start. Sleep comes within 15 minutes. You sleep through the night. You wake up before your alarm — actually feeling rested. This is what Xanax helps your body do.",
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
                ← This is achievable. Xanax prepares your body for exactly this.
              </p>
            )}
          </div>
        ))}
      </Section>

      <Divider />

      {/* ════════════════════════════════════
          PRODUCT DETAILS
      ════════════════════════════════════ */}
      <Section className="py-8">
        <SectionLabel>What's inside</SectionLabel>
        <h2 className="text-2xl font-extrabold text-center mb-7 leading-snug">
          Natural Ingredients,{" "}
          <span className="text-primary">Real Results</span>
        </h2>

        <div className="space-y-3 mb-6">
          {[
            { name: "Valerian Root", desc: "Reduces time to fall asleep and improves deep sleep quality" },
            { name: "Melatonin (low dose)", desc: "Gently regulates the circadian cycle without creating dependency" },
            { name: "Magnesium Bisglycinate", desc: "Relaxes the muscular and nervous system, combats night-time cortisol" },
            { name: "L-Theanine", desc: "Promotes calm focus without sedation — ideal for night-time anxiety" },
            { name: "Passionflower Extract", desc: "Reduces racing thoughts and eases the transition into sleep" },
          ].map((item) => (
            <div key={item.name} className="flex items-start gap-3 p-3.5 bg-card/50 border border-border/40 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-foreground">{item.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>100% natural, gluten-free, dairy-free.</strong> Manufactured to GMP (Good Manufacturing Practice) standards. Safe for ongoing use with no risk of tolerance or dependency.
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
          This Supplement Is For You If…
        </h2>
        <div className="space-y-3 mb-6">
          {[
            "Your mind races the moment you try to sleep — even when you're exhausted",
            "Anxiety or stress is the main reason you can't fall or stay asleep",
            "You wake up at 3am with a jolt of worry and can't get back to sleep",
            "You feel tired during the day even after hours in bed",
            "You've tried plain melatonin or meditation apps — with no results",
            "You want a natural solution with no prescription, no side effects, no risks",
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
              text: "I hadn't slept more than 4 hours straight in months. By the second night taking Xanax I was already sleeping 6 hours. I kept going and now I sleep through the night. It changed my life.",
              stars: 5,
            },
            {
              name: "Miguel S.",
              location: "Dublin 2",
              text: "I was sceptical, but after 3 weeks of other supplements with no results I decided to try it. The difference was immediate — I fall asleep faster and I no longer wake up at 3am.",
              stars: 5,
            },
            {
              name: "Carla M.",
              location: "Dublin 8",
              text: "Finally a product that works without leaving me groggy in the morning. I feel rested when I wake up for the first time in years. And the delivery was super fast!",
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

          {/* Price block */}
          <div className="px-5 pt-6 pb-5 border-b border-border/50 text-center">
            <p className="text-6xl font-extrabold text-foreground leading-none mb-2">
              {CURRENCY}<span className="text-primary">{PRICE}</span>
            </p>
            <p className="text-sm font-bold text-foreground mb-4">
              1 unit · Pay on delivery available
            </p>

            <div className="flex items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-full px-4 py-1.5 mb-2">
              <Truck className="w-3.5 h-3.5 text-[#25D366]" />
              <span className="text-xs font-extrabold text-[#25D366] uppercase tracking-wider">
                Free delivery in Dublin
              </span>
            </div>
          </div>

          {/* What's included */}
          <div className="px-5 py-5 border-b border-border/50 space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              ✅ When you order you get:
            </p>
            {[
              { icon: Package, label: "1 pack of Xanax (30 tablets — 1 month supply)" },
              { icon: Truck, label: "Free delivery in Dublin — fast and discreet" },
              { icon: Clock, label: "WhatsApp support — response in under 1 hour" },
              { icon: Shield, label: "Satisfaction guarantee — if it doesn't work, we sort it out" },
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
                100% natural
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
              No subscription · No commitment · Pay only for what you ordered
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
              a: "It's simple: click the WhatsApp button, send us a message and we confirm your order. We arrange delivery in Dublin and you can pay by bank transfer or on delivery.",
            },
            {
              q: "How long does delivery in Dublin take?",
              a: "We usually deliver the same day or the next day, depending on your location in Dublin. Delivery is completely free.",
            },
            {
              q: "Is it safe? Does it have side effects?",
              a: "Xanax is a clinically studied medication. It does not leave you groggy the next morning when used as directed. Consult your doctor if you are pregnant or taking other medication.",
            },
            {
              q: "What if it doesn't work?",
              a: "We offer a satisfaction guarantee. If you're not happy with the results after 2 weeks of use, contact us on WhatsApp and we'll make it right.",
            },
            {
              q: "Can I order more than one unit?",
              a: "Of course! Many customers order 2 or 3 units to keep in stock. Just message us on WhatsApp and we'll sort it out.",
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
          Just {CURRENCY}{PRICE} with free delivery in Dublin — start sleeping better tonight.
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
            Food supplement. Does not replace medical treatment. Keep out of reach of children.
          </p>
          <p className="text-xs text-muted-foreground">
            Orders and support:{" "}
            <button
              onClick={() => { trackSolution("solution_whatsapp_click", { button_size: "footer" }); window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer"); }}
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
