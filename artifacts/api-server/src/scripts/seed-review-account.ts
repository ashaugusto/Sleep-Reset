/**
 * Sleep Wired — the Hotmart review account
 *
 * Hotmart does not approve a product without logging in. The "Members area"
 * tab of the product form asks for a link, a login and a password, and the
 * reviewer uses them to enter as a student and confirm there is delivery
 * before approving. An account that does not open, or that opens on an empty
 * dashboard, is a rejection.
 *
 * So this is that account, written as a script instead of typed by hand into
 * the production database, so it survives a password rotation, a second
 * product submission, or a database restore without anyone having to remember
 * which four columns mattered.
 *
 * What the account has to satisfy — all of it read by the router in
 * artifacts/sleep-reset/src/App.tsx:
 *
 *   password_hash        the reviewer signs in at /sign-in with an email, and
 *                        POST /auth/login compares bcrypt against this column.
 *                        A username does not exist here; "student" cannot work.
 *   purchased_at         without it AuthGuard redirects to /, and the reviewer
 *                        lands on the sales quiz instead of the product.
 *   onboarding_complete  without it RootRedirect sends them to /onboarding and
 *                        the review starts on a form.
 *   content              a fresh account is technically valid and reads as an
 *                        empty shell, so the account also carries five nights
 *                        of history: Sleep Log and Progress open on data.
 *
 * The five rungs of the ladder are all granted, which is what "see delivery"
 * means for a reviewer who was shown a bundle on the sales page:
 *
 *   front     purchased_at            the platform, the seven nights
 *   bump      premium_purchased_at    the Recovery Pack, seven audios at /upgrade
 *   oto1      kit_purchased_at        the 3AM Relapse Kit
 *   downsell  downsell_purchased_at   the single 3AM protocol
 *   seat      seat_credits            the partner seat
 *
 * Raw SQL, not drizzle, and that is deliberate. The script has to run against
 * whatever the production database is on the day it runs, and the checked-out
 * schema runs ahead of it: the last three columns above and the purchases
 * table arrive with FLU-156. A drizzle insert names every column the schema
 * knows about and fails on the ones the database has not got yet. So every
 * column past the original four is written only after asking
 * information_schema whether it is there, and the script is useful both before
 * and after that migration lands.
 *
 * Run it:
 *
 *   cd artifacts/api-server
 *   REVIEW_ACCOUNT_PASSWORD='...' \
 *     node --env-file=../../.env src/scripts/seed-review-account.ts
 *
 * The password is never hardcoded: it goes in Hotmart's product form and in
 * nothing else, and a value committed here would outlive the review.
 */
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";

const EMAIL = (process.env.REVIEW_ACCOUNT_EMAIL || "hotmart@sleepwired.com").toLowerCase().trim();
const PASSWORD = process.env.REVIEW_ACCOUNT_PASSWORD || "";
const NAME = process.env.REVIEW_ACCOUNT_NAME || "Hotmart Review";

/** The rungs that are actually sold. season and backend are not shippable yet. */
const RUNGS = ["front", "bump", "oto1", "downsell", "seat"] as const;

/**
 * Five nights in, two to go. Far enough that the progress ring, the streak and
 * the charts all have something to draw; not so far that the account looks
 * finished and the "Start tonight's protocol" button has nothing left to open.
 */
const CURRENT_NIGHT = 5;

/** The checklist keys of NIGHT_CONTENT in artifacts/sleep-reset/src/pages/night.tsx. */
const NIGHT_CHECKLISTS: Record<number, string[]> = {
  1: ["alarm", "consistent", "commit"],
  2: ["shutdown_time", "phone_away", "alternative", "room_dim"],
  3: ["no_caffeine", "last_meal", "alcohol", "water"],
  4: ["dark_room", "cool_temp", "phone_away", "no_tv", "comfortable"],
};

/**
 * Four nights of a sleep diary that gets better, because that is the claim the
 * sales page makes and a reviewer who opens Progress should see it being made
 * good. Latency and night waking fall, quality and restfulness rise.
 */
const DIARY = [
  { latency: 55, wakeCount: 3, wakeDuration: 70, quality: 2, restfulness: 2, mood: 2 },
  { latency: 45, wakeCount: 2, wakeDuration: 50, quality: 3, restfulness: 3, mood: 3 },
  { latency: 35, wakeCount: 2, wakeDuration: 35, quality: 3, restfulness: 4, mood: 3 },
  { latency: 25, wakeCount: 1, wakeDuration: 20, quality: 4, restfulness: 4, mood: 4 },
  { latency: 20, wakeCount: 1, wakeDuration: 15, quality: 5, restfulness: 4, mood: 4 },
];

