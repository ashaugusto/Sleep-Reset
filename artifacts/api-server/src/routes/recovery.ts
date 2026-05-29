import { Router, type IRouter, type Request, type Response } from "express";
import { db, leadsTable } from "@workspace/db";
import { and, eq, lt, isNull, or, sql } from "drizzle-orm";
import { sendRecoveryEmail, sendPostPurchaseEmail, sendMorningReminderEmail, sendAccountPendingEmail } from "../emailService";
import { pool } from "@workspace/db";
import type { RecoveryStep } from "../recoveryEmails";
import type { PostPurchaseStep } from "../postPurchaseEmails";

const router: IRouter = Router();

// Trigger thresholds (minutes since lead creation):
//   step 1 fired at: created_at + 30min  AND recovery_sent_count = 0
//   step 2 fired at: created_at + 24h   AND recovery_sent_count = 1
//   step 3 fired at: created_at + 72h   AND recovery_sent_count = 2
const THRESHOLDS_MIN: Record<RecoveryStep, number> = {
  1: 30,
  2: 60 * 24,
  3: 60 * 72,
};

// Simple shared-secret auth so cron from VPS can hit it but world can't
function isAuthorized(req: Request): boolean {
  const expected = process.env.RECOVERY_TICK_SECRET;
  if (!expected) return false; // safety: not configured = closed
  const got = (req.headers["x-recovery-secret"] as string | undefined) || req.query.secret;
  return got === expected;
}

router.post("/internal/leads/recovery-tick", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const results: Record<string, number> = { sent: 0, errors: 0, skipped: 0 };
  for (const step of [1, 2, 3] as RecoveryStep[]) {
    const thresholdMin = THRESHOLDS_MIN[step];
    const dueLeads = await db
      .select()
      .from(leadsTable)
      .where(
        and(
          eq(leadsTable.purchased, false),
          eq(leadsTable.recoverySentCount, step - 1),
          lt(leadsTable.createdAt, sql`now() - (${thresholdMin} || ' minutes')::interval`),
        ),
      )
      .limit(50); // batch cap per tick

    for (const lead of dueLeads) {
      const sent = await sendRecoveryEmail({
        email: lead.email,
        name: lead.name,
        heroVariant: lead.heroVariant,
        step,
      });
      if (sent) {
        await db.update(leadsTable)
          .set({
            recoverySentCount: step,
            recoveryLastAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(leadsTable.id, lead.id));
        results.sent += 1;
      } else {
        results.errors += 1;
      }
    }
  }

  res.json(results);
});

// ─── Account-pending tick ────────────────────────────────────────────────────
// Detects leads who paid but didn't finish account creation OR onboarding.
// Sends a reminder email up to 2 times (T+24h after purchase, then T+5d).
// Stage 1 ("no_account"): paid but no row in users table.
// Stage 2 ("onboarding_incomplete"): account created but onboarding_complete=false.
// Tracked via email_log to avoid spamming (max 1 per type per lead per 4 days).
router.post("/internal/leads/account-pending-tick", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const results: { sent: string[]; skipped: string[]; errors: string[] } = { sent: [], skipped: [], errors: [] };

  // Stage 1: paid > 24h ago, no account created
  const noAcct = await pool.query<{ id: string; email: string; name: string | null }>(
    `SELECT l.id, l.email, l.name FROM leads l
     LEFT JOIN users u ON LOWER(u.email) = LOWER(l.email)
     WHERE l.purchased = true
       AND l.purchased_at < now() - interval '24 hours'
       AND l.purchased_at > now() - interval '30 days'
       AND u.id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM email_log el
         WHERE el.email = LOWER(l.email)
           AND el.email_type = 'account_pending'
           AND el.sent_at > now() - interval '4 days'
       )
     LIMIT 50`,
  );
  for (const r of noAcct.rows) {
    const sent = await sendAccountPendingEmail({ email: r.email, name: r.name, leadId: r.id, stage: "no_account" });
    if (sent) results.sent.push(`${r.email} (no_account)`); else results.errors.push(r.email);
  }

  // Stage 2: account created, onboarding incomplete, purchased > 48h ago
  const incomplete = await pool.query<{ id: string; email: string; name: string | null }>(
    `SELECT l.id, l.email, l.name FROM leads l
     JOIN users u ON LOWER(u.email) = LOWER(l.email)
     WHERE l.purchased = true
       AND l.purchased_at < now() - interval '48 hours'
       AND l.purchased_at > now() - interval '30 days'
       AND u.onboarding_complete = false
       AND NOT EXISTS (
         SELECT 1 FROM email_log el
         WHERE el.email = LOWER(l.email)
           AND el.email_type = 'account_pending'
           AND el.sent_at > now() - interval '4 days'
       )
     LIMIT 50`,
  );
  for (const r of incomplete.rows) {
    const sent = await sendAccountPendingEmail({ email: r.email, name: r.name, leadId: r.id, stage: "onboarding_incomplete" });
    if (sent) results.sent.push(`${r.email} (onboarding_incomplete)`); else results.errors.push(r.email);
  }

  res.json(results);
});

