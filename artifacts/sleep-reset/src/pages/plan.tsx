import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Lock, ShieldCheck } from "lucide-react";
import { gtm } from "@/lib/gtm";
import {
  TYPE_TO_KEY_NIGHT,
  PRICE_TODAY,
  PRICE_ANCHOR,
  type Profile,
} from "@/lib/quiz-data";
import { useI18n, fill, money } from "@/lib/i18n";
import { hotmartCheckoutUrl } from "@/lib/offers";
import { FunnelHeader } from "@/components/funnel-chrome";
import { getParam, logEvent, heroVariant, haptic } from "@/lib/funnel-track";
import "@/styles/funnel.css";

// ─── Offer page ──────────────────────────────────────────────────────────────
// Step 3 of 3, and the piece the funnel did not have. Until now the result page
// handed off to /watch, the previous homepage: a different layout, a different
// voice, and a page written for someone who had never answered a question. The
// visitor felt it, and said so.
//
// This page is the same surface as the quiz and the result, and it is written
// for someone who already knows their type. Everything on it is either their
// diagnosis carried forward or the offer itself. Nothing restates the pitch
// from scratch, because they already sat through it.
//
// /watch is untouched and still served, for old links and any ad still pointing
// at the series. It is no longer where the quiz sends people.
//
// Order on the page: what the seven nights do → what you get → the add-on →
// price and guarantee → objections. Buy buttons at the top of the offer block
// and in the sticky bar, so the decision is never more than a thumb away.

const VALID: Profile[] = ["maintenance", "onset", "mixed", "circadian"];

function isProfile(v: string): v is Profile {
  return (VALID as string[]).includes(v);
}

