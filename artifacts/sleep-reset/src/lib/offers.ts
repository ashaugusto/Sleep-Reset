import { PRICE_TODAY, PRICE_ANCHOR, BUMP_PRICE, type Profile } from "@/lib/quiz-data";
import type { Locale } from "@/lib/i18n";

// ─── The product ladder ──────────────────────────────────────────────────────
// Every offer we sell, in one place, in the order the buyer meets them. Until
// now the ladder lived in three places at once: prices in quiz-data, Stripe
// price ids in the API's env, and the rest in a marketing document nobody can
// run. Changing an offer meant hunting constants across five files and hoping.
//
// The rungs, and what each one is for:
//
//   front     the platform, lifetime access, paid once. The main offer.
//   bump      Recovery Pack, at the checkout, one click, no redirect.
//   oto1      the 3AM Relapse Kit, one click after the purchase clears.
//   downsell  a single protocol, for whoever said no to the OTO.
//   seat      a second account, for the partner who gets woken up.
//   season    Reset Season, four seasonal drops, paid once for the year.
//   backend   personal recalibration, read off the buyer's own sleep log.
//
// The promise on the sales page is "no app, no subscription, paid once", so
// nothing here is recurring and nothing already sold is ever revoked. Season
// is a year of content bought in one go, not a subscription.
//
// Decided by Ash on 8 Aug 2026, in the issue interaction on FLU-143:
//   - Hotmart takes every market, not just PT and ES.
//   - OTO 1 is the 3AM Relapse Kit, to be produced. The WIRED series was the
//     alternative, already rendered and free to ship, and was turned down. It
//     stays free at /watch as top-of-funnel, which is also what the style
//     decision asked for: cinema on the ad side, clinic on the buying side.
//   - Recurring revenue is the annual Season pack, never a subscription.
//
// Rationale and pricing: marketing/flu143-esteira-hotmart.md

export type Rung = "front" | "bump" | "oto1" | "downsell" | "seat" | "season" | "backend";

export interface Offer {
  rung: Rung;
  /** EUR, the price actually charged today. */
  price: number;
  /** EUR, what it was or would be worth. Only where the anchor is honest. */
  anchor?: number;
  /** True once the deliverable exists in the repo and can be sold this week. */
  shippable: boolean;
}

export const OFFERS: Record<Rung, Offer> = {
  front: { rung: "front", price: PRICE_TODAY, anchor: PRICE_ANCHOR, shippable: true },
  bump: { rung: "bump", price: BUMP_PRICE, shippable: true },
  // The Kit has to be written before it can be sold, so the post-purchase step
  // has no offer to show until it exists. Anything reading this ladder must
  // check `shippable` and skip the rung, not fall through to a broken page.
  oto1: { rung: "oto1", price: 47, shippable: false },
  downsell: { rung: "downsell", price: 9, shippable: true },
  seat: { rung: "seat", price: 17, shippable: true },
  season: { rung: "season", price: 39, shippable: false },
  backend: { rung: "backend", price: 79, shippable: false },
};

// ─── Where the money is taken ────────────────────────────────────────────────
// Hotmart costs 9.9% + 0.50 USD against Stripe's ~2.9%, and gives back three
// things Stripe does not: the funnel mechanics as configuration rather than
// code, merchant-of-record status for EU VAT, and an affiliate market. Ash
// chose Hotmart for every market, so VITE_HOTMART_LOCALES is meant to stay
// empty and every language checks out on Hotmart. The extra fee in EN and FR
// buys one panel and one set of funnel rules instead of two of each.
//
// The filter stays in the code as the way back: setting VITE_HOTMART_LOCALES
// to "pt,es" sends EN and FR to Stripe again without a deploy of new logic.
// Stripe also remains the fallback whenever a rung has no offer code, so a
// half-configured Hotmart never becomes a dead button.
//
// Vite inlines import.meta.env only for statically written keys, so every
// variable below is spelled out. Dynamic lookup silently yields undefined in a
// production build, which would fail as a quiet fallback to Stripe.