// ─── Email log viewer (admin) ────────────────────────────────────────────────
// GET /internal/email-log?email=X (uses DASHBOARD_SECRET, not recovery secret)
router.get("/internal/email-log", async (req: Request, res: Response) => {
  const expected = process.env.DASHBOARD_SECRET;
  const got = (req.query.key as string | undefined) || (req.headers["x-dashboard-key"] as string | undefined);
  if (!expected || got !== expected) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const filterEmail = (req.query.email as string | undefined)?.toLowerCase().trim();
  const limit = Math.min(parseInt((req.query.limit as string) || "200", 10), 500);
  const q = filterEmail
    ? await pool.query(
        `SELECT id, email, lead_id, email_type, step, subject, resend_id, success, error, sent_at
         FROM email_log WHERE email = $1 ORDER BY sent_at DESC LIMIT $2`,
        [filterEmail, limit],
      )
    : await pool.query(
        `SELECT id, email, lead_id, email_type, step, subject, resend_id, success, error, sent_at
         FROM email_log ORDER BY sent_at DESC LIMIT $1`,
        [limit],
      );
  // Aggregate stats
  const stats = await pool.query(
    `SELECT email_type,
            count(*) FILTER (WHERE success) AS success,
            count(*) FILTER (WHERE NOT success) AS error
     FROM email_log GROUP BY email_type ORDER BY email_type`,
  );
  res.json({ filter_email: filterEmail ?? null, count: q.rows.length, stats: stats.rows, items: q.rows });
});

// ─── Payment sync health check ──────────────────────────────────────────────
// Compares Stripe paid charges (last 24h) vs DB leads.purchased=true (last 24h).
// If gap > 0, emails the alert recipient. Idempotent-ish: cron runs hourly,
// so worst case = 24 alerts/day until fixed. Better than silent drift.
router.post("/internal/health/payment-sync-check", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion });
    const since = Math.floor((Date.now() - 24 * 3600 * 1000) / 1000);
    const charges = await stripe.charges.list({ created: { gte: since }, limit: 100 });
    const paid = charges.data.filter((c: any) => c.paid && !c.refunded);
    const paidEmails = new Set(paid.map((c: any) =>
      ((c.billing_details?.email || c.receipt_email || "") as string).toLowerCase().trim()
    ).filter(Boolean));

    const dbRows = await db.select({ email: leadsTable.email })
      .from(leadsTable)
      .where(and(
        eq(leadsTable.purchased, true),
        sql`${leadsTable.purchasedAt} >= now() - interval '24 hours'`,
      ));
    const dbEmails = new Set(dbRows.map(r => r.email.toLowerCase().trim()));

    const missingInDb: string[] = [];
    for (const e of paidEmails) if (!dbEmails.has(e)) missingInDb.push(e);

    const result = {
      stripe_paid_24h: paid.length,
      db_purchased_24h: dbRows.length,
      missing_in_db: missingInDb,
      gap: missingInDb.length,
      ok: missingInDb.length === 0,
    };

    if (missingInDb.length > 0 && process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM || "Sleep Wired <noreply@sleepwired.com>";
      const to = process.env.PAYMENT_ALERT_TO || "ashaugusto@icloud.com";
      const itemsHtml = missingInDb.map(e => `<li><code>${e}</code></li>`).join("");
      await resend.emails.send({
        from,
        to,
        subject: `⚠️ Sleep — ${missingInDb.length} venda(s) Stripe não confirmada(s) no DB`,
        html: `<p><b>Gap detectado entre Stripe e DB nas últimas 24h:</b></p>
<p>Stripe paid: ${paid.length} · DB purchased=true: ${dbRows.length}</p>
<p>Emails pagos no Stripe sem flag <code>purchased=true</code> no DB:</p>
<ul>${itemsHtml}</ul>
<p>Provável causa: webhook Stripe falhou ou está rejeitando signatures. Investigar logs <code>sleep-reset-api</code>.</p>
<p>—<br>auto-check /internal/health/payment-sync-check</p>`,
      });
      logger.warn({ gap: missingInDb.length, missing: missingInDb }, "Payment sync gap — alert sent");
    }

    res.json(result);
  } catch (e) {
    logger.error(e, "payment-sync-check failed");
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Backfill: dispatch post-purchase step 1 for leads that were marked
// purchased manually (e.g., when the Stripe webhook bug missed them).
// Idempotent: skips leads that already have post_purchase_step > 0.
router.post("/internal/leads/backfill-welcome", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const due = await db.select().from(leadsTable)
    .where(and(eq(leadsTable.purchased, true), eq(leadsTable.postPurchaseStep, 0)))
    .limit(50);
  const results: { sent: string[]; errors: string[] } = { sent: [], errors: [] };
  for (const lead of due) {
    const sent = await sendPostPurchaseEmail({ email: lead.email, name: lead.name, step: 1, leadId: lead.id });
    if (sent) {
      await db.update(leadsTable)
        .set({ postPurchaseStep: 1, postPurchaseLastAt: new Date(), updatedAt: new Date() })
        .where(eq(leadsTable.id, lead.id));
      results.sent.push(lead.email);
    } else {
      results.errors.push(lead.email);
    }
  }
  res.json(results);
});

