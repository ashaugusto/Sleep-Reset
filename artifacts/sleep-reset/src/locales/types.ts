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
};
