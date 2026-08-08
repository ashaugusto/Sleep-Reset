// ─── Quiz content ────────────────────────────────────────────────────────────
// Every word the visitor reads in the entry quiz lives here, so marketing can
// rewrite copy without touching the page components.
// Source spec: marketing/flu143-enquete-perguntas.md
//
// The `key` and `value` slugs are NOT free text: the API scores the quiz from
// them (api-server/src/routes/quiz.ts → classifyType). Renaming one silently
// breaks typing. Labels, emoji and feedback are safe to change.
//
// Rule from the spec, worth repeating: no claim we can't support. No
// "1,200 profiles analysed", no "join X people". If one appears here, it goes.

export type Profile = "maintenance" | "onset" | "mixed" | "circadian";

export type Choice = {
  key: string;
  label: string;
  emoji: string;
  /** One line shown for ~1.1s after the tap. Information, never praise. */
  feedback: string;
  /** Extra answer fields this choice writes (Q3 carries frequency + duration). */
  derives?: Record<string, string>;
};

export type Question = {
  key: string;
  prompt: string;
  helper?: string;
  choices: Choice[];
};

export const INTRO = {
  eyebrow: "A 60-second sleep test",
  headline: "Why does your brain wake you at 3AM?",
  sub: "Five questions. Sixty seconds. At the end you get your sleep type and the exact mechanism behind it.",
  cta: "Show me my sleep type",
  // The single most important line on the screen — it's what separates this
  // from every other quiz funnel in the niche. Keep it under the button.
  microcopy: "No email needed to see your result.",
};

/** Held for A/B once traffic is back on. Swap INTRO's headline/sub with one. */
export const INTRO_VARIANTS = {
  b: {
    headline: "You've tried everything. Find out what you actually have.",
    sub: "Most people treat the wrong kind of insomnia for years. Five questions tells you which one is yours.",
  },
  c: {
    headline: "Three types of people can't sleep. Only one of them wakes at 3AM.",
    sub: "Answer five questions and find out which one you are.",
  },
};

