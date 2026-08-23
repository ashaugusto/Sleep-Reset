// Prova, contra o site a sério, que o id de um utilizador deixou de ser a
// credencial: as três rotas de /api/users exigem sessão, e a sessão tem de ser
// a dona da linha. A FLU-223 tirou o passwordHash da resposta, esta metade
// tranca a porta.
//
// Cria duas contas descartáveis na base de produção e apaga-as no fim.
//
//   node --env-file=.env artifacts/api-server/test/users-auth-production-verify.mjs

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pg = createRequire(path.resolve(here, "../../../lib/db/package.json"))("pg");
const bcrypt = createRequire(path.resolve(here, "../package.json"))("bcryptjs");

const BASE = "https://sleepwired.com";
const url = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/, "");
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
  if (ok) { pass++; console.log(`  OK   ${name}`); }
  else { fail++; console.log(`  FALHA ${name} ${extra}`); }
};

// two throwaway accounts, cleaned at the end
const TAG = "flu224-verify";
const A = { id: crypto.randomUUID(), email: `${TAG}-a@example.com`, pw: "senha-de-teste-224" };
const B = { id: crypto.randomUUID(), email: `${TAG}-b@example.com`, pw: "senha-de-teste-224" };

async function seed(u) {
  await pool.query(
    `insert into users (id, email, name, password_hash) values ($1,$2,$3,$4)`,
    [u.id, u.email, "Verif 224", await bcrypt.hash(u.pw, 10)],
  );
}
async function login(u) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: u.email, password: u.pw }),
  });
  if (!r.ok) throw new Error(`login ${u.email} -> ${r.status}`);
  return r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}
const call = (path, opts = {}) =>
  fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.cookie ? { cookie: opts.cookie } : {}) },
  });

try {
  await pool.query(`delete from users where email like $1`, [`%${TAG}%`]);
  await seed(A); await seed(B);

  // 1. sem cookie
  console.log("\n1. sem sessao nenhuma");
  let r = await call(`/api/users/${A.id}`);
  check("GET /users/:id devolve 401", r.status === 401, `-> ${r.status}`);
  r = await call(`/api/users`, { method: "POST", body: JSON.stringify({ id: A.id, email: "invasor@example.com" }) });
  check("POST /users devolve 401", r.status === 401, `-> ${r.status}`);
  r = await call(`/api/users/${A.id}/profile`, { method: "PUT", body: JSON.stringify({ usualBedtimeMinutes: 60 }) });
  check("PUT /users/:id/profile devolve 401", r.status === 401, `-> ${r.status}`);

  // 2. sessao do B contra o registo do A
  console.log("\n2. autenticado como B, a mexer no registo do A");
  const cookieB = await login(B);
  r = await call(`/api/users/${A.id}`, { cookie: cookieB });
  check("GET do registo alheio devolve 403", r.status === 403, `-> ${r.status}`);
  r = await call(`/api/users`, { method: "POST", cookie: cookieB, body: JSON.stringify({ id: A.id, email: "invasor@example.com" }) });
  check("POST com id alheio devolve 403", r.status === 403, `-> ${r.status}`);
  r = await call(`/api/users/${A.id}/profile`, { method: "PUT", cookie: cookieB, body: JSON.stringify({ usualBedtimeMinutes: 60 }) });
  check("PUT no perfil alheio devolve 403", r.status === 403, `-> ${r.status}`);

  const { rows: [after] } = await pool.query(`select email, usual_bedtime_minutes from users where id = $1`, [A.id]);
  check("o registo do A nao foi tocado", after.email === A.email && after.usual_bedtime_minutes === null,
        `-> ${JSON.stringify(after)}`);

  // 3. o proprio dono continua a passar
  console.log("\n3. autenticado como B, no proprio registo");
  r = await call(`/api/users/${B.id}`, { cookie: cookieB });
  const body = r.ok ? await r.json() : null;
  check("GET do proprio registo devolve 200", r.status === 200, `-> ${r.status}`);
  check("a resposta traz o email e o nome", body?.email === B.email && body?.name === "Verif 224");
  check("a resposta nao traz passwordHash", body && !("passwordHash" in body));
  r = await call(`/api/users/${B.id}/profile`, { method: "PUT", cookie: cookieB,
        body: JSON.stringify({ sleepDisruptorPrimary: "work_stress", sleepDisruptorFrequency: "every_night",
                               usualBedtimeMinutes: 1380, neededWakeUpMinutes: 420 }) });
  const put = r.ok ? await r.json() : null;
  check("PUT no proprio perfil devolve 200", r.status === 200, `-> ${r.status}`);
  check("o onboarding fica completo", put?.onboardingComplete === true);
  r = await call(`/api/users`, { method: "POST", cookie: cookieB, body: JSON.stringify({ id: B.id, name: "Verif 224 b" }) });
  check("POST com o proprio id devolve 200", r.status === 200, `-> ${r.status}`);

  // 4. as paginas da app continuam a servir
  console.log("\n4. paginas autenticadas");
  for (const [path, name] of [["/api/auth/me", "auth/me"], ["/api/dashboard/" + B.id, "dashboard"]]) {
    const res = await call(path, { cookie: cookieB });
    check(`${name} responde ao dono`, res.status === 200 || res.status === 404, `-> ${res.status}`);
  }
} finally {
  await pool.query(`delete from users where email like $1`, [`%${TAG}%`]);
  await pool.end();
}

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
