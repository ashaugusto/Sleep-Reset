import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// DO managed PG uses a self-signed CA chain, and pg-connection-string now treats
// sslmode=require as verify-full, which rejects it: "self-signed certificate in
// certificate chain". Passing `ssl` alongside `connectionString` does NOT fix it:
// pg does `Object.assign({}, config, parse(connectionString))`, so whatever the
// URL says about SSL wins over the explicit option. So strip sslmode out of the
// URL first, then set ssl ourselves. We trust DO's managed cluster.
function connectionConfig(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    return u.toString();
  } catch {
    return url;
  }
}

export const pool = new Pool({
  connectionString: connectionConfig(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });

export * from "./schema";