export const QUESTIONS: Question[] = [
  {
    key: "main_problem",
    prompt: "Which one is your night?",
    helper: "Pick the one that ruins the most nights.",
    choices: [
      {
        key: "wake_3am",
        label: "I fall asleep fine — then I'm awake at 3AM",
        emoji: "🌙",
        feedback: "That's the most common answer on this test.",
      },
      {
        key: "cant_fall_asleep",
        label: "I lie there for hours before I fall asleep",
        emoji: "🔁",
        feedback: "Your brain won't hand over the shift. There's a reason.",
      },
      {
        key: "both",
        label: "Both — hard to fall asleep, then awake again",
        emoji: "⚡",
        feedback: "Two problems, one mechanism underneath. We'll get to it.",
      },
      {
        key: "light_all_night",
        label: "I sleep, but light and broken all night",
        emoji: "🪶",
        feedback: "Sleep that never goes deep. Different failure, same cause.",
      },
      {
        key: "irregular_schedule",
        label: "My schedule is chaos — shifts, travel, late nights",
        emoji: "🕐",
        feedback: "Your body clock is being overwritten every week.",
      },
    ],
  },
  {
    key: "night_mind",
    prompt: "When you're awake at night, what's your brain doing?",
    helper: "Be honest. Everyone picks one of these.",
    choices: [
      {
        key: "racing",
        label: "Racing — work, money, conversations on loop",
        emoji: "🌀",
        feedback: "Not thoughts. A brain stuck on guard duty.",
      },
      {
        key: "alert",
        label: "Wide awake and alert, like it's midday",
        emoji: "🫀",
        feedback: "Alert at 3AM is a hormone doing its job badly.",
      },
      {
        key: "clock_math",
        label: "Watching the clock, doing the math on hours left",
        emoji: "⏰",
        feedback: "Clock math is the fastest way to stay awake.",
      },
      {
        key: "sleep_anxiety",
        label: "Worrying about not sleeping",
        emoji: "😰",
        feedback: "Trying harder to sleep is what keeps you awake.",
      },
    ],
  },
  {
    // One tap, two data points: `severity` plus the derived frequency/duration
    // the old quiz spent two separate questions collecting.
    key: "severity",
    prompt: "How often does this happen?",
    helper: "Roughly. Nobody's counting.",
    choices: [
      {
        key: "nightly_chronic",
        label: "Almost every night, and it's been years",
        emoji: "🔴",
        feedback: "Years, not weeks. This is chronic insomnia territory.",
        derives: { frequency: "every_night", duration: "3y_plus" },
      },
      {
        key: "most_nights",
        label: "Most nights for the last few months",
        emoji: "🟠",
        feedback: "Past three months, it stops being a bad patch.",
        derives: { frequency: "4_6_per_wk", duration: "3_12mo" },
      },
      {
        key: "few_nights",
        label: "A few nights a week, on and off",
        emoji: "🟡",
        feedback: "On and off is still every week. It counts.",
        derives: { frequency: "2_3_per_wk" },
      },
      {
        key: "waves",
        label: "It comes in waves — good weeks, terrible weeks",
        emoji: "🟢",
        feedback: "The waves usually track something. We'll find it.",
        derives: { frequency: "2_3_per_wk" },
      },
    ],
  },
  {
    // Single-select ladder: pick the furthest you've gone. Multi-select needed
    // a Continue button and was the only question that broke the one-tap rule.
    key: "tried",
    prompt: "What have you already tried?",
    helper: "Pick the furthest you've gone.",
    choices: [
      {
        key: "supplements",
        label: "Melatonin, teas, magnesium",
        emoji: "🍵",
        feedback: "Melatonin shifts timing. It doesn't stop hyperarousal.",
      },
      {
        key: "apps",
        label: "Sleep apps, meditation, white noise",
        emoji: "📱",
        feedback: "Apps calm the room. The problem isn't the room.",
      },
      {
        key: "hygiene",
        label: "Sleep hygiene — dark room, no screens, no coffee",
        emoji: "📋",
        feedback: "Sleep hygiene prevents insomnia. It doesn't treat it.",
      },
      {
        // Highest purchase intent of the five. Flagged on the profile for
        // retargeting and for which bump we show.
        key: "prescription",
        label: "Prescription sleeping pills",
        emoji: "💊",
        feedback: "You went as far as medicine goes. And you're still here.",
      },
      {
        key: "nothing",
        label: "Honestly, nothing serious yet",
        emoji: "🆕",
        feedback: "Then you're starting before the years pile up.",
      },
    ],
  },
  {
    // Last on purpose: heaviest question, and the one the offer copy quotes back.
    key: "day_impact",
    prompt: "What does the next day cost you?",
    helper: "The part you'd fix first.",
    choices: [
      {
        key: "no_energy",
        label: "Energy — I'm running on empty by 10am",
        emoji: "🔋",
        feedback: "Coffee stops working around the third bad week.",
      },
      {
        key: "brain_fog",
        label: "Focus — I read the same line four times",
        emoji: "🌫️",
        feedback: "That fog is your brain running maintenance while awake.",
      },
      {
        key: "bad_mood",
        label: "Patience — I snap at people I love",
        emoji: "😤",
        feedback: "The people around you notice before you do.",
      },
      {
        key: "dread",
        label: "Dread — I start fearing bedtime by dinner",
        emoji: "🛏️",
        feedback: "Dreading bed is the loop feeding itself.",
      },
    ],
  },
];

/** Analysis screen: one line every 800ms, the finished ones stay with a check. */
export const ANALYZING_LINES = [
  "Reading your answers…",
  "Matching them to the four insomnia types…",
  "Your result is ready.",
];

export type ResultBlock = {
  title: string;
  subtitle: string;
  /** Paragraph 1 = the mechanism. Paragraph 2 = why nothing has worked. */
  body: [string, string];
  /** One line bridging the diagnosis into the email ask. */
  bridge: string;
  /** Name used inside the email sub-headline: "Your full {label} breakdown…". */
  label: string;
  /** WIRED episode embedded under the result for this type. */
  episode: { n: number; title: string; src: string; poster: string };
};

const EP = {
  mechanism: { n: 3, title: "The Mechanism", src: "/videos/eps/ep3.mp4", poster: "/images/watch/ep3.jpg?v=2" },
  threeAm: { n: 4, title: "Why Exactly 3:07 AM", src: "/videos/eps/ep4.mp4", poster: "/images/watch/ep4.jpg?v=2" },
  nothingWorked: { n: 2, title: "Why Nothing Worked", src: "/videos/eps/ep2.mp4", poster: "/images/watch/ep2.jpg?v=2" },
};

export const RESULT_BADGE = "Your result";