const BEDTIME = 1380; // 23:00
const SLEEP_ATTEMPT = 1395; // 23:15
const FINAL_WAKE = 420; // 07:00
const OUT_OF_BED = 435; // 07:15

/**
 * The same arithmetic as calculateSleepMetrics in
 * artifacts/api-server/src/routes/sleep-logs.ts. Copied rather than imported
 * because that one is a private helper inside a route module, and a seeded row
 * that disagreed with the app's own maths would be a bug nobody would look for.
 */
function sleepMetrics(latency: number, wakeDuration: number, quality: number, restfulness: number) {
  let outNorm = OUT_OF_BED;
  let wakeNorm = FINAL_WAKE;
  if (outNorm < BEDTIME) outNorm += 1440;
  if (wakeNorm < BEDTIME) wakeNorm += 1440;

  const timeInBedMinutes = outNorm - BEDTIME;
  const wakeToGetUpMinutes = Math.max(0, outNorm - wakeNorm);
  const totalSleepMinutes = Math.max(
    0,
    timeInBedMinutes - latency - wakeDuration - wakeToGetUpMinutes
  );
  const sleepEfficiencyPct =
    timeInBedMinutes > 0 ? Math.round((totalSleepMinutes / timeInBedMinutes) * 1000) / 10 : 0;
  const sleepScore = Math.round(
    Math.min(100, Math.max(0, sleepEfficiencyPct)) * 0.5 +
      (quality / 5) * 100 * 0.25 +
      (restfulness / 5) * 100 * 0.25
  );
  return { timeInBedMinutes, totalSleepMinutes, sleepEfficiencyPct, sleepScore };
}

async function columnsOf(table: string): Promise<Set<string>> {
  const { rows } = await pool.query<{ column_name: string }>(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1",
    [table]
  );
  return new Set(rows.map((r) => r.column_name));
}

async function tableExists(table: string): Promise<boolean> {
  const { rows } = await pool.query(
    "select 1 from information_schema.tables where table_schema = 'public' and table_name = $1",
    [table]
  );
  return rows.length > 0;
}

/** ISO date, `days` before today, for sleep_logs.log_date. */
function dateNDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function upsertUser(now: Date): Promise<string> {
  const available = await columnsOf("users");

  // Everything the account should carry. Filtered against the live table below,
  // so the three ladder columns are simply skipped until FLU-156 adds them.
  const wanted: Record<string, unknown> = {
    email: EMAIL,
    name: NAME,
    password_hash: await bcrypt.hash(PASSWORD, 10),
    onboarding_complete: true,
    current_night: CURRENT_NIGHT,
    // The onboarding answers a real buyer would have given. Without them the
    // night pages fall back to their generic `default` tip and the account
    // reads as half set up.
    sleep_disruptor_primary: "racing_thoughts",
    sleep_disruptor_frequency: "most_nights",
    usual_bedtime_minutes: BEDTIME,
    needed_wake_up_minutes: FINAL_WAKE,
    sleep_profile_type: "maintenance",
    reminder_night_minutes: 1320, // 22:00
    reminder_morning_minutes: 450, // 07:30
    // The ladder.
    purchased_at: now, // front
    premium_purchased_at: now, // bump
    kit_purchased_at: now, // oto1
    downsell_purchased_at: now, // downsell
    seat_credits: 1, // seat
  };

  const cols = Object.keys(wanted).filter((c) => available.has(c));
  const skipped = Object.keys(wanted).filter((c) => !available.has(c));
  if (skipped.length) {
    console.log(`   (columns not in this database yet, skipped: ${skipped.join(", ")})`);
  }

  const { rows: existing } = await pool.query<{ id: string }>(
    "select id from users where lower(email) = $1 limit 1",
    [EMAIL]
  );

  if (existing.length > 0) {
    const id = existing[0].id;
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(", ");
    await pool.query(`update users set ${sets} where id = $${cols.length + 1}`, [
      ...cols.map((c) => wanted[c]),
      id,
    ]);
    console.log(`   user updated: ${id}`);
    return id;
  }

  const id = crypto.randomUUID();
  const placeholders = cols.map((_, i) => `$${i + 2}`).join(", ");
  await pool.query(
    `insert into users (id, ${cols.join(", ")}) values ($1, ${placeholders})`,
    [id, ...cols.map((c) => wanted[c])]
  );
  console.log(`   user created: ${id}`);
  return id;
}

