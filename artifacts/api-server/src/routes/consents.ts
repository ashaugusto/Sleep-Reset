import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, consentsTable, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/requireAuth";
import { CONSENT_KINDS, consentText, type ConsentKind } from "../lib/consent-texts";

const router: IRouter = Router();

// ─── The two boxes on the seventh rung ───────────────────────────────────────
//   GET  /consents/backend   what this account has agreed to, and when
//   POST /consents/backend   tick or untick either box
//
// They are ticked on our offer page, before the jump to Hotmart, because the
// Hotmart checkout builder has text blocks and no consent box of ours with
// state we can keep. So the state has to be kept here: a screen that forgets
// is not a record, and "the buyer had it ticked" is a claim we have to be able
// to prove years later, in the language it was ticked in.
//
// Two things this route deliberately does not do. It does not take the
// sentence from the request body, because a client-supplied proof of consent
// proves nothing; the text is looked up server side from the locale. And it
// does not delete anything on untick: withdrawal sets `withdrawnAt` on the row
// that is live, so the record still says they agreed in March and withdrew in
// May, which is what happened.

type BoxState = {
  granted: boolean;
  grantedAt: string | null;
  withdrawnAt: string | null;
  statement: string;
  locale: string | null;
};

const EMPTY = (kind: ConsentKind, locale: string): BoxState => ({
  granted: false,
  grantedAt: null,
  withdrawnAt: null,
  statement: consentText(kind, locale),
  locale: null,
});

/** The newest row for this kind, live or not. Rows are append only per grant. */
async function newestRow(userId: string, kind: ConsentKind) {
  const rows = await db
    .select()
    .from(consentsTable)
    .where(and(eq(consentsTable.userId, userId), eq(consentsTable.kind, kind)))
    .orderBy(desc(consentsTable.grantedAt))
    .limit(1);
  return rows[0] ?? null;
}

async function stateFor(userId: string, locale: string): Promise<Record<ConsentKind, BoxState>> {
  const out = {} as Record<ConsentKind, BoxState>;
  for (const kind of CONSENT_KINDS) {
    const row = await newestRow(userId, kind);
    out[kind] = row
      ? {
          granted: row.withdrawnAt === null,
          grantedAt: row.grantedAt.toISOString(),
          withdrawnAt: row.withdrawnAt ? row.withdrawnAt.toISOString() : null,
          statement: row.statement,
          locale: row.locale,
        }
      : EMPTY(kind, locale);
  }
  return out;
}

function clientIp(req: Request): string | null {
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  return xfwd || req.socket.remoteAddress || null;
}

router.get("/consents/backend", requireAuth, async (req: Request, res: Response) => {
  try {
    const locale = typeof req.query.locale === "string" ? req.query.locale : "en";
    res.json(await stateFor(req.userId!, locale));
  } catch (err) {
    logger.error({ err, userId: req.userId }, "consents: read failed");
    res.status(500).json({ message: "Could not read consent state" });
  }
});

router.post("/consents/backend", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const locale = typeof body.locale === "string" ? body.locale : "en";
  const rung = body.rung === "backendLive" ? "backendLive" : "backend";

  // Absent means "leave it alone". Only a boolean moves a box, so the page can
  // send one checkbox without silently withdrawing the other.
  const wanted: Partial<Record<ConsentKind, boolean>> = {};
  if (typeof body.earlyStart === "boolean") wanted.backend_early_start = body.earlyStart;
  if (typeof body.logReading === "boolean") wanted.backend_log_reading = body.logReading;
  if (Object.keys(wanted).length === 0) {
    res.status(400).json({ message: "Nothing to record" });
    return;
  }

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user?.email) {
      res.status(400).json({ message: "Account has no email address" });
      return;
    }

    for (const [kind, want] of Object.entries(wanted) as [ConsentKind, boolean][]) {
      const row = await newestRow(userId, kind);
      const live = row !== null && row.withdrawnAt === null;
      if (want === live) continue;
      if (want) {
        await db.insert(consentsTable).values({
          kind,
          userId,
          email: user.email,
          rung,
          locale,
          statement: consentText(kind, locale),
          ipAddress: clientIp(req),
          userAgent: (req.headers["user-agent"] as string | undefined)?.slice(0, 500) ?? null,
        });
      } else {
        await db
          .update(consentsTable)
          .set({ withdrawnAt: new Date(), updatedAt: new Date() })
          .where(and(eq(consentsTable.id, row!.id), isNull(consentsTable.withdrawnAt)));
      }
      logger.info({ userId, kind, granted: want, locale }, "consents: recorded");
    }

    res.json(await stateFor(userId, locale));
  } catch (err) {
    logger.error({ err, userId }, "consents: write failed");
    res.status(500).json({ message: "Could not record consent" });
  }
});

export default router;
