#!/usr/bin/env node
// Checks the product ladder on Hotmart against what the site promises.
//
//   node scripts/hotmart-ladder-verify.mjs            # every rung that is configured
//   node scripts/hotmart-ladder-verify.mjs front bump # only these rungs
//   node scripts/hotmart-ladder-verify.mjs --json     # machine readable
//
// Why this exists. Every rung of the ladder is half code and half panel: the
// code holds the product id and the offer code, the panel holds the price, the
// warranty and the order bump. Nothing connects the two halves, and Hotmart
// does not fail loudly when they disagree. A wrong product id answers 307 to
// /error?errorMessage=008 with a 200 further down the chain; a warranty set to
// 7 days sells perfectly well under a page that promises 60. Both were live.
//
// So this reads the checkout the buyer actually gets, pulls the real numbers
// out of the Nuxt payload the page ships with, and compares them to the two
// sources of truth in the repo:
//
//   prices    artifacts/sleep-reset/src/lib/offers.ts  (and quiz-data.ts)
//   warranty  artifacts/sleep-reset/src/locales/*.ts   (the refund promise)
//
// The warranty is not hardcoded here on purpose. Whatever the sales pages say
// is what the checkout has to honour, so the expected number is read off the
// locales. Change the promise in four languages and this follows; change it in
// three and this says so.
//
// What is hardcoded is the range Hotmart allows, because that is the platform's
// rule and not ours: 7, 15, 21 or 30 days, with 15 the minimum for European
// sales. A promise outside that range fails the run before any checkout is
// fetched, since no panel setting could ever match it.
//
// Exit 0 means every configured rung matches. Exit 1 means at least one does
// not, and the buyer is seeing something we did not promise. Rungs with no
// product or offer code yet are reported as pending, not as failures: they are
// the panel work still to do, not a regression.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(REPO_ROOT, "artifacts", "sleep-reset");
const CHECKOUT_MODE_CUSTOM = "10";

// ─── What Hotmart will actually let us promise ───────────────────────────────
// The guarantee is a dropdown in the panel, not a free number, and it has four
// entries. Anything the copy promises outside this set cannot be configured at
// all: the buyer reads it, asks for the refund on day 40, and Hotmart's own
// refund button has already expired. That is exactly what was live here, with
// four pages in four languages promising 60 days against a platform maximum of
// 30, so the check is in the script rather than in somebody's memory.
//
// The floor is the other half. Hotmart requires a minimum of 15 days for sales
// in any European country, and we price in EUR, so 7 is not a valid setting for
// us even though the panel offers it. Both live rungs were sitting on 7.
//
// Source: help.hotmart.com, "How to adjust the guarantee period for a product
// I created?" (article 360034552751).
const WARRANTY_OPTIONS = [7, 15, 21, 30];
const WARRANTY_MIN_EU = 15;

// The rungs, in the order the buyer meets them. Mirrors offers.ts.
const RUNGS = [
  { rung: "front", product: "VITE_HOTMART_PRODUCT", off: "VITE_HOTMART_OFF_FRONT", expectBump: true },
  { rung: "bump", product: "VITE_HOTMART_PRODUCT_BUMP", off: "VITE_HOTMART_OFF_BUMP" },
  { rung: "oto1", product: "VITE_HOTMART_PRODUCT_OTO1", off: "VITE_HOTMART_OFF_OTO1" },
  { rung: "downsell", product: "VITE_HOTMART_PRODUCT_DOWNSELL", off: "VITE_HOTMART_OFF_DOWNSELL" },
  { rung: "seat", product: "VITE_HOTMART_PRODUCT_SEAT", off: "VITE_HOTMART_OFF_SEAT" },
  { rung: "season", product: "VITE_HOTMART_PRODUCT_SEASON", off: "VITE_HOTMART_OFF_SEASON" },
  { rung: "backend", product: "VITE_HOTMART_PRODUCT_BACKEND", off: "VITE_HOTMART_OFF_BACKEND" },
];

