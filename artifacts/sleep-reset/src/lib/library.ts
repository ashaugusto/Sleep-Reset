import type { Rung } from "@/lib/offers";

// ─── What a buyer actually receives ──────────────────────────────────────────
// Every rung of the ladder sells something, and until now only the front one
// had somewhere to be listened to. The Recovery Pack was playable on /upgrade,
// which is the page that sells it, and the Kit was not playable anywhere at
// all: the audio has been sitting in public/audio/kit-*.mp3 since 8 Aug with no
// route reading it. A buyer who paid 47 EUR had a receipt and nothing else.
//
// So the contents of each pack live here, once, and both the sales page and the
// library render from the same list. The rule that follows from that: a slug
// named here has to exist in public/audio, because the library renders a player
// for it the moment the entitlement is granted, and a 404 inside the member
// area is worse than a missing feature. The slug is the whole file name minus
// the extension, not a fragment to be pasted into a template, so that grepping
// for the file finds this list.
//
// This is English only, like the rest of the member area (dashboard, night,
// upgrade). The four locales cover the funnel, which is where the visitor is
// still deciding; past the checkout the app has always been in one language.

export interface Track {
  /** The file in public/audio, minus the extension. */
  slug: string;
  title: string;
  desc: string;
  /** Read off the file, never guessed. Shown under the title. */
  length: string;
}

export interface Pack {
  rung: Rung;
  title: string;
  /** One line for the locked state: what they would be getting. */
  blurb: string;
  tracks: Track[];
  /** Shown above the players when owned, as a downloadable one-pager. */
  document?: { href: string; title: string; desc: string };
  /** Where a member who does not own it goes to buy it. */
  buyHref: string;
}

// Every session runs 2:19 to 2:41, measured 9 Aug 2026, which is the "~2-3 min"
// the sales page has always promised.
const RECOVERY_PACK: Pack = {
  rung: "bump",
  title: "Recovery Pack",
  blurb: "Seven sessions for the nights that knock sleep out of rhythm: travel, illness, 3 AM anxiety, shift work.",
  buyHref: "/upgrade",
  tracks: [
    { slug: "recovery-jet-lag", title: "Jet Lag Reset", desc: "Resolve time-zone shifts in 3 nights", length: "2-3 min" },
    { slug: "recovery-3am-anxiety", title: "3 AM Anxiety Attack", desc: "What to do when you wake up wired at 3 AM", length: "2-3 min" },
    { slug: "recovery-sunday-night", title: "Sunday Night Insomnia", desc: "Break the weekly conditioned-anxiety cycle", length: "2-3 min" },
    { slug: "recovery-shift-work", title: "Shift Work Adaptation", desc: "Sleep that fights modern shift patterns", length: "2-3 min" },
    { slug: "recovery-post-illness", title: "Post-Illness Recovery", desc: "Reset after fever, surgery or COVID", length: "2-3 min" },
    { slug: "recovery-post-vacation", title: "Post-Vacation Reset", desc: "3-night fix when you come back wrecked", length: "2-3 min" },
    { slug: "recovery-quick-reset", title: "Quick Reset (2-night)", desc: "The most aggressive CBT-I recompression", length: "2-3 min" },
  ],
};

// Measured the same day: the protocol is 20:25 and the three triggers are 5:23,
// 4:28 and 4:17. The sales copy on /kit promises "a twenty minute protocol" and
// "four to five minutes each", so these are the numbers that have to keep
// matching if the audio is ever re-rendered.
const RELAPSE_KIT: Pack = {
  rung: "oto1",
  title: "3AM Relapse Kit",
  blurb: "What you run on the night it comes back: a 20 minute protocol, the bedside card, and three short versions for whatever set it off.",
  buyHref: "/kit",
  document: {
    href: "/kit/first-90-seconds.pdf",
    title: "The first 90 seconds card",
    desc: "One page. Print it for the bedside drawer, or keep it on your phone.",
  },
  tracks: [
    {
      slug: "kit-3am-protocol",
      title: "The 20 minute protocol",
      desc: "Play it in the dark, in the middle of the night. The silences are left in on purpose.",
      length: "20 min",
    },
    {
      slug: "kit-trigger-anxiety",
      title: "Trigger: an anxious wake",
      desc: "For the wake that arrives already racing.",
      length: "5 min",
    },
    {
      slug: "kit-trigger-alcohol",
      title: "Trigger: a night after drinking",
      desc: "For the 3 AM rebound wake that follows alcohol.",
      length: "4 min",
    },
    {
      slug: "kit-trigger-schedule",
      title: "Trigger: a schedule that moved",
      desc: "For a shifted wake time, a flight, or a week that broke the anchor.",
      length: "4 min",
    },
  ],
};

/** In the order the buyer meets them, which is also the order they are sold. */
export const PACKS: Pack[] = [RECOVERY_PACK, RELAPSE_KIT];

export { RECOVERY_PACK, RELAPSE_KIT };

/** The file a track's player points at. One place, so a rename breaks once. */
export function trackSrc(track: Track): string {
  return `/audio/${track.slug}.mp3`;
}
