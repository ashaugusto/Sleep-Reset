// A compra de teste que a FLU-156 pede, contra o site a sério.
// Estendida na FLU-227 aos degraus 4 (protocolo avulso) e 5 (segundo assento).
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
// Os degraus 4 e 5 ainda não têm produto publicado no painel, portanto não têm
// código de oferta. Isso trava a metade da Hotmart, não a nossa: a compra é
// semeada no livro com o formato que o webhook escreveria (ver `seedRung`) e
// todo o resto corre pelo código de produção, incluindo o reembolso, que se
// orienta pelo número da transacção e nunca pelo código da oferta. No dia em
// que HOTMART_OFF_DOWNSELL e HOTMART_OFF_SEAT estiverem no .env, as mesmas
// linhas passam a entrar pelo webhook sem se mudar nada aqui.
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
// O parceiro que recebe o segundo assento. Conta nova, criada por ele a partir
// do convite, nunca pelo webhook. Também não recebe email nenhum.
const PARTNER = `${TAG}-partner-${STAMP}@sleepwired.invalid`;
// A senha que o comprador escolhe em /sign-up e a que o parceiro escolhe no
// convite. Contas de teste, apagadas no fim, mas ainda assim não "123456".
const PASSWORD = `flu227-${STAMP}`;

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
  downsell: `${TAG.toUpperCase()}D${STAMP}`,
  seat: `${TAG.toUpperCase()}S${STAMP}`,
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

// ─── Sessões ────────────────────────────────────────────────────────────────
// Os degraus 4 e 5 não vivem só no webhook: metade deles são rotas que exigem
// um comprador com sessão iniciada (/api/seats) e a outra metade são rotas que
// exigem que não haja sessão nenhuma (/api/seats/invite/<token>, que o parceiro
// abre sem conta). Por isso dois frascos de cookies em vez de um, e um que
// nunca é enviado.
function jar() { return { cookie: "" }; }
const OWNER = jar();
const GUEST = jar();