// The four sleep-type variants of the front offer. Same product, same price,
// different order bump headline. They are checked as front offers.
const FRONT_VARIANTS = [
  ["maintenance", "VITE_HOTMART_OFF_FRONT_MAINTENANCE"],
  ["onset", "VITE_HOTMART_OFF_FRONT_ONSET"],
  ["mixed", "VITE_HOTMART_OFF_FRONT_MIXED"],
  ["circadian", "VITE_HOTMART_OFF_FRONT_CIRCADIAN"],
];

function parseArgs(argv) {
  const out = { rungs: [], json: false };
  for (const arg of argv) {
    if (arg === "--json") out.json = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg.startsWith("-")) {
      console.error(`unknown argument: ${arg}`);
      process.exit(2);
    } else out.rungs.push(arg);
  }
  return out;
}

/** KEY=VALUE, ignores blanks and # comments, strips one layer of quotes. */
function readEnv(path) {
  const env = {};
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return env;
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

/** Prices come from the repo, not from a second copy of the table in here. */
function readExpectedPrices() {
  const quiz = readFileSync(join(APP, "src", "lib", "quiz-data.ts"), "utf8");
  const offers = readFileSync(join(APP, "src", "lib", "offers.ts"), "utf8");
  const constant = (name) => {
    const m = quiz.match(new RegExp(`export const ${name}\\s*=\\s*(\\d+(?:\\.\\d+)?)`));
    return m ? Number(m[1]) : null;
  };
  const named = { PRICE_TODAY: constant("PRICE_TODAY"), BUMP_PRICE: constant("BUMP_PRICE") };
  const prices = {};
  for (const m of offers.matchAll(/(\w+):\s*\{\s*rung:\s*"(\w+)"\s*,\s*price:\s*([\w.]+)/g)) {
    const raw = m[3];
    prices[m[2]] = raw in named ? named[raw] : Number(raw);
  }
  return prices;
}

/**
 * The refund window the sales pages promise, per locale. Read as a number of
 * days out of every "60 days / 60 jours / 60 dias" style phrase we ship. One
 * distinct number across every locale is the only healthy answer.
 */
function readPromisedWarranty() {
  const dir = join(APP, "src", "locales");
  const byLocale = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".ts") || file === "types.ts") continue;
    const text = readFileSync(join(dir, file), "utf8");
    const days = new Set();
    for (const m of text.matchAll(/\b(\d{1,3})[\s-](?:days?|jours?|dias?|Tage)\b/gi)) days.add(Number(m[1]));
    if (days.size) byLocale[file.replace(/\.ts$/, "")] = [...days].sort((a, b) => a - b);
  }
  return byLocale;
}

/**
 * Nuxt ships the checkout's state as a flat, deduplicated array: every value
 * sits once at its own index and every reference to it is that index. Objects
 * keep their real keys and store indices as values, arrays are lists of
 * indices. Resolving is a walk with a depth stop, because the graph is cyclic.
 */
function nuxtPayload(html) {
  const m = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return null;
  }
  const resolve_ = (i, depth = 0) => {
    if (typeof i !== "number" || i < 0 || i >= data.length) return i;
    const v = data[i];
    if (depth > 6) return null;
    if (Array.isArray(v)) return v.map((x) => resolve_(x, depth + 1));
    if (v && typeof v === "object") {
      const o = {};
      for (const [k, r] of Object.entries(v)) o[k] = resolve_(r, depth + 1);
      return o;
    }
    return v;
  };
  const nodes = (predicate) => {
    const out = [];
    for (let i = 0; i < data.length; i++) {
      const e = data[i];
      if (e && typeof e === "object" && !Array.isArray(e) && predicate(e)) out.push({ index: i, node: e, resolve: resolve_ });
    }
    return out;
  };
  return { data, resolve: resolve_, nodes };
}

