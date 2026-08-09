// Applies every .sql file in ./migrations, in filename order.
//
// There is no migration table and no rollback: the files are written to be
// idempotent (CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS), so running
// this twice is a no-op and running it against a database that is already
// current is free. That is the whole contract. `drizzle-kit push` stays the
// tool for a scratch database; this is the one that touches production.
//
//   node lib/db/migrate.mjs
//   DATABASE_URL=... node lib/db/migrate.mjs

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// Same treatment as lib/db/src/index.ts: DO's managed cluster serves a
// self-signed chain, and sslmode=require in the URL now means verify-full.
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
url.searchParams.delete("ssl");

const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl: url.hostname === "localhost" || url.hostname === "127.0.0.1" ? false : { rejectUnauthorized: false },
});

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  const sql = await readFile(path.join(dir, file), "utf8");
  process.stdout.write(`→ ${file} `);
  await pool.query(sql);
  console.log("ok");
}

await pool.end();
console.log(`${files.length} file(s) applied.`);
