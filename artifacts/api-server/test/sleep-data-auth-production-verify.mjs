// Prova, contra o site a sério, que o histórico de sono deixou de estar aberto.
//
// A FLU-224 trancou /api/users/:id e parou aí. As três rotas vizinhas ficaram
// como estavam: qualquer um que soubesse um id lia o diário de sono de outra
// conta, e duas delas também escreviam lá dentro. Este ficheiro é o irmão do
// users-auth-production-verify.mjs para as seis rotas que faltavam.
//
// Cria duas contas descartáveis na base de produção e apaga-as no fim, com as
// linhas de sono que criar pelo caminho — estas tabelas não têm FK, portanto
// apagar o utilizador não leva o resto atrás.
//
//   node --env-file=.env artifacts/api-server/test/sleep-data-auth-production-verify.mjs

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pg = createRequire(path.resolve(here, "../../../lib/db/package.json"))("pg");
const bcrypt = createRequire(path.resolve(here, "../package.json"))("bcryptjs");

const BASE = process.env.VERIFY_BASE || "https://sleepwired.com";
const url = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/, "");
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
  if (ok) { pass++; console.log(`  OK   ${name}`); }
  else { fail++; console.log(`  FALHA ${name} ${extra}`); }
};

const TAG = "flu229-verify";
const A = { id: crypto.randomUUID(), email: `${TAG}-a@example.com`, pw: "senha-de-teste-229" };
const B = { id: crypto.randomUUID(), email: `${TAG}-b@example.com`, pw: "senha-de-teste-229" };

const TODAY = new Date().toISOString().slice(0, 10);
const ONTEM = new Date(Date.now() - 86400e3).toISOString().slice(0, 10);

