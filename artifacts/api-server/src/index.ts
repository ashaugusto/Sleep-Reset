import app from "./app";
import { logger } from "./lib/logger";
import { initStripeSync } from "./stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  initStripeSync(databaseUrl).catch((err) => {
    logger.warn({ err }, "Stripe sync init failed — payments may still work via env vars");
  });
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
