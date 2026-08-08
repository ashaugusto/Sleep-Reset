import type { Profile } from "@/locales/types";

// ─── Funnel structure ────────────────────────────────────────────────────────
// What used to be one file of English copy is now two things:
//
//   • this file      the structure the API cares about: question order, answer
//                    slugs, what each answer derives, which episode belongs to
//                    which type, the prices.
//   • src/locales/*  every word a visitor reads, one file per language.
//
// The split exists for one reason: the slugs below are scored server-side
// (api-server/src/routes/quiz.ts → classifyType). Renaming one silently breaks
// classification, so they must never sit next to translatable text where a
// translator would reasonably change them.
//
// House rules that survive into every locale: no em dash, no emoji, and no
// claim we cannot support. Spec: marketing/flu143-enquete-perguntas.md

export type { Profile };

export type Choice = {
  key: string;
  /** Extra answer fields this choice writes (Q3 carries frequency + duration). */
  derives?: Record<string, string>;
};

export type Question = {
  key: string;
  choices: Choice[];
};

/** Order matters: it is the order the visitor answers in. */
export const QUESTIONS: Question[] = [
  {
    key: "main_problem",
    choices: [
      { key: "wake_3am" },
      { key: "cant_fall_asleep" },
      { key: "both" },
      { key: "light_all_night" },
      { key: "irregular_schedule" },
    ],
  },
  {
    key: "night_mind",
    choices: [
      { key: "racing" },
      { key: "alert" },
      { key: "clock_math" },
      { key: "sleep_anxiety" },
    ],
  },
  {
    // One tap, two data points: `severity` plus the derived frequency/duration
    // the old quiz spent two separate questions collecting.
    key: "severity",
    choices: [
      { key: "nightly_chronic", derives: { frequency: "every_night", duration: "3y_plus" } },
      { key: "most_nights", derives: { frequency: "4_6_per_wk", duration: "3_12mo" } },
      { key: "few_nights", derives: { frequency: "2_3_per_wk" } },
      { key: "waves", derives: { frequency: "2_3_per_wk" } },
    ],
  },
  {
    // Single-select ladder: pick the furthest you've gone. Multi-select needed
    // a Continue button and was the only question that broke the one-tap rule.
    // `prescription` is the highest purchase intent of the five.
    key: "tried",
    choices: [
      { key: "supplements" },
      { key: "apps" },
      { key: "hygiene" },
      { key: "prescription" },
      { key: "nothing" },
    ],
  },
  {
    // Last on purpose: heaviest question, and the one the offer copy quotes back.
    key: "day_impact",
    choices: [
      { key: "no_energy" },
      { key: "brain_fog" },
      { key: "bad_mood" },
      { key: "dread" },
    ],
  },
];

/** Analysis screen pacing, in ms per line. */
export const ANALYZE_LINE_MS = 800;

/** Which ad hero the offer page should match for each type. */
export const TYPE_TO_HERO: Record<Profile, string> = {
  onset: "hyperarousal",
  maintenance: "wake3am",
  mixed: "default",
  circadian: "melatonin",
};

/** The WIRED episode embedded under each result. Titles live in the locales. */
export const TYPE_TO_EPISODE: Record<Profile, { n: number; src: string; poster: string; runtime: string }> = {
  maintenance: { n: 4, src: "/videos/eps/ep4.mp4", poster: "/images/watch/ep4.jpg?v=2", runtime: "1m 33s" },
  onset: { n: 3, src: "/videos/eps/ep3.mp4", poster: "/images/watch/ep3.jpg?v=2", runtime: "2m 02s" },
  circadian: { n: 2, src: "/videos/eps/ep2.mp4", poster: "/images/watch/ep2.jpg?v=2", runtime: "1m 54s" },
  mixed: { n: 3, src: "/videos/eps/ep3.mp4", poster: "/images/watch/ep3.jpg?v=2", runtime: "2m 02s" },
};

/** Offer page: which of the seven nights does the heavy lifting for each type. */
export const TYPE_TO_KEY_NIGHT: Record<Profile, number> = {
  maintenance: 4, // the 3AM response
  onset: 3,       // the wind-down that works cold
  circadian: 5,   // anchoring the clock
  mixed: 2,       // taking the effort out, which has to come first
};

// ─── Prices ──────────────────────────────────────────────────────────────────
// Single source for every surface in the funnel. The anchor is honest: it is
// the price at public launch, not a countdown that resets on reload.
export const PRICE_TODAY = 27;
export const PRICE_ANCHOR = 47;
/** Recovery Pack. Same €19 as the /upgrade OTO, sold here as an order bump. */
export const BUMP_PRICE = 19;
