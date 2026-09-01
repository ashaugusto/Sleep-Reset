// ─── The legal pages, in the four languages the product sells in ─────────────
// The terms lived in English only until FLU-243, while the funnel, the offer
// pages and the checkout were all in four. For a French buyer that is not a
// tidiness problem: dir. 93/13 wants contract terms in clear and intelligible
// language, and the Code de la consommation expects that language to be French.
// While the whole product was one 27 EUR download it was a theoretical risk.
// With a human service at 149 EUR and health data in the middle of it, it is
// not, so the terms follow the same locale as everything else.
//
// The shape is deliberately dumb: a heading, a date, an intro, and a list of
// sections whose `content` is the same tiny markdown subset the pages already
// render (blank line for a paragraph, `**bold**`). Nothing here is templated
// and nothing is interpolated, because a contract with a placeholder in it is
// a contract nobody proof-read.

export type LegalSection = {
  title: string;
  content: string;
};

export type LegalCopy = {
  heading: string;
  /** Already formatted for the language. Not a date to be localised at render. */
  updated: string;
  intro: string;
  sections: LegalSection[];
  back: string;
};
