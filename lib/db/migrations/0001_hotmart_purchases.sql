-- Purchases ledger + the entitlement columns it feeds.
--
-- Schema changes here have always gone out through `drizzle-kit push`, which
-- diffs the live database and can decide to drop what it does not recognise.
-- That is fine against an empty branch database and not fine against the one
-- holding the buyers, so this goes out as plain idempotent DDL instead. Run it
-- as often as you like: every statement checks first.
--
-- Applied with:  node lib/db/migrate.mjs

CREATE TABLE IF NOT EXISTS purchases (
  id                text PRIMARY KEY,
  provider          text NOT NULL DEFAULT 'hotmart',
  transaction_id    text NOT NULL,
  dedupe_key        text NOT NULL,
  email             text NOT NULL,
  user_id           text,
  rung              text NOT NULL,
  offer_code        text,
  product_ucode     text,
  product_id        text,
  status            text NOT NULL DEFAULT 'approved',
  price_cents       integer,
  currency          text,
  sck               text,
  event             text,
  purchased_at      timestamp NOT NULL DEFAULT now(),
  revoked_at        timestamp,
  created_at        timestamp NOT NULL DEFAULT now(),
  updated_at        timestamp NOT NULL DEFAULT now()
);

-- The natural key. Hotmart re-delivers a notification until it gets a 200, and
-- fires one call per product in the order, so it is transaction plus product.
CREATE UNIQUE INDEX IF NOT EXISTS purchases_dedupe_idx ON purchases (dedupe_key);
CREATE INDEX IF NOT EXISTS purchases_email_idx ON purchases (email);
CREATE INDEX IF NOT EXISTS purchases_transaction_idx ON purchases (transaction_id);

-- The rest of the ladder, as projections of the table above.
ALTER TABLE users ADD COLUMN IF NOT EXISTS kit_purchased_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS downsell_purchased_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seat_credits integer NOT NULL DEFAULT 0;

-- Attribution as it comes back off a Hotmart purchase.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sck text;
