import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n, fill, money } from "@/lib/i18n";
import { OFFERS, hotmartCheckoutUrl } from "@/lib/offers";
import { FunnelHeader } from "@/components/funnel-chrome";
import { FunnelWidget, widgetMarkup } from "@/components/funnel-widget";
import { logEvent, haptic } from "@/lib/funnel-track";
import widgetSource from "@/funnel-widgets/oto1.html?raw";
import "@/styles/funnel.css";

// ─── OTO 1: the 3AM Relapse Kit ──────────────────────────────────────────────
// The rung the ladder was missing a page for. Everything else about it already
// existed: the audio in public/audio/kit-*.mp3, the card in public/kit/, the
// copy in every locale under `oto1`, the price in offers.ts. What did not exist
// was somewhere to sell it, so the offer code Ash creates in the panel had
// nowhere to land.
//
// Where the visitor comes from. Hotmart's Funil de Vendas takes over the
// post-purchase redirect: instead of going straight to /welcome, the buyer is
// sent here with the transaction still in the URL, and /welcome is one click
// further on. That is why this page is public and asks for nothing: the buyer
// has paid, but has not set a password yet, and there is no account to guard.
//
// Which means the one rule this page cannot break is that both buttons end at
// /welcome carrying the transaction. Yes goes to the checkout and Hotmart
// returns them; no goes there directly. A buyer who declines an upsell and
// loses access to what they already bought is the single worst outcome
// available on this screen, so the decline is a real link, styled to be found,
// not a grey whisper under the fold.
//
// Two ways to say yes, and the page picks by itself. Hotmart's funnel step
// generates a widget, pasted into src/funnel-widgets/oto1.html, that holds the
// real one click buttons: the card already on file is charged without a second
// checkout. While that file is empty the button below opens a normal checkout
// instead, which sells the kit but asks for the card a second time ninety
// seconds after the first. The `micro` line ("your card is not asked for
// again") is only true of the widget, so it is only shown with the widget.
//
// An embed that never draws is treated as no embed: the widget reports back
// whether it made it onto the screen, and if it did not, our own buttons come
// back. The one thing this page must never be is a page a buyer cannot leave.

const TRANSACTION_KEYS = ["transaction", "trans", "hotmart_transaction", "tid"];

/** The Hotmart funnel widget, or "" while nobody has pasted one in. */
const WIDGET = widgetMarkup(widgetSource);

export default function Kit() {
  const { t } = useI18n();
  const c = t.oto1;
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const params = useMemo(
    () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)),
    [],
  );
  const transaction = TRANSACTION_KEYS.map((k) => params.get(k)).find((v) => !!v) ?? "";
  const email = params.get("email") ?? "";

  // Where both answers end up. The transaction is what /welcome uses to claim
  // the purchase, so it travels with the visitor either way.
  const onward = useMemo(() => {
    const q = new URLSearchParams();
    if (transaction) q.set("transaction", transaction);
    return `/welcome${q.toString() ? `?${q}` : ""}`;
  }, [transaction]);

  const checkoutUrl = hotmartCheckoutUrl("oto1", {
    email: email || undefined,
    tracking: { h: "oto1", tx: transaction || null },
  });

  // null while the widget is still deciding whether it exists on screen. false
  // means fall back to our own buttons, which is also where a page with no
  // widget pasted starts.
  const [widgetLive, setWidgetLive] = useState<boolean | null>(WIDGET ? null : false);

  const onWidgetSettled = useCallback((live: boolean) => {
    setWidgetLive(live);
    // A widget that was pasted and then did not draw is the expensive silent
    // failure here: the page looks fine and the one click upsell is gone.
    logEvent(live ? "kit_widget" : "kit_widget_dead");
  }, []);

  useEffect(() => {
    logEvent("kit_view");
    // Nothing to sell at all: no widget pasted and no offer code in the build.
    // Not a visitor-facing failure, a deploy one, and worth a line in the log so
    // it shows up as lost revenue rather than as silence.
    if (!checkoutUrl && !WIDGET) logEvent("kit_unconfigured");
  }, [checkoutUrl]);

  const buy = () => {
    if (inFlight.current || !checkoutUrl) return;
    inFlight.current = true;
    haptic();
    setBusy(true);
    logEvent("kit_checkout");
    window.location.href = checkoutUrl;
  };

  const decline = () => {
    logEvent("kit_decline");
    window.location.href = onward;
  };

  const price = money(t, OFFERS.oto1.price);

  return (
    <div className="fnl">
      {/* Three of three, filled. They finished the funnel one screen ago and
          the rule should say so rather than reopen a fourth step. */}
      <FunnelHeader ticks={3} on={3} />
      <main className="fnl-wrap fnl-main">
        <span className="fnl-eyebrow mb-5">{c.eyebrow}</span>
        <h1 className="fnl-display mb-4">{c.title}</h1>
        {c.body.map((p, i) => (
          <p key={i} className={i === 0 ? "fnl-lede mb-5" : "fnl-body mb-9"}>
            {p}
          </p>
        ))}

        {/* Same rows as the seven nights on /plan, numbered the same way. The
            visitor read that list ninety seconds ago; reusing its shape is how
            this reads as the next line of the same order rather than a second
            sales page that happened to open. */}
        <span className="fnl-label">{c.includedLabel}</span>
        <ol className="fnl-nights mt-3 mb-9">
          {c.included.map((item, i) => (
            <li key={item.title} className="fnl-night">
              <span className="fnl-night-n">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="fnl-night-title">{item.title}</span>
                <span className="fnl-night-body block">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* The card is the one piece of the kit that can be shown rather than
            described, so it is shown. The audio is not previewed here: this
            visitor bought ninety seconds ago and does not need convincing that
            we can record, they need to know what the kit is for. */}
        <figure className="fnl-panel mb-9">
          <img
            src="/kit/first-90-seconds.png"
            alt={c.included[1].title}
            loading="lazy"
            className="w-full rounded-md"
          />
          <figcaption className="fnl-micro mt-2">{c.included[1].title}</figcaption>
        </figure>

        <span className="fnl-label">{c.notLabel}</span>
        <p className="fnl-body mt-3 mb-9">{c.not}</p>

        <div className="fnl-offer">
          <p className="fnl-price">
            <span className="fnl-price-now">{price}</span>
          </p>
          <p className="fnl-body mb-5">{fill(c.priceLine, { price })}</p>

          {/* Hotmart's own Yes and No, charging the card already on file. Both
              answers live inside the embed, which is why ours are not rendered
              next to it. */}
          {WIDGET && widgetLive !== false && (
            <>
              <FunnelWidget html={WIDGET} onSettled={onWidgetSettled} className="fnl-widget" />
              <p className="fnl-micro mt-3">{c.micro}</p>
            </>
          )}

          {widgetLive === false &&
            (checkoutUrl ? (
              <button className="fnl-cta" onClick={buy} disabled={busy}>
                {c.cta}
              </button>
            ) : (
              // No offer code, no button. The buyer is not told the kit exists
              // and then handed a dead link; they go on to what they paid for.
              <button className="fnl-cta" onClick={decline}>
                {c.decline}
              </button>
            ))}

          <p className="fnl-micro mt-3">{c.guarantee}</p>
        </div>

        {widgetLive === false && checkoutUrl && (
          <button className="fnl-ghost mt-6" onClick={decline}>
            {c.decline}
          </button>
        )}
      </main>
    </div>
  );
}