const ENV: Record<string, string> = {
  provider: String(import.meta.env.VITE_CHECKOUT_PROVIDER || ""),
  hotmartLocales: String(import.meta.env.VITE_HOTMART_LOCALES || ""),
  product: String(import.meta.env.VITE_HOTMART_PRODUCT || ""),
  front: String(import.meta.env.VITE_HOTMART_OFF_FRONT || ""),
  frontMaintenance: String(import.meta.env.VITE_HOTMART_OFF_FRONT_MAINTENANCE || ""),
  frontOnset: String(import.meta.env.VITE_HOTMART_OFF_FRONT_ONSET || ""),
  frontMixed: String(import.meta.env.VITE_HOTMART_OFF_FRONT_MIXED || ""),
  frontCircadian: String(import.meta.env.VITE_HOTMART_OFF_FRONT_CIRCADIAN || ""),
  bump: String(import.meta.env.VITE_HOTMART_OFF_BUMP || ""),
  oto1: String(import.meta.env.VITE_HOTMART_OFF_OTO1 || ""),
  downsell: String(import.meta.env.VITE_HOTMART_OFF_DOWNSELL || ""),
  seat: String(import.meta.env.VITE_HOTMART_OFF_SEAT || ""),
  season: String(import.meta.env.VITE_HOTMART_OFF_SEASON || ""),
  backend: String(import.meta.env.VITE_HOTMART_OFF_BACKEND || ""),
};

/**
 * The front offer exists four times over, one per sleep type, so that the
 * order bump attached to it can carry the headline that fits what the visitor
 * just answered. Same pack, same files, different first line. A Hotmart order
 * bump is fixed per offer, and this is how you get around that.
 */
const FRONT_BY_PROFILE: Record<Profile, string> = {
  maintenance: ENV.frontMaintenance,
  onset: ENV.frontOnset,
  mixed: ENV.frontMixed,
  circadian: ENV.frontCircadian,
};

export type Provider = "stripe" | "hotmart";

/** Which processor takes this visitor's money. Stripe unless told otherwise. */
export function providerFor(locale: Locale): Provider {
  if (!ENV.product) return "stripe";
  if (ENV.provider === "hotmart") {
    const only = ENV.hotmartLocales
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (only.length && !only.includes(locale)) return "stripe";
    return "hotmart";
  }
  return "stripe";
}

/** The Hotmart offer code for a rung, or "" when it has not been created yet. */
export function offerCode(rung: Rung, profile?: Profile | null): string {
  if (rung === "front") {
    const byProfile = profile ? FRONT_BY_PROFILE[profile] : "";
    return byProfile || ENV.front;
  }
  return ENV[rung] || "";
}

export interface CheckoutContext {
  profile?: Profile | null;
  email?: string;
  /** Whatever we want handed back to us on the webhook. Attribution lives here. */
  tracking?: Record<string, string | null | undefined>;
}

/**
 * Hotmart hands `sck` back untouched in the purchase webhook, so it is the one
 * field that closes attribution end to end. We pack the ad content and the
 * sleep type into it rather than trusting the click to carry UTMs all the way
 * through a hosted checkout.
 */
function buildSck(ctx: CheckoutContext): string {
  const parts = Object.entries(ctx.tracking ?? {})
    .filter(([, v]) => !!v)
    .map(([k, v]) => `${k}-${String(v).replace(/[^A-Za-z0-9_-]/g, "")}`);
  return parts.join("_").slice(0, 100);
}

/**
 * The hosted checkout URL, or "" when this rung has no offer configured. An
 * empty string is the caller's signal to fall back to Stripe rather than send
 * somebody to a broken page.
 */
export function hotmartCheckoutUrl(rung: Rung, ctx: CheckoutContext = {}): string {
  const off = offerCode(rung, ctx.profile);
  if (!ENV.product || !off) return "";

  const url = new URL(`https://pay.hotmart.com/${ENV.product}`);
  url.searchParams.set("off", off);
  const sck = buildSck(ctx);
  if (sck) url.searchParams.set("sck", sck);
  if (ctx.email) url.searchParams.set("email", ctx.email);
  return url.toString();
}