export const RESULTS: Record<Profile, ResultBlock> = {
  // 67% of the profiles we have land here. This is the block that matters.
  maintenance: {
    title: "You're a Maintenance Type.",
    subtitle: "You don't have trouble falling asleep. You have trouble staying asleep — and that's a different problem with a different fix.",
    body: [
      "Here's what happens to you around 3AM. Cortisol — the hormone that gets you out of bed in the morning — doesn't switch on at your alarm. It starts rising in the second half of the night, hours before you need it. In most people that pulse passes underneath sleep and nobody notices. In you, it lands like an alarm. Eyes open. Fully alert. At the worst possible hour.",
      "That's the first half. The second half is what your brain has learned to do with it. After enough bad nights, waking up stops being neutral and becomes a threat — so the moment you're awake, your brain starts checking the clock, doing the math, bracing for tomorrow. That's hyperarousal, and it's why trying harder makes it worse. It's also why melatonin, apps and sleep hygiene did nothing for you: they're built to help you fall asleep. You already do that fine. Nobody gave you anything for the 3AM half.",
    ],
    bridge: "Your plan targets the wake-up, not the bedtime.",
    label: "Maintenance Type",
    episode: EP.threeAm,
  },
  onset: {
    title: "You're an Onset Type.",
    subtitle: "Your body is ready for sleep. Your brain refuses to hand over the shift.",
    body: [
      "Falling asleep isn't a decision, it's a handover — your nervous system has to drop out of alert mode before sleep can start. Yours doesn't. The moment the lights go off and the distractions stop, the day's unfinished business gets the floor: work, money, the conversation you replayed at 6pm. Your body is exhausted and your brain is running at midday speed. That's the “tired but wired” state, and it's a measurable physical condition, not a personality trait.",
      "The part that traps people is what comes next. Every hour you spend awake in bed teaches your brain that bed is where you lie there thinking. Do that for a few hundred nights and the bedroom itself becomes the trigger — you get sleepy on the sofa and wide awake the second you lie down. This is why “just relax” fails and why effort backfires: sleep is the one thing that gets further away the harder you chase it. It has to be approached from the side.",
    ],
    bridge: "Your plan works on the handover, not on willpower.",
    label: "Onset Type",
    episode: EP.mechanism,
  },
  circadian: {
    title: "You're a Circadian Type.",
    subtitle: "Your sleep isn't broken. It's being scheduled by something other than your body clock.",
    body: [
      "You have an internal clock that decides when you get sleepy, and it runs on light and routine — not on how tired you are. Shift work, travel, and late nights rewrite that clock faster than it can adjust. So it stops arriving at the same time every night. You lie down when the schedule says to and your body isn't there yet, or it showed up three hours ago and left.",
      "This is the type that gets the worst advice, because most sleep products assume a normal schedule and tell you to keep a fixed bedtime. You can't. What you can do is anchor the clock from the other end — the wake-up, the first light of the day, the first hour after it. Those are the signals your body actually reads, and they work even when your nights don't repeat.",
    ],
    bridge: "Your plan anchors the mornings, because your nights move.",
    label: "Circadian Type",
    episode: EP.nothingWorked,
  },
  mixed: {
    title: "You're a Mixed Type.",
    subtitle: "Two problems on the surface. One mechanism underneath.",
    body: [
      "You have trouble getting in and trouble staying in — which reads like two separate faults but usually isn't. It's a nervous system that never fully drops out of alert. It keeps you from falling asleep at the start of the night, and it wakes you at the first natural surface point a few hours in. Same guard, two shifts.",
      "Mixed is the type that makes people give up, because fixing one half seems to make the other worse: you finally fall asleep faster and then you're up at 3AM anyway. That's not failure, it's the order being wrong. When the underlying arousal comes down, both halves move together — but it has to be done in sequence, one before the other, which is the part nobody tells you.",
    ],
    bridge: "Your plan runs in order, because both halves are connected.",
    label: "Mixed Type",
    episode: EP.mechanism,
  },
};

export const CAPTURE = {
  headline: "Where should we send your plan?",
  /** {TYPE} is replaced with the profile's `label`. */
  sub: "Your full {TYPE} breakdown plus Night 1 of the protocol. One email. Nothing else.",
  button: "Send me my plan",
  micro: "No spam. One follow-up at most. Unsubscribe in one click.",
  // Not optional. The hero promised no email to see the result — gating what
  // comes after breaks that promise with the sceptic, who is the buyer.
  skip: "Or keep reading without it →",
};
