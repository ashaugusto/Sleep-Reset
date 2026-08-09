import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./webhookHandlers";
import { isStripeConfigured } from "./stripeClient";

const app: Express = express();

// Trust Replit's reverse proxy so req.secure reflects the original HTTPS connection.
// Without this, express-session refuses to set secure cookies (sees req.secure=false).
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!isStripeConfigured()) {
      res.status(503).send("Stripe not configured");
      return;
    }
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      // Signature verification (isolated from stripe-replit-sync upsert which can fail
      // when its schema isn't migrated). We use the Stripe SDK directly so signature
      // validation is independent of the sync layer.
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion });
      const whSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
      let verifiedEvent: Stripe.Event;
      try {
        verifiedEvent = await stripe.webhooks.constructEventAsync(req.body as Buffer, sig, whSecret);
      } catch (sigErr) {
        logger.error(sigErr, "Webhook signature verification failed");
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      // Mark lead as purchased on checkout.session.completed
      try {
        const evt = verifiedEvent as unknown as {
          type?: string;
          data?: { object?: { id?: string; customer_details?: { email?: string }; metadata?: { email?: string } } };
        };
        if (evt.type === "checkout.session.completed") {
          const obj = evt.data?.object as {
            id?: string;
            customer_details?: { email?: string; phone?: string };
            metadata?: { email?: string; fbp?: string; fbc?: string; product?: string; user_id?: string; bump_recovery_pack?: string; hero_variant?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; ip?: string; ua?: string };
            amount_total?: number;
            currency?: string;
          } ?? {};
          const sessionId = obj.id;
          const email = (obj.customer_details?.email || obj.metadata?.email || "").toLowerCase().trim();
          const isUpgrade = obj.metadata?.product === "recovery_pack";

          // Recovery Pack upgrade — flag the user, skip the rest of the regular post-purchase path
          if (isUpgrade && obj.metadata?.user_id) {
            const { db, usersTable } = await import("@workspace/db");
            const { eq } = await import("drizzle-orm");
            await db.update(usersTable)
              .set({ premiumPurchasedAt: new Date() })
              .where(eq(usersTable.id, obj.metadata.user_id));
            // Ledger row so a later refund on any processor can tell this pack
            // apart from the platform purchase and take back only one of them.
            if (email && sessionId) {
              const { recordPurchase, linkPurchasesToUser } = await import("./lib/entitlements");
              await recordPurchase({
                provider: "stripe", transactionId: sessionId, productKey: "bump",
                email, rung: "bump", event: "checkout.session.completed",
              });
              await linkPurchasesToUser(email, obj.metadata.user_id);
            }
            logger.info({ userId: obj.metadata.user_id, sessionId }, "Recovery Pack upgrade marked");
            res.status(200).json({ received: true });
            return;
          }
          const { db, leadsTable } = await import("@workspace/db");
          const { eq, or, sql } = await import("drizzle-orm");
          const md = obj.metadata ?? {};
          if (email || sessionId) {
            const conds = [];
            if (email) conds.push(eq(leadsTable.email, email));
            if (sessionId) conds.push(eq(leadsTable.stripeSessionId, sessionId));
            if (email) {
              // Upsert by email — covers the public flow (lead already exists) AND
              // the express/Start flow (no pre-payment lead: create it now from the
              // email Stripe collected, backfilling attribution from session metadata).
              await db.insert(leadsTable).values({
                email,
                whatsapp: obj.customer_details?.phone || null,
                heroVariant: md.hero_variant || "watch",
                fbp: md.fbp || null,
                fbc: md.fbc || null,
                utmSource: md.utm_source || null,
                utmMedium: md.utm_medium || null,
                utmCampaign: md.utm_campaign || null,
                utmContent: md.utm_content || null,
                ipAddress: md.ip || null,
                userAgent: md.ua || null,
                purchased: true,
                purchasedAt: new Date(),
                stripeSessionId: sessionId ?? null,
              }).onConflictDoUpdate({
                target: leadsTable.email,
                set: {
                  purchased: true,
                  purchasedAt: new Date(),
                  stripeSessionId: sessionId ?? null,
                  whatsapp: sql`COALESCE(${leadsTable.whatsapp}, EXCLUDED.whatsapp)`,
                  fbp: sql`COALESCE(${leadsTable.fbp}, EXCLUDED.fbp)`,
                  fbc: sql`COALESCE(${leadsTable.fbc}, EXCLUDED.fbc)`,
                  utmSource: sql`COALESCE(${leadsTable.utmSource}, EXCLUDED.utm_source)`,
                  utmMedium: sql`COALESCE(${leadsTable.utmMedium}, EXCLUDED.utm_medium)`,
                  utmCampaign: sql`COALESCE(${leadsTable.utmCampaign}, EXCLUDED.utm_campaign)`,
                  utmContent: sql`COALESCE(${leadsTable.utmContent}, EXCLUDED.utm_content)`,
                  ipAddress: sql`COALESCE(${leadsTable.ipAddress}, EXCLUDED.ip_address)`,
                  userAgent: sql`COALESCE(${leadsTable.userAgent}, EXCLUDED.user_agent)`,
                  updatedAt: new Date(),
                },
              });
            } else {
              await db.update(leadsTable)
                .set({ purchased: true, purchasedAt: new Date(), stripeSessionId: sessionId ?? null, updatedAt: new Date() })
                .where(conds.length > 1 ? or(...conds) : conds[0]);
            }
            logger.info({ email, sessionId }, "Lead marked as purchased");

            // Purchases ledger. Access is derived from these rows, so a Stripe
            // sale has to appear here too — otherwise a Hotmart refund later
            // finds no evidence this platform access was paid for and clears it.
            if (email && sessionId) {
              try {
                const { recordPurchase, recomputeAccess } = await import("./lib/entitlements");
                await recordPurchase({
                  provider: "stripe", transactionId: sessionId, productKey: "front",
                  email, rung: "front", event: "checkout.session.completed",
                  // The order total, bump included. Nothing computes off it;
                  // it is there so support can read a row and see the sale.
                  priceCents: obj.amount_total ?? null, currency: (obj.currency || "eur").toUpperCase(),
                });
                if (md.bump_recovery_pack === "1") {
                  await recordPurchase({
                    provider: "stripe", transactionId: sessionId, productKey: "bump",
                    email, rung: "bump", event: "checkout.session.completed",
                  });
                }
                await recomputeAccess(email);
              } catch (ledgerErr) {
                logger.error(ledgerErr, "Purchases ledger write failed (non-fatal)");
              }
            }

            // Attribution: link quiz profile -> purchase (best-effort, isolated; never blocks the purchase path)
            if (email) {
              try {
                const { pool } = await import("@workspace/db");
                await pool.query(
                  "UPDATE sleep_profiles SET converted_at = now() WHERE lower(email) = $1 AND converted_at IS NULL",
                  [email],
                );
              } catch (cErr) {
                logger.error(cErr, "sleep_profiles converted_at update failed (non-fatal)");
              }
            }

            // CAPI Purchase + Post-purchase welcome email
            try {
              const leadRows = await db.select().from(leadsTable)
                .where(conds.length > 1 ? or(...conds) : conds[0])
                .limit(1);
              const lead = leadRows[0];
              if (lead && sessionId) {
                const { sendCapiEvent } = await import("./lib/meta-capi");
                const valueEur = obj.amount_total ? obj.amount_total / 100 : 27;
                const currency = (obj.currency || "eur").toUpperCase();
                void sendCapiEvent({
                  eventName: "Purchase",
                  eventId: sessionId,
                  eventSourceUrl: `${process.env.APP_URL || "https://sleepwired.com"}/welcome?session_id=${sessionId}`,
                  userData: {
                    email: lead.email,
                    phone: lead.whatsapp,
                    externalId: lead.id,
                    clientIp: lead.ipAddress,
                    clientUserAgent: lead.userAgent,
                    fbp: lead.fbp,
                    fbc: lead.fbc,
                  },
                  customData: {
                    value: valueEur,
                    currency,
                    contentIds: ["sleep-wired-7night"],
                    contentName: "The Cognitive Shutdown Method",
                    contentType: "product",
                    numItems: 1,
                    orderId: sessionId,
                  },
                });

                // Post-purchase welcome email (step 1) — fire immediately, mark sent
                if (lead.postPurchaseStep === 0) {
                  const { sendPostPurchaseEmail } = await import("./emailService");
                  const sent = await sendPostPurchaseEmail({ email: lead.email, name: lead.name, step: 1, leadId: lead.id });
                  if (sent) {
                    await db.update(leadsTable)
                      .set({ postPurchaseStep: 1, postPurchaseLastAt: new Date(), updatedAt: new Date() })
                      .where(eq(leadsTable.id, lead.id));
                  }
                }
              }
            } catch (capiErr) {
              logger.error(capiErr, "CAPI Purchase / post-purchase welcome dispatch failed (non-fatal)");
            }
          }
        }
      } catch (leadErr) {
        logger.error(leadErr, "Lead update on webhook failed (non-fatal)");
      }

      // Best-effort: pass through to stripe-replit-sync upsert. May fail if its
      // schema isn't migrated — that's not blocking our critical lead-update path.
      try {
        await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      } catch (syncErr) {
        logger.warn({ err: syncErr }, "stripe-replit-sync processWebhook failed (non-fatal, lead already updated)");
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error(error, "Webhook error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgSession = connectPgSimple(session);

// Create the session table if it doesn't exist — done inline to avoid
// connect-pg-simple's table.sql file lookup which breaks in bundled builds.
pool.query(`
  CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`).catch((err: Error) => logger.warn({ err }, "Session table setup warning"));

app.use(
  session({
    store: new PgSession({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pool: pool as any,
    }),
    secret: process.env.SESSION_SECRET || "fallback-dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  }),
);

// Mount at both /api and / to support:
// - Direct access (dev/Replit): frontend calls /api/auth/login → Express sees /api/auth/login
// - DO App Platform: strips /api prefix → Express sees /auth/login
app.use("/api", router);
app.use("/", router);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err && typeof err === "object" && "issues" in err) {
    res.status(400).json({ message: "Validation error", errors: (err as { issues: unknown[] }).issues });
    return;
  }
  logger.error(err, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
});

export default app;
