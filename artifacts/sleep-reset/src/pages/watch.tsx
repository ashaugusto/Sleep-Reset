import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import {
  Play, Info, Search, Bell, ChevronRight,
  X, Plus, ThumbsUp,
  Headphones, Calculator, FileText, Sunrise, ListChecks, Infinity as InfinityIcon,
} from "lucide-react";
import { gtm } from "@/lib/gtm";

// ═══════════════════════════════════════════════════════════════════
// /watch — Netflix-style streaming homepage for Sleep Wired.
// The product (7-night protocol) is presented as a limited series:
// billboard trailer + episode rows qualify the lead through video
// instead of long-form copy. Visual target: indistinguishable from
// Netflix's browse UI (palette, type, motion, layout) — brand assets
// (logo, ta-dum) are our own.
// ═══════════════════════════════════════════════════════════════════

const BRAND = "SLEEP WIRED";
const PRICE_TODAY = 27;
const PRICE_ANCHOR = 47; // open-beta price; rises to €47 at public launch (honest anchor, mirrors landing's price bump — no fake resetting countdown)
const BUMP_PRICE = 19;   // Recovery Pack — order bump (STRIPE_PRICE_PREMIUM). Same €19 as the /upgrade OTO.

// ─── Recovery Pack bump — shared across every CTA ───────────────────
// The bump lives module-level (not inside a single component's useState) so
// that ticking the Recovery Pack updates the price on EVERY checkout CTA at
// once — nav, sticky bar, end-card, info modal, FAQ, billboard, offer bar —
// instead of only the offer bar. Mixed prices across CTAs confuse the buyer
// on the way to Stripe. useBump() subscribes each CTA; startCheckout() reads
// the same flag by default so the express order always matches what's shown.
let bumpOn = false;
const bumpSubs = new Set<() => void>();
function setBumpGlobal(next: boolean) {
  if (bumpOn === next) return;
  bumpOn = next;
  bumpSubs.forEach((fn) => fn());
}
function useBump(): boolean {
  return useSyncExternalStore(
    (cb) => { bumpSubs.add(cb); return () => { bumpSubs.delete(cb); }; },
    () => bumpOn,
    () => false, // SSR snapshot — bump always starts off, no hydration mismatch
  );
}
// Displayed prices, bump-aware — used by every CTA so they move together.
const todayPrice = (b: boolean) => (b ? PRICE_TODAY + BUMP_PRICE : PRICE_TODAY);
const anchorPrice = (b: boolean) => (b ? PRICE_ANCHOR + BUMP_PRICE : PRICE_ANCHOR);
const CURRENCY = "€";

// Episode map — dedicated cuts from the VSL (audio-normalized v3).
// TOF narrative: connection → pain → curiosity. The hard sell lives on /start.
type Episode = {
  n: number;
  title: string;
  synopsis: string;
  duration: string;
  thumb: string;
  src: string;
  progress?: number; // 0-100, "continue watching" bar
};
const EPISODES: Episode[] = [
  {
    n: 1,
    title: "The 3AM Loop",
    synopsis: "Coffee does nothing. Your brain is buffering by 10am. And at 10pm the dread creeps in — because you know what's coming.",
    duration: "1m 46s",
    thumb: "/images/watch/ep1.jpg?v=2",
    src: "/videos/eps/ep1.mp4",
    progress: 35,
  },
  {
    n: 2,
    title: "Why Nothing Worked",
    synopsis: "Melatonin, teas, meditation apps, sleep hygiene, wine, pills. They all failed you for one single reason.",
    duration: "1m 54s",
    thumb: "/images/watch/ep2.jpg?v=2",
    src: "/videos/eps/ep2.mp4",
  },
  {
    n: 3,
    title: "The Mechanism",
    synopsis: "Your brain learned that night time is dangerous. It's called hyperarousal — and the harder you try to sleep, the worse it gets.",
    duration: "2m 02s",
    thumb: "/images/watch/ep3.jpg?v=2",
    src: "/videos/eps/ep3.mp4",
  },
  {
    n: 4,
    title: "Why Exactly 3:07 AM",
    synopsis: "There's a reason millions of people wake at the same hour every night. It's a hormone pulse — and in your brain it lands like an alarm.",
    duration: "1m 33s",
    thumb: "/images/watch/ep4.jpg?v=2",
    src: "/videos/eps/ep4.mp4",
  },
  {
    n: 5,
    title: "The Way Back",
    synopsis: "The most proven insomnia treatment on Earth — recommended first-line by the NHS and Mayo Clinic. So why has nobody given it to you?",
    duration: "2m 22s",
    thumb: "/images/watch/ep5.jpg?v=2",
    src: "/videos/eps/ep5.mp4",
  },
];

// "Top 10 Tonight" — the audience's own nights, as poster cards.
// Each poster is a moody cold-blue still of the pain it names — the
// viewer recognizes their own night and feels seen before the offer.
const TOP10: { label: string; sub: string; img: string }[] = [
  { label: "Waking at 3:07 AM", sub: "Thriller", img: "/images/watch/top1.jpg" },
  { label: "Tired but Wired", sub: "Psychological", img: "/images/watch/top2.jpg" },
  { label: "Racing Mind at Lights-Out", sub: "Drama", img: "/images/watch/top3.jpg" },
  { label: "Melatonin Does Nothing", sub: "Documentary", img: "/images/watch/top4.jpg" },
  { label: "The Sunday-Night Dread", sub: "Horror", img: "/images/watch/top5.jpg" },
  { label: "Coffee Until Noon", sub: "Comedy-drama", img: "/images/watch/top6.jpg" },
  { label: "Snapping at Everyone", sub: "Family drama", img: "/images/watch/top7.jpg" },
  { label: "Scrolling Until 2AM", sub: "Reality", img: "/images/watch/top8.jpg" },
  { label: "The Nap Trap", sub: "Mystery", img: "/images/watch/top9.jpg" },
  { label: "Five Alarms Every Morning", sub: "Action", img: "/images/watch/top10.jpg" },
];

