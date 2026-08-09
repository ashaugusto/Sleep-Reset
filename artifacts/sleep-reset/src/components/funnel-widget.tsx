import { useEffect, useRef } from "react";

// ─── Third party markup, mounted so that it actually runs ────────────────────
// Hotmart's Funil de Vendas does not give us an API for the upsell buttons, it
// gives us a block of HTML generated per funnel step. Rendering it is not as
// simple as dropping it into JSX: React has no way to render a string as
// elements, and `dangerouslySetInnerHTML` parses <script> tags but the browser
// refuses to execute scripts inserted that way. A widget pasted with
// dangerouslySetInnerHTML looks pasted and does nothing.
//
// So the script tags are re-created as real elements. That is the standard way
// to mount a vendor embed, and it is the only part of this file that is not
// obvious. Everything else exists so the page above can know whether the embed
// is on screen: `onSettled(true)` when the container has height, false when it
// does not, so the caller can put its own buttons back rather than leave a
// buyer on a page with no way forward.

/** How long the widget gets to draw itself before we call it a failure. */
const SETTLE_MS = 2500;

export function FunnelWidget({
  html,
  onSettled,
  className,
}: {
  html: string;
  /** True once the embed has drawn something, false if it never did. */
  onSettled?: (live: boolean) => void;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  // Kept in a ref so the effect does not re-run, and re-mount the widget, every
  // time the parent re-renders with a new closure.
  const settled = useRef(onSettled);
  settled.current = onSettled;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    el.innerHTML = html;

    // Scripts parsed from innerHTML are inert. Replacing each one with a fresh
    // element, attributes and body copied over, is what makes the browser run
    // it. Order is preserved, which matters when a vendor ships a loader plus a
    // call to it.
    const scripts = Array.from(el.querySelectorAll("script"));
    for (const old of scripts) {
      const fresh = document.createElement("script");
      for (const { name, value } of Array.from(old.attributes)) fresh.setAttribute(name, value);
      fresh.text = old.textContent ?? "";
      old.replaceWith(fresh);
    }

    let done = false;
    const check = (live: boolean) => {
      if (done) return;
      done = true;
      settled.current?.(live);
    };

    // Most embeds are on screen in the same frame. The timer is for the ones
    // that fetch first, and for the ones that never arrive at all because a
    // blocker ate the request.
    const raf = requestAnimationFrame(() => {
      if (el.getBoundingClientRect().height > 0) check(true);
    });
    const timer = window.setTimeout(() => check(el.getBoundingClientRect().height > 0), SETTLE_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      el.innerHTML = "";
    };
  }, [html]);

  return <div ref={host} className={className} />;
}

/**
 * What was pasted into a widget file, or "" if it is still just the note
 * telling somebody to paste. Comments and whitespace do not count as content,
 * which is what lets the placeholder file carry its own instructions.
 */
export function widgetMarkup(raw: string): string {
  const stripped = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  return stripped;
}
