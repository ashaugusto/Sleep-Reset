import type { Locale } from "@/lib/i18n";

// ─── The four dates Reset Season is delivered on ─────────────────────────────
// The sixth rung has no drip and no queue: it drops on 1 January, 1 April,
// 1 July and 1 October, and on no other day. Ash fixed that on 23 Aug 2026, and
// it is what makes the rung honest in a product that promises no subscription —
// a year of content bought once, delivered on dates anyone can check, instead of
// a renewal date nobody remembers agreeing to.
//
// Every buyer gets four drops: the four fixed dates that fall inside their
// twelve months. Buy in February and the four are April, July, October and
// January. Nobody gets fewer for having bought in the wrong month, which is the
// first question the copy answers.
//
// This file exists because of the second question. "Fixed dates" leaves the
// visitor doing calendar arithmetic to find out how long they are about to wait,
// and somebody hesitating over 39 EUR does not do arithmetic, they close the
// tab. So the page says the date out loud, in their language, and this is where
// that string is worked out. It is the only variable in the funnel that is not
// a price.
//
// Copy and the decisions behind it: marketing/esteira-degraus-4-7-copy.md.

/** January, April, July, October, as month indexes. */
export const DROP_MONTHS = [0, 3, 6, 9] as const;

/**
 * The next drop after `now`, strictly after: a drop day that is today has
 * already gone out with the morning's batch, so it is not what this buyer is
 * waiting for. Being one quarter pessimistic on one day in ninety is the
 * cheaper mistake — the other direction promises a delivery that already
 * happened, to somebody who has just paid.
 */
export function nextSeasonDropDate(now: Date = new Date()): Date {
  const year = now.getFullYear();
  for (const month of DROP_MONTHS) {
    const drop = new Date(year, month, 1);
    if (drop > now) return drop;
  }
  return new Date(year + 1, DROP_MONTHS[0], 1);
}

// The month names are written out rather than taken from Intl, for two reasons
// that both end in the visitor reading something slightly wrong. French wants
// "1er avril" and Intl gives "1 avril". Portuguese here capitalises the month,
// because the bullet directly above names all four dates that way, and Intl
// lowercases it. On top of that the exact output moves with the ICU version
// bundled in whatever browser the visitor turned up with, and this string sits
// in the middle of a sentence Sophie wrote.
//
// Only four months can ever appear, so this is sixteen strings, not a calendar.
const MONTHS: Record<Locale, Record<(typeof DROP_MONTHS)[number], string>> = {
  pt: { 0: "Janeiro", 3: "Abril", 6: "Julho", 9: "Outubro" },
  en: { 0: "January", 3: "April", 6: "July", 9: "October" },
  fr: { 0: "janvier", 3: "avril", 6: "juillet", 9: "octobre" },
  es: { 0: "enero", 3: "abril", 6: "julio", 9: "octubre" },
};

// Day and month, with no preposition and no article. The French and Spanish
// bullets already carry "le" and "el" in Sophie's text, so the value goes in
// raw; adding them here would render "le le 1er avril".
const SHAPE: Record<Locale, (month: string) => string> = {
  pt: (month) => `1 de ${month}`,
  en: (month) => `1 ${month}`,
  fr: (month) => `1er ${month}`,
  es: (month) => `1 de ${month}`,
};

/**
 * `{nextDate}` for the season copy: the next drop, in the visitor's language.
 *
 *   fill(t.season.bullets[1], { nextDate: nextSeasonDrop(locale) })
 */
export function nextSeasonDrop(locale: Locale, now: Date = new Date()): string {
  const drop = nextSeasonDropDate(now);
  const month = drop.getMonth() as (typeof DROP_MONTHS)[number];
  return SHAPE[locale](MONTHS[locale][month]);
}