// ─── Social proof — real customers + early beta testers ─────────────
// FTC (US) / ASA (UK) / EU 2019/2161: every card carries an honest,
// per-item disclosure (`badge`). Paying customers are labelled as such;
// the original four were given free beta access and say so. NO invented
// volume metrics — the green tag paraphrases each person's own words.
const REVIEWS: { initial: string; name: string; meta: string; nights: string; badge: string; quote: string }[] = [
  // Paying customers (board-supplied, lightly adapted for length).
  { initial: "L", name: "Laura", meta: "Switzerland · 35", nights: "Waking up actually rested", badge: "Verified Sleep Wired customer",
    quote: "I invested €27 as a last attempt before going back to heavy sleep medication. It doesn't promise miracles, but it gave me something no gadget ever had: a clear night-by-night plan. The price is nothing next to waking up actually rested." },
  { initial: "M", name: "Michael", meta: "Ireland · 41", nights: "Bad nights no longer the default", badge: "Verified Sleep Wired customer",
    quote: "I paid in the middle of the night after lying awake for hours, again — exhausted all day but wired at night. What helped wasn't a magic trick, it was structure. In seven nights I went from 'no idea what I'm doing' to a routine that calmed my brain before it could spiral. I still have bad nights, but they stopped being the default." },
  { initial: "A", name: "Ana", meta: "Portugal · 33", nights: "Sunday nights no longer dreaded", badge: "Verified Sleep Wired customer",
    quote: "I bought it on a Monday after another brutal Sunday night. My problem was never falling asleep once — it was the loop: worrying about the week, replaying conversations, checking the clock every 15 minutes. The sessions taught me how to close my Sundays differently — the evening routine, the sleep window, what to do when anxiety kicks in. Sunday nights aren't something I dread anymore." },
  { initial: "K", name: "Katrin", meta: "Finland · 37", nights: "Sleep is finally predictable", badge: "Verified Sleep Wired customer",
    quote: "I paid pretty sceptical — I'd already spent money on apps and supplements that changed nothing. The difference here was a clear plan: when to go to bed, when to get up, and what to do when my mind starts racing. My sleep isn't perfect, but now it's predictable." },
  { initial: "O", name: "Omer", meta: "Turkey · 29", nights: "Sleep stopped feeling random", badge: "Verified Sleep Wired customer",
    quote: "I paid at 6am, right after a nearly sleepless night. For months I'd tried to fix my sleep with willpower alone. The protocol showed me it wasn't about trying harder, but changing specific behaviours — what time I get out of bed, how I handle waking at 3am, what I do with my phone. It didn't make me a 'perfect sleeper', but it finally stopped feeling random." },
  { initial: "S", name: "Stefanie", meta: "Germany · 34", nights: "'Tired but wired' faded", badge: "Verified Sleep Wired customer",
    quote: "I treated the €27 as a test, with almost zero expectations. The 'guided nights' format made it easy — I just hit play and followed along. After the first week, that constant 'tired but wired' feeling at night started to fade." },
  { initial: "V", name: "Vilas", meta: "Estonia · 39", nights: "Refund honored — kept the tools", badge: "Verified Sleep Wired customer",
    quote: "I bought the program and later asked for a refund because I was going through a rough personal patch — and the refund was no hassle. Even so, the first sessions made one thing clear: my problem wasn't lack of discipline, it was habits I'd never connected to my sleep. Even without finishing the 7 nights, I walked away with tools I hadn't seen in any app." },
  // Original beta testers — free early access, disclosed.
  { initial: "B", name: "Bruno", meta: "Dublin · 34", nights: "Out by Night 4", badge: "Beta tester · received free access for honest feedback",
    quote: "It used to take me ~90 minutes to fall asleep — I'd accepted that was just my brain. By Night 4–5 I was out in about 15 minutes and staying asleep until my alarm. Waking up without feeling wrecked is something I hadn't felt in years." },
  { initial: "C", name: "Caio", meta: "Curitiba · 38", nights: "Switched off by Night 3", badge: "Beta tester · received free access for honest feedback",
    quote: "I'd lie down and my mind wouldn't stop — work, bills, conversations. Meditation, sleep podcasts, nothing stuck. By Night 3 I could actually switch off in under 30 minutes, and my sleep got noticeably deeper." },
  { initial: "G", name: "Gustavo", meta: "Genève · 41", nights: "Calmer by Night 5", badge: "Beta tester · received free access for honest feedback",
    quote: "I was on the melatonin + app combo; helped one night, back to racing thoughts the next. A few nights in, the racing started to dial down, and by Night 5 I could go to bed without that 'tonight I won't sleep' panic." },
  { initial: "M", name: "Markus", meta: "Berlin · 36", nights: "Relaxed by Night 4", badge: "Beta tester · received free access for honest feedback",
    quote: "I'd get into bed already tense, like a fight with sleep every night. Didn't think a 7-night routine would change much. By Night 4 I was lying down relaxed and falling asleep faster, without that full-body tension." },
];

const FAQS: [string, string][] = [
  [
    "What is WIRED?",
    "WIRED is a 5-episode mini-series that explains, night by night, why your brain won't shut down — and the 7-night clinical protocol (CBT-I) that retrains it. You watch the episodes free, right here. The full program is the season finale: your own 7 nights.",
  ],
  [
    "How much does it cost?",
    `One payment of ${CURRENCY}${PRICE_TODAY}. No subscription, no recurring charges. Lifetime access, every future update included, and a 60-day money-back guarantee — finish the 7 nights, and if your sleep hasn't changed, you get every cent back.`,
  ],
  [
    "Is this meditation or another sleep app?",
    "No. It's CBT-I — Cognitive Behavioral Therapy for Insomnia — the method the NHS, Mayo Clinic and the American Academy of Sleep Medicine recommend before any sleeping pill. Structured, self-guided, done lying in your own bed.",
  ],
  [
    "What if it doesn't work for me?",
    "You have 60 days. Complete the 7 nights, and if you're not falling asleep faster and staying asleep longer, reply to any email and we refund you in full. No forms, no questions.",
  ],
];

// ─── Tracking (same endpoint/shape as the main landing) ─────────────
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
        hero_variant: "watch",
        client_id: clientId(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* noop */ }
}

// ─── Express checkout — Start goes straight to Stripe ───────────────
// No email form: Stripe collects the email on its hosted page, and the
// webhook upserts the lead + fires CAPI Purchase from it. We still pass
// fbp/fbc/utm so Purchase attribution survives. Falls back to the proven
// /start order form if the express endpoint is unavailable.
function cookie(k: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + k.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}
function resolveFbc(): string {
  const existing = cookie("_fbc");
  if (existing) return existing;
  if (typeof window === "undefined") return "";
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : "";
}
let checkoutInFlight = false;
async function startCheckout(bump = bumpOn) {
  if (checkoutInFlight) return;
  checkoutInFlight = true;
  logEvent(bump ? "watch_cta_click_bump" : "watch_cta_click");
  // Meta InitiateCheckout — express path has no email yet, so fire the pixel
  // with fbp/fbc-based matching only. Lets Meta optimize on IC (server-side
  // express checkout intentionally omits it). Email-gated path fires its own.
  try { gtm.initiateCheckout(""); } catch { /* noop */ }
  const fallback = () => { window.location.href = "/start#order-form"; };
  try {
    const u = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const r = await fetch("/api/checkout/express", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_variant: "watch",
        bump,
        fbp: cookie("_fbp"),
        fbc: resolveFbc(),
        utm_source: u.get("utm_source") || "",
        utm_medium: u.get("utm_medium") || "",
        utm_campaign: u.get("utm_campaign") || "",
        utm_content: u.get("utm_content") || "",
      }),
    });
    if (!r.ok) { checkoutInFlight = false; fallback(); return; }
    const { url } = await r.json();
    if (url) window.location.href = url;
    else { checkoutInFlight = false; fallback(); }
  } catch {
    checkoutInFlight = false;
    fallback();
  }
}