async function seed(u) {
  await pool.query(
    `insert into users (id, email, name, password_hash) values ($1,$2,$3,$4)`,
    [u.id, u.email, "Verif 229", await bcrypt.hash(u.pw, 10)],
  );
}
async function limpar() {
  const { rows } = await pool.query(`select id from users where email like $1`, [`%${TAG}%`]);
  const ids = rows.map((r) => r.id);
  if (ids.length) {
    for (const t of ["sleep_logs", "night_completions", "checklist_items"]) {
      await pool.query(`delete from ${t} where user_id = any($1)`, [ids]);
    }
  }
  await pool.query(`delete from users where email like $1`, [`%${TAG}%`]);
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

const noite = (u) => JSON.stringify({ logDate: TODAY, bedtimeMinutes: 1380, sleepAttemptMinutes: 1400,
                                      eveningMood: 3, eveningNotes: `de ${u}` });
const manha = JSON.stringify({ finalWakeTimeMinutes: 420, outOfBedMinutes: 450, sleepLatencyMinutes: 22,
                               wakeCount: 1, wakeDurationMinutes: 20, sleepQuality: 4, restfulness: 4 });
const checklist = JSON.stringify({ checklistItems: [{ key: "no-screens", checked: true }], completed: true });

try {
  await limpar();
  await seed(A); await seed(B);

  // Uma linha do A, posta pela base para não depender das rotas que estamos a
  // testar. É o que o invasor vai tentar ler e o que tem de continuar intacto.
  const { rows: [logA] } = await pool.query(
    `insert into sleep_logs (user_id, log_date, bedtime_minutes, sleep_attempt_minutes, evening_mood, evening_notes)
     values ($1,$2,1350,1360,2,'diario privado do A') returning id`,
    [A.id, ONTEM],
  );

  const rotas = (id) => [
    ["GET",  `/api/users/${id}/sleep-logs`, undefined],
    ["POST", `/api/users/${id}/sleep-logs`, noite("invasor")],
    ["PUT",  `/api/users/${id}/sleep-logs/${logA.id}/morning`, manha],
    ["GET",  `/api/users/${id}/progress`, undefined],
    ["GET",  `/api/users/${id}/night-completions`, undefined],
    ["PUT",  `/api/users/${id}/night-completions/1`, checklist],
  ];

  // 1. sem cookie nenhum
  console.log("\n1. sem sessao nenhuma");
  for (const [method, p, body] of rotas(A.id)) {
    const r = await call(p, { method, body });
    check(`${method} ${p.replace(A.id, ":id")} devolve 401`, r.status === 401, `-> ${r.status}`);
  }

  // 2. sessao do B contra os dados do A
  console.log("\n2. autenticado como B, a mexer no sono do A");
  const cookieB = await login(B);
  for (const [method, p, body] of rotas(A.id)) {
    const r = await call(p, { method, body, cookie: cookieB });
    check(`${method} ${p.replace(A.id, ":id-alheio")} devolve 403`, r.status === 403, `-> ${r.status}`);
  }

  const { rows: logsA } = await pool.query(`select * from sleep_logs where user_id = $1`, [A.id]);
  check("o A continua com uma so linha, a que era dele",
        logsA.length === 1 && logsA[0].evening_notes === "diario privado do A" && logsA[0].morning_complete === false,
        `-> ${logsA.length} linhas`);
  const { rows: nightsA } = await pool.query(`select count(*)::int n from night_completions where user_id = $1`, [A.id]);
  check("ninguem escreveu noites concluidas na conta do A", nightsA[0].n === 0, `-> ${nightsA[0].n}`);

  // 3. o dono continua a fazer o que a app faz
  console.log("\n3. autenticado como B, no proprio diario");
  let r = await call(`/api/users/${B.id}/sleep-logs`, { method: "POST", cookie: cookieB, body: noite("B") });
  const criado = r.status === 201 ? await r.json() : null;
  check("POST do proprio log devolve 201", r.status === 201, `-> ${r.status}`);

  r = await call(`/api/users/${B.id}/sleep-logs/${criado?.id}/morning`, { method: "PUT", cookie: cookieB, body: manha });
  const manhaFeita = r.ok ? await r.json() : null;
  check("PUT da manha devolve 200", r.status === 200, `-> ${r.status}`);
  check("a manha calcula o score", typeof manhaFeita?.sleepScore === "number" && manhaFeita.morningComplete === true,
        `-> ${JSON.stringify(manhaFeita?.sleepScore)}`);

  r = await call(`/api/users/${B.id}/sleep-logs`, { cookie: cookieB });
  const lista = r.ok ? await r.json() : null;
  check("GET dos proprios logs devolve 200 com a linha", r.status === 200 && lista?.length === 1, `-> ${r.status}`);

  r = await call(`/api/users/${B.id}/night-completions/1`, { method: "PUT", cookie: cookieB, body: checklist });
  check("PUT da noite 1 devolve 200", r.status === 200, `-> ${r.status}`);

  r = await call(`/api/users/${B.id}/night-completions`, { cookie: cookieB });
  const noites = r.ok ? await r.json() : null;
  check("GET das proprias noites devolve 200 com a noite 1",
        r.status === 200 && noites?.length === 1 && noites[0].completed === true, `-> ${r.status}`);

  r = await call(`/api/users/${B.id}/progress`, { cookie: cookieB });
  const prog = r.ok ? await r.json() : null;
  check("GET do proprio progresso devolve 200", r.status === 200, `-> ${r.status}`);
  check("o progresso conta o log e a noite",
        prog?.logsCount === 1 && prog?.nightsCompleted === 1 && typeof prog?.currentSleepScore === "number",
        `-> ${JSON.stringify({ logsCount: prog?.logsCount, nightsCompleted: prog?.nightsCompleted })}`);

  // 4. e o diario do A ficou onde estava
  const { rows: [aindaA] } = await pool.query(
    `select evening_notes, morning_complete from sleep_logs where id = $1`, [logA.id]);
  check("no fim de tudo, a linha do A esta como estava",
        aindaA.evening_notes === "diario privado do A" && aindaA.morning_complete === false);
} finally {
  await limpar();
  await pool.end();
}

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
