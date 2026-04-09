import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getStripeClient, isStripeConfigured } from "../stripeClient";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/checkout", requireAuth, async (req: Request, res: Response) => {
  if (!isStripeConfigured()) {
    res.status(503).json({ message: "Stripe is not configured" });
    return;
  }

  const userId = req.session.userId!;
  const { priceId } = req.body as { priceId: string };

  if (!priceId) {
    res.status(400).json({ message: "priceId is required" });
    return;
  }

  const stripe = getStripeClient();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  let customerId = user?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
      email: user?.email ?? undefined,
    });
    customerId = customer.id;

    await db
      .update(usersTable)
      .set({ stripeCustomerId: customerId })
      .where(eq(usersTable.id, userId));
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const baseUrl = `${appUrl}/sleep-reset`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: `${baseUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/purchase?cancelled=1`,
    metadata: { userId },
  });

  res.json({ url: session.url });
});

router.get("/purchase-status", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session.userId!;

  const [user] = await db
    .select({ purchasedAt: usersTable.purchasedAt })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  res.json({
    purchased: !!user?.purchasedAt,
    purchasedAt: user?.purchasedAt ?? null,
  });
});

export async function stripeWebhookHandler(req: Request, res: Response, _next: NextFunction) {
  if (!isStripeConfigured()) {
    res.status(503).send("Stripe not configured");
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const stripe = getStripeClient();
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } else {
      event = JSON.parse((req.body as Buffer).toString());
    }
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { userId?: string } };
    const userId = session.metadata?.userId;

    if (userId) {
      await db
        .update(usersTable)
        .set({ purchasedAt: new Date() })
        .where(eq(usersTable.id, userId));
    }
  }

  res.json({ received: true });
}

export default router;