/** Everything we care about, pulled out of one checkout page. */
function readCheckout(html) {
  const p = nuxtPayload(html);
  if (!p) return null;

  const products = [];
  const seen = new Set();
  for (const { node, resolve: r } of p.nodes((e) => "warrantyDays" in e)) {
    const name = r(node.name);
    const warrantyDays = r(node.warrantyDays);
    const key = `${name}|${warrantyDays}`;
    if (typeof name !== "string" || seen.has(key)) continue;
    seen.add(key);
    products.push({ name, warrantyDays });
  }

  const prices = [];
  for (const { index, resolve: r } of p.nodes((e) => e.type !== undefined && e.value !== undefined && e.currency !== undefined)) {
    const node = r(index);
    if (node && node.type === "FULL_PRICE") prices.push({ value: node.value, currency: node.currency });
  }

  let mode = null;
  for (const { node, resolve: r } of p.nodes((e) => "checkoutMode" in e)) {
    const v = r(node.checkoutMode);
    if (typeof v === "string") mode = v;
  }

  return { products, prices, mode };
}

function checkoutUrl(product, off) {
  const url = new URL(`https://pay.hotmart.com/${product}`);
  url.searchParams.set("off", off);
  url.searchParams.set("checkoutMode", CHECKOUT_MODE_CUSTOM);
  return url.toString();
}

