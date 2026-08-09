// Hotmart delivery, end to end, against a throwaway database.
//
// The acceptance question on FLU-156 is "does a test purchase on each of the
// offer codes create the right account and open the right thing", and that is
// not answerable by reading the code: it depends on the offer map, the dedupe
// key, the account creation and the recompute all agreeing. So this drives the
// real server over real HTTP with real Hotmart 2.0.0 payloads and then reads
// the database to see what actually happened.
//
// It refuses to run against anything but a local database. Point it at the
// production URL and it exits before touching a thing.
//
//   createdb sleepwired_hotmart_test
//   DATABASE_URL=postgres://localhost/sleepwired_hotmart_test \
//     pnpm --filter @workspace/db exec drizzle-kit push --force
//   DATABASE_URL=postgres://localhost/sleepwired_hotmart_test \
//     node artifacts/api-server/test/hotmart-purchase.smoke.mjs

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// pnpm keeps node_modules strict, and `pg` belongs to @workspace/db rather than
// to this package. Borrowing its resolution beats adding a dependency the
// server does not use.
const pg = createRequire(path.resolve(here, "../../../lib/db/package.json"))("pg");
const serverEntry = path.resolve(here, "../dist/index.mjs");

const DB_URL = process.env.DATABASE_URL || "postgres://localhost/sleepwired_hotmart_test";
const host = new URL(DB_URL).hostname;
if (host !== "localhost" && host !== "127.0.0.1" && host !== "") {
  console.error(`Refusing to run: DATABASE_URL points at ${host}, not a local database.`);
  process.exit(1);
}

const PORT = 3599;
const BASE = `http://127.0.0.1:${PORT}`;
const HOTTOK = "test-hottok-do-not-use-in-production";

// The offer codes as they would come back from the panel, one per rung, plus
// the four sleep-type variants of the front offer.
const OFF = {
  front: "offgeneric01",
  frontMaintenance: "offmaint01",
  frontOnset: "offonset01",
  frontMixed: "offmixed01",
  frontCircadian: "offcirc01",
  bump: "offbump01",
  oto1: "offoto101",
  downsell: "offdown01",
  seat: "offseat01",
};

const env = {
  ...process.env,
  DATABASE_URL: DB_URL,
  PORT: String(PORT),
  NODE_ENV: "test",
  APP_URL: "http://127.0.0.1:5173",
  SESSION_SECRET: "smoke-test-secret",
  HOTMART_HOTTOK: HOTTOK,
  HOTMART_PRODUCT: "prod123",
  HOTMART_OFF_FRONT: OFF.front,
  HOTMART_OFF_FRONT_MAINTENANCE: OFF.frontMaintenance,
  HOTMART_OFF_FRONT_ONSET: OFF.frontOnset,
  HOTMART_OFF_FRONT_MIXED: OFF.frontMixed,
  HOTMART_OFF_FRONT_CIRCADIAN: OFF.frontCircadian,
  HOTMART_OFF_BUMP: OFF.bump,
  HOTMART_OFF_OTO1: OFF.oto1,
  HOTMART_OFF_DOWNSELL: OFF.downsell,
  HOTMART_OFF_SEAT: OFF.seat,
  // Keep the side effects switched off: no Resend key, no Meta token.
  RESEND_API_KEY: "",
  META_ACCESS_TOKEN: "",
};

const pool = new pg.Pool({ connectionString: DB_URL, ssl: false });

let passed = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ─── Payload builders ────────────────────────────────────────────────────────

function purchasePayload({ event, transaction, email, name, offer, ucode, price, sck }) {
  return {
    id: `evt-${transaction}-${offer ?? "x"}`,
    event,
    version: "2.0.0",
    creation_date: Date.now(),
    data: {
      product: { id: 1234567, ucode: ucode ?? "ucode-front", name: "Sleep Wired" },
      buyer: { email, name, checkout_phone: "+41790000000" },
      purchase: {
        transaction,
        status: "APPROVED",
        order_date: Date.now(),
        approved_date: Date.now(),
        price: { value: price ?? 27, currency_value: "EUR" },
        offer: offer ? { code: offer } : undefined,
        origin: sck ? { sck } : undefined,
        buyer_ip: "203.0.113.9",
      },
    },
  };
}

