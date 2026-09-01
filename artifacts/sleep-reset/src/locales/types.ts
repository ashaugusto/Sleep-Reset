// ─── Shape of every locale file ──────────────────────────────────────────────
// One dictionary per language, all of them structurally identical, so a missing
// string is a TypeScript error and never a blank space in front of a visitor.
//
// What lives here is only what paid traffic reads: quiz, result, offer. The
// legacy /watch page is not translated and is not part of this path.
//
// Two house rules survive translation and are not negotiable in any language:
//   1. No em dash. Colon, full stop or comma.
//   2. No emoji.
// And the old one: no claim we cannot support. No invented numbers, no
// "join X people", no testimonial that was not given.
//
// The answer slugs (question keys, choice keys) are NOT in here. They live in
// lib/quiz-data.ts because the API scores from them. Translating a slug breaks
// classification silently. Only labels and prose belong in this file.

export type Profile = "maintenance" | "onset" | "mixed" | "circadian";

/** prompt/helper for a question, plus one entry per choice slug. */
export type QuestionCopy = {
  prompt: string;
  helper: string;
  /** keyed by choice slug from quiz-data.ts */
  choices: Record<string, { label: string; feedback: string }>;
};

export type ResultCopy = {
  /** "You're a Maintenance Type." */
  title: string;
  subtitle: string;
  /** Long form: paragraph 1 = the mechanism, paragraph 2 = why nothing worked. */
  body: [string, string];
  /** One line bridging the diagnosis into the ask. */
  bridge: string;
  /** Short name reused inside other sentences: "Your full {label} breakdown". */
  label: string;
  /** ── The scannable read-out. Three lines, one per labelled row. ──
   *  This is the part that has to land in five seconds, before anyone decides
   *  whether the long form is worth reading. */
  have: string;
  night: string;
  first: string;
  /** Title of the episode embedded under this result. */
  episodeTitle: string;
  /** Offer page: what the seven nights do for this type specifically. */
  planLede: string;
};

/** ── The one click upsell, shown once, right after the front offer clears. ──
 *  The page itself is hosted by the checkout, so this copy gets pasted into a
 *  panel rather than rendered by us. It lives here anyway, for the reason the
 *  rest of the file exists: one wording, four languages, and a type error the
 *  day a language is missing a line. Deliverables it describes are real files:
 *  public/audio/kit-*.mp3 and public/kit/first-90-seconds.pdf. */
export type Oto1Copy = {
  eyebrow: string;
  title: string;
  /** Two paragraphs: the fear they have at this exact second, then the answer. */
  body: [string, string];
  includedLabel: string;
  included: [
    { title: string; body: string },
    { title: string; body: string },
    { title: string; body: string },
    { title: string; body: string },
  ];
  notLabel: string;
  not: string;
  /** "One payment of {price}." */
  priceLine: string;
  cta: string;
  /** The refusal has to be a real, findable link, or the page is a dark pattern. */
  decline: string;
  micro: string;
  guarantee: string;
};

/** ── The downsell, shown only to whoever said no to the Kit. ──
 *  Fourth rung, 9 EUR: public/audio/kit-3am-protocol.mp3 sold on its own,
 *  without the three trigger versions and without the printed card. Same file
 *  the Kit buyer gets, which is why src/lib/library.ts marks it superseded by
 *  the Kit and never offers it back to somebody who took the Kit.
 *
 *  Copy from Sophie, FLU-226: marketing/esteira-degraus-4-7-copy.md. She wrote
 *  it for exactly this reading of the rung, and flagged the alternative (a
 *  Recovery Pack track sold alone) as needing a different text. */
export type DownsellCopy = {
  /** Product name. English in all four languages, like the Kit. */
  name: string;
  eyebrow: string;
  title: string;
  /** One line under the title: what the offer is, in the visitor's language. */
  promise: string;
  bullets: [string, string, string, string];
  /** "One payment of {price}." */
  priceLine: string;
  /** Carries the price too: "Yes, take the protocol for {price}". */
  cta: string;
  /** The refusal has to be a real, findable link, or the page is a dark pattern. */
  decline: string;
  guarantee: string;
};

/** ── The second seat, sold inside the platform rather than in the funnel. ──
 *  Fifth rung, 17 EUR: a full second account for the person who gets woken up.
 *  Sophie's angle, and it is the whole offer: not a shared login, an account of
 *  their own with the sleep window worked out on their nights.
 *
 *  There is no `decline` here because there is no refusal screen. This is not a
 *  step in a funnel, it is a card in the member area, and the way to say no is
 *  to not press the button.
 *
 *  Copy from Sophie, FLU-226. She left one question open, whether the partner is
 *  invited by link or named at the checkout; the answer is the link, which is
 *  what /partner and /seat implement, so the copy stands as written. */
export type SeatCopy = {
  name: string;
  eyebrow: string;
  title: string;
  promise: string;
  bullets: [string, string, string, string, string];
  priceLine: string;
  cta: string;
  guarantee: string;
};

/** ── The shape the in-platform rungs share. ──
 *  Rungs 4, 5 and 6 are the same page under different names: a promise, a list
 *  of bullets, one price and one button. Sophie's mould, written down once so
 *  the sixth does not drift from the fourth, and so the seventh can say exactly
 *  what it changes.
 *
 *  `bullets` is narrowed to a fixed length by each rung that uses it. A tuple is
 *  what turns a dropped line into a type error rather than a page that is one
 *  bullet shorter in Spanish and nowhere else.
 */
export type RungCopy = {
  name: string;
  eyebrow: string;
  title: string;
  promise: string;
  bullets: string[];
  priceLine: string;
  cta: string;
  /** Only rung 4 has a refusal: it is the one that lives on an exit page. */
  decline?: string;
  guarantee: string;
};

