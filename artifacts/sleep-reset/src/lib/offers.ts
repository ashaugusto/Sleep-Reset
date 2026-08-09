import { PRICE_TODAY, PRICE_ANCHOR, BUMP_PRICE, type Profile } from "@/lib/quiz-data";

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
  // The Kit exists as of FLU-153: the 20 minute protocol and the three trigger
  // versions are in public/audio/kit-*.mp3, the one page card is in
  // public/kit/, and the page copy is in every locale under `oto1`. What is
  // still missing is the offer code, and that is what `offerCode` returns "" for
  // until Hotmart has it, so nobody reaches a broken page in the meantime.
  oto1: { rung: "oto1", price: 47, shippable: true },
  downsell: { rung: "downsell", price: 9, shippable: true },
  seat: { rung: "seat", price: 17, shippable: true },
  season: { rung: "season", price: 39, shippable: false },
  backend: { rung: "backend", price: 79, shippable: false },
};

// ─── Where the money is taken ────────────────────────────────────────────────
// Hotmart, and only Hotmart. Decided by Ash on 9 Aug 2026 in FLU-143: Stripe is
// abandoned, the whole structure and the whole funnel live on Hotmart.
//
// Hotmart costs 9.9% + 0.50 USD against Stripe's ~2.9%, and gives back three
// things Stripe did not: the funnel mechanics as configuration rather than
// code, merchant-of-record status for EU VAT, and an affiliate market. One
// panel and one set of funnel rules for every market, instead of two of each.
//
// There is deliberately no second processor and no fallback. A fallback is what
// turns "we sell on Hotmart" into two half-maintained checkouts, and it is what
// made a missing offer code silently charge somebody through the other one. A
// rung with no offer code now returns "" and the page says so, loudly, to us.
// Stripe survives in the API for exactly one thing: verifying a sale that was
// already made there, so nobody who paid before today is stranded.
//
// Vite inlines import.meta.env only for statically written keys, so every
// variable below is spelled out. Dynamic lookup silently yields undefined in a
// production build, which here would mean a dead buy button.

const ENV: Record<string, string> = {
  product: String(import.meta.env.VITE_HOTMART_PRODUCT || ""),
  productBump: String(import.meta.env.VITE_HOTMART_PRODUCT_BUMP || ""),
  productOto1: String(import.meta.env.VITE_HOTMART_PRODUCT_OTO1 || ""),
  productDownsell: String(import.meta.env.VITE_HOTMART_PRODUCT_DOWNSELL || ""),
  productSeat: String(import.meta.env.VITE_HOTMART_PRODUCT_SEAT || ""),
  productSeason: String(import.meta.env.VITE_HOTMART_PRODUCT_SEASON || ""),
  productBackend: String(import.meta.env.VITE_HOTMART_PRODUCT_BACKEND || ""),
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

/**
 * True once the Hotmart product code is in the build. False means no rung can
 * be sold at all, which is a deploy problem, not a visitor problem: the pages
 * show their error copy instead of a button that goes nowhere.
 */
export function isCheckoutConfigured(): boolean {
  return !!ENV.product;
}

/** The Hotmart offer code for a rung, or "" when it has not been created yet. */
export function offerCode(rung: Rung, profile?: Profile | null): string {
  if (rung === "front") {
    const byProfile = profile ? FRONT_BY_PROFILE[profile] : "";
    return byProfile || ENV.front;
  }
  return ENV[rung] || "";
}

/**
 * Which Hotmart product a rung is sold under.
 *
 * The ladder is not one product with seven offers. Product 1 is the protocol
 * and carries the four sleep-type offers plus the generic one; the Recovery
 * Pack, the Relapse Kit, the single protocol and the second seat are each a
 * product of their own, because that is the only way one can be attached to
 * another's checkout as an order bump.
 *
 * The distinction is not academic. `pay.hotmart.com/<product 1>?off=<the
 * Recovery Pack's offer>` does not sell the Recovery Pack: Hotmart answers 307
 * to `/error?errorMessage=008`, which is what the upgrade page was linking to
 * for as long as it built its URL off the main product. A rung whose product is
 * not in the build returns "" here, and "" is what stops a page from rendering
 * a button at all.
 */
function productFor(rung: Rung): string {
  if (rung === "front") return ENV.product;
  const key = `product${rung.charAt(0).toUpperCase()}${rung.slice(1)}`;
  return ENV[key] || "";
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
 * The checkout the buyer actually sees.
 *
 * Hotmart serves the same offer under four different pages and picks by this
 * parameter: absent or `0` is the stock checkout, `2` the widget, and `10` the
 * page built in the panel's checkout builder. Ours is `10`, and it is not a
 * cosmetic choice: the order bump lives on that page and nowhere else. Reading
 * the same offer's `__NUXT_DATA__` both ways, the stock page carries no
 * `ORDER_BUMP_ITEM` at all, so a link without this parameter sells the front
 * offer alone and never shows the Recovery Pack it was supposed to be attached
 * to. It also loses the banner, the product copy and the exit popup.
 */
const CHECKOUT_MODE_CUSTOM = "10";

/**
 * The hosted checkout URL, or "" when this rung has no offer configured yet.
 * An empty string is the caller's signal to keep the button off the page (or
 * to show the checkout error) rather than send somebody to a broken page.
 */
export function hotmartCheckoutUrl(rung: Rung, ctx: CheckoutContext = {}): string {
  const off = offerCode(rung, ctx.profile);
  const product = productFor(rung);
  if (!product || !off) return "";

  const url = new URL(`https://pay.hotmart.com/${product}`);
  url.searchParams.set("off", off);
  url.searchParams.set("checkoutMode", CHECKOUT_MODE_CUSTOM);
  const sck = buildSck(ctx);
  if (sck) url.searchParams.set("sck", sck);
  if (ctx.email) url.searchParams.set("email", ctx.email);
  return url.toString();
}