async function verifyOffer({ label, product, off, expectPrice, expectWarranty, expectBump }) {
  const url = checkoutUrl(product, off);
  const result = { label, product, off, url, ok: false, problems: [], notes: [] };

  let res;
  try {
    res = await fetch(url, { redirect: "follow", headers: { "user-agent": "sleepwired-ladder-verify" } });
  } catch (err) {
    result.problems.push(`unreachable: ${err.message}`);
    return result;
  }
  result.status = res.status;
  result.finalUrl = res.url;

  // A wrong product id does not 404. It redirects to the error screen, and the
  // error screen answers 200. The final URL is the only honest signal.
  if (/\/error/.test(res.url)) {
    const code = new URL(res.url).searchParams.get("errorMessage");
    result.problems.push(`Hotmart sent this to the error screen (errorMessage=${code || "?"}). The offer does not belong to this product.`);
    return result;
  }
  if (!res.ok) {
    result.problems.push(`HTTP ${res.status}`);
    return result;
  }

  const page = readCheckout(await res.text());
  if (!page) {
    result.problems.push("no __NUXT_DATA__ in the page, cannot read the offer");
    return result;
  }

  result.productName = page.products[0]?.name ?? null;
  result.warrantyDays = page.products.map((x) => x.warrantyDays);
  result.prices = page.prices;
  result.mode = page.mode;
  result.bumpProducts = page.products.slice(1).map((x) => x.name);

  if (page.mode !== "CUSTOM") {
    result.problems.push(`checkout mode is ${page.mode ?? "unknown"}, not CUSTOM. The order bump only exists on the custom page.`);
  }

  const values = [...new Set(page.prices.map((x) => x.value))];
  if (expectPrice != null && !values.includes(expectPrice)) {
    result.problems.push(`price is ${values.join(" / ") || "unreadable"} EUR, the repo sells this rung at ${expectPrice} EUR`);
  }

  for (const product of page.products) {
    if (expectWarranty != null && product.warrantyDays !== expectWarranty) {
      result.problems.push(`"${product.name}" refunds for ${product.warrantyDays} days, the sales pages promise ${expectWarranty}`);
    }
    // Independent of what we promise: below the European floor the setting is
    // not ours to make, so this is reported even when the copy agrees with it.
    if (typeof product.warrantyDays === "number" && product.warrantyDays < WARRANTY_MIN_EU) {
      result.problems.push(`"${product.name}" is set to ${product.warrantyDays} days. We sell in EUR, and Hotmart requires at least ${WARRANTY_MIN_EU} days for European sales.`);
    }
  }

  if (expectBump && page.products.length < 2) {
    result.problems.push("no order bump on this checkout, the Recovery Pack is not attached");
  }
  if (expectBump && page.products.length >= 2) {
    result.notes.push(`order bump attached: ${page.products.slice(1).map((x) => x.name).join(", ")}`);
  }

  result.ok = result.problems.length === 0;
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 30).join("\n").replace(/^\/\/ ?/gm, ""));
    return 0;
  }

  const env = readEnv(join(APP, ".env"));
  const prices = readExpectedPrices();
  const promised = readPromisedWarranty();

  // One number across every locale, or we do not know what we promised.
  const allDays = new Set(Object.values(promised).flat());
  const guarantee = [...allDays].filter((d) => d >= 7 && d <= 365).sort((a, b) => b - a);
  const expectWarranty = guarantee[0] ?? null;

  // A promise the panel has no dropdown entry for can never be honoured, so it
  // fails the run on its own, before a single checkout is fetched.
  const copyProblems = [];
  if (expectWarranty != null && !WARRANTY_OPTIONS.includes(expectWarranty)) {
    copyProblems.push(
      `the sales pages promise ${expectWarranty} days, and Hotmart only offers ${WARRANTY_OPTIONS.join(", ")}. ` +
        `No rung can be set to ${expectWarranty}, so this refund is one we would have to honour by hand.`,
    );
  } else if (expectWarranty != null && expectWarranty < WARRANTY_MIN_EU) {
    copyProblems.push(`the sales pages promise ${expectWarranty} days, below the ${WARRANTY_MIN_EU} day minimum Hotmart requires for European sales.`);
  }

  const targets = [];
  for (const spec of RUNGS) {
    if (args.rungs.length && !args.rungs.includes(spec.rung)) continue;
    const product = env[spec.product] || "";
    const off = env[spec.off] || "";
    if (!product || !off) {
      targets.push({ pending: true, label: spec.rung, missing: [!product && spec.product, !off && spec.off].filter(Boolean) });
      continue;
    }
    targets.push({
      label: spec.rung,
      product,
      off,
      expectPrice: prices[spec.rung] ?? null,
      expectWarranty,
      expectBump: !!spec.expectBump,
    });
  }
  if (!args.rungs.length || args.rungs.includes("front")) {
    for (const [profile, key] of FRONT_VARIANTS) {
      const off = env[key] || "";
      if (!off) {
        targets.push({ pending: true, label: `front:${profile}`, missing: [key] });
        continue;
      }
      targets.push({
        label: `front:${profile}`,
        product: env.VITE_HOTMART_PRODUCT || "",
        off,
        expectPrice: prices.front ?? null,
        expectWarranty,
        expectBump: true,
      });
    }
  }

  const live = targets.filter((t) => !t.pending);
  const pending = targets.filter((t) => t.pending);
  const results = [];
  for (const t of live) results.push(await verifyOffer(t));

  if (args.json) {
    console.log(JSON.stringify({ expectWarranty, promised, copyProblems, results, pending }, null, 2));
    return results.every((r) => r.ok) && !copyProblems.length ? 0 : 1;
  }

  console.log(`refund window promised by the site: ${expectWarranty ?? "unreadable"} days`);
  for (const [loc, days] of Object.entries(promised)) {
    if (expectWarranty != null && !days.includes(expectWarranty)) {
      console.log(`  ${loc}: does not mention ${expectWarranty} days anywhere (found ${days.join(", ")})`);
    }
  }
  for (const p of copyProblems) console.log(`  -> ${p}`);
  console.log("");

  for (const r of results) {
    const head = r.ok ? "OK  " : "FAIL";
    console.log(`${head} ${r.label.padEnd(18)} ${r.productName ?? "?"}`);
    console.log(`     ${r.url}`);
    if (r.prices?.length) {
      const v = [...new Set(r.prices.map((x) => `${x.value} ${x.currency}`))];
      console.log(`     price ${v.join(" / ")} (net, VAT of the buyer's country goes on top)`);
    }
    if (r.warrantyDays?.length) console.log(`     warranty ${[...new Set(r.warrantyDays)].join(" / ")} days, mode ${r.mode ?? "?"}`);
    for (const n of r.notes) console.log(`     ${n}`);
    for (const p of r.problems) console.log(`     -> ${p}`);
  }

  if (pending.length) {
    console.log("\nnot created in the panel yet:");
    for (const p of pending) console.log(`     ${p.label.padEnd(18)} missing ${p.missing.join(", ")}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} live rungs match the repo, ${pending.length} still to create.`);
  return failed.length || copyProblems.length ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(2);
  },
);
