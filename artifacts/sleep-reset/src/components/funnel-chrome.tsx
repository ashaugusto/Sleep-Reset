import { LOCALES, DICTS, useI18n, type Locale } from "@/lib/i18n";

// ─── Chrome shared by the three funnel screens ───────────────────────────────
// Wordmark, language switcher and the segmented progress rule. Kept together so
// the header is identical on the quiz, the result and the offer: the visitor
// should not be able to tell they changed page, only that they moved forward.

/** Wordmark. Drawn here rather than pulled from an icon set: a hairline
 *  crescent at 16px sits with the letterspaced type, a filled icon doesn't. */
export function Crescent() {
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

/**
 * Language switcher. A native select on purpose: it is two lines of markup, it
 * is reachable by keyboard and screen reader for free, and on a phone it opens
 * the OS picker, which is the control people already know. A custom dropdown
 * here would be decoration, and decoration in the header competes with the
 * question.
 */
export function LangSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <label className="fnl-lang">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="Language"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {DICTS[code].name}
          </option>
        ))}
      </select>
      <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
        <path d="M1 1.25 4.5 4.75 8 1.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </label>
  );
}

/**
 * The funnel header. `right` is whatever the page wants beside the wordmark
 * (the question counter on the quiz), and `ticks` is the progress rule: one
 * segment per step, `on` up to where the visitor has reached.
 */
export function FunnelHeader({
  right,
  ticks,
  on,
}: {
  right?: React.ReactNode;
  ticks: number;
  on: number;
}) {
  return (
    <header className="fnl-head">
      <div className="fnl-wrap fnl-head-row">
        <span className="fnl-mark">
          <Crescent /> Sleep Wired
        </span>
        <span className="fnl-head-right">
          {right && <span className="fnl-step">{right}</span>}
          <LangSwitch />
        </span>
      </div>
      <div className="fnl-progress">
        {Array.from({ length: ticks }, (_, i) => (
          <span key={i} className="fnl-tick" data-on={i < on} />
        ))}
      </div>
    </header>
  );
}