// ─── Post-purchase 9-email engagement tick ──────────────────────────────────
// Steps 2..9 are sent 24h apart based on post_purchase_last_at.
// Step 1 (welcome) is dispatched directly from the Stripe webhook in app.ts.
router.post("/internal/leads/post-purchase-tick", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const results: Record<string, number> = { sent: 0, errors: 0, skipped: 0 };
  // For each step 2..9, find leads currently at step-1 whose last email was >= 24h ago
  for (const step of [2, 3, 4, 5, 6, 7, 8, 9] as PostPurchaseStep[]) {
    const dueLeads = await db
      .select()
      .from(leadsTable)
      .where(
        and(
          eq(leadsTable.purchased, true),
          eq(leadsTable.postPurchaseStep, step - 1),
          lt(leadsTable.postPurchaseLastAt, sql`now() - interval '24 hours'`),
        ),
      )
      .limit(50);
    for (const lead of dueLeads) {
      const sent = await sendPostPurchaseEmail({ email: lead.email, name: lead.name, step, leadId: lead.id });
      if (sent) {
        await db.update(leadsTable)
          .set({ postPurchaseStep: step, postPurchaseLastAt: new Date(), updatedAt: new Date() })
          .where(eq(leadsTable.id, lead.id));
        results.sent += 1;
      } else {
        results.errors += 1;
      }
    }
  }
  res.json(results);
});

// ─── Morning reminder tick ──────────────────────────────────────────────────
// Daily-ish cron at ~7am UTC. Sends to leads who purchased in last 8 days and
// haven't received a morning reminder in the last 20 hours.
router.post("/internal/leads/morning-reminder-tick", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const results: Record<string, number> = { sent: 0, errors: 0 };
  const due = await db
    .select()
    .from(leadsTable)
    .where(
      and(
        eq(leadsTable.purchased, true),
        lt(leadsTable.purchasedAt, sql`now() - interval '12 hours'`),       // wait until the morning AFTER purchase
        sql`${leadsTable.purchasedAt} > now() - interval '8 days'`,         // stop after 8 days
        or(
          isNull(leadsTable.morningReminderLastAt),
          lt(leadsTable.morningReminderLastAt, sql`now() - interval '20 hours'`),
        ),
        lt(leadsTable.morningReminderCount, 8),
      ),
    )
    .limit(50);
  for (const lead of due) {
    const dayNumber = lead.morningReminderCount + 1;
    const sent = await sendMorningReminderEmail({ email: lead.email, name: lead.name, dayNumber, leadId: lead.id });
    if (sent) {
      await db.update(leadsTable)
        .set({
          morningReminderCount: dayNumber,
          morningReminderLastAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(leadsTable.id, lead.id));
      results.sent += 1;
    } else {
      results.errors += 1;
    }
  }
  res.json(results);
});

// Read-only debug endpoint (also gated)
router.get("/internal/leads/stats", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const stats = await db
    .select({
      total: sql<number>`count(*)::int`,
      purchased: sql<number>`count(*) filter (where purchased = true)::int`,
      recovery_0: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 0)::int`,
      recovery_1: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 1)::int`,
      recovery_2: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 2)::int`,
      recovery_3: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 3)::int`,
    })
    .from(leadsTable);
  res.json(stats[0]);
});

export default router;
