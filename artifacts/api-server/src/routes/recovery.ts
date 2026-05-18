import { Router, type IRouter, type Request, type Response } from "express";
import { db, leadsTable } from "@workspace/db";
import { and, eq, lt, isNull, or, sql } from "drizzle-orm";
import { sendRecoveryEmail, sendPostPurchaseEmail } from "../emailService";
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
      const sent = await sendPostPurchaseEmail({ email: lead.email, name: lead.name, step });
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
