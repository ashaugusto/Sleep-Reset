import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Check, ChevronDown, Lock } from "lucide-react";
import { gtm } from "@/lib/gtm";
import { TYPE_TO_HERO, TYPE_TO_EPISODE, type Profile } from "@/lib/quiz-data";
import { useI18n, fill, withLocale, type Dict } from "@/lib/i18n";
import { FunnelHeader } from "@/components/funnel-chrome";
import { clientId, getCookie, logEvent } from "@/lib/funnel-track";
import "@/styles/funnel.css";

// ─── Result page ─────────────────────────────────────────────────────────────
// Step 2 of 3. The order on this page is the whole point and it was wrong
// before: the visitor got two dense paragraphs and no obvious next step, then a
// button that dropped them onto the old WIRED page, which reads as a different
// site and loses the thread.
//
// Now: the read-out first (three labelled lines anyone can absorb in five
// seconds), then the single next step, then everything optional. The long form
// is still here, folded, for the reader who wants it. The button goes to /plan,
// which is step 3 and carries the offer in this same design system.
//
// The email is asked for after value landed, and skipping it never blocks the
// way forward. The hero promised "no email to see your result" and gating the
// next step would break that promise with the sceptic, who is the buyer.

/** Step 3 keeps the ad's UTMs, the matched hero, the profile and the language. */
function planUrl(profileId: string, type: Profile): string {
  const out = withLocale(new URLSearchParams(window.location.search));
  out.delete("id");
  out.set("h", TYPE_TO_HERO[type] || "default");
  out.set("qp", profileId);
  out.set("type", type);
  return "/plan?" + out.toString();
}

export default function QuizResult() {
  const { t } = useI18n();
  const [profileId, setProfileId] = useState("");
  const [type, setType] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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
    window.location.href = planUrl(profileId, type);
  }, [profileId, type]);

  async function capture() {
    setErr("");
    const clean = email.trim().toLowerCase();
    if (!/^.+@.+\..+$/.test(clean)) { setErr(t.result.capture.invalidEmail); return; }
    setSending(true);
    try {
      // Shared event id so the browser pixel and server CAPI dedup into one Lead.
      const eventId = `lead_${clientId()}_${Math.random().toString(36).slice(2, 10)}`;
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
        setErr(data?.error || t.result.capture.saveError);
        setSending(false);
        return;
      }
      gtm.quizComplete(type || "mixed", clean, eventId);
      logEvent("quiz_complete");
      setSent(true);
    } catch {
      setErr(t.result.capture.networkError);
      setSending(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="fnl">
      <FunnelHeader ticks={3} on={2} />
      <main className="fnl-wrap fnl-main">{children}</main>
    </div>
  );

  if (!type) {
    return shell(
      <div className="flex-1 flex flex-col justify-center">
        <span className="fnl-label mb-4">{t.quiz.analysisLabel}</span>
        <p className="fnl-step-row" data-done="false">
          <span className="fnl-dot" /> <span>{t.result.loading}</span>
        </p>
      </div>,
    );
  }

  const r = t.result.types[type];
  const ep = TYPE_TO_EPISODE[type];

  return shell(
    <>
      {/* ── Diagnosis ── */}
      <span className="fnl-eyebrow mb-5">{t.result.badge}</span>
      <h1 className="fnl-display mb-4">{r.title}</h1>
      <p className="fnl-lede mb-8" style={{ color: "var(--text)" }}>{r.subtitle}</p>

      {/* ── The read-out ──
          Three labelled lines. This is the part that has to be understood
          without reading anything else on the page. */}
      <span className="fnl-label">{t.result.readoutLabel}</span>
      <dl className="fnl-readout mt-3 mb-8">
        <div>
          <dt>{t.result.haveLabel}</dt>
          <dd>{r.have}</dd>
        </div>
        <div>
          <dt>{t.result.nightLabel}</dt>
          <dd>{r.night}</dd>
        </div>
        <div>
          <dt>{t.result.firstLabel}</dt>
          <dd>{r.first}</dd>
        </div>
      </dl>

      {/* The one line we want carried forward. */}
      <p className="fnl-pull mb-7">{r.bridge}</p>

      {/* ── The next step, and there is only one ── */}
      <button type="button" onClick={goToOffer} className="fnl-cta">
        {t.result.cta} <ArrowRight className="w-[18px] h-[18px]" />
      </button>
      <p className="fnl-micro mt-3 text-center">{t.result.ctaMicro}</p>

      {/* ── Email: optional, and clearly optional ── */}
      <div className="mt-10">
        {sent ? (
          <div className="fnl-panel flex items-start gap-3">
            <span
              className="grid place-items-center w-7 h-7 rounded-full shrink-0"
              style={{ background: "var(--brass)" }}
            >
              <Check className="w-4 h-4" strokeWidth={2.75} style={{ color: "#0b0906" }} />
            </span>
            <div>
              <p className="text-[1rem] font-semibold leading-snug">{t.result.capture.sentTitle}</p>
              <p className="fnl-helper mt-1">{t.result.capture.sentBody}</p>
            </div>
          </div>
        ) : (
          <div className="fnl-panel">
            <h2 className="text-[1.0625rem] font-semibold leading-snug mb-1.5">
              {t.result.capture.headline}
            </h2>
            <p className="fnl-helper mb-4">
              {fill(t.result.capture.sub, { type: r.label })}
            </p>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void capture(); }}
              placeholder={t.result.capture.placeholder}
              className="fnl-input"
            />
            {err && (
              <p className="mt-2 text-[0.875rem] font-medium" style={{ color: "#e0796b" }}>{err}</p>
            )}
            <button
              type="button"
              onClick={() => void capture()}
              disabled={sending}
              className="fnl-cta mt-3"
            >
              {sending
                ? t.result.capture.sending
                : (<>{t.result.capture.button} <ArrowRight className="w-[18px] h-[18px]" /></>)}
            </button>
            <p className="fnl-micro mt-3 flex items-start gap-1.5">
              <Lock className="w-3 h-3 mt-[3px] shrink-0" /> {t.result.capture.micro}
            </p>
          </div>
        )}
      </div>

      {/* ── The long version, folded ──
          Kept whole for the reader who wants the mechanism, out of the way for
          the one who already got what they came for. */}
      <details
        className="fnl-disclosure mt-10"
        onToggle={(e) => {
          if ((e.currentTarget as HTMLDetailsElement).open) logEvent("quiz_result_expand");
        }}
      >
        <summary>
          {t.result.fullReadLabel}
          <ChevronDown className="w-4 h-4" />
        </summary>
        <div className="fnl-disclosure-body">
          {r.body.map((p, i) => (
            <p key={i} className="fnl-body">{p}</p>
          ))}
        </div>
      </details>

      {/* ── The episode that explains this type ── */}
      <div className="mt-10">
        <span className="fnl-label">
          {fill(t.result.watchNext, { n: ep.n, time: ep.runtime })}
        </span>
        <h2 className="fnl-h2 mt-2 mb-5">{r.episodeTitle}</h2>

        <div className="fnl-video">
          <video
            src={ep.src}
            poster={ep.poster}
            controls
            playsInline
            preload="none"
            onPlay={() => logEvent(`quiz_result_ep${ep.n}_play`)}
          />
        </div>

        <button type="button" onClick={goToOffer} className="fnl-cta mt-7">
          {t.result.cta} <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <p className="fnl-micro mt-3 text-center">{t.result.ctaMicro}</p>
      </div>
    </>,
  );
}
