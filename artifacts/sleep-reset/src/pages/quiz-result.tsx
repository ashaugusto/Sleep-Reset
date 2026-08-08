import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Check, Lock, Moon, Play } from "lucide-react";
import { gtm } from "@/lib/gtm";
import { RESULTS, RESULT_BADGE, CAPTURE, type Profile, type ResultBlock } from "@/lib/quiz-data";

// ─── Result page ─────────────────────────────────────────────────────────────
// The piece the funnel never had: the old quiz dumped people on the homepage
// with no read-out at all. Order here is deliberate — diagnosis first, email
// second, episode third. The address is only asked for after value landed, and
// skipping it never blocks the way to the offer.
//
// From here the visitor moves to /watch, which carries the full series and
// checkout. Quiz opens, video closes.

const TYPE_TO_HERO: Record<Profile, string> = {
  onset: "hyperarousal",
  maintenance: "wake3am",
  mixed: "default",
  circadian: "melatonin",
};

function clientId(): string {
  try { return localStorage.getItem("sw_cid") || ""; } catch { return ""; }
}
function getCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
    return m ? m[1] : "";
  } catch { return ""; }
}
function logEvent(event: string) {
  try {
    void fetch("/api/sw/e", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        ad_id: new URLSearchParams(window.location.search).get("utm_content") || "",
        client_id: clientId(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

/** Offer URL keeping the ad's UTMs, the matched hero and the profile id. */
function offerUrl(profileId: string, type: Profile): string {
  const out = new URLSearchParams(window.location.search);
  out.delete("id");
  out.set("h", TYPE_TO_HERO[type] || "default");
  out.set("qp", profileId);
  return "/watch?" + out.toString();
}

export default function QuizResult() {
  const [profileId, setProfileId] = useState("");
  const [type, setType] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const episodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { window.location.href = "/"; return; }
    setProfileId(id);
    logEvent("quiz_result_view");

    fetch("/api/quiz/profile/" + encodeURIComponent(id))
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !d?.profile) { window.location.href = "/"; return; }
        setType((d.profile.type as Profile) || "mixed");
      })
      .catch(() => { window.location.href = "/"; });
  }, []);

  const goToOffer = useCallback(() => {
    if (!type) return;
    logEvent("quiz_result_to_offer");
    window.location.href = offerUrl(profileId, type);
  }, [profileId, type]);

  async function capture() {
    setErr("");
    const clean = email.trim().toLowerCase();
    if (!/^.+@.+\..+$/.test(clean)) { setErr("Please enter a valid email."); return; }
    setSending(true);
    try {
      // Shared event id so the browser pixel and server CAPI dedup into one Lead.
      const eventId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const res = await fetch("/api/quiz/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          email: clean,
          event_id: eventId,
          fbp: getCookie("_fbp"),
          fbc: getCookie("_fbc"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "Could not save your email. Try again.");
        setSending(false);
        return;
      }
      gtm.quizComplete(type || "mixed", clean, eventId);
      logEvent("quiz_complete");
      setSent(true);
    } catch {
      setErr("Network error — please try again.");
      setSending(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ background: "#FAFAF7", color: "#1F2937", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-20 bg-[#FAFAF7]/95 backdrop-blur-sm border-b border-[#EDEDE8]">
        <div className="max-w-[460px] mx-auto w-full px-5 h-14 flex items-center gap-2">
          <Moon className="w-[18px] h-[18px] text-[#0E2541]" />
          <span className="font-bold text-[13px] text-[#0E2541] tracking-tight">Sleep Wired</span>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[460px] mx-auto px-5 pt-7 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );

  if (!type) {
    return shell(
      <div className="flex flex-col items-center justify-center pt-24 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#E5E7EB] border-t-[#C9A14A] animate-spin mb-5" />
        <p className="text-[14px] text-[#6B7280]">Loading your result…</p>
      </div>,
    );
  }

  const r: ResultBlock = RESULTS[type];

  return shell(
    <>
      {/* ── Diagnosis ── */}
      <span className="inline-flex items-center bg-white border border-[#E5E7EB] text-[#0E2541] text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full mb-5">
        {RESULT_BADGE}
      </span>
      <h1
        className="text-[2rem] leading-[1.12] text-[#0E2541] mb-3"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
      >
        {r.title}
      </h1>
      <p className="text-[16.5px] leading-[1.5] text-[#0E2541] font-medium mb-6">{r.subtitle}</p>

      <div className="space-y-4 mb-7">
        {r.body.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.65] text-[#374151]">{p}</p>
        ))}
      </div>

      {/* The one line we want remembered going into the ask. */}
      <div className="border-l-[3px] border-[#C9A14A] bg-white rounded-r-xl px-4 py-3.5 mb-8">
        <span className="text-[15.5px] leading-[1.5] text-[#0E2541] font-semibold">{r.bridge}</span>
      </div>

      {/* ── Email — asked only now, and never as a wall ── */}
      {sent ? (
        <div className="bg-white border border-[#E7E7E2] rounded-2xl p-5 flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-[#166534] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </span>
          <div>
            <p className="text-[16px] font-bold text-[#0E2541] leading-snug">Your plan is on its way.</p>
            <p className="text-[14px] text-[#6B7280] mt-1">Check your inbox in the next few minutes.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E7E2] rounded-2xl p-5">
          <h2 className="text-[18px] font-bold text-[#0E2541] leading-snug mb-1.5">{CAPTURE.headline}</h2>
          <p className="text-[14px] leading-[1.5] text-[#4B5563] mb-4">
            {CAPTURE.sub.replace("{TYPE}", r.label)}
          </p>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void capture(); }}
            placeholder="you@example.com"
            className="w-full px-4 min-h-[54px] rounded-xl border-2 border-[#E7E7E2] bg-[#FAFAF7] focus:border-[#0E2541] focus:outline-none text-[16px]"
          />
          {err && <p className="mt-2 text-[14px] text-red-600 font-medium">{err}</p>}
          <button
            type="button"
            onClick={() => void capture()}
            disabled={sending}
            className="mt-3 w-full bg-[#0E2541] active:scale-[0.985] transition-transform text-white font-extrabold text-[17px] min-h-[56px] rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_8px_24px_rgba(14,37,65,0.2)]"
          >
            {sending ? "Sending…" : (<>{CAPTURE.button} <ArrowRight className="w-5 h-5" /></>)}
          </button>
          <p className="mt-3 text-[12px] text-[#6B7280] flex items-start gap-1.5">
            <Lock className="w-3 h-3 mt-[3px] shrink-0" /> {CAPTURE.micro}
          </p>
          <button
            type="button"
            onClick={() => {
              logEvent("quiz_capture_skip");
              episodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-4 w-full text-center text-[14px] text-[#6B7280] underline underline-offset-4 py-1"
          >
            {CAPTURE.skip}
          </button>
        </div>
      )}

      {/* ── The episode that explains this type, then the offer ── */}
      <div ref={episodeRef} className="mt-10 scroll-mt-16">
        <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B7280] mb-2">
          Watch next · Episode {r.episode.n}
        </span>
        <h2
          className="text-[1.4rem] leading-[1.2] text-[#0E2541] mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
        >
          {r.episode.title}
        </h2>
        <div className="rounded-2xl overflow-hidden bg-black relative">
          <video
            className="w-full block"
            src={r.episode.src}
            poster={r.episode.poster}
            controls
            playsInline
            preload="none"
            onPlay={() => logEvent(`quiz_result_ep${r.episode.n}_play`)}
          />
          <span className="absolute top-3 left-3 pointer-events-none flex items-center gap-1 bg-black/60 text-white text-[11px] font-bold px-2 py-1 rounded">
            <Play className="w-3 h-3" /> {r.episode.n === 4 ? "1m 33s" : r.episode.n === 3 ? "2m 02s" : "1m 54s"}
          </span>
        </div>

        <button
          type="button"
          onClick={goToOffer}
          className="mt-6 w-full bg-[#C9A14A] active:scale-[0.985] transition-transform text-white font-extrabold text-[17px] min-h-[58px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(201,161,74,0.3)]"
        >
          See the protocol for your type <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-3 text-center text-[12px] text-[#6B7280]">60-day refund · Instant access</p>
      </div>
    </>,
  );
}