// ─── Email-gated checkout — captures the lead into the recovery drip ─
// Reuses /api/checkout/public: it upserts the lead (so the abandonment drip
// enrolls them if they bail on Stripe) AND fires server-side CAPI Lead + IC,
// then returns a Stripe URL. Used by the exit-intent gate below. Returns true
// if the redirect started, false so the caller can show an error.
async function startCheckoutWithEmail(email: string): Promise<boolean> {
  const v = email.trim().toLowerCase();
  const leadEventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try { gtm.lead(v, leadEventId); } catch { /* noop */ }
  try {
    const u = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const r = await fetch("/api/checkout/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: v,
        hero_variant: "watch",
        fbp: cookie("_fbp"),
        fbc: resolveFbc(),
        lead_event_id: leadEventId,
        utm_source: u.get("utm_source") || "",
        utm_medium: u.get("utm_medium") || "",
        utm_campaign: u.get("utm_campaign") || "",
        utm_content: u.get("utm_content") || "",
      }),
    });
    if (!r.ok) return false;
    const { url, session_id } = await r.json();
    try { gtm.initiateCheckout(v, session_id ?? null); } catch { /* noop */ }
    if (url) { window.location.href = url; return true; }
    return false;
  } catch {
    return false;
  }
}

// ─── Sound design (WebAudio — no asset files) ───────────────────────
// boom: cinematic two-hit sting on Play (our "ta-dum" stand-in).
// tick: sub-perceptual hover blip. All gated behind user gesture.
let audioCtx: AudioContext | null = null;
function ctx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch { return null; }
}
function boom() {
  const c = ctx(); if (!c) return;
  const t0 = c.currentTime;
  [[82, 0, 0.9], [55, 0.13, 1.4]].forEach(([freq, delay, dur]) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq as number, t0 + (delay as number));
    g.gain.setValueAtTime(0.0001, t0 + (delay as number));
    g.gain.exponentialRampToValueAtTime(0.5, t0 + (delay as number) + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (delay as number) + (dur as number));
    o.connect(g); g.connect(c.destination);
    o.start(t0 + (delay as number)); o.stop(t0 + (delay as number) + (dur as number) + 0.1);
  });
}
let lastTick = 0;
function tick() {
  const c = ctx(); if (!c) return;
  const now = Date.now();
  if (now - lastTick < 120) return;
  lastTick = now;
  const t0 = c.currentTime;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = "sine"; o.frequency.value = 1320;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.025, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + 0.1);
}

// ─── Intro overlay — the brand letter animation ─────────────────────
function Intro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
      onClick={onDone}
      style={{ animation: "swIntroFade 0.5s ease 2.9s forwards" }}
    >
      <span
        className="select-none"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "min(38vw, 240px)",
          color: "#E50914",
          lineHeight: 1,
          letterSpacing: "0.02em",
          animation: "swIntroZoom 3.2s cubic-bezier(0.4,0,0.2,1) forwards",
          textShadow: "0 0 80px rgba(229,9,20,0.45)",
        }}
      >
        W
      </span>
      <span
        className="absolute pointer-events-none"
        style={{
          width: "4px",
          height: "min(42vw, 270px)",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.85), transparent)",
          filter: "blur(2px)",
          animation: "swIntroSweep 1.5s ease-in-out 0.9s forwards",
          opacity: 0,
          transform: "translateX(-160px) rotate(12deg)",
        }}
      />
    </div>
  );
}

// ─── Billboard (hero) ───────────────────────────────────────────────
function Billboard({ onPlay, onMoreInfo }: { onPlay: () => void; onMoreInfo: () => void }) {
  const bump = useBump();
  return (
    <div className="relative w-full" style={{ height: "min(56.25vw + 120px, 92vh)", minHeight: 480 }}>
      {/* Static cinematic still (cold-blue, on-brand with the Top 10 set).
          Replaced the autoplay VSL trailer — its burned-in captions and the
          candle scene read wrong as an ambient hero. Bespoke hero pending. */}
      <img
        src="/images/watch/ep3.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
      />
      {/* Netflix gradient stack: bottom fade into page bg + left vignette for legibility */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(77deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 60%)" }} />
      <div className="absolute inset-x-0 bottom-0" style={{ height: "14.7vw", minHeight: 120, background: "linear-gradient(180deg, rgba(20,20,20,0) 0%, rgba(20,20,20,0.6) 50%, #141414 100%)" }} />

      {/* Content block — bottom-left, Netflix 4% gutter */}
      <div className="absolute bottom-[22%] sm:bottom-[28%] left-[4%] right-[4%] sm:right-auto sm:max-w-[36%] min-w-[280px]">
        <div className="flex items-center gap-2 mb-3 sm:mb-5">
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E50914", fontSize: "1.6rem", lineHeight: 1 }}>W</span>
          <span className="text-[#d2d2d2] text-[0.72rem] font-semibold tracking-[0.35em]">S E R I E S</span>
        </div>
        <h1
          className="text-white"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(3.4rem, 9vw, 7.5rem)",
            lineHeight: 0.9,
            letterSpacing: "0.01em",
            textShadow: "2px 2px 6px rgba(0,0,0,0.45)",
          }}
        >
          WIRED
        </h1>
        <p className="text-[#e5e5e5] text-[0.78rem] sm:text-sm font-medium mt-2 mb-3 [text-shadow:1px_1px_3px_rgba(0,0,0,0.6)]">
          <span className="text-[#46d369] font-bold">Based on CBT-I</span>
          <span className="mx-2">NHS · Mayo Clinic</span>
          <span className="border border-[#9b9b9b] px-1.5 py-px text-[0.65rem] mr-2">13+</span>
          Limited Series
          <span className="ml-2 border border-[#9b9b9b] rounded px-1 py-px text-[0.6rem] align-middle">HD</span>
        </p>
        <p className="hidden sm:block text-white text-[1.1vw] min-[1400px]:text-base leading-snug max-w-[34rem] [text-shadow:1px_1px_3px_rgba(0,0,0,0.7)]">
          Why your brain won't shut down at night — and the CBT-I protocol that retrains it.
          <strong className="font-semibold"> Not a series you binge. A 7-night protocol you finish</strong> — from the very bed you can't sleep in. No pills. No meditation.
        </p>
        {/* Offer line — the one purchase signal that lives above the fold on every device */}
        <p className="text-[#f5f5f5] text-[0.82rem] sm:text-sm font-semibold mt-2.5 [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
          <span className="text-[#9b9b9b] line-through mr-1.5">{CURRENCY}{anchorPrice(bump)}</span>
          <span className="text-[#46d369]">{CURRENCY}{todayPrice(bump)} once</span> · lifetime access · 60-day money-back guarantee
          {bump && <span className="text-[#f0c14b]"> · incl. Recovery Pack</span>}
        </p>
        <p className="text-[#f0c14b] text-[0.68rem] sm:text-[0.72rem] font-bold tracking-wide mt-1 [text-shadow:1px_1px_3px_rgba(0,0,0,0.8)]">
          Open-beta price — rises to {CURRENCY}{anchorPrice(bump)} at public launch
        </p>

        <div className="flex items-center gap-3 mt-4 sm:mt-6">
          <button
            type="button"
            onClick={() => { boom(); logEvent("watch_billboard_play"); onPlay(); }}
            className="flex items-center gap-2 bg-white text-black font-bold rounded-[4px] px-5 sm:px-7 py-2 sm:py-2.5 text-sm sm:text-lg hover:bg-white/80 transition-colors"
          >
            <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-black" /> Play
          </button>
          <button
            type="button"
            onClick={() => { logEvent("watch_moreinfo_open"); onMoreInfo(); }}
            className="flex items-center gap-2 text-white font-semibold rounded-[4px] px-5 sm:px-7 py-2 sm:py-2.5 text-sm sm:text-lg transition-colors"
            style={{ background: "rgba(109,109,110,0.7)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(109,109,110,0.4)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(109,109,110,0.7)")}
          >
            <Info className="w-5 h-5 sm:w-7 sm:h-7" /> More Info
          </button>
        </div>
      </div>

      {/* Right edge: maturity tab (Netflix touch) */}
      <div className="hidden sm:flex absolute right-0 bottom-[30%] items-center">
        <span
          className="text-[#dcdcdc] text-sm py-1 pl-3 pr-8"
          style={{ background: "rgba(51,51,51,0.6)", borderLeft: "3px solid #dcdcdc" }}
        >
          13+
        </span>
      </div>
    </div>
  );
}