export default function Plan() {
  const { t } = useI18n();
  const [type, setType] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showSticky, setShowSticky] = useState(false);
  const offerRef = useRef<HTMLDivElement | null>(null);
  const inFlight = useRef(false);

  // ── Which type are we selling to ──
  // ?type= comes from the result page, so the page renders instantly. The
  // profile id is the fallback for a bookmarked or shared link, and for the
  // day we start emailing this URL.
  useEffect(() => {
    logEvent("plan_view");
    const fromQuery = getParam("type");
    if (isProfile(fromQuery)) { setType(fromQuery); return; }

    const qp = getParam("qp");
    if (!qp) { window.location.href = "/"; return; }
    fetch("/api/quiz/profile/" + encodeURIComponent(qp))
      .then((r) => r.json())
      .then((d) => {
        const fetched = String(d?.profile?.type ?? "");
        setType(isProfile(fetched) ? fetched : "mixed");
      })
      .catch(() => setType("mixed"));
  }, []);

  // ── Sticky bar: appears once the offer block has been scrolled past ──
  useEffect(() => {
    const el = offerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowSticky(entry.boundingClientRect.top < 0 && !entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [type]);

  // One price on this page, always. The Recovery Pack is added and priced on
  // the Hotmart checkout, so nothing here can change the total any more.
  const total = PRICE_TODAY;
  const anchorTotal = PRICE_ANCHOR;

  const checkout = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    haptic();
    setErr("");
    setBusy(true);
    logEvent("plan_checkout");
    try {
      gtm.initiateCheckout("", null);
    } catch {}

    // Hotmart is a hosted checkout: no session to create, we hand the visitor
    // over with the offer that matches their type. sck is the only field
    // Hotmart gives back untouched on the webhook, so attribution rides in
    // there. There is no second processor to fall through to: if the URL comes
    // back empty the offer is not configured and the honest move is to say the
    // checkout is down, not to route the sale somewhere we no longer sell.
    const url = hotmartCheckoutUrl("front", {
      profile: type,
      tracking: {
        t: type,
        h: heroVariant() || "plan",
        qp: getParam("qp"),
        c: getParam("utm_content"),
        s: getParam("utm_source"),
      },
    });

    if (!url) {
      logEvent("plan_checkout_unconfigured");
      setErr(t.plan.checkoutError);
      setBusy(false);
      inFlight.current = false;
      return;
    }

    // No lead row is written here, and that is not an oversight: this page never
    // asks for an email. The sale is reconstructed on the other side, where the
    // Hotmart webhook reads the buyer's email off the payload and the tracking
    // back off sck, then writes the lead and fires CAPI Purchase.
    window.location.href = url;
  }, [type, t]);

  if (!type) {
    return (
      <div className="fnl">
        <FunnelHeader ticks={3} on={3} />
        <main className="fnl-wrap fnl-main">
          <div className="flex-1 flex flex-col justify-center">
            <p className="fnl-step-row" data-done="false">
              <span className="fnl-dot" /> <span>{t.result.loading}</span>
            </p>
          </div>
        </main>
      </div>
    );
  }

  const r = t.result.types[type];
  const keyNight = TYPE_TO_KEY_NIGHT[type];
  const ctaLabel = fill(t.plan.cta, { price: money(t, total) });

  return (
    <div className="fnl">
      <FunnelHeader ticks={3} on={3} />
      <main className="fnl-wrap fnl-main">
        <>
          {/* ── Carried forward from the result ── */}
          <span className="fnl-eyebrow mb-5">{t.plan.eyebrow}</span>
          <h1 className="fnl-display mb-4">{fill(t.plan.title, { label: r.label })}</h1>
          <p className="fnl-lede mb-9">{r.planLede}</p>

          {/* ── The seven nights ── */}
          <span className="fnl-label">{t.plan.nightsLabel}</span>
          <ol className="fnl-nights mt-3">
            {t.plan.nights.map((n, i) => (
              <li key={n.title} className="fnl-night" data-key={i + 1 === keyNight}>
                <span className="fnl-night-n">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="fnl-night-title">{n.title}</span>
                  <span className="fnl-night-body block">{n.body}</span>
                </span>
              </li>
            ))}
          </ol>

          {/* The one row that is lit above, said in words. */}
          <p className="fnl-pull mt-7">
            {fill(t.plan.keyNight, { label: r.label, n: keyNight })}
          </p>

          {/* ── What you get ── */}
          <div className="mt-11">
            <span className="fnl-label">{t.plan.includedLabel}</span>
            <ul className="fnl-list mt-4">
              {t.plan.included.map((line) => (
                <li key={line}>
                  <Check className="w-[18px] h-[18px]" strokeWidth={2.25} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Order bump ── */}
          {/* Not here. The same pack is a native Hotmart bump one step later, on
              the checkout itself, and it was hidden on this page for as long as
              Hotmart has been live. Two places to tick the same box is how a
              buyer gets charged 19 EUR twice. */}

          {/* ── The offer ── */}
          <div ref={offerRef} className="fnl-offer mt-8">
            <span className="fnl-label">{t.plan.offerLabel}</span>
            <div className="fnl-price mt-3">
              <span className="fnl-price-now">{money(t, total)}</span>
              <span className="fnl-price-was">{money(t, anchorTotal)}</span>
            </div>
            <p className="fnl-helper mt-3">
              {fill(t.plan.priceLine, { price: money(t, total) })}
            </p>
            <p className="fnl-helper mt-1.5">
              {fill(t.plan.anchorLine, { price: money(t, anchorTotal) })}
            </p>

            <hr className="fnl-rule my-4" />

            <p className="text-[0.9375rem] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-[18px] h-[18px] mt-0.5 shrink-0" style={{ color: "var(--brass)" }} />
              <span>{t.plan.guarantee}</span>
            </p>

            <button type="button" onClick={() => void checkout()} disabled={busy} className="fnl-cta mt-5">
              {busy ? t.plan.ctaBusy : (<>{ctaLabel} <ArrowRight className="w-[18px] h-[18px]" /></>)}
            </button>
            {err && (
              <p className="mt-2 text-[0.875rem] font-medium text-center" style={{ color: "#e0796b" }}>{err}</p>
            )}
            <p className="fnl-micro mt-3 flex items-start justify-center gap-1.5 text-center">
              <Lock className="w-3 h-3 mt-[3px] shrink-0" /> {t.plan.ctaMicro}
            </p>
          </div>

          {/* ── Objections ── */}
          <div className="mt-11">
            <span className="fnl-label">{t.plan.faqLabel}</span>
            <div className="mt-3">
              {t.plan.faq.map((item) => (
                <details key={item.q} className="fnl-disclosure">
                  <summary>
                    {item.q}
                    <ChevronDown className="w-4 h-4" />
                  </summary>
                  <div className="fnl-disclosure-body">
                    <p className="fnl-body">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* The way back. Someone who wants to re-read their diagnosis before
              deciding should not have to use the browser's back button and
              wonder whether they lost their result. */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="fnl-ghost mt-8 self-start"
          >
            <ArrowLeft className="w-4 h-4" /> {t.plan.backToResult}
          </button>

          {/* Space for the sticky bar, so it never covers the last line. */}
          <div className="h-24" aria-hidden="true" />
        </>
      </main>

      {/* ── Sticky buy bar ──
          Inside .fnl so it inherits the palette, fixed so it pins to the
          viewport. It only appears after the offer block has been read past:
          showing it from the first screen would be asking for the sale before
          saying what the sale is. */}
      <div className="fnl-sticky" data-on={showSticky}>
        <div className="fnl-sticky-inner">
          <button type="button" onClick={() => void checkout()} disabled={busy} className="fnl-cta">
            {busy ? t.plan.ctaBusy : (<>{ctaLabel} <ArrowRight className="w-[18px] h-[18px]" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