async function post(payload, { hottok = HOTTOK } = {}) {
  const res = await fetch(`${BASE}/api/hotmart/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-HOTMART-HOTTOK": hottok },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function userRow(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] ?? null;
}

async function purchaseRows(email) {
  const { rows } = await pool.query("SELECT * FROM purchases WHERE email = $1 ORDER BY created_at", [email]);
  return rows;
}

// ─── The run ─────────────────────────────────────────────────────────────────

async function waitForServer(child) {
  for (let i = 0; i < 60; i += 1) {
    if (child.exitCode !== null) throw new Error(`server exited early with code ${child.exitCode}`);
    try {
      const res = await fetch(`${BASE}/api/healthz`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not come up");
}

async function run() {
  await pool.query("TRUNCATE purchases, users, leads RESTART IDENTITY CASCADE");

  // 1 — the five rungs, each on its own transaction and buyer
  console.log("\nthe five offer codes");
  const cases = [
    { rung: "front", offer: OFF.front, email: "generic@example.com", tx: "HP10000001", column: "purchased_at", price: 27 },
    { rung: "bump", offer: OFF.bump, email: "bump@example.com", tx: "HP10000002", column: "premium_purchased_at", price: 19 },
    { rung: "oto1", offer: OFF.oto1, email: "kit@example.com", tx: "HP10000003", column: "kit_purchased_at", price: 47 },
    { rung: "downsell", offer: OFF.downsell, email: "down@example.com", tx: "HP10000004", column: "downsell_purchased_at", price: 9 },
    { rung: "seat", offer: OFF.seat, email: "seat@example.com", tx: "HP10000005", column: null, price: 17 },
  ];

  for (const c of cases) {
    const { status, body } = await post(purchasePayload({
      event: "PURCHASE_APPROVED",
      transaction: c.tx,
      email: c.email,
      name: "Test Buyer",
      offer: c.offer,
      ucode: `ucode-${c.rung}`,
      price: c.price,
      sck: "t-maintenance_h-plan_s-fb_c-ad42",
    }));
    const user = await userRow(c.email);
    const rows = await purchaseRows(c.email);
    check(`${c.rung}: webhook accepted`, status === 200 && body.action === "granted", `status ${status} ${JSON.stringify(body)}`);
    check(`${c.rung}: mapped to the right rung`, body.rung === c.rung, `got ${body.rung}`);
    check(`${c.rung}: account created`, !!user, "no user row");
    check(`${c.rung}: purchase recorded`, rows.length === 1 && rows[0].rung === c.rung, JSON.stringify(rows.map((r) => r.rung)));
    if (c.column) {
      check(`${c.rung}: ${c.column} set`, !!user?.[c.column], `${c.column}=${user?.[c.column]}`);
    } else {
      check(`${c.rung}: seat credit granted`, user?.seat_credits === 1, `seat_credits=${user?.seat_credits}`);
    }
  }

  // 2 — the four sleep-type variants of the front offer all grant the platform
  console.log("\nthe four front variants");
  const variants = [
    ["maintenance", OFF.frontMaintenance],
    ["onset", OFF.frontOnset],
    ["mixed", OFF.frontMixed],
    ["circadian", OFF.frontCircadian],
  ];
  for (const [index, [label, offer]] of variants.entries()) {
    const email = `${label}@example.com`;
    const { body } = await post(purchasePayload({
      event: "PURCHASE_APPROVED",
      transaction: `HP2000000${index}`,
      email,
      name: "Variant Buyer",
      offer,
      ucode: "ucode-front",
      sck: `t-${label}_h-plan`,
    }));
    const user = await userRow(email);
    check(`front/${label}: grants the platform`, body.rung === "front" && !!user?.purchased_at, `rung=${body.rung}, purchased_at=${user?.purchased_at}`);
  }

  // 3 — sck read back into the lead
  console.log("\nattribution");
  const { rows: leadRows } = await pool.query("SELECT * FROM leads WHERE email = $1", ["generic@example.com"]);
  const lead = leadRows[0];
  check("sck stored raw on the lead", lead?.sck === "t-maintenance_h-plan_s-fb_c-ad42", `sck=${lead?.sck}`);
  check("sck parsed into hero_variant", lead?.hero_variant === "plan", `hero_variant=${lead?.hero_variant}`);
  check("sck parsed into utm_source", lead?.utm_source === "fb", `utm_source=${lead?.utm_source}`);
  check("sck parsed into utm_content", lead?.utm_content === "ad42", `utm_content=${lead?.utm_content}`);
  check("lead marked purchased", lead?.purchased === true, `purchased=${lead?.purchased}`);

  // 4 — order bump: a second product on the same transaction as the platform
  console.log("\nplatform plus bump in one order");
  const both = "ladder@example.com";
  await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP30000001", email: both, offer: OFF.front, ucode: "ucode-front", price: 27 }));
  await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP30000001", email: both, offer: OFF.bump, ucode: "ucode-bump", price: 19 }));
  let ladderRows = await purchaseRows(both);
  let ladderUser = await userRow(both);
  check("two products on one transaction are two rows", ladderRows.length === 2, `${ladderRows.length} rows`);
  check("both rungs granted", !!ladderUser?.purchased_at && !!ladderUser?.premium_purchased_at);

  // 5 — Hotmart re-delivers until it gets a 200
  console.log("\nredelivery");
  const dup = await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP30000001", email: both, offer: OFF.front, ucode: "ucode-front", price: 27 }));
  ladderRows = await purchaseRows(both);
  check("duplicate delivery does not duplicate the row", ladderRows.length === 2, `${ladderRows.length} rows`);
  check("duplicate delivery is not treated as a new sale", dup.body.isNew === false, `isNew=${dup.body.isNew}`);

  // 6 — the security boundary
  console.log("\nauthentication");
  const badTok = await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP40000001", email: "attacker@example.com", offer: OFF.front }), { hottok: "wrong" });
  check("wrong hottok is rejected", badTok.status === 401, `status ${badTok.status}`);
  check("wrong hottok creates nothing", (await userRow("attacker@example.com")) === null);

  // 7 — an offer code nobody pasted into the env
  console.log("\nunmapped offer");
  const unknown = await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP50000001", email: "mystery@example.com", offer: "notinenv", ucode: "ucode-mystery" }));
  const mysteryUser = await userRow("mystery@example.com");
  check("unmapped offer is recorded", unknown.body.rung === "unknown" && (await purchaseRows("mystery@example.com")).length === 1);
  check("unmapped offer grants nothing", !mysteryUser?.purchased_at && !mysteryUser?.premium_purchased_at, "something was granted");
  check("unmapped offer still gets an account", !!mysteryUser, "no account, buyer cannot even log in");

  // 8 — the refund rule the whole ledger exists for
  console.log("\nrefund takes back one transaction, not the account");
  const refundBuyer = "refund@example.com";
  await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP60000001", email: refundBuyer, offer: OFF.front, ucode: "ucode-front" }));
  await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP60000002", email: refundBuyer, offer: OFF.bump, ucode: "ucode-bump" }));
  const refunded = await post(purchasePayload({ event: "PURCHASE_REFUNDED", transaction: "HP60000002", email: refundBuyer, offer: OFF.bump, ucode: "ucode-bump" }));
  const afterRefund = await userRow(refundBuyer);
  check("refund accepted", refunded.status === 200 && refunded.body.action === "revoked", JSON.stringify(refunded.body));
  check("the refunded pack is closed", !afterRefund?.premium_purchased_at, `premium_purchased_at=${afterRefund?.premium_purchased_at}`);
  check("the lifetime access paid separately is untouched", !!afterRefund?.purchased_at, "platform access was revoked too");

  // 9 — chargeback, same rule, opposite direction
  console.log("\nchargeback");
  const cbBuyer = "chargeback@example.com";
  await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP70000001", email: cbBuyer, offer: OFF.front, ucode: "ucode-front" }));
  await post(purchasePayload({ event: "PURCHASE_APPROVED", transaction: "HP70000002", email: cbBuyer, offer: OFF.oto1, ucode: "ucode-oto1" }));
  await post(purchasePayload({ event: "PURCHASE_CHARGEBACK", transaction: "HP70000001", email: cbBuyer, offer: OFF.front, ucode: "ucode-front" }));
  const afterCb = await userRow(cbBuyer);
  check("charged-back platform access is closed", !afterCb?.purchased_at, `purchased_at=${afterCb?.purchased_at}`);
  check("the Kit they did pay for stays open", !!afterCb?.kit_purchased_at, "the Kit was revoked as well");

  // 10 — events we acknowledge and ignore
  console.log("\nnoise");
  const billet = await post(purchasePayload({ event: "PURCHASE_BILLET_PRINTED", transaction: "HP80000001", email: "billet@example.com", offer: OFF.front }));
  check("unhandled event is acknowledged, not retried", billet.status === 200 && billet.body.action === "ignored", JSON.stringify(billet.body));
  check("unhandled event grants nothing", (await userRow("billet@example.com")) === null);

  // 11 — the thank-you page
  console.log("\n/welcome claim");
  const pending = await fetch(`${BASE}/api/hotmart/claim?transaction=HP99999999`);
  check("unknown transaction reads as pending", pending.status === 404 && (await pending.json()).pending === true);

  const claim = await fetch(`${BASE}/api/hotmart/claim?transaction=HP10000001`);
  const claimBody = await claim.json();
  check("known transaction verifies", claim.status === 200 && claimBody.paymentVerified === true, JSON.stringify(claimBody));
  check("claim masks the buyer's email", claimBody.maskedEmail === "g***c@example.com", `maskedEmail=${claimBody.maskedEmail}`);
  check("claim does not leak the address", !JSON.stringify(claimBody).includes("generic@example.com"));
  check("claim reports what was bought", Array.isArray(claimBody.rungs) && claimBody.rungs.includes("front"), JSON.stringify(claimBody.rungs));

  const refundedClaim = await fetch(`${BASE}/api/hotmart/claim?transaction=HP60000002`);
  check("refunded transaction reads as gone", refundedClaim.status === 410, `status ${refundedClaim.status}`);

  // 12 — setting a password from the thank-you page
  console.log("\n/sign-up from a Hotmart purchase");
  const wrongEmail = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: "HP10000001", email: "notthebuyer@example.com", password: "hunter22" }),
  });
  check("a guessed transaction with the wrong email opens nothing", wrongEmail.status === 400, `status ${wrongEmail.status}`);

  const ok = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: "HP10000001", email: "generic@example.com", password: "hunter22" }),
  });
  const okBody = await ok.json();
  check("the buyer sets a password and is signed in", ok.status === 200 && okBody.email === "generic@example.com", JSON.stringify(okBody));
  check("the session cookie is issued", !!ok.headers.get("set-cookie"));

  const again = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: "HP10000001", email: "generic@example.com", password: "someoneelse" }),
  });
  check("a second sign-up cannot overwrite the password", again.status === 409, `status ${again.status}`);
}

const child = spawn("node", [serverEntry], { env, stdio: ["ignore", "pipe", "pipe"] });
const serverLog = [];
child.stdout.on("data", (d) => serverLog.push(d.toString()));
child.stderr.on("data", (d) => serverLog.push(d.toString()));

try {
  await waitForServer(child);
  await run();
} catch (err) {
  failures.push(`run aborted: ${err.message}`);
  console.error(err);
  console.error(serverLog.join("").slice(-4000));
} finally {
  child.kill("SIGTERM");
  await pool.end();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