// ─── Episode card with Netflix hover-expand ─────────────────────────
function EpCard({ ep, onOpen }: { ep: Episode; onOpen: (ep: Episode) => void }) {
  return (
    <button
      type="button"
      onClick={() => { boom(); logEvent(`watch_ep${ep.n}_open`); onOpen(ep); }}
      onMouseEnter={tick}
      className="group relative shrink-0 w-[46vw] sm:w-[300px] text-left snap-start transition-transform duration-300 sm:hover:scale-[1.28] sm:hover:z-30 sm:hover:delay-[400ms]"
      style={{ transformOrigin: "center bottom" }}
    >
      <div className="relative rounded-[4px] overflow-hidden bg-[#2f2f2f] aspect-video">
        <img src={ep.thumb} alt={ep.title} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {/* Episode numeral */}
        <span
          className="absolute left-2 bottom-1 text-white/95"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.6rem", lineHeight: 1, textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
        >
          {ep.n}
        </span>
        <span className="absolute right-2 top-2 bg-black/60 text-white text-[0.65rem] font-semibold px-1.5 py-0.5 rounded">
          {ep.duration}
        </span>
        {/* continue-watching bar */}
        {typeof ep.progress === "number" && (
          <div className="absolute bottom-0 inset-x-0 h-[3px] bg-[#5b5b5b]">
            <div className="h-full bg-[#E50914]" style={{ width: `${ep.progress}%` }} />
          </div>
        )}
        {/* hover play affordance */}
        <span className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="w-12 h-12 rounded-full bg-black/50 border-2 border-white flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </span>
        </span>
      </div>
      {/* expanded meta panel (desktop hover) */}
      <div className="hidden sm:block absolute inset-x-0 top-full bg-[#181818] rounded-b-[4px] px-3 py-2.5 opacity-0 translate-y-[-6px] pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-[400ms] transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.75)]">
        <p className="text-white text-[0.82rem] font-bold leading-tight">E{ep.n} · {ep.title}</p>
        <p className="text-[#b3b3b3] text-[0.72rem] leading-snug mt-1 line-clamp-3">{ep.synopsis}</p>
      </div>
      {/* mobile title under card */}
      <p className="sm:hidden text-[#d2d2d2] text-xs font-semibold mt-1.5 leading-tight">E{ep.n} · {ep.title}</p>
    </button>
  );
}

// ─── Generic horizontal row with arrows ─────────────────────────────
function Row({ title, children }: { title: string; children: React.ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * (scroller.current.clientWidth - 120), behavior: "smooth" });
  };
  return (
    <section className="relative mt-8 sm:mt-[3vw] group/row">
      <h2 className="text-[#e5e5e5] font-bold text-base sm:text-[1.4vw] min-[1700px]:text-2xl px-[4%] mb-2">{title}</h2>
      <div className="relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="hidden sm:flex absolute left-0 top-0 bottom-0 z-40 w-[4%] items-center justify-center bg-black/40 opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-9 h-9 text-white rotate-180" />
        </button>
        <div
          ref={scroller}
          className="flex gap-2 sm:gap-2.5 overflow-x-auto px-[4%] pb-2 snap-x scroll-smooth"
          style={{ scrollbarWidth: "none", paddingTop: 4, paddingBottom: 140, marginBottom: -120 }}
        >
          {children}
        </div>
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="hidden sm:flex absolute right-0 top-0 bottom-0 z-40 w-[4%] items-center justify-center bg-black/40 opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-9 h-9 text-white" />
        </button>
      </div>
    </section>
  );
}

// ─── Top 10 card (signature outlined numeral + pain poster) ─────────
function Top10Card({ rank, label, sub, img }: { rank: number; label: string; sub: string; img: string }) {
  return (
    <div className="relative shrink-0 flex items-end snap-start" onMouseEnter={tick}>
      <span
        aria-hidden
        className="select-none relative z-0"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(7rem, 13vw, 12rem)",
          lineHeight: 0.78,
          color: "#141414",
          WebkitTextStroke: "4px #595959",
          marginRight: "-0.18em",
        }}
      >
        {rank}
      </span>
      <div className="relative z-10 w-[110px] sm:w-[150px] aspect-[2/3] rounded-[4px] overflow-hidden transition-transform duration-300 hover:scale-105 bg-[#15161d]">
        <img src={img} alt={label} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        {/* legibility wash: darken top + bottom, leave the still readable in the middle */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.85) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-between p-2.5">
          <span className="text-[0.55rem] font-bold tracking-[0.2em] text-white/70 uppercase [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">{sub}</span>
          <p
            className="text-white leading-[0.95]"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.35rem", textShadow: "0 2px 6px rgba(0,0,0,0.95)" }}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Review card (Netflix-style social proof) ──────────────────────
