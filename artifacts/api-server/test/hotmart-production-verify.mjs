// A compra de teste que a FLU-156 pede, contra o site a sério.
//
// O smoke test irmão (hotmart-purchase.smoke.mjs) prova a lógica contra uma
// base de dados descartável. Este prova a outra metade, que nenhum teste local
// alcança: que o HOTTOK colado no painel é o que o servidor tem, que os códigos
// de oferta do .env são os das ofertas publicadas, e que o processo que está
// mesmo a correr em produção escreve no lugar certo.
//
// Cria contas verdadeiras na base de produção e apaga-as no fim. Se rebentar a
// meio, --cleanup-only limpa o que ficou para trás.
//
//   node --env-file=.env artifacts/api-server/test/hotmart-production-verify.mjs
//   node --env-file=.env artifacts/api-server/test/hotmart-production-verify.mjs --cleanup-only

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pg = createRequire(path.resolve(here, "../../../lib/db/package.json"))("pg");

const BASE = process.env.VERIFY_BASE || "https://sleepwired.com";
const HOTTOK = process.env.HOTMART_HOTTOK || "";
const DB_URL = process.env.DATABASE_URL || "";
const CLEANUP_ONLY = process.argv.includes("--cleanup-only");

// Uma marca no email que a limpeza reconhece. Sem isto, apagar por engano a
// conta de um comprador a sério é uma linha de SQL de distância.
const TAG = "flu156verify";
const STAMP = process.env.VERIFY_STAMP || String(Math.floor(Date.now() / 1000));

// O degrau `front` é o único que dispara email de boas-vindas. Vai para uma
// caixa que existe, de propósito: o email a chegar é metade da prova.
const BUYER = process.env.VERIFY_EMAIL || `ashaugusto+${TAG}${STAMP}@icloud.com`;
// Os outros dois degraus não mandam email nenhum, por isso não precisam de
// caixa. `.invalid` é reservado e nunca sai da máquina.
const BUYER_UNKNOWN = `${TAG}-unknown-${STAMP}@sleepwired.invalid`;

const OFF = {
  front: (process.env.HOTMART_OFF_FRONT || "").trim(),
  bump: (process.env.HOTMART_OFF_BUMP || "").trim(),
  oto1: (process.env.HOTMART_OFF_OTO1 || "").trim(),
  downsell: (process.env.HOTMART_OFF_DOWNSELL || "").trim(),
  seat: (process.env.HOTMART_OFF_SEAT || "").trim(),
};
const UCODE = {
  front: (process.env.HOTMART_UCODE_FRONT || "").trim(),
  bump: (process.env.HOTMART_UCODE_BUMP || "").trim(),
  oto1: (process.env.HOTMART_UCODE_OTO1 || "").trim(),
};

const TX = {
  front: `${TAG.toUpperCase()}F${STAMP}`,
  bump: `${TAG.toUpperCase()}B${STAMP}`,
  oto1: `${TAG.toUpperCase()}K${STAMP}`,
  unknown: `${TAG.toUpperCase()}U${STAMP}`,
};

// A base é a mesma que o servidor usa: cluster gerido da DO, com cadeia
// auto-assinada. O sslmode da URL tem de sair antes, senão o pg trata
// `require` como `verify-full` e recusa. Mesma manobra de lib/db/src/index.ts.
function connectionConfig(url) {
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("ssl");
    return u.toString();
  } catch {
    return url;
  }
}
const isLocal = /(?:@|\/\/)(?:localhost|127\.0\.0\.1)/.test(DB_URL);
const pool = new pg.Pool({
  connectionString: connectionConfig(DB_URL),
  ssl: isLocal ? false : { rejectUnauthorized: false },
});
let passed = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) { passed += 1; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ""}`); console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`); }
}

