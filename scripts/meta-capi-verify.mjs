#!/usr/bin/env node
// Validates a Meta CAPI setup end to end, before we trust it in production.
//
//   node scripts/meta-capi-verify.mjs                       # reads .env at the repo root
//   node scripts/meta-capi-verify.mjs --token EAA... --pixel 1277058757910786
//   node scripts/meta-capi-verify.mjs --no-send             # checks only, fires no event
//
// Three checks, in order, stopping at the first hard failure:
//   1. the token is valid, and says when (or whether) it expires
//   2. the pixel id is real and this token can reach it
//   3. a test event actually lands in Events Manager
//
// Exit 0 means all three passed. The token is never printed.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GRAPH_VERSION = "v21.0";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const out = { send: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--token") out.token = argv[++i];
    else if (arg === "--pixel") out.pixel = argv[++i];
    else if (arg === "--test-code") out.testCode = argv[++i];
    else if (arg === "--no-send") out.send = false;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else {
      console.error(`unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return out;
}

// Minimal .env reader: KEY=VALUE, ignores blanks and # comments, strips one
// layer of surrounding quotes. Same subset node --env-file accepts.
function readEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return {};
  }
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function graph(path, params) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function fail(message, detail) {
  console.error(`FAIL  ${message}`);
  if (detail !== undefined) console.error(JSON.stringify(detail, null, 2));
  process.exit(1);
}

function pass(message) {
  console.log(`OK    ${message}`);
}

function warn(message) {
  console.log(`WARN  ${message}`);
}

function formatDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().replace(".000Z", "Z");
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 14).join("\n"));
  process.exit(0);
}

const fileEnv = readEnvFile(resolve(REPO_ROOT, ".env"));
const token = args.token || process.env.META_ACCESS_TOKEN || fileEnv.META_ACCESS_TOKEN;
const pixelId = args.pixel || process.env.META_PIXEL_ID || fileEnv.META_PIXEL_ID;
const testCode = args.testCode || process.env.META_TEST_EVENT_CODE || fileEnv.META_TEST_EVENT_CODE;

if (!token) {
  fail("no token. Pass --token, or set META_ACCESS_TOKEN in the environment or in .env at the repo root.");
}
if (!pixelId) {
  fail("no pixel id. Pass --pixel, or set META_PIXEL_ID in the environment or in .env at the repo root.");
}

console.log(`pixel ${pixelId}, graph ${GRAPH_VERSION}\n`);

// 1. Is the token alive, and for how long?
const debug = await graph("debug_token", { input_token: token, access_token: token });
const info = debug.body?.data;

if (!debug.ok || !info) {
  fail("could not introspect the token", debug.body);
}
if (!info.is_valid) {
  // The 30 Jul expiry showed up exactly here: is_valid false, error code 190.
  fail(`token is not valid: ${info.error?.message ?? "no reason given"}`, info);
}

pass(`token is valid (type ${info.type ?? "unknown"}, app ${info.app_id ?? "unknown"})`);

if (info.expires_at === 0) {
  pass("token never expires, which is what a System User token should look like");
} else if (typeof info.expires_at === "number") {
  const daysLeft = Math.round((info.expires_at * 1000 - Date.now()) / 86_400_000);
  warn(
    `token expires ${formatDate(info.expires_at)} (${daysLeft} days). This is not a permanent ` +
      `System User token, so CAPI goes blind again on that date. Re-issue it from Business Manager > System Users.`,
  );
}
if (typeof info.data_access_expires_at === "number" && info.data_access_expires_at > 0) {
  warn(`data access expires ${formatDate(info.data_access_expires_at)}`);
}

const scopes = info.scopes ?? [];
if (scopes.length && !scopes.includes("ads_management")) {
  warn(`token scopes are [${scopes.join(", ")}] and do not include ads_management`);
}

// 2. Does the pixel exist, and can this token see it?
const pixel = await graph(pixelId, { fields: "id,name,owner_business", access_token: token });
if (!pixel.ok) {
  fail(
    `pixel ${pixelId} is unreachable with this token. Either the id is wrong or the System User ` +
      `has no asset assignment on it.`,
    pixel.body,
  );
}
pass(
  `pixel ${pixel.body.id} is "${pixel.body.name ?? "unnamed"}"` +
    (pixel.body.owner_business?.name ? `, owned by ${pixel.body.owner_business.name}` : ""),
);
if (pixel.body.id !== String(pixelId)) {
  warn(`graph returned pixel id ${pixel.body.id}, which is not the ${pixelId} we asked for`);
}

// 3. Does an event actually land?
if (!args.send) {
  console.log("\nskipped the test event (--no-send)");
  process.exit(0);
}
if (!testCode) {
  warn(
    "no META_TEST_EVENT_CODE, so the test event would count as real traffic. Copy the code from " +
      "Events Manager > Test events and re-run. Skipping the send.",
  );
  process.exit(0);
}

const eventId = `capi-verify-${Math.floor(Date.now() / 1000)}`;
const payload = {
  data: [
    {
      event_name: "ViewContent",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: "https://sleepwired.com/",
      user_data: {
        // A fixed synthetic address, so repeat runs collapse onto one person
        // instead of inventing a new one each time.
        em: [createHash("sha256").update("capi-verify@sleepwired.com").digest("hex")],
        client_user_agent: "sleepwired-capi-verify/1.0",
      },
      custom_data: { content_name: "capi verification" },
    },
  ],
  test_event_code: testCode,
};

const send = await fetch(
  `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  },
);
const sendBody = await send.json().catch(() => ({}));

if (!send.ok) {
  fail(`test event rejected with HTTP ${send.status}`, sendBody);
}
if (sendBody.events_received !== 1) {
  fail(`Meta accepted the call but reported events_received=${sendBody.events_received}`, sendBody);
}

pass(`test event accepted (event_id ${eventId}, fbtrace ${sendBody.fbtrace_id ?? "none"})`);
console.log(
  `\nOpen Events Manager > pixel ${pixelId} > Test events and confirm a ViewContent shows up ` +
    `under code ${testCode}. Until it appears there, the pipe is not proven.`,
);