async function api(pathname, { method = "GET", body, as = null } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(as?.cookie ? { Cookie: as.cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set && as) as.cookie = set.split(";")[0];
  let json = null;
  try { json = await res.json(); } catch { /* corpo vazio */ }
  return { status: res.status, json };
}

// ─── Semear um degrau que ainda não tem oferta no painel ─────────────────────
// Quando o código de oferta existe no .env, a compra entra por onde entra a
// sério: o webhook. Quando não existe, o webhook classificaria como `unknown` e
// não abriria nada, o que não é uma falha do código mas do painel.
//
// Nesse caso a linha é escrita à mão no livro de compras, com exactamente o
// formato que o webhook escreveria. Tudo o que vem a seguir continua a correr
// pelo código de produção sem saber a diferença: o recálculo de acessos, o
// /api/entitlements, o convite, e o reembolso, que só olha para o número da
// transacção e nunca para o código da oferta. Sem isto, os degraus 4 e 5 só
// seriam testáveis depois de o Ash publicar os produtos, que é ao contrário da
// ordem em que as coisas se fazem.
async function seedRung({ transaction, rung, price, email }) {
  const offer = OFF[rung];
  if (offer) {
    const r = await post(payload({ event: "PURCHASE_APPROVED", transaction, email, name: "Teste FLU156", offer, ucode: UCODE[rung], price }));
    return { via: "webhook", ok: r.status === 200 && r.json?.rung === rung, detail: JSON.stringify(r.json) };
  }
  await pool.query(
    `insert into purchases (id, provider, transaction_id, dedupe_key, email, rung, offer_code,
                            status, price_cents, currency, event, purchased_at, created_at, updated_at)
     values ($1, 'hotmart', $2, $3, $4, $5, null, 'approved', $6, 'EUR', 'seed.flu227', now(), now(), now())
     on conflict (dedupe_key) do nothing`,
    [crypto.randomUUID(), transaction, `hotmart:${transaction}:${rung}`, email, rung, Math.round(price * 100)],
  );
  return { via: "semeado", ok: true, detail: "" };
}

async function invites(ownerEmail) {
  const { rows } = await pool.query(
    `select token, redeemed_at, redeemed_by_email, granted_purchase_id
       from seat_invites where owner_email = $1 order by created_at`, [ownerEmail]);
  return rows;
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
  // Os convites primeiro: apontam para linhas de compras, e apagar as compras
  // antes deixava convites órfãos com um token vivo na base de produção.
  const i = await pool.query(`delete from seat_invites where owner_email ilike $1 or redeemed_by_email ilike $1`, [like]);
  const p = await pool.query(`delete from purchases where email ilike $1`, [like]);
  const l = await pool.query(`delete from leads where email ilike $1`, [like]);
  const u = await pool.query(`delete from users where email ilike $1`, [like]);
  console.log(`\nLimpeza: ${p.rowCount} compras, ${i.rowCount} convites, ${l.rowCount} leads, ${u.rowCount} contas.`);
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
  console.log(`Degraus 4 e 5: downsell=${OFF.downsell || "(sem oferta, semeado)"} seat=${OFF.seat || "(sem oferta, semeado)"}\n`);

  // Deixa a mesa limpa antes de começar, para o caso de uma corrida anterior
  // ter ficado a meio.
  await pool.query(`delete from seat_invites where owner_email ilike $1 or redeemed_by_email ilike $1`, [`%${TAG}%`]);
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

  // ─── FLU-227: os degraus 4 e 5 ─────────────────────────────────────────────
  // Daqui para baixo o comprador tem senha. Tudo o que se apoiava em ele NÃO
  // ter conta (o /claim a responder hasAccount:false) já correu acima.

  console.log("\nDegrau 4 — o protocolo avulso (downsell):");
  const seedDown = await seedRung({ transaction: TX.downsell, rung: "downsell", price: 9, email: BUYER });
  check(`compra do downsell registada (${seedDown.via})`, seedDown.ok, seedDown.detail);

  console.log("\nDegrau 5 — o segundo assento (seat):");
  const seedSeat = await seedRung({ transaction: TX.seat, rung: "seat", price: 17, email: BUYER });
  check(`compra do assento registada (${seedSeat.via})`, seedSeat.ok, seedSeat.detail);

  // A senha. Não é um extra do teste: é o que faz correr `recomputeAccess` pelo
  // caminho a sério, e é a única forma de o comprador chegar às rotas do
  // assento, que exigem sessão.
  console.log("\nO comprador põe senha (/api/auth/register):");
  const reg = await api("/api/auth/register", {
    method: "POST",
    body: { transaction: TX.front, email: BUYER, password: PASSWORD },
    as: OWNER,
  });
  check("registo aceite", reg.status === 200 && !!reg.json?.id, JSON.stringify(reg.json));
  check("sessão iniciada (veio cookie)", !!OWNER.cookie, "sem set-cookie");

  const uReg = await user(BUYER);
  check("o protocolo avulso abriu na conta", !!uReg?.downsell_purchased_at, "downsell_purchased_at vazio");
  check("um assento creditado", uReg?.seat_credits === 1, String(uReg?.seat_credits));
  check("a plataforma continua aberta", !!uReg?.purchased_at);

  const ent = await api("/api/entitlements", { as: OWNER });
  check("entitlements devolve o degrau 4", Array.isArray(ent.json?.rungs) && ent.json.rungs.includes("downsell"), JSON.stringify(ent.json?.rungs));
  check("entitlements devolve o degrau 5", Array.isArray(ent.json?.rungs) && ent.json.rungs.includes("seat"), JSON.stringify(ent.json?.rungs));

  console.log("\nO assento vira convite:");
  const seats0 = await api("/api/seats", { as: OWNER });
  check("um assento comprado, um por dar", seats0.json?.owned === 1 && seats0.json?.available === 1, JSON.stringify(seats0.json));
  const noSession = await api("/api/seats");
  check("sem sessão a lista é recusada", noSession.status === 401, String(noSession.status));

  const made = await api("/api/seats/invite", { method: "POST", as: OWNER });
  check("convite criado", made.status === 201 && typeof made.json?.url === "string", JSON.stringify(made.json));
  const inviteUrl = made.json?.url || "";
  const token = inviteUrl.split("/seat/")[1] || "";
  check("o link aponta para /seat/<token> de 64 hex", /^[0-9a-f]{64}$/.test(token), inviteUrl);

  const again2 = await api("/api/seats/invite", { method: "POST", as: OWNER });
  check("um assento não dá dois convites", again2.status === 409, String(again2.status));
  const rowsInv = await invites(BUYER);
  check("um só convite na base", rowsInv.length === 1, String(rowsInv.length));

  console.log("\nO parceiro abre o convite (sem conta, sem sessão):");
  const look = await api(`/api/seats/invite/${token}`);
  check("o convite é válido", look.status === 200 && look.json?.valid === true, JSON.stringify(look.json));
  check("ainda por usar", look.json?.redeemed === false);
  check("não devolve email nenhum", !JSON.stringify(look.json || {}).includes("@"), JSON.stringify(look.json));
  const lookMiss = await api(`/api/seats/invite/${"0".repeat(64)}`);
  check("token que não existe devolve 404", lookMiss.status === 404, String(lookMiss.status));

  const self = await api(`/api/seats/invite/${token}/claim`, { method: "POST", body: { email: BUYER, password: PASSWORD } });
  check("o comprador não pode gastar o assento em si próprio", self.status === 400, JSON.stringify(self.json));
  const weak = await api(`/api/seats/invite/${token}/claim`, { method: "POST", body: { email: PARTNER, password: "123" } });
  check("senha curta é recusada", weak.status === 400, JSON.stringify(weak.json));

  const claimed = await api(`/api/seats/invite/${token}/claim`, {
    method: "POST",
    body: { email: PARTNER, name: "Parceiro FLU227", password: PASSWORD },
    as: GUEST,
  });
  check("o parceiro resgata o assento", claimed.status === 200 && claimed.json?.ok === true, JSON.stringify(claimed.json));
  check("e fica com sessão iniciada", claimed.json?.signedIn === true, JSON.stringify(claimed.json));

  const uPartner = await user(PARTNER);
  check("conta do parceiro criada", !!uPartner);
  check("com senha, escolhida por ele", !!uPartner?.password_hash);
  check("com a plataforma aberta", !!uPartner?.purchased_at, "purchased_at vazio: pagou-se um assento e não se entregou nada");
  check("e sem herdar o que era do comprador", !uPartner?.premium_purchased_at && !uPartner?.downsell_purchased_at && uPartner?.seat_credits === 0);

  const pPartner = await purchases(PARTNER);
  check("uma linha no livro, ligada à transacção do assento", pPartner.length === 1 && pPartner[0]?.transaction_id === TX.seat, JSON.stringify(pPartner));
  check("registada como front, que é o que ele recebe", pPartner[0]?.rung === "front", pPartner[0]?.rung);
  check("a zero, porque quem pagou foi o outro", pPartner[0]?.price_cents === 0, String(pPartner[0]?.price_cents));

  const meAsPartner = await api("/api/auth/me", { as: GUEST });
  check("o parceiro entra na área de membros", meAsPartner.status === 200 && meAsPartner.json?.email === PARTNER, JSON.stringify(meAsPartner.json));

  const usedTwice = await api(`/api/seats/invite/${token}/claim`, { method: "POST", body: { email: `outro-${PARTNER}`, password: PASSWORD } });
  check("o convite não serve duas vezes", usedTwice.status === 409, String(usedTwice.status));
  const seats1 = await api("/api/seats", { as: OWNER });
  check("o comprador vê o assento ocupado", seats1.json?.available === 0 && seats1.json?.seats?.[0]?.redeemedAt, JSON.stringify(seats1.json));
  check("e vê o email do parceiro mascarado", typeof seats1.json?.seats?.[0]?.redeemedBy === "string" && seats1.json.seats[0].redeemedBy.includes("***"), JSON.stringify(seats1.json?.seats?.[0]));

  console.log("\nReembolso do degrau 5 — fecha os dois lados, e só esses:");
  const rSeat = await post(payload({ event: "PURCHASE_REFUNDED", transaction: TX.seat, email: BUYER, price: 17 }));
  check("webhook responde revoked", rSeat.status === 200 && rSeat.json?.action === "revoked", JSON.stringify(rSeat.json));
  const uPartnerAfter = await user(PARTNER);
  check("o parceiro perde o acesso", !uPartnerAfter?.purchased_at, "acesso pago por um assento devolvido continua aberto");
  const uOwnerAfter = await user(BUYER);
  check("o crédito do assento desaparece", uOwnerAfter?.seat_credits === 0, String(uOwnerAfter?.seat_credits));
  check("a plataforma do comprador fica de pé", !!uOwnerAfter?.purchased_at, "reembolso levou acesso que não era dele");
  check("e o protocolo avulso também", !!uOwnerAfter?.downsell_purchased_at, "reembolso levou acesso que não era dele");
  const lookDead = await api(`/api/seats/invite/${token}`);
  check("o convite morre com o assento", lookDead.status === 404, String(lookDead.status));

  console.log("\nReembolso do degrau 4 — fecha só o protocolo avulso:");
  const rDown = await post(payload({ event: "PURCHASE_REFUNDED", transaction: TX.downsell, email: BUYER, price: 9 }));
  check("webhook responde revoked", rDown.status === 200 && rDown.json?.action === "revoked", JSON.stringify(rDown.json));
  const uDownAfter = await user(BUYER);
  check("o protocolo avulso fecha", !uDownAfter?.downsell_purchased_at);
  check("a plataforma continua aberta depois de quatro estornos", !!uDownAfter?.purchased_at, "reembolso levou acesso que não era dele");

  console.log("\nDegraus ainda sem oferta no painel:");
  for (const rung of ["downsell", "seat"]) {
    // Isto não é uma falha: é o estado do painel a ser dito em voz alta. O
    // caminho de entrega acima já correu de qualquer maneira, semeado.
    console.log(`  nota  ${rung}: HOTMART_OFF_${rung.toUpperCase()}=${OFF[rung] || "(vazio)"}`);
  }

  await cleanup();
  const after = await user(BUYER);
  check("limpeza não deixou conta de teste para trás", after === null);
  check("nem a conta do parceiro", (await user(PARTNER)) === null);
  check("nem convites com token vivo", (await invites(BUYER)).length === 0);

  await pool.end();
  console.log(`\n${passed} passaram, ${failures.length} falharam.`);
  if (failures.length) { for (const f of failures) console.log(`  - ${f}`); process.exit(1); }
}

main().catch(async (err) => { console.error(err); try { await cleanup(); await pool.end(); } catch {} process.exit(1); });