function payload({ event, transaction, email, name, offer, ucode, price, sck }) {
  return {
    id: `evt-${transaction}-${offer || "x"}`,
    event,
    version: "2.0.0",
    creation_date: Date.now(),
    data: {
      product: { id: 8279398, ucode, name: "Sleep Wired" },
      buyer: { email, name, checkout_phone: "+41790000000" },
      purchase: {
        transaction,
        status: event === "PURCHASE_APPROVED" ? "APPROVED" : "REFUNDED",
        order_date: Date.now(),
        approved_date: Date.now(),
        price: { value: price, currency_value: "EUR" },
        offer: offer ? { code: offer } : undefined,
        origin: sck ? { sck } : undefined,
        buyer_ip: "203.0.113.9",
      },
    },
  };
}

async function post(body, { hottok = HOTTOK } = {}) {
  const res = await fetch(`${BASE}/api/hotmart/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(hottok ? { "X-HOTMART-HOTTOK": hottok } : {}) },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* corpo vazio */ }
  return { status: res.status, json };
}

async function purchases(email) {
  const { rows } = await pool.query(
    `select transaction_id, rung, status, revoked_at, offer_code, price_cents, currency, sck, user_id
       from purchases where email = $1 order by created_at`, [email]);
  return rows;
}
async function user(email) {
  const { rows } = await pool.query(
    `select id, email, name, password_hash, purchased_at, premium_purchased_at, kit_purchased_at,
            downsell_purchased_at, seat_credits from users where email = $1`, [email]);
  return rows[0] || null;
}

async function cleanup() {
  const like = `%${TAG}%`;
  const p = await pool.query(`delete from purchases where email ilike $1`, [like]);
  const l = await pool.query(`delete from leads where email ilike $1`, [like]);
  const u = await pool.query(`delete from users where email ilike $1`, [like]);
  console.log(`\nLimpeza: ${p.rowCount} compras, ${l.rowCount} leads, ${u.rowCount} contas.`);
}

async function main() {
  if (CLEANUP_ONLY) { await cleanup(); await pool.end(); return; }

  if (!HOTTOK) { console.error("HOTMART_HOTTOK vazio. Corre com --env-file=.env."); process.exit(1); }
  if (!DB_URL) { console.error("DATABASE_URL vazio."); process.exit(1); }
  if (!OFF.front || !OFF.bump || !OFF.oto1) {
    console.error("Faltam códigos de oferta no .env (FRONT/BUMP/OTO1)."); process.exit(1);
  }

  console.log(`\nAlvo: ${BASE}`);
  console.log(`Comprador de teste: ${BUYER}`);
  console.log(`Ofertas: front=${OFF.front} bump=${OFF.bump} oto1=${OFF.oto1}`);
  console.log(`Sem oferta publicada: downsell=${OFF.downsell || "(nenhuma)"} seat=${OFF.seat || "(nenhuma)"}\n`);

  // Deixa a mesa limpa antes de começar, para o caso de uma corrida anterior
  // ter ficado a meio.
  await pool.query(`delete from purchases where email ilike $1`, [`%${TAG}%`]);
  await pool.query(`delete from leads where email ilike $1`, [`%${TAG}%`]);
  await pool.query(`delete from users where email ilike $1`, [`%${TAG}%`]);

  console.log("Porta:");
  check("hottok errado é recusado", (await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.front, email: BUYER, offer: OFF.front, price: 27 }), { hottok: "nao-e-este" })).status === 401);
  check("sem hottok é recusado", (await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.front, email: BUYER, offer: OFF.front, price: 27 }), { hottok: "" })).status === 401);
  const ignored = await post({ event: "PURCHASE_BILLET_PRINTED", version: "2.0.0", data: { purchase: { transaction: TX.front } } });
  check("evento que não é venda é reconhecido e ignorado", ignored.status === 200 && ignored.json?.action === "ignored", JSON.stringify(ignored.json));

  console.log("\nDegrau 1 — a plataforma (front):");
  const sck = "t-maintenance_h-plan_s-fb_c-flu156";
  const r1 = await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.front, email: BUYER, name: "Teste FLU156", offer: OFF.front, ucode: UCODE.front, price: 27, sck }));
  check("webhook responde granted/front", r1.status === 200 && r1.json?.action === "granted" && r1.json?.rung === "front", JSON.stringify(r1.json));
  const u1 = await user(BUYER);
  check("conta criada pelo email do comprador", !!u1, "sem linha em users");
  check("conta nasce sem senha", u1 ? u1.password_hash === null : false);
  check("nome do comprador guardado", u1?.name === "Teste FLU156", u1?.name);
  check("purchased_at preenchido", !!u1?.purchased_at);
  check("bump e kit continuam fechados", !u1?.premium_purchased_at && !u1?.kit_purchased_at);
  const p1 = await purchases(BUYER);
  check("uma linha no livro de compras", p1.length === 1, `${p1.length}`);
  check("linha ligada à conta", p1[0]?.user_id === u1?.id);
  check("preço guardado em cêntimos", p1[0]?.price_cents === 2700, String(p1[0]?.price_cents));
  check("sck guardado tal como veio", p1[0]?.sck === sck, p1[0]?.sck);
  const { rows: leadRows } = await pool.query(`select purchased, hero_variant, utm_source, utm_content, sck from leads where email = $1`, [BUYER]);
  check("lead marcado como comprador", leadRows[0]?.purchased === true);
  check("sck lido de volta para o lead (hero)", leadRows[0]?.hero_variant === "plan", leadRows[0]?.hero_variant);
  check("sck lido de volta para o lead (source)", leadRows[0]?.utm_source === "fb", leadRows[0]?.utm_source);
  check("sck lido de volta para o lead (content)", leadRows[0]?.utm_content === "flu156", leadRows[0]?.utm_content);

  const again = await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.front, email: BUYER, name: "Teste FLU156", offer: OFF.front, ucode: UCODE.front, price: 27, sck }));
  check("redelivery da Hotmart não duplica", again.status === 200 && again.json?.isNew === false, JSON.stringify(again.json));
  check("continua a haver uma só linha", (await purchases(BUYER)).length === 1);

  console.log("\nDegrau 2 — o pack (bump):");
  const r2 = await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.bump, email: BUYER, name: "Teste FLU156", offer: OFF.bump, ucode: UCODE.bump, price: 19 }));
  check("webhook responde granted/bump", r2.status === 200 && r2.json?.rung === "bump", JSON.stringify(r2.json));
  const u2 = await user(BUYER);
  check("premium_purchased_at aberto", !!u2?.premium_purchased_at);
  check("plataforma continua aberta", !!u2?.purchased_at);

  console.log("\nDegrau 3 — o Kit (oto1):");
  const r3 = await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.oto1, email: BUYER, name: "Teste FLU156", offer: OFF.oto1, ucode: UCODE.oto1, price: 37 }));
  check("webhook responde granted/oto1", r3.status === 200 && r3.json?.rung === "oto1", JSON.stringify(r3.json));
  const u3 = await user(BUYER);
  check("kit_purchased_at aberto", !!u3?.kit_purchased_at);
  check("os três degraus abertos ao mesmo tempo", !!u3?.purchased_at && !!u3?.premium_purchased_at && !!u3?.kit_purchased_at);

  console.log("\nPágina de obrigado (/api/hotmart/claim):");
  const claim = await (await fetch(`${BASE}/api/hotmart/claim?transaction=${TX.front}`)).json();
  check("a compra é confirmada", claim?.paymentVerified === true, JSON.stringify(claim));
  check("email devolvido mascarado, nunca inteiro", typeof claim?.maskedEmail === "string" && claim.maskedEmail.includes("***") && !claim.maskedEmail.includes(BUYER), claim?.maskedEmail);
  check("diz que ainda não tem senha", claim?.hasAccount === false);
  check("dentro da janela pode criar conta", claim?.canCreateAccount === true);
  const claimMiss = await fetch(`${BASE}/api/hotmart/claim?transaction=NAOEXISTE${STAMP}`);
  check("transacção que não existe devolve 404 pendente", claimMiss.status === 404);

  console.log("\nOferta que ninguém mapeou:");
  const r4 = await post(payload({ event: "PURCHASE_APPROVED", transaction: TX.unknown, email: BUYER_UNKNOWN, name: "Teste FLU156 desconhecido", offer: `off-que-nao-existe-${STAMP}`, ucode: `ucode-que-nao-existe-${STAMP}`, price: 9 }));
  check("é aceite com 200 (a Hotmart não fica a repetir)", r4.status === 200, String(r4.status));
  check("registada como unknown", r4.json?.rung === "unknown", JSON.stringify(r4.json));
  const u4 = await user(BUYER_UNKNOWN);
  check("conta criada para o dinheiro não se perder", !!u4);
  check("mas não abre degrau nenhum", u4 ? (!u4.purchased_at && !u4.premium_purchased_at && !u4.kit_purchased_at && !u4.downsell_purchased_at) : false);

  console.log("\nReembolso — a pergunta toda desta issue:");
  const r5 = await post(payload({ event: "PURCHASE_REFUNDED", transaction: TX.bump, email: BUYER, offer: OFF.bump, ucode: UCODE.bump, price: 19 }));
  check("webhook responde revoked", r5.status === 200 && r5.json?.action === "revoked", JSON.stringify(r5.json));
  const u5 = await user(BUYER);
  check("o pack devolvido fecha", !u5?.premium_purchased_at);
  check("a plataforma paga noutra transacção fica de pé", !!u5?.purchased_at, "reembolso levou acesso que não era dele");
  check("o Kit pago noutra transacção fica de pé", !!u5?.kit_purchased_at, "reembolso levou acesso que não era dele");
  const p5 = await purchases(BUYER);
  check("só a linha do pack está revogada", p5.filter((r) => r.revoked_at).length === 1 && p5.find((r) => r.rung === "bump")?.status === "refunded");
  const claimRefunded = await fetch(`${BASE}/api/hotmart/claim?transaction=${TX.bump}`);
  check("a página de obrigado do pack devolvido responde 410", claimRefunded.status === 410, String(claimRefunded.status));

  const r6 = await post(payload({ event: "PURCHASE_CHARGEBACK", transaction: TX.oto1, email: BUYER, offer: OFF.oto1, ucode: UCODE.oto1, price: 37 }));
  check("chargeback também revoga", r6.status === 200 && r6.json?.action === "revoked", JSON.stringify(r6.json));
  const u6 = await user(BUYER);
  check("Kit fechado pelo chargeback", !u6?.kit_purchased_at);
  check("plataforma intacta depois de dois estornos", !!u6?.purchased_at);

  const r7 = await post(payload({ event: "PURCHASE_REFUNDED", transaction: `NUNCAEXISTIU${STAMP}`, email: BUYER, offer: OFF.bump, price: 19 }));
  check("reembolso de venda que nunca chegou não rebenta", r7.status === 200 && r7.json?.action === "nothing_to_revoke", JSON.stringify(r7.json));

  console.log("\nDegraus sem oferta publicada:");
  for (const rung of ["downsell", "seat"]) {
    check(`${rung}: sem código no .env, ainda não há o que testar`, !OFF[rung], `HOTMART_OFF_${rung.toUpperCase()} está preenchido — acrescenta o teste`);
  }

  await cleanup();
  const after = await user(BUYER);
  check("limpeza não deixou conta de teste para trás", after === null);

  await pool.end();
  console.log(`\n${passed} passaram, ${failures.length} falharam.`);
  if (failures.length) { for (const f of failures) console.log(`  - ${f}`); process.exit(1); }
}

main().catch(async (err) => { console.error(err); try { await cleanup(); await pool.end(); } catch {} process.exit(1); });
