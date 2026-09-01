-- The two boxes on the seventh rung's offer page.
--
-- Same contract as 0001 and 0002: idempotent DDL applied by
-- `node lib/db/migrate.mjs`, never `drizzle-kit push`.
--
-- `transaction_id` is nullable and stays that way. The boxes are ticked on our
-- page, before Hotmart, so at write time there is no transaction to point at;
-- the webhook stamps it afterwards by email. A permanently null one is a
-- visitor who ticked and never bought, and that is a row worth keeping.
--
-- Nothing here is ever UPDATEd except `withdrawn_at`. Consent taken back is a
-- second fact about the same row, not the deletion of the first.

CREATE TABLE IF NOT EXISTS consents (
  id             text PRIMARY KEY,
  kind           text NOT NULL,
  user_id        text NOT NULL,
  email          text NOT NULL,
  rung           text,
  locale         text NOT NULL,
  statement      text NOT NULL,
  transaction_id text,
  ip_address     text,
  user_agent     text,
  granted_at     timestamp NOT NULL DEFAULT now(),
  withdrawn_at   timestamp,
  created_at     timestamp NOT NULL DEFAULT now(),
  updated_at     timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consents_user_kind_idx ON consents (user_id, kind);
CREATE INDEX IF NOT EXISTS consents_email_idx ON consents (email);
CREATE INDEX IF NOT EXISTS consents_transaction_idx ON consents (transaction_id);
