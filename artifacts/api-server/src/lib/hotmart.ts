import { createHash, timingSafeEqual } from "node:crypto";

// ─── Reading a Hotmart purchase ──────────────────────────────────────────────
// Everything the webhook needs to answer three questions: is this really from
// Hotmart, which rung of the ladder was bought, and where did the buyer come
// from. The offer codes live in the same variables the front end uses, so one
// .env feeds both: the browser builds the checkout link, the server reads the
// notification that comes back from it.
//
// Webhook version 2.0.0. The 1.x payload is flat and form-encoded; if Hotmart
// ever sends one we reject it rather than guess, because a misread offer code
// grants the wrong product.

// The seventh rung is sold at two prices, and each price is its own Hotmart
// offer, so it is two rungs: the written plan, and the same plan with thirty
// minutes on a call. Buying the second is what buys the call, and that has to
// be visible in what the account owns rather than inferred from an amount.
export type Rung =
  | "front"
  | "bump"
  | "oto1"
  | "downsell"
  | "seat"
  | "season"
  | "backend"
  | "backendLive";
/** A paid-for offer we have no mapping for. Recorded, never granted. */
export type RungOrUnknown = Rung | "unknown";

/**
 * How long after the sale the transaction code is worth anything as proof.
 *
 * It is a weak secret — HP plus a timestamp — so the window is short and the
 * code only counts in company with the buyer's own email, which /hotmart/claim
 * never gives out in full. Guessing a code alone yields a masked address.
 */
export const CLAIM_WINDOW_HOURS = 48;

/** The events we act on. Everything else is logged and acknowledged. */
export const GRANTING_EVENTS = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"] as const;
/**
 * Money went back. PURCHASE_PROTEST is deliberately absent: a protest is a
 * dispute being opened, not decided, and the chargeback event follows if it is
 * upheld. Cutting access at protest punishes buyers who go on to win nothing.
 */
export const REVOKING_EVENTS = ["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK"] as const;

export interface HotmartPurchasePayload {
  id?: string;
  event?: string;
  version?: string;
  creation_date?: number;
  data?: {
    product?: { id?: number | string; ucode?: string; name?: string };
    buyer?: { email?: string; name?: string; checkout_phone?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      order_date?: number;
      approved_date?: number;
      price?: { value?: number; currency_value?: string };
      offer?: { code?: string };
      origin?: { xcod?: string; sck?: string };
      buyer_ip?: string;
    };
  };
}

/** Env with the server name first, falling back to the build-time VITE one. */
function env(name: string): string {
  return (process.env[`HOTMART_${name}`] || process.env[`VITE_HOTMART_${name}`] || "").trim();
}

export function hottokConfigured(): boolean {
  return !!process.env.HOTMART_HOTTOK;
}

/**
 * Hotmart authenticates with a shared secret in a header, not a signature over
 * the body, so this is a string compare — but a constant-time one, because a
 * leaky compare on a fixed token is exactly the case timing attacks are for.
 * Hashing first keeps the comparison length-independent.
 */
export function hottokValid(received: string | string[] | undefined): boolean {
  const secret = process.env.HOTMART_HOTTOK || "";
  if (!secret) return false;
  const got = Array.isArray(received) ? received[0] : received;
  if (!got) return false;
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

/**
 * Which rung an offer code belongs to.
 *
 * The platform is published five times over — one offer per sleep type, plus a
 * generic — so that each can carry its own order bump headline. All five are
 * the same product and all five grant the same thing.
 */
export function rungForOffer(offerCode?: string | null, productUcode?: string | null): RungOrUnknown {
  const code = (offerCode || "").trim().toLowerCase();

  const byRung: Array<[Rung, string[]]> = [
    ["front", ["OFF_FRONT", "OFF_FRONT_MAINTENANCE", "OFF_FRONT_ONSET", "OFF_FRONT_MIXED", "OFF_FRONT_CIRCADIAN"]],
    ["bump", ["OFF_BUMP"]],
    ["oto1", ["OFF_OTO1"]],
    ["downsell", ["OFF_DOWNSELL"]],
    ["seat", ["OFF_SEAT"]],
    ["season", ["OFF_SEASON"]],
    ["backend", ["OFF_BACKEND"]],
    ["backendLive", ["OFF_BACKEND_LIVE"]],
  ];

  if (code) {
    for (const [rung, names] of byRung) {
      for (const name of names) {
        const configured = env(name).toLowerCase();
        if (configured && configured === code) return rung;
      }
    }
  }

  // No offer code match. A product ucode map is the second chance: it survives
  // somebody creating a sixth offer in the panel and forgetting to paste the
  // code back here, which is the likeliest way this goes wrong in practice.
  const ucode = (productUcode || "").trim().toLowerCase();
  if (ucode) {
    const ucodeMap: Array<[Rung, string]> = [
      ["front", "UCODE_FRONT"],
      ["bump", "UCODE_BUMP"],
      ["oto1", "UCODE_OTO1"],
      ["downsell", "UCODE_DOWNSELL"],
      ["seat", "UCODE_SEAT"],
      ["season", "UCODE_SEASON"],
      ["backend", "UCODE_BACKEND"],
      ["backendLive", "UCODE_BACKEND_LIVE"],
    ];
    for (const [rung, name] of ucodeMap) {
      const configured = env(name).toLowerCase();
      if (configured && configured === ucode) return rung;
    }
  }

  return "unknown";
}

/**
 * `sck` read back.
 *
 * offers.ts packs attribution as `key-value` pairs joined by underscores, e.g.
 * `t-maintenance_h-plan_s-fb`. It is the only field Hotmart returns untouched,
 * which makes it the one thing that closes the loop from ad click to purchase
 * through a checkout we do not host.
 */
export function parseSck(sck?: string | null): {
  profileType?: string;
  heroVariant?: string;
  quizProfile?: string;
  utmContent?: string;
  utmSource?: string;
} {
  const out: Record<string, string> = {};
  if (!sck) return out;
  const keys: Record<string, string> = {
    t: "profileType",
    h: "heroVariant",
    qp: "quizProfile",
    c: "utmContent",
    s: "utmSource",
  };
  for (const part of sck.split("_")) {
    const dash = part.indexOf("-");
    if (dash <= 0) continue;
    const key = keys[part.slice(0, dash)];
    const value = part.slice(dash + 1);
    if (key && value && !out[key]) out[key] = value;
  }
  return out;
}

/** EUR 27.5 → 2750. Hotmart sends a float; money never stays one here. */
export function toCents(value?: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** Hotmart sends epoch milliseconds. */
export function toDate(epochMs?: number | null): Date | null {
  if (typeof epochMs !== "number" || !Number.isFinite(epochMs) || epochMs <= 0) return null;
  const d = new Date(epochMs);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `joana@gmail.com` → `j***a@gmail.com`. What /welcome is allowed to show. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