/**
 * One purchases row per rung, once that table exists. The user columns above
 * are projections of these rows rather than the source of truth (see the
 * comment on the table), so an account seeded only through the flags would be
 * one refund recomputation away from losing everything it was granted.
 */
async function upsertPurchases(userId: string, now: Date) {
  if (!(await tableExists("purchases"))) {
    console.log("   purchases table not in this database yet, skipped");
    return;
  }

  const prices: Record<string, number> = {
    front: 2700,
    bump: 1900,
    oto1: 4700,
    downsell: 900,
    seat: 1700,
  };

  for (const rung of RUNGS) {
    await pool.query(
      `insert into purchases
         (provider, transaction_id, dedupe_key, email, user_id, rung, status,
          price_cents, currency, event, purchased_at, updated_at)
       values ('manual', $1, $2, $3, $4, $5, 'approved', $6, 'EUR', 'review.account', $7, $7)
       on conflict (dedupe_key) do update set
         user_id = excluded.user_id,
         status = 'approved',
         revoked_at = null,
         updated_at = excluded.updated_at`,
      [
        `review-${rung}`,
        `manual:review-${rung}:${EMAIL}`,
        EMAIL,
        userId,
        rung,
        prices[rung],
        now,
      ]
    );
  }
  console.log(`   purchases rows: ${RUNGS.join(", ")}`);
}

/** Rebuilt from scratch every run, so re-running never doubles the history. */
async function seedHistory(userId: string) {
  await pool.query("delete from sleep_logs where user_id = $1", [userId]);
  await pool.query("delete from night_completions where user_id = $1", [userId]);
  await pool.query("delete from checklist_items where user_id = $1", [userId]);

  for (let i = 0; i < DIARY.length; i++) {
    const d = DIARY[i];
    const m = sleepMetrics(d.latency, d.wakeDuration, d.quality, d.restfulness);
    await pool.query(
      `insert into sleep_logs
         (user_id, log_date, bedtime_minutes, sleep_attempt_minutes, evening_mood,
          final_wake_time_minutes, out_of_bed_minutes, sleep_latency_minutes,
          wake_count, wake_duration_minutes, sleep_quality, restfulness,
          time_in_bed_minutes, total_sleep_minutes, sleep_efficiency_pct,
          sleep_score, morning_complete)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)`,
      [
        userId,
        dateNDaysAgo(DIARY.length - i),
        BEDTIME,
        SLEEP_ATTEMPT,
        d.mood,
        FINAL_WAKE,
        OUT_OF_BED,
        d.latency,
        d.wakeCount,
        d.wakeDuration,
        d.quality,
        d.restfulness,
        m.timeInBedMinutes,
        m.totalSleepMinutes,
        m.sleepEfficiencyPct,
        m.sleepScore,
      ]
    );
  }

  for (const [night, keys] of Object.entries(NIGHT_CHECKLISTS)) {
    const nightNumber = Number(night);
    const items = keys.map((key) => ({ key, checked: true }));
    await pool.query(
      `insert into night_completions (user_id, night_number, checklist_items, completed, completed_at)
       values ($1, $2, $3, true, now())`,
      [userId, nightNumber, JSON.stringify(items)]
    );
    for (const key of keys) {
      await pool.query(
        `insert into checklist_items (user_id, night_number, key, checked)
         values ($1, $2, $3, true)
         on conflict (user_id, night_number, key) do update set checked = true, updated_at = now()`,
        [userId, nightNumber, key]
      );
    }
  }

  console.log(`   history: ${DIARY.length} sleep logs, nights 1-${CURRENT_NIGHT - 1} completed`);
}

async function main() {
  if (PASSWORD.length < 6) {
    throw new Error(
      "REVIEW_ACCOUNT_PASSWORD must be set and at least 6 characters — POST /auth/register enforces the same floor."
    );
  }

  const now = new Date();
  console.log(`Seeding the review account for ${EMAIL}`);

  const userId = await upsertUser(now);
  await upsertPurchases(userId, now);
  await seedHistory(userId);

  console.log("");
  console.log("Done. What goes in Hotmart's Members area tab:");
  console.log("   Link:  https://sleepwired.com/sign-in");
  console.log(`   Login: ${EMAIL}`);
  console.log("   Password: the REVIEW_ACCOUNT_PASSWORD you just passed in");
  console.log("");
  console.log("Check it in a private window: sign in, land on /dashboard, no bounce to / or /onboarding.");
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("Failed to seed the review account:", err.message);
    await pool.end().catch(() => {});
    process.exit(1);
  });