/** ── Reset Season, the sixth rung: four drops across a year, paid once. ──
 *  39 EUR, sold inside the platform, delivered on 1 January, 1 April, 1 July
 *  and 1 October and on no other day. Every buyer gets the four dates that fall
 *  inside their twelve months, which is why the copy names them.
 *
 *  The line the whole rung stands on: this is not a subscription. The sales page
 *  promises "paid once, no subscription", and a year of content bought in one go
 *  is the only shape that keeps that true. Three of the five bullets say so out
 *  loud, in all four languages, and none of them may be softened.
 *
 *  `{nextDate}` is the one variable here that is not a price: the next of the
 *  four dates counted from today, in the visitor's language, with no preposition
 *  and no article, because the French and Spanish bullets already carry `le` and
 *  `el`. src/lib/season.ts is the only place that works it out.
 *
 *  There is no `decline`, for the same reason the seat has none: this is a card
 *  in the member area, not a step in a funnel, and the way to say no is to not
 *  press the button.
 *
 *  Copy from Sophie, FLU-226: marketing/esteira-degraus-4-7-copy.md.
 */
export type SeasonCopy = Omit<RungCopy, "bullets" | "decline"> & {
  bullets: [string, string, string, string, string];
};

/** One level of rung 7. The head of the page is shared between the two; the
 *  price line and the button are not, and `{price}` resolves per level rather
 *  than once for the page. */
export type BackendTier = {
  name: string;
  priceLine: string;
  /** Only the upper level has one: a bullet more, not a bullet different. */
  extra: string | null;
  cta: string;
};

/** ── The Recalibration, the seventh rung: a person reads the buyer's log. ──
 *  Sold at the end of night 7 and only to an account with seven logged nights,
 *  because what is being sold is a reading of that log. Two levels: 79 for the
 *  written plan, 149 for the same plan plus thirty minutes live. The prices are
 *  in src/lib/offers.ts under `backend` and `backendLive`, one Hotmart offer
 *  each, and the tiers below are in that same order.
 *
 *  Three lines are compliance, not style, and none of them is optional: the
 *  last bullet, `medical`, and the guarantee. The last bullet says this is
 *  education in writing and not medical advice. `medical` sits under the
 *  bullets and sends anyone on sleep medication, or sleeping badly for over
 *  three months, to a doctor, because the bullet above it cannot carry that
 *  weight alone. The guarantee cannot be the shared 30 days: it has to open
 *  with the 14 day right of withdrawal, which the buyer has to know about
 *  before pressing the button, say how that right is lost, and only then make
 *  the promise about reading the log first.
 *
 *  Copy from Sophie, FLU-226: marketing/esteira-degraus-4-7-copy.md, with the
 *  compliance substitutions of FLU-246 applied on top of it. Where the two
 *  disagree the source of truth is marketing/flu235-degrau7-compliance.md,
 *  point 5, and that file is the one to edit these strings from.
 */
export type BackendCopy = Omit<RungCopy, "bullets" | "priceLine" | "cta" | "decline"> & {
  bullets: [string, string, string, string, string];
  /** Sits under the bullets, above the prices. Never inside a tier card. */
  medical: string;
  tiers: [BackendTier, BackendTier];
};

export type Dict = {
  code: string;
  /** Native name, shown in the switcher. */
  name: string;
  /** Value for <html lang>. */
  htmlLang: string;
  /** Price template. "€{n}" in English, "{n} €" in the romance languages. */
  money: string;

  quiz: {
    eyebrow: string;
    headline: string;
    sub: string;
    cta: string;
    microcopy: string;
    promises: [string, string, string];
    /** "{n} / {total}" */
    stepLabel: string;
    building: string;
    back: string;
    noEmailNote: string;
    analysisLabel: string;
    analyzing: [string, string, string];
    privacy: string;
    failTitle: string;
    failBody: string;
    retry: string;
    questions: Record<string, QuestionCopy>;
  };

  result: {
    badge: string;
    loading: string;
    readoutLabel: string;
    haveLabel: string;
    nightLabel: string;
    firstLabel: string;
    fullReadLabel: string;
    /** "Watch next · Episode {n} · {time}" */
    watchNext: string;
    cta: string;
    ctaMicro: string;
    capture: {
      headline: string;
      sub: string;
      button: string;
      sending: string;
      micro: string;
      placeholder: string;
      sentTitle: string;
      sentBody: string;
      invalidEmail: string;
      saveError: string;
      networkError: string;
    };
    types: Record<Profile, ResultCopy>;
  };

  plan: {
    eyebrow: string;
    /** "Seven nights, built around your {label}." */
    title: string;
    /** "For a {label}, Night {n} is the one that carries the change." */
    keyNight: string;
    nightsLabel: string;
    nights: [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
    includedLabel: string;
    included: [string, string, string, string];
    bump: {
      label: string;
      title: string;
      body: string;
      /** "Yes, add the Recovery Pack for {price}" */
      check: string;
      note: string;
    };
    offerLabel: string;
    /** "One payment of {price}. No subscription." */
    priceLine: string;
    /** "Open beta price. It rises to {price} at public launch." */
    anchorLine: string;
    guarantee: string;
    /** "Start tonight for {price}" */
    cta: string;
    ctaBusy: string;
    ctaMicro: string;
    checkoutError: string;
    faqLabel: string;
    faq: [
      { q: string; a: string },
      { q: string; a: string },
      { q: string; a: string },
    ];
    backToResult: string;
  };

  oto1: Oto1Copy;
  downsell: DownsellCopy;
  seat: SeatCopy;
  season: SeasonCopy;
  backend: BackendCopy;
};
