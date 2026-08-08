import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Check, ChevronDown, Lock } from "lucide-react";
import { gtm } from "@/lib/gtm";
import { RESULTS, RESULT_BADGE, CAPTURE, type Profile, type ResultBlock } from "@/lib/quiz-data";
import "@/styles/funnel.css";

// ─── Result page ─────────────────────────────────────────────────────────────
// The piece the funnel never had: the old quiz dumped people on the homepage
// with no read-out at all. Order here is deliberate: diagnosis first, email
// second, episode third. The address is only asked for after value landed, and
// skipping it never blocks the way to the offer.
//
// From here the visitor moves to /watch, which carries the full series and
// checkout. Quiz opens, video closes. Shared look: styles/funnel.css.

const TYPE_TO_HERO: Record<Profile, string> = {
  onset: "hyperarousal",
  maintenance: "wake3am",
  mixed: "default",
  circadian: "melatonin",
};

const EP_RUNTIME: Record<number, string> = { 2: "1m 54s", 3: "2m 02s", 4: "1m 33s" };

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

function Crescent() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.2 9.9A5.7 5.7 0 0 1 6.1 2.8a5.9 5.9 0 1 0 7.1 7.1Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      setErr("Network error. Please try again.");
      setSending(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="fnl">
      <header className="fnl-head">
        <div className="fnl-wrap fnl-head-row">
          <span className="fnl-mark"><Crescent /> Sleep Wired</span>
        </div>
        <div className="fnl-progress">
          <span className="fnl-tick" data-on="true" />
        </div>
      </header>
      <main className="fnl-wrap fnl-main">{children}</main>
    </div>
  );

  if (!type) {
    return shell(
      <div className="flex-1 flex flex-col justify-center">
        <span className="fnl-label mb-4">Analysis</span>
        <p className="fnl-step-row" data-done="false">
          <span className="fnl-dot" /> <span>Opening your result</span>
        </p>
      </div>,
    );
  }

  const r: ResultBlock = RESULTS[type];

  return shell(
    <>
      {/* ── Diagnosis ── */}
      <span className="fnl-eyebrow mb-5">{RESULT_BADGE}</span>
      <h1 className="fnl-display mb-4">{r.title}</h1>
      <p className="fnl-lede mb-7" style={{ color: "var(--text)" }}>{r.subtitle}</p>

      <div className="mb-8">
        {r.body.map((p, i) => (
          <p key={i} className="fnl-body">{p}</p>
        ))}
      </div>

      {/* The one line we want remembered going into the ask. */}
      <p className="fnl-pull mb-9">{r.bridge}</p>

      {/* ── Email: asked only now, and never as a wall ── */}
      {sent ? (
        <div className="fnl-panel flex items-start gap-3">
          <span
            className="grid place-items-center w-7 h-7 rounded-full shrink-0"
            style={{ background: "var(--brass)" }}
          >
            <Check className="w-4 h-4" strokeWidth={2.75} style={{ color: "#0b0906" }} />
          </span>
          <div>
            <p className="text-[1rem] font-semibold leading-snug">Your plan is on its way.</p>
            <p className="fnl-helper mt-1">Check your inbox in the next few minutes.</p>
          </div>
        </div>
      ) : (
        <div className="fnl-panel">
          <h2 className="text-[1.0625rem] font-semibold leading-snug mb-1.5">{CAPTURE.headline}</h2>
          <p className="fnl-helper mb-4">{CAPTURE.sub.replace("{TYPE}", r.label)}</p>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void capture(); }}
            placeholder="you@example.com"
            className="fnl-input"
          />
          {err && <p className="mt-2 text-[0.875rem] font-medium" style={{ color: "#e0796b" }}>{err}</p>}
          <button
            type="button"
            onClick={() => void capture()}
            disabled={sending}
            className="fnl-cta mt-3"
          >
            {sending ? "Sending" : (<>{CAPTURE.button} <ArrowRight className="w-[18px] h-[18px]" /></>)}
          </button>
          <p className="fnl-micro mt-3 flex items-start gap-1.5">
            <Lock className="w-3 h-3 mt-[3px] shrink-0" /> {CAPTURE.micro}
          </p>
          <hr className="fnl-rule my-4" />
          <button
            type="button"
            onClick={() => {
              logEvent("quiz_capture_skip");
              episodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="fnl-ghost"
          >
            {CAPTURE.skip} <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── The episode that explains this type, then the offer ── */}
      <div ref={episodeRef} className="mt-12 scroll-mt-16">
        <span className="fnl-label">Watch next · Episode {r.episode.n} · {EP_RUNTIME[r.episode.n]}</span>
        <h2 className="fnl-h2 mt-2 mb-5">{r.episode.title}</h2>

        <div className="fnl-video">
          <video
            src={r.episode.src}
            poster={r.episode.poster}
            controls
            playsInline
            preload="none"
            onPlay={() => logEvent(`quiz_result_ep${r.episode.n}_play`)}
          />
        </div>

        <button type="button" onClick={goToOffer} className="fnl-cta mt-7">
          See the protocol for your type <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <p className="fnl-micro mt-3 text-center">60-day refund · Instant access</p>
      </div>
    </>,
  );
}
