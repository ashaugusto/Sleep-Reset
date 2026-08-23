import type { Dict } from "./types";

// ─── English — the source language ───────────────────────────────────────────
// Every other locale is translated from this file, so this is the one that gets
// edited first when marketing rewrites a line. The quiz and result copy here is
// the wording that was already running; the read-out and the offer page are new.
//
// Spec for the questions: marketing/flu143-enquete-perguntas.md

const en: Dict = {
  code: "en",
  name: "English",
  htmlLang: "en",
  money: "€{n}",

  quiz: {
    eyebrow: "60-second sleep test",
    headline: "Why does your brain wake you at 3AM?",
    sub: "Five questions. Sixty seconds. At the end you get your sleep type and the exact mechanism behind it.",
    cta: "Show me my sleep type",
    // The single most important line on the screen. It is what separates this
    // from every other quiz funnel in the niche. Keep it under the button.
    microcopy: "No email needed to see your result.",
    promises: [
      "Which of the four insomnia types you have",
      "The mechanism keeping you awake at your hour",
      "The one thing to change first, tonight",
    ],
    stepLabel: "{n} / {total}",
    building: "Building your result",
    back: "Back",
    noEmailNote: "No email to see your result",
    analysisLabel: "Analysis",
    analyzing: [
      "Reading your answers",
      "Matching them to the four insomnia types",
      "Your result is ready",
    ],
    privacy: "Your answers stay private. We never sell or share them.",
    failTitle: "We couldn't build your result.",
    failBody: "Your answers are saved. One tap and we'll try again.",
    retry: "Try again",

    questions: {
      main_problem: {
        prompt: "Which one is your night?",
        helper: "Pick the one that ruins the most nights.",
        choices: {
          wake_3am: {
            label: "I fall asleep fine, then I'm awake at 3AM",
            feedback: "That's the most common answer on this test.",
          },
          cant_fall_asleep: {
            label: "I lie there for hours before I fall asleep",
            feedback: "Your brain won't hand over the shift. There's a reason.",
          },
          both: {
            label: "Both. Hard to fall asleep, then awake again",
            feedback: "Two problems, one mechanism underneath. We'll get to it.",
          },
          light_all_night: {
            label: "I sleep, but light and broken all night",
            feedback: "Sleep that never goes deep. Different failure, same cause.",
          },
          irregular_schedule: {
            label: "My schedule is chaos: shifts, travel, late nights",
            feedback: "Your body clock is being overwritten every week.",
          },
        },
      },
      night_mind: {
        prompt: "When you're awake at night, what's your brain doing?",
        helper: "Be honest. Everyone picks one of these.",
        choices: {
          racing: {
            label: "Racing. Work, money, conversations on loop",
            feedback: "Not thoughts. A brain stuck on guard duty.",
          },
          alert: {
            label: "Wide awake and alert, like it's midday",
            feedback: "Alert at 3AM is a hormone doing its job badly.",
          },
          clock_math: {
            label: "Watching the clock, doing the math on hours left",
            feedback: "Clock math is the fastest way to stay awake.",
          },
          sleep_anxiety: {
            label: "Worrying about not sleeping",
            feedback: "Trying harder to sleep is what keeps you awake.",
          },
        },
      },
      severity: {
        prompt: "How often does this happen?",
        helper: "Roughly. Nobody's counting.",
        choices: {
          nightly_chronic: {
            label: "Almost every night, and it's been years",
            feedback: "Years, not weeks. This is chronic insomnia territory.",
          },
          most_nights: {
            label: "Most nights for the last few months",
            feedback: "Past three months, it stops being a bad patch.",
          },
          few_nights: {
            label: "A few nights a week, on and off",
            feedback: "On and off is still every week. It counts.",
          },
          waves: {
            label: "It comes in waves. Good weeks, terrible weeks",
            feedback: "The waves usually track something. We'll find it.",
          },
        },
      },
      tried: {
        prompt: "What have you already tried?",
        helper: "Pick the furthest you've gone.",
        choices: {
          supplements: {
            label: "Melatonin, teas, magnesium",
            feedback: "Melatonin shifts timing. It doesn't stop hyperarousal.",
          },
          apps: {
            label: "Sleep apps, meditation, white noise",
            feedback: "Apps calm the room. The problem isn't the room.",
          },
          hygiene: {
            label: "Sleep hygiene: dark room, no screens, no coffee",
            feedback: "Sleep hygiene prevents insomnia. It doesn't treat it.",
          },
          prescription: {
            label: "Prescription sleeping pills",
            feedback: "You went as far as medicine goes. And you're still here.",
          },
          nothing: {
            label: "Honestly, nothing serious yet",
            feedback: "Then you're starting before the years pile up.",
          },
        },
      },
      day_impact: {
        prompt: "What does the next day cost you?",
        helper: "The part you'd fix first.",
        choices: {
          no_energy: {
            label: "Energy. I'm running on empty by 10am",
            feedback: "Coffee stops working around the third bad week.",
          },
          brain_fog: {
            label: "Focus. I read the same line four times",
            feedback: "That fog is your brain running maintenance while awake.",
          },
          bad_mood: {
            label: "Patience. I snap at people I love",
            feedback: "The people around you notice before you do.",
          },
          dread: {
            label: "Dread. I start fearing bedtime by dinner",
            feedback: "Dreading bed is the loop feeding itself.",
          },
        },
      },
    },
  },

  result: {
    badge: "Your result",
    loading: "Opening your result",
    readoutLabel: "The short version",
    haveLabel: "What you have",
    nightLabel: "What happens at night",
    firstLabel: "What has to change first",
    fullReadLabel: "The long version",
    watchNext: "Watch next · Episode {n} · {time}",
    cta: "See my 7-night plan",
    ctaMicro: "One payment · 30-day refund · Instant access",

    capture: {
      headline: "Where should we send your plan?",
      sub: "Your full {type} breakdown plus Night 1 of the protocol. One email. Nothing else.",
      button: "Send me my plan",
      sending: "Sending",
      micro: "No spam. One follow-up at most. Unsubscribe in one click.",
      placeholder: "you@example.com",
      sentTitle: "Your plan is on its way.",
      sentBody: "Check your inbox in the next few minutes.",
      invalidEmail: "Please enter a valid email.",
      saveError: "Could not save your email. Try again.",
      networkError: "Network error. Please try again.",
    },

    types: {
      // 67% of the profiles we have land here. This is the block that matters.
      maintenance: {
        title: "You're a Maintenance Type.",
        subtitle: "You don't have trouble falling asleep. You have trouble staying asleep, and that is a different problem with a different fix.",
        body: [
          "Here's what happens to you around 3AM. Cortisol, the hormone that gets you out of bed in the morning, doesn't switch on at your alarm. It starts rising in the second half of the night, hours before you need it. In most people that pulse passes underneath sleep and nobody notices. In you, it lands like an alarm. Eyes open. Fully alert. At the worst possible hour.",
          "That's the first half. The second half is what your brain has learned to do with it. After enough bad nights, waking up stops being neutral and becomes a threat, so the moment you're awake your brain starts checking the clock, doing the math, bracing for tomorrow. That's hyperarousal, and it's why trying harder makes it worse. It's also why melatonin, apps and sleep hygiene did nothing for you. They are built to help you fall asleep. You already do that fine. Nobody ever gave you anything for the 3AM half.",
        ],
        bridge: "Your plan targets the wake-up, not the bedtime.",
        label: "Maintenance Type",
        have: "Sleep maintenance insomnia. You start the night fine and lose it in the second half.",
        night: "A cortisol rise arrives hours early and lands on top of your sleep instead of underneath it.",
        first: "Stop working on bedtime. The 3AM wake-up is the part that has to be trained.",
        episodeTitle: "Why Exactly 3:07 AM",
        planLede: "Every night of the protocol works on the second half of your night. That is the half nothing you have tried so far was built for.",
      },
      onset: {
        title: "You're an Onset Type.",
        subtitle: "Your body is ready for sleep. Your brain refuses to hand over the shift.",
        body: [
          "Falling asleep isn't a decision, it's a handover. Your nervous system has to drop out of alert mode before sleep can start. Yours doesn't. The moment the lights go off and the distractions stop, the day's unfinished business gets the floor: work, money, the conversation you replayed at 6pm. Your body is exhausted and your brain is running at midday speed. That is the tired-but-wired state, and it's a measurable physical condition, not a personality trait.",
          "The part that traps people is what comes next. Every hour you spend awake in bed teaches your brain that bed is where you lie there thinking. Do that for a few hundred nights and the bedroom itself becomes the trigger. You get sleepy on the sofa and wide awake the second you lie down. This is why being told to relax fails, and why effort backfires. Sleep is the one thing that gets further away the harder you chase it. It has to be approached from the side.",
        ],
        bridge: "Your plan works on the handover, not on willpower.",
        label: "Onset Type",
        have: "Sleep onset insomnia. The body is ready, the nervous system will not hand over.",
        night: "Alert mode never drops, so the day's unfinished business gets the floor the moment the room goes quiet.",
        first: "Stop chasing sleep. The handover is approached from the side, never head on.",
        episodeTitle: "The Mechanism",
        planLede: "Every night of the protocol works on the handover, the thing a body does on its own and yours has stopped doing on cue.",
      },
      circadian: {
        title: "You're a Circadian Type.",
        subtitle: "Your sleep isn't broken. It's being scheduled by something other than your body clock.",
        body: [
          "You have an internal clock that decides when you get sleepy, and it runs on light and routine, not on how tired you are. Shift work, travel and late nights rewrite that clock faster than it can adjust. So it stops arriving at the same time every night. You lie down when the schedule says to and your body isn't there yet, or it showed up three hours ago and left.",
          "This is the type that gets the worst advice, because most sleep products assume a normal schedule and tell you to keep a fixed bedtime. You can't. What you can do is anchor the clock from the other end: the wake-up, the first light of the day, the first hour after it. Those are the signals your body actually reads, and they work even when your nights don't repeat.",
        ],
        bridge: "Your plan anchors the mornings, because your nights move.",
        label: "Circadian Type",
        have: "Circadian misalignment. The sleep itself is fine. The timing is not.",
        night: "Shifts, travel and light rewrite your body clock faster than it can settle on an hour.",
        first: "Stop fixing bedtime. The clock is anchored from the morning end.",
        episodeTitle: "Why Nothing Worked",
        planLede: "Every night of the protocol anchors the clock from the morning, because your nights refuse to repeat.",
      },
      mixed: {
        title: "You're a Mixed Type.",
        subtitle: "Two problems on the surface. One mechanism underneath.",
        body: [
          "You have trouble getting in and trouble staying in, which reads like two separate faults but usually isn't. It's a nervous system that never fully drops out of alert. It keeps you from falling asleep at the start of the night, and it wakes you at the first natural surface point a few hours in. Same guard, two shifts.",
          "Mixed is the type that makes people give up, because fixing one half seems to make the other worse. You finally fall asleep faster and then you're up at 3AM anyway. That's not failure, it's the order being wrong. When the underlying arousal comes down both halves move together, but it has to be done in sequence, one before the other, which is the part nobody tells you.",
        ],
        bridge: "Your plan runs in order, because both halves are connected.",
        label: "Mixed Type",
        have: "Mixed insomnia. Trouble getting in, and trouble staying in.",
        night: "One nervous system stuck on alert, working two shifts: the start of the night and the first time you surface.",
        first: "Stop treating the two halves separately. The order decides whether either one moves.",
        episodeTitle: "The Mechanism",
        planLede: "The protocol runs your two halves in sequence, arousal first, because that is the order that makes both of them move.",
      },
    },
  },

  plan: {
    eyebrow: "Your protocol",
    title: "Seven nights, built around your {label}.",
    keyNight: "For a {label}, Night {n} is the one that carries the change.",
    nightsLabel: "What the seven nights do",
    nights: [
      {
        title: "The baseline",
        body: "You measure the night you actually have, not the one you remember. Ten minutes, once.",
      },
      {
        title: "Taking the effort out",
        body: "The first rule that lowers the pressure to sleep, which is the pressure keeping you awake.",
      },
      {
        title: "A wind-down that works cold",
        body: "A twelve minute sequence that runs whether or not you feel calm when you start it.",
      },
      {
        title: "The 3AM response",
        body: "Exactly what to do when you are awake in the dark, including when to leave the bed and when not to.",
      },
      {
        title: "Anchoring the clock",
        body: "The wake time and the first hour of light that hold the rest of the week in place.",
      },
      {
        title: "The thoughts",
        body: "What to do with the loop at night, without arguing with it and without waiting it out.",
      },
      {
        title: "Keeping it",
        body: "How the protocol collapses into three habits you keep without thinking about them.",
      },
    ],
    includedLabel: "What you get",
    included: [
      "The 7-night protocol, one session per night",
      "Guided audio for every session",
      "The sleep diary and the charts that show whether it actually moved",
      "Lifetime access, every future update included",
    ],
    bump: {
      label: "Add-on",
      title: "The Recovery Pack",
      body: "What to do after a bad night, a travel night and a night on shift, so one broken night doesn't restart the whole thing.",
      check: "Yes, add the Recovery Pack for {price}",
      note: "Normally sold for {price} after you finish. Add it here and it goes in the same checkout.",
    },
    offerLabel: "The offer",
    priceLine: "One payment of {price}. No subscription, no recurring charge.",
    anchorLine: "Open beta price. It rises to {price} at public launch.",
    guarantee: "Finish the seven nights. If your sleep hasn't changed, every cent back. 30 days.",
    cta: "Start tonight for {price}",
    ctaBusy: "Taking you to checkout",
    ctaMicro: "Secure checkout by Hotmart. No account needed to start.",
    checkoutError: "Checkout didn't open. Please try again.",
    faqLabel: "Before you decide",
    faq: [
      {
        q: "Is this sleep hygiene again?",
        a: "No. Sleep hygiene prevents insomnia, it doesn't treat it, which is why it did nothing for you. This is the behavioural protocol used for chronic insomnia, cut down to seven nights you run at home.",
      },
      {
        q: "What if it doesn't work for me?",
        a: "Then you did the seven nights and you get your money back, up to 30 days. The refund doesn't depend on us agreeing about why.",
      },
      {
        q: "Do I need an account?",
        a: "Not to buy. After the payment you set a password on one screen, and the protocol opens on the same device.",
      },
    ],
    backToResult: "Back to my result",
  },

  oto1: {
    eyebrow: "Add before you go in",
    title: "The night it comes back",
    body: [
      "You just bought seven nights. Here is the question you are already asking: what about the first night it comes back? Because it does come back, once, usually a few weeks in, and that is the night that decides whether you keep the method or quietly stop using it.",
      "The 3AM Relapse Kit is what you run on that night. A twenty minute protocol you play in the dark, a card for the first ninety seconds, and three short versions for the three things that usually set it off. Nothing to read and nothing to work out at three in the morning.",
    ],
    includedLabel: "What is in it",
    included: [
      {
        title: "The 20 minute protocol",
        body: "Guided audio for the middle of the night, with the silences left in, so you are being talked through it while you do it instead of remembering a list.",
      },
      {
        title: "The first 90 seconds card",
        body: "One page. Printed for the bedside drawer and saved on your phone. What to do before you decide anything about the night.",
      },
      {
        title: "Three trigger versions",
        body: "Four to five minutes each, for the three relapses that actually happen: an anxious wake, a night after drinking, and a schedule that moved.",
      },
      {
        title: "Yours for good",
        body: "The same lifetime access as the protocol. Paid once, no subscription, every update included.",
      },
    ],
    notLabel: "What this is not",
    not: "It is not a second course and it is not more theory. It is the one night the seven nights do not cover, worked out in advance. Education and coaching, not medical care.",
    priceLine: "One payment of {price}, added to the order you just made.",
    cta: "Yes, add the Relapse Kit",
    decline: "No thanks, take me to my protocol",
    micro: "One click. Your card is not asked for again.",
    guarantee: "Covered by the same 30 day guarantee as the protocol.",
  },

  // Rungs 4 and 5, copy by Sophie: marketing/esteira-degraus-4-7-copy.md.
  downsell: {
    name: "The 3AM Protocol",
    eyebrow: "Before you go in",
    title: "Then take just the audio",
    promise: "The twenty minute audio at the centre of the kit, on its own, for the night it comes back.",
    bullets: [
      "The 20 minute protocol, the same recording that sits at the centre of the kit, without the card and without the three trigger versions.",
      "Made to be played in the dark, with the silences left in. Nothing to read at three in the morning.",
      "It lands in your library on the same login, the moment you pay.",
      "Yours for good. Paid once, no subscription.",
    ],
    priceLine: "One payment of {price}, added to the order you just made.",
    cta: "Yes, take the protocol for {price}",
    decline: "No thanks, take me to my protocol",
    guarantee: "Covered by the same 30 day guarantee as the protocol.",
  },
  seat: {
    name: "Second Seat",
    eyebrow: "For the other side of the bed",
    title: "They are not sleeping either",
    promise: "A second account for the person you wake up, with the seven nights worked out on their nights, not yours.",
    bullets: [
      "A separate account, with its own login, its own sleep log and a sleep window worked out on their nights, not yours.",
      "Their own onboarding from the start. They answer the same questions and get the plan for their case.",
      "The same seven nights and the same recordings you have. Nothing about it is a cut down version.",
      "Lifetime access, paid once, no subscription. It stays theirs even if the two accounts go separate ways.",
      "It works as a gift. You pay, they get the invitation and set it up themselves.",
    ],
    priceLine: "One payment of {price}. Nothing changes about your own access.",
    cta: "Add a second seat for {price}",
    guarantee: "The same 30 day guarantee as the protocol.",
  },
  // Degraus 6 e 7, texto da Sophie: marketing/esteira-degraus-4-7-copy.md.
  // O degrau 6 abre no dia 14 e o 7 no fim da noite 7: src/lib/rung-gates.ts
  // guarda essa ordem, porque as duas ofertas juntas comiam-se uma a outra.
  season: {
    name: "Reset Season",
    eyebrow: "The year is not flat",
    title: "There are four nights a year when this comes back",
    promise: "Four new protocols across a year, on the four dates when sleep tends to fall over. Paid once.",
    bullets: [
      "Four drops a year, on fixed dates: 1 January, 1 April, 1 July and 1 October. Those are the four points where sleep goes, and it goes at the same ones every time.",
      "You get the four drops that fall inside your twelve months. The first one is {nextDate}.",
      "Each drop is a new recording plus one page of what to do that week. No theory and no course.",
      "Paid once for the twelve months. No renewal, no card kept on file, nothing to cancel.",
      "What you already own stays exactly as it is. And the drops you receive stay in your library for good, including after the year ends.",
    ],
    priceLine: "One payment of {price} for the four drops of the year. This is not a subscription.",
    cta: "Get Reset Season for {price}",
    guarantee: "30 day guarantee counted from your first drop, not from the purchase. The clock only starts once you have something in hand.",
  },
  backend: {
    name: "The Recalibration",
    eyebrow: "After 7 logged nights",
    title: "The app calculates. This is someone looking",
    promise: "Someone reads the nights you logged and writes back the window your own data is asking for.",
    bullets: [
      "You send nothing. Your sleep log is already in the account, and that is what gets worked on.",
      "A person goes through your log night by night. This is not the app's automatic calculation, you already have that and you keep it.",
      "You get back a written plan for your case: the recalculated window, what to change first, and what to stop doing.",
      "It arrives in up to 7 working days, once. This is not ongoing coaching and there is no subscription behind it.",
      "This is education and coaching about sleep habits. It is not a diagnosis, it is not treatment, and it does not replace a doctor.",
    ],
    tiers: [
      {
        name: "The Recalibration",
        priceLine: "The written plan, in up to 7 working days.",
        extra: null,
        cta: "Ask for my recalibration for {price}",
      },
      {
        name: "The Recalibration Live",
        priceLine: "The same written plan, plus 30 minutes live to walk you through it.",
        extra: "Thirty minutes on a call, booked after you have read the plan, for the questions that only turn up in the reading.",
        cta: "Get the plan and the call for {price}",
      },
    ],
    guarantee: "We look at your log before starting. If there are not enough nights in there to work with, we say so and refund you without having started.",
  },
};

export default en;