function ReviewCard({ r }: { r: typeof REVIEWS[number] }) {
  return (
    <div className="shrink-0 w-[78vw] sm:w-[360px] snap-start bg-[#181818] rounded-md p-5 flex flex-col" onMouseEnter={tick}>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #E50914, #7a0c10)" }}
        >
          {r.initial}
        </span>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">{r.name}</p>
          <p className="text-[#8c8c8c] text-[0.72rem] leading-tight">{r.meta}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 shrink-0 text-[#46d369]">
          <ThumbsUp className="w-4 h-4 fill-[#46d369]" />
          <span className="text-[0.72rem] font-bold">{r.nights}</span>
        </span>
      </div>
      <p className="text-[#d2d2d2] text-[0.84rem] leading-relaxed flex-1">{r.quote}</p>
      <p className="text-[#6f6f6f] text-[0.62rem] mt-3 pt-3 border-t border-[#2c2c2c]">
        {r.badge}
      </p>
    </div>
  );
}

// ─── Full-screen episode player ─────────────────────────────────────
// When an episode ends we surface an end-card — the highest-intent moment
// on the page. It offers the purchase CTA first, then autoplay-next (with a
// short countdown) so the viewer keeps qualifying. Terminal episode has no
// "next" and leans entirely on the offer.
const AUTOPLAY_SECS = 8;
function PlayerModal({ ep, onClose, onPlayEp }: { ep: Episode | null; onClose: () => void; onPlayEp: (ep: Episode) => void }) {
  const vref = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const bump = useBump();
  const nextEp = ep ? EPISODES.find((e) => e.n === ep.n + 1) ?? null : null;

  useEffect(() => {
    setEnded(false);
    setCount(null);
    if (!ep) return;
    const v = vref.current;
    if (v) void v.play().catch(() => {});
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [ep, onClose]);

  // Autoplay-next countdown — starts once the card appears and a next ep exists.
  useEffect(() => {
    if (!ended || !nextEp) return;
    setCount(AUTOPLAY_SECS);
    const id = setInterval(() => {
      setCount((c) => {
        if (c === null) return null;
        if (c <= 1) { clearInterval(id); onPlayEp(nextEp); return null; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [ended, nextEp, onPlayEp]);

  if (!ep) return null;
  return (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col" style={{ animation: "swFadeIn 0.35s ease" }}>
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <button type="button" aria-label="Back" onClick={onClose} className="text-white hover:scale-110 transition-transform">
          <X className="w-8 h-8" />
        </button>
        <span className="text-[#b3b3b3] text-sm font-medium tracking-wide">
          WIRED &nbsp;·&nbsp; E{ep.n} — {ep.title}
        </span>
        <span className="w-8" />
      </div>
      <div className="relative flex-1 min-h-0">
        <video
          ref={vref}
          src={ep.src}
          controls
          playsInline
          onEnded={() => { logEvent(`watch_ep${ep.n}_complete`); setEnded(true); }}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
        {ended && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ background: "rgba(10,10,12,0.94)", animation: "swFadeIn 0.4s ease" }}
          >
            <p className="text-[#E50914] text-[0.72rem] font-bold tracking-[0.25em] uppercase mb-3">
              You just watched E{ep.n} — {ep.title}
            </p>
            <h3 className="text-white font-extrabold text-2xl sm:text-4xl max-w-xl leading-tight">
              The finale isn't another episode. It's your first full night of sleep.
            </h3>
            <p className="text-[#d2d2d2] text-sm sm:text-base mt-3 max-w-md">
              Start the 7-night protocol tonight — <span className="text-[#9b9b9b] line-through">{CURRENCY}{anchorPrice(bump)}</span>{" "}
              <span className="text-[#46d369] font-bold">{CURRENCY}{todayPrice(bump)}</span> during open beta · 60-day money-back guarantee.
            </p>
            <button
              type="button"
              onClick={() => { logEvent(`watch_endcard_cta_ep${ep.n}`); startCheckout(); }}
              className="mt-6 inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#f6121d] text-white font-bold text-base sm:text-lg px-8 py-3.5 rounded-[4px] transition-colors"
            >
              <Play className="w-5 h-5 fill-white" /> Start your 7 nights — {CURRENCY}{todayPrice(bump)}
            </button>

            {nextEp ? (
              <div className="mt-8 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => { logEvent(`watch_endcard_next_ep${nextEp.n}`); onPlayEp(nextEp); }}
                  className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/25 rounded-md pl-2 pr-5 py-2 transition-colors"
                >
                  <span className="relative w-24 aspect-video rounded overflow-hidden shrink-0">
                    <img src={nextEp.thumb} alt="" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </span>
                  </span>
                  <span className="text-left">
                    <span className="block text-[#b3b3b3] text-[0.68rem] font-semibold uppercase tracking-wide">
                      {count !== null ? `Next episode in ${count}s` : "Next episode"}
                    </span>
                    <span className="block text-white text-sm font-bold">E{nextEp.n} · {nextEp.title}</span>
                  </span>
                </button>
                {count !== null && (
                  <button
                    type="button"
                    onClick={() => setCount(null)}
                    className="text-[#8c8c8c] hover:text-white text-xs mt-2 transition-colors"
                  >
                    Cancel autoplay
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-[#8c8c8c] hover:text-white text-sm mt-8 transition-colors"
              >
                Back to episodes
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── "More Info" jaw — series detail + offer ────────────────────────
function InfoModal({ open, onClose, onPlayEp }: { open: boolean; onClose: () => void; onPlayEp: (ep: Episode) => void }) {
  const bump = useBump();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)", animation: "swFadeIn 0.3s ease" }} onClick={onClose}>
      <div
        className="relative max-w-[850px] mx-auto my-8 rounded-lg overflow-hidden bg-[#181818] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "swSlideUp 0.4s cubic-bezier(0.2,0.9,0.3,1)" }}
      >
        <div className="relative aspect-video">
          <img src="/images/watch/billboard.jpg" alt="WIRED" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, #181818 0%, transparent 50%)" }} />
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#181818] text-white flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-6 left-6 sm:left-12 right-6">
            <h2 className="text-white mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.6rem,6vw,4.5rem)", lineHeight: 0.9 }}>
              WIRED
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => { boom(); logEvent("watch_info_play"); onPlayEp(EPISODES[0]); }}
                className="flex items-center gap-2 bg-white text-black font-bold rounded-[4px] px-6 py-2 text-sm sm:text-base hover:bg-white/80 transition-colors"
              >
                <Play className="w-5 h-5 fill-black" /> Play
              </button>
              <button
                type="button"
                onClick={() => startCheckout()}
                className="flex items-center gap-2 bg-[#E50914] text-white font-bold rounded-[4px] px-6 py-2 text-sm sm:text-base hover:bg-[#f6121d] transition-colors"
              >
                Start your 7 nights — {CURRENCY}{todayPrice(bump)}
              </button>
              <span className="w-9 h-9 rounded-full border-2 border-[#5b5b5b] text-white flex items-center justify-center hover:border-white transition-colors cursor-pointer" title="My List">
                <Plus className="w-5 h-5" />
              </span>
              <span className="w-9 h-9 rounded-full border-2 border-[#5b5b5b] text-white flex items-center justify-center hover:border-white transition-colors cursor-pointer" title="I relate">
                <ThumbsUp className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
        <div className="px-6 sm:px-12 py-6 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-6">
          <div>
            <p className="text-[0.85rem] mb-3">
              <span className="text-[#46d369] font-bold">98% Match</span>
              <span className="text-[#d2d2d2] mx-2">2026</span>
              <span className="border border-[#9b9b9b] text-[#d2d2d2] px-1.5 py-px text-[0.7rem] mr-2">13+</span>
              <span className="text-[#d2d2d2]">5 Episodes</span>
              <span className="ml-2 border border-[#9b9b9b] text-[#d2d2d2] rounded px-1 py-px text-[0.65rem]">HD</span>
            </p>
            <p className="text-white text-[0.95rem] leading-relaxed">
              You're exhausted. You did everything right. And at 3:07 AM your eyes still snap open.
              WIRED breaks down — in five short episodes — the hyperarousal loop keeping your brain on guard duty,
              and walks you into the 7-night clinical protocol (CBT-I) that shuts it down.
              The season finale isn't on a screen: it's your first full night of sleep.
            </p>
          </div>
          <div className="text-[0.8rem] space-y-2">
            <p><span className="text-[#777]">Genre:</span> <span className="text-[#d2d2d2]">Docuseries, Sleep Science</span></p>
            <p><span className="text-[#777]">Based on:</span> <span className="text-[#d2d2d2]">CBT-I — recommended by NHS, Mayo Clinic &amp; AASM</span></p>
            <p><span className="text-[#777]">This show is:</span> <span className="text-[#d2d2d2]">Practical, Science-backed, Watched in bed</span></p>
          </div>
        </div>
        <div className="px-6 sm:px-12 pb-8">
          <h3 className="text-white font-bold text-lg mb-3">Episodes</h3>
          <div className="divide-y divide-[#404040]">
            {EPISODES.map((ep) => (
              <button
                key={ep.n}
                type="button"
                onClick={() => { logEvent(`watch_ep${ep.n}_open`); onPlayEp(ep); }}
                className="w-full flex items-center gap-4 py-3.5 px-2 text-left hover:bg-[#333] rounded transition-colors"
              >
                <span className="text-[#d2d2d2] text-xl w-6 text-center shrink-0">{ep.n}</span>
                <div className="relative w-28 shrink-0 aspect-video rounded overflow-hidden">
                  <img src={ep.thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold flex items-center justify-between gap-3">
                    {ep.title} <span className="text-[#999] font-normal shrink-0">{ep.duration}</span>
                  </p>
                  <p className="text-[#b3b3b3] text-[0.78rem] leading-snug mt-0.5 line-clamp-2">{ep.synopsis}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ accordion (Netflix marketing style) ────────────────────────
function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const bump = useBump();
  return (
    <section className="px-[4%] py-12 sm:py-16 max-w-[815px] mx-auto">
      <h2 className="text-white font-extrabold text-2xl sm:text-[2.5rem] text-center mb-6 sm:mb-8">
        Frequently Asked Questions
      </h2>
      <div className="space-y-2">
        {FAQS.map(([q, a], i) => (
          <div key={q}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between bg-[#2d2d2d] hover:bg-[#414141] transition-colors text-white text-left text-base sm:text-xl font-medium px-6 py-5"
            >
              {q}
              <Plus className={`w-6 h-6 shrink-0 ml-4 transition-transform duration-200 ${open === i ? "rotate-45" : ""}`} />
            </button>
            {open === i && (
              <div className="bg-[#2d2d2d] mt-px px-6 py-5 text-white text-[0.95rem] sm:text-lg leading-relaxed">
                {a}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-10">
        <p className="text-white text-base sm:text-xl mb-4">
          Ready to finally sleep? Your first night starts tonight.
        </p>
        <button
          type="button"
          onClick={() => startCheckout()}
          className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#f6121d] text-white font-bold text-lg sm:text-2xl px-8 py-3.5 rounded-[4px] transition-colors"
        >
          Start your 7 nights — {CURRENCY}{todayPrice(bump)} <ChevronRight className="w-6 h-6" />
        </button>
        <p className="text-[#999] text-xs mt-3">One payment · lifetime access · 60-day guarantee</p>
      </div>
    </section>
  );
}

// ─── Authority band — the method's clinical pedigree ────────────────
// CBT-I (the method WIRED is built on) is genuinely recommended first-line
// by these bodies. FTC/ASA-safe framing: they endorse the *method*, not our
// product, and the disclaimer says so explicitly. No borrowed logos.
function AuthorityBand() {
  const ORGS = ["NHS", "Mayo Clinic", "AASM", "Harvard Health"];
  return (
    <section className="px-[4%] mt-12 sm:mt-[4vw]">
      <div className="max-w-[1100px] mx-auto rounded-md bg-[#181818] border border-[#262626] px-6 sm:px-9 py-7">
        <p className="text-center text-[#8c8c8c] text-[0.7rem] font-bold uppercase tracking-[0.22em] mb-5">
          The method behind WIRED — CBT-I — is recommended first-line by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {ORGS.map((o) => (
            <span
              key={o}
              className="text-[#d2d2d2] text-lg sm:text-2xl font-extrabold tracking-tight opacity-90"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {o}
            </span>
          ))}
        </div>
        <p className="text-center text-[#6f6f6f] text-[0.68rem] leading-relaxed mt-6 max-w-2xl mx-auto">
          Cognitive Behavioral Therapy for Insomnia (CBT-I) is recommended as the first-line treatment for
          chronic insomnia by these organizations. They recommend the <em>method</em> — they are not
          affiliated with, and do not endorse, Sleep Wired. WIRED is a self-guided educational program built on CBT-I,
          not a medical service.
        </p>
      </div>
    </section>
  );
}

// ─── Exit-intent lead gate — capture email into the recovery drip ───
// Express checkout skips email, so abandoners are unrecoverable. This soft
// gate fires once per session on exit intent (desktop: cursor leaves toward
// the tab bar; mobile: fast scroll-up after deep engagement). Submitting
// saves the lead + redirects to Stripe; dismissing costs nothing.
function LeadGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { setErr(true); return; }
    setErr(false);
    setLoading(true);
    logEvent("watch_leadgate_submit");
    const ok = await startCheckoutWithEmail(v);
    if (!ok) { setLoading(false); startCheckout(); } // fall back to express Stripe
  }
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", animation: "swFadeIn 0.3s ease" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] rounded-lg overflow-hidden bg-[#181818] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "swSlideUp 0.35s cubic-bezier(0.2,0.9,0.3,1)" }}
      >
        <button type="button" aria-label="Close" onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="px-7 pt-8 pb-7">
          <p className="text-[#E50914] text-[0.7rem] font-bold tracking-[0.22em] uppercase mb-2">Before you go</p>
          <h3 className="text-white font-extrabold text-2xl leading-tight">
            Save your spot at the beta price.
          </h3>
          <p className="text-[#b3b3b3] text-sm mt-2.5 leading-snug">
            Drop your email and we'll hold your <span className="text-[#9b9b9b] line-through">{CURRENCY}{PRICE_ANCHOR}</span>{" "}
            <span className="text-[#46d369] font-semibold">{CURRENCY}{PRICE_TODAY}</span> access and send you back to finish anytime.
            No spam — just your link and a nudge if you don't complete.
          </p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErr(false); }}
              placeholder="you@email.com"
              className={`w-full rounded-[4px] bg-[#2a2a2a] text-white placeholder-[#8c8c8c] px-4 py-3 text-base outline-none border ${err ? "border-[#E50914]" : "border-[#404040]"} focus:border-white transition-colors`}
            />
            {err && <p className="text-[#E50914] text-xs">Enter a valid email address.</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#f6121d] disabled:opacity-60 text-white font-bold text-base px-6 py-3.5 rounded-[4px] transition-colors"
            >
              {loading ? "Taking you to checkout…" : <>Hold my spot — {CURRENCY}{PRICE_TODAY} <ChevronRight className="w-5 h-5" /></>}
            </button>
          </form>
          <button
            type="button"
            onClick={onClose}
            className="block mx-auto text-[#8c8c8c] hover:text-white text-xs mt-4 transition-colors"
          >
            No thanks, I'll pay full price later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────
export default function Watch() {
  const [scrolled, setScrolled] = useState(false);
  const [intro, setIntro] = useState(false);
  const [playerEp, setPlayerEp] = useState<Episode | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const bump = useBump(); // Recovery Pack order bump — shared so every CTA moves together

  // Bebas Neue for title art — injected here so the rest of the app
  // doesn't pay for it.
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  useEffect(() => {
    logEvent("watch_page_view");
    gtm.viewVSL(); // Meta ViewContent (€27 product) — pixel funnel signal for /watch
    try {
      if (!sessionStorage.getItem("sw_watch_intro")) {
        sessionStorage.setItem("sw_watch_intro", "1");
        setIntro(true);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Exit-intent lead gate — fires once per session. Skips while a full-screen
  // surface (intro/player/info) already owns the viewport (body overflow hidden).
  useEffect(() => {
    try { if (sessionStorage.getItem("sw_watch_gate")) return; } catch { /* noop */ }
    let armed = false; // mobile: only after real engagement
    let lastY = window.scrollY;
    const fire = () => {
      try {
        if (sessionStorage.getItem("sw_watch_gate")) return;
        if (document.body.style.overflow === "hidden") return; // a modal is open
        sessionStorage.setItem("sw_watch_gate", "1");
      } catch { return; }
      logEvent("watch_leadgate_shown");
      setGateOpen(true);
    };
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) fire();
    };
    const onScrollM = () => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.4) armed = true; // scrolled deep
      if (armed && lastY - y > 45 && y < window.innerHeight * 0.6) fire(); // fast scroll back to top
      lastY = y;
    };
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScrollM, { passive: true });
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScrollM);
    };
  }, []);

  const openEp = useCallback((ep: Episode) => { setInfoOpen(false); setPlayerEp(ep); }, []);

  return (
    <div className="min-h-screen text-white" style={{ background: "#141414", fontFamily: "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* keyframes local to this page */}
      <style>{`
        @keyframes swIntroZoom { 0% { transform: scale(1.6); opacity: 0; } 12% { opacity: 1; } 55% { transform: scale(1); } 100% { transform: scale(0.94); opacity: 1; } }
        @keyframes swIntroSweep { 0% { opacity: 0; transform: translateX(-180px) rotate(12deg); } 25% { opacity: 1; } 100% { opacity: 0; transform: translateX(180px) rotate(12deg); } }
        @keyframes swIntroFade { to { opacity: 0; visibility: hidden; } }
        @keyframes swFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes swSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {intro && <Intro onDone={() => setIntro(false)} />}

      {/* ── Nav ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-300"
        style={{
          background: scrolled ? "#141414" : "linear-gradient(180deg, rgba(0,0,0,0.7) 10%, transparent)",
          height: 68,
        }}
      >
        <div className="h-full flex items-center px-[4%] gap-6">
          <span className="flex items-baseline gap-1.5 select-none">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#E50914", fontSize: "1.9rem", lineHeight: 1 }}>W</span>
            <span className="hidden min-[420px]:inline text-[#E50914] font-extrabold tracking-[0.18em] text-[0.78rem]">{BRAND}</span>
          </span>
          <nav className="hidden md:flex items-center gap-5 text-[0.82rem] text-[#e5e5e5]">
            <span className="font-bold text-white cursor-default">Home</span>
            <span className="hover:text-[#b3b3b3] transition-colors cursor-pointer" onClick={() => setInfoOpen(true)}>Episodes</span>
            <span className="hover:text-[#b3b3b3] transition-colors cursor-pointer" onClick={() => setInfoOpen(true)}>How it works</span>
            <span className="hover:text-[#b3b3b3] transition-colors cursor-pointer" onClick={() => setInfoOpen(true)}>My List</span>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Search className="hidden sm:block w-5 h-5 text-white cursor-pointer" />
            <Bell className="hidden sm:block w-5 h-5 text-white cursor-pointer" />
            <a
              href="/sign-in"
              onClick={() => logEvent("watch_signin_click")}
              className="text-[#e5e5e5] hover:text-white text-[0.78rem] font-semibold transition-colors"
            >
              Sign In
            </a>
            <button
              type="button"
              onClick={() => startCheckout()}
              className="bg-[#E50914] hover:bg-[#f6121d] text-white text-[0.78rem] font-bold px-3.5 py-1.5 rounded-[4px] transition-colors"
            >
              Start — {CURRENCY}{todayPrice(bump)}
            </button>
          </div>
        </div>
      </header>

      {/* ── Billboard ── */}
      <Billboard onPlay={() => setPlayerEp(EPISODES[0])} onMoreInfo={() => setInfoOpen(true)} />

      {/* ── Rows ── */}
      <main className="relative z-10 -mt-[6vw] pb-4">
        <Row title="WIRED — Limited Series · watch free">
          {EPISODES.map((ep) => <EpCard key={ep.n} ep={ep} onOpen={openEp} />)}
        </Row>

        <Row title="Top 10 Nights You Know Too Well">
          {TOP10.map((t, i) => (
            <Top10Card key={t.label} rank={i + 1} label={t.label} sub={t.sub} img={t.img} />
          ))}
        </Row>

        {/* ── The reveal: this isn't a show, it's a protocol you do ──
            Placed on "screen two" (above social proof) so cold traffic
            sees the actual offer — named components, price, guarantee —
            before deciding to leave. Framed as depth, not a plot twist. */}
        <section className="px-[4%] mt-12 sm:mt-[4vw]">
          <div className="max-w-[1100px]">
            <p className="text-[#E50914] text-[0.72rem] font-bold tracking-[0.25em] uppercase mb-3">
              The finale isn't on a screen — it's your first full night's sleep
            </p>
            <h2 className="text-white font-extrabold leading-[1.05] text-2xl sm:text-4xl max-w-3xl">
              You've watched enough. This is the one you actually finish.
            </h2>
            <p className="text-[#b3b3b3] text-sm sm:text-base mt-3 max-w-2xl">
              WIRED isn't a series you binge. It's the CBT-I protocol sleep clinics use — rebuilt as 7 guided
              nights you complete in your own bed. Here's everything you get for {CURRENCY}{PRICE_TODAY}:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-7">
              {[
                { Icon: ListChecks, title: "The 7-night protocol", desc: "4 phases — Audit · Compress · Reset · Rewire. Self-guided, done lying in bed." },
                { Icon: Calculator, title: "Your sleep-window calculator", desc: "Your exact CBT-I sleep window — the calculation clinics charge €300 to run." },
                { Icon: Headphones, title: "Guided audio sessions", desc: "One short session each night. Press play, lie back — the protocol runs itself." },
                { Icon: FileText, title: "The brain-dump workbook", desc: "Empty the racing thoughts onto the page so your mind stops replaying them at 3am." },
                { Icon: Sunrise, title: "The morning protocol", desc: "The first 30 minutes that decide tonight's sleep — light, water, movement, no phone." },
                { Icon: InfinityIcon, title: "Lifetime access", desc: "Buy once. Every future session, workbook and calculator update — yours forever." },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="bg-[#181818] rounded-md p-5 flex flex-col gap-2">
                  <Icon className="w-6 h-6 text-[#E50914]" />
                  <p className="text-white text-[0.95rem] font-bold leading-tight">{title}</p>
                  <p className="text-[#b3b3b3] text-[0.82rem] leading-snug">{desc}</p>
                </div>
              ))}
            </div>

            {/* ── Order bump — the value ladder's first rung ──────────────
                The 7 nights get you sleeping. The Recovery Pack keeps you
                sleeping when life throws a bad night (travel, illness, 3AM
                anxiety, shift work). Same €19 as the post-purchase OTO —
                offered here so the buyer can add it in one checkout, lifting
                AOV without a second transaction. Fulfilled via the express
                checkout's bump line item + metadata.bump_recovery_pack. */}
            <button
              type="button"
              onClick={() => setBumpGlobal(!bump)}
              aria-pressed={bump}
              className="w-full text-left rounded-md mt-5 p-4 sm:p-5 flex items-start gap-3.5 transition-colors border-2 border-dashed"
              style={{
                borderColor: bump ? "#46d369" : "#f0c14b",
                background: bump ? "rgba(70,211,105,0.08)" : "rgba(240,193,75,0.06)",
              }}
            >
              <span
                className="shrink-0 mt-0.5 w-6 h-6 rounded-[5px] flex items-center justify-center border-2 transition-colors"
                style={{
                  borderColor: bump ? "#46d369" : "#8a8a8a",
                  background: bump ? "#46d369" : "transparent",
                }}
              >
                {bump && <ThumbsUp className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[#f0c14b] text-[0.6rem] font-bold uppercase tracking-[0.18em]">Add-on · one click</span>
                  <span className="text-white text-[0.98rem] font-bold">
                    Yes — add the Recovery Pack for {CURRENCY}{BUMP_PRICE}
                  </span>
                </span>
                <span className="block text-[#c9c9c9] text-[0.83rem] leading-snug mt-1">
                  7 guided sessions for the nights the old pattern tries to come back — jet lag, illness, 3 AM anxiety, Sunday-night dread, shift work. Relapse insurance for your sleep.
                  <span className="text-[#9b9b9b]"> Normally sold for {CURRENCY}{BUMP_PRICE} after you finish — grab it now in the same checkout.</span>
                </span>
              </span>
            </button>

            {/* Offer bar — price, guarantee, CTA (total reflects the bump) */}
            <div
              className="rounded-md mt-3 px-6 sm:px-9 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
              style={{ background: "linear-gradient(90deg, #1f1f1f 0%, #2a1215 60%, #3d090e 100%)" }}
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-2.5 mb-1">
                  <span className="text-[#9b9b9b] text-lg sm:text-xl line-through">{CURRENCY}{anchorPrice(bump)}</span>
                  <span className="text-white text-2xl sm:text-3xl font-extrabold leading-none">{CURRENCY}{todayPrice(bump)}</span>
                  <span className="text-[#f0c14b] text-[0.62rem] font-bold uppercase tracking-[0.15em] border border-[#f0c14b]/40 rounded px-1.5 py-0.5">Open beta</span>
                </div>
                <p className="text-white text-base sm:text-lg font-extrabold leading-tight">
                  One payment. No subscription, ever.
                </p>
                <p className="text-[#d2d2d2] text-sm mt-1">
                  {bump
                    ? <>7-night protocol <span className="text-white font-semibold">+ Recovery Pack</span> — {CURRENCY}{PRICE_TODAY} + {CURRENCY}{BUMP_PRICE}. One payment, lifetime access to both. 60-day money-back guarantee on the whole order.</>
                    : <>Locked at {CURRENCY}{PRICE_TODAY} during open beta — rises to {CURRENCY}{PRICE_ANCHOR} at public launch. Finish the 7 nights; if your sleep hasn't changed, every cent back. 60-day guarantee.</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startCheckout(bump)}
                className="shrink-0 inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#f6121d] text-white font-bold text-base sm:text-lg px-7 py-3.5 rounded-[4px] transition-colors"
              >
                <Play className="w-5 h-5 fill-white" /> Start Night 1 — {CURRENCY}{todayPrice(bump)}
              </button>
            </div>
          </div>
        </section>

        <Row title="What People Are Saying">
          {REVIEWS.map((r) => <ReviewCard key={r.name} r={r} />)}
        </Row>

        <AuthorityBand />

        <Faq />
      </main>

      {/* ── Footer ── */}
      <footer className="px-[4%] pb-10 pt-2 max-w-[1000px] mx-auto text-[#757575] text-[0.8rem]">
        <p className="mb-5">Questions? Email <a href="mailto:support@sleepwired.com" className="underline">support@sleepwired.com</a></p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <a href="/privacy-policy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms of Use</a>
          <a href="/sign-in" className="hover:underline">Sign In</a>
          <a href="/start#order-form" className="hover:underline">Start the protocol</a>
        </div>
        <p className="text-[0.72rem] leading-relaxed">
          Sleep Wired is an educational self-help program based on CBT-I and is not a substitute for medical care.
          Not affiliated with any streaming service. {new Date().getFullYear()} © Sleep Wired.
        </p>
      </footer>

      <PlayerModal ep={playerEp} onClose={() => setPlayerEp(null)} onPlayEp={setPlayerEp} />
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} onPlayEp={openEp} />
      <LeadGateModal open={gateOpen} onClose={() => setGateOpen(false)} />

      {/* mobile sticky CTA after scroll */}
      {scrolled && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-4 py-3" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.95) 60%, transparent)" }}>
          <button
            type="button"
            onClick={() => startCheckout()}
            className="flex items-center justify-center gap-2 bg-[#E50914] text-white font-bold text-base py-3 rounded-[4px] w-full"
          >
            <Play className="w-5 h-5 fill-white" /> Start your 7 nights — {CURRENCY}{todayPrice(bump)}
          </button>
        </div>
      )}
    </div>
  );
}
