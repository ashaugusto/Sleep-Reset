import Stripe from "stripe";
import { StripeSync, runMigrations } from "stripe-replit-sync";

const STRIPE_API_VERSION = "2026-03-25.dahlia";

export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION as any });
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(apiKey, { apiVersion: STRIPE_API_VERSION as any });
}

let _stripeSyncInstance: StripeSync | null = null;

export async function getStripeSync(): Promise<StripeSync> {
  if (_stripeSyncInstance) return _stripeSyncInstance;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is required for StripeSync");
  const databaseUrl = process.env.DATABASE_URL;
  _stripeSyncInstance = new StripeSync({
    stripeSecretKey,
    poolConfig: { connectionString: databaseUrl },
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  return _stripeSyncInstance;
}

export async function initStripeSync(databaseUrl: string): Promise<void> {
  await runMigrations({ databaseUrl });
  const stripeSync = await getStripeSync();
  const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
  await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
  stripeSync.syncBackfill().catch((err) => console.error("Stripe backfill error:", err));
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
