import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n, fill, money } from "@/lib/i18n";
import { OFFERS, hotmartCheckoutUrl } from "@/lib/offers";
import { FunnelHeader } from "@/components/funnel-chrome";
import { logEvent, haptic } from "@/lib/funnel-track";
import "@/styles/funnel.css";

// ─── Rung 4: the downsell ────────────────────────────────────────────────────
// The page that appears when somebody says no on /kit. Until now that click
// went straight to /welcome and the 47 EUR refusal was the end of the ladder;
// this is the 9 EUR version of the same thing, and it is the only rung that is
// shown to a visitor who has just told us no.
//
// Which is exactly why it is built the way it is. A second ask, after a refusal,
// is the easiest screen in the funnel to turn into a trap, so the rules from
// /kit are tighter here, not looser:
//
//   - The decline is a real, findable link, at full contrast, and it is the
//     only thing on the page if there is nothing to sell.
//   - Both answers end at /welcome carrying the transaction, which is what the
//     buyer needs to claim what they have already paid for. Losing that is
//     worse than losing the 9 EUR.
//   - There is no third ask. Say no here and the funnel is over.
//
// What it sells is not a new recording: it is the Kit's twenty minute protocol
// on its own, public/audio/kit-3am-protocol.mp3, the same file the Kit buyer
// gets. src/lib/library.ts holds the other half of that, which is that a Kit
// buyer never sees this offered back to them.
//
// No Hotmart one-click widget here, unlike /kit. The funnel step that generates
// one is configured per upsell in the panel, and this rung has no product yet;
// when it does, the widget goes in the same way /kit does it and this comment
// is what says so.

const TRANSACTION_KEYS = ["transaction", "trans", "hotmart_transaction", "tid"];

export default function Protocol() {
  const { t } = useI18n();
  const c = t.downsell;
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const params = useMemo(
    () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search)),
    [],
  );
  const transaction = TRANSACTION_KEYS.map((k) => params.get(k)).find((v) => !!v) ?? "";
  const email = params.get("email") ?? "";

  const onward = useMemo(() => {
    const q = new URLSearchParams();
    if (transaction) q.set("transaction", transaction);
    return `/welcome${q.toString() ? `?${q}` : ""}`;
  }, [transaction]);

  const checkoutUrl = hotmartCheckoutUrl("downsell", {
    email: email || undefined,
    tracking: { h: "downsell", tx: transaction || null },
  });

  useEffect(() => {
    logEvent("downsell_view");
    // The offer code is not in the build. Not a visitor-facing failure, a
    // deploy one, and it is lost revenue rather than silence.
    if (!checkoutUrl) logEvent("downsell_unconfigured");
  }, [checkoutUrl]);

  const buy = () => {
    if (inFlight.current || !checkoutUrl) return;
    inFlight.current = true;
    haptic();
    setBusy(true);
    logEvent("downsell_checkout");
    window.location.href = checkoutUrl;
  };

  const decline = () => {
    logEvent("downsell_decline");
    window.location.href = onward;
  };

  const price = money(t, OFFERS.downsell.price);

  return (
    <div className="fnl">
      {/* Same three filled ticks as /kit. This is a second question inside the
          last step, not a fourth step: the rule must not imply the funnel grew
          because they said no. */}
      <FunnelHeader ticks={3} on={3} />
      <main className="fnl-wrap fnl-main">
        <span className="fnl-eyebrow mb-5">{c.eyebrow}</span>
        <h1 className="fnl-display mb-4">{c.title}</h1>
        {/* The product name stays English in all four languages, like the Kit
            and the Recovery Pack, and the promise underneath is what explains
            it in the visitor's own. */}
        <p className="fnl-label mb-2">{c.name}</p>
        <p className="fnl-lede mb-9">{c.promise}</p>

        {/* Same numbered rule as the quiz's contract and the seven nights on
            /plan. The visitor read that shape twice already, which is how this
            reads as the next line of the same order rather than a new page. */}
        <ol className="fnl-promises mb-9">
          {c.bullets.map((line, i) => (
            <li key={line}>
              <span className="fnl-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>

        <div className="fnl-offer">
          <p className="fnl-price">
            <span className="fnl-price-now">{price}</span>
          </p>
          <p className="fnl-body mb-5">{fill(c.priceLine, { price })}</p>

          {checkoutUrl ? (
            <button className="fnl-cta" onClick={buy} disabled={busy}>
              {fill(c.cta, { price })}
            </button>
          ) : (
            // Nothing to sell. They are not told the protocol exists and then
            // handed a dead button; the only control is the way out.
            <button className="fnl-cta" onClick={decline}>
              {c.decline}
            </button>
          )}

          <p className="fnl-micro mt-3">{c.guarantee}</p>
        </div>

        {checkoutUrl && (
          <button className="fnl-ghost mt-6" onClick={decline}>
            {c.decline}
          </button>
        )}
      </main>
    </div>
  );
}
