-- The fifth rung: a second seat, given to a partner.
--
-- Same contract as 0001 and for the same reason: idempotent DDL applied by
-- `node lib/db/migrate.mjs`, never `drizzle-kit push`, because push diffs the
-- live database and is free to drop what it does not recognise.
--
-- There is no revoked_at here on purpose. An invite is live exactly when the
-- seat purchase behind it is live, and the seat purchase already has one.

CREATE TABLE IF NOT EXISTS seat_invites (
  id                  text PRIMARY KEY,
  purchase_id         text NOT NULL,
  token               text NOT NULL,
  owner_email         text NOT NULL,
  owner_user_id       text,
  redeemed_at         timestamp,
  redeemed_by_email   text,
  redeemed_by_user_id text,
  granted_purchase_id text,
  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seat_invites_token_idx ON seat_invites (token);
-- One invite per seat bought. This index is the credit counter: two requests
-- racing for the same seat means one of them fails, not two seats spent.
CREATE UNIQUE INDEX IF NOT EXISTS seat_invites_purchase_idx ON seat_invites (purchase_id);
CREATE INDEX IF NOT EXISTS seat_invites_owner_idx ON seat_invites (owner_email);
