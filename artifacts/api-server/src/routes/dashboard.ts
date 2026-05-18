import { Router, type IRouter, type Request, type Response } from "express";
import { fetchAllAccounts, fetchLeadStats, fetchStripeRevenue, fetchAccountBreakdown } from "../dashboardData";

const router: IRouter = Router();

function isAuthorized(req: Request): boolean {
  const expected = process.env.DASHBOARD_SECRET;
  if (!expected) return false;
  const got = (req.query.key as string | undefined) || (req.headers["x-dashboard-key"] as string | undefined);
  return got === expected;
}

router.get("/admin/dashboard/data", async (req, res) => {
  if (!isAuthorized(req)) return res.status(403).json({ error: "Forbidden" });
  const preset = (req.query.preset as string) || "last_72h";
  try {
    const [accounts, leads, stripe] = await Promise.all([
      fetchAllAccounts(preset),
      fetchLeadStats(),
      fetchStripeRevenue(preset === "today" || preset === "yesterday" ? 1 : preset === "last_72h" ? 3 : preset === "last_7d" ? 7 : preset === "last_14d" ? 14 : preset === "last_30d" ? 30 : 30),
    ]);
    res.json({ generated_at: new Date().toISOString(), preset, accounts, leads, stripe });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get("/admin/dashboard/breakdown", async (req, res) => {
  if (!isAuthorized(req)) return res.status(403).json({ error: "Forbidden" });
  const accountId = req.query.account as string;
  const preset = (req.query.preset as string) || "last_72h";
  if (!accountId) return res.status(400).json({ error: "account required" });
  try {
    const data = await fetchAccountBreakdown(accountId, preset);
    res.json(data);
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get("/admin/dashboard", (req, res) => {
  if (!isAuthorized(req)) return res.status(403).send("Forbidden — pass ?key=<DASHBOARD_SECRET>");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderDashboard(req.query.key as string));
});

function renderDashboard(key: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Sleep Wired — Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }
    .num { font-variant-numeric: tabular-nums; }
    .row-clickable { cursor: pointer; }
    .row-clickable:hover { background: rgb(30 41 59 / 0.6); }
    .drill { background: rgb(15 23 42); }
    details > summary { list-style: none; cursor: pointer; }
    details > summary::-webkit-details-marker { display: none; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

<div class="max-w-[1600px] mx-auto px-4 py-5">

  <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div>
      <h1 class="text-xl font-bold">Sleep Wired — Dashboard</h1>
      <p id="meta" class="text-xs text-slate-400 mt-1">Loading…</p>
    </div>
    <div class="flex items-center gap-2">
      <select id="preset" class="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm">
        <option value="last_72h" selected>Last 72h (rolling)</option>
        <option value="today">Today (acct TZ)</option>
        <option value="yesterday">Yesterday</option>
        <option value="last_3d">Last 3 days</option>
        <option value="last_7d">Last 7 days</option>
        <option value="last_14d">Last 14 days</option>
        <option value="last_30d">Last 30 days</option>
        <option value="this_month">This month</option>
        <option value="lifetime">Lifetime</option>
      </select>
      <label class="flex items-center gap-1 text-xs text-slate-400">
        <input type="checkbox" id="autorefresh" class="accent-indigo-500" /> Auto 60s
      </label>
      <button id="refresh" class="bg-indigo-600 hover:bg-indigo-500 rounded px-4 py-1.5 text-sm font-semibold">Refresh</button>
    </div>
  </div>

  <div id="totals" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-5"></div>

  <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-5">
    <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
      <h2 class="font-semibold text-sm">Ad Accounts <span class="text-xs text-slate-500 font-normal">(click row to drilldown campaigns→adsets→ads)</span></h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs num">
        <thead class="bg-slate-800/50 text-[10px] uppercase text-slate-400 tracking-wider">
          <tr>
            <th class="text-left px-2 py-2">Account</th>
            <th class="text-right px-2 py-2">CCY</th>
            <th class="text-right px-2 py-2">Spend</th>
            <th class="text-right px-2 py-2">€</th>
            <th class="text-right px-2 py-2">Impr</th>
            <th class="text-right px-2 py-2">Reach</th>
            <th class="text-right px-2 py-2">Freq</th>
            <th class="text-right px-2 py-2">CPM</th>
            <th class="text-right px-2 py-2">Clicks</th>
            <th class="text-right px-2 py-2">CTR</th>
            <th class="text-right px-2 py-2">CPC</th>
            <th class="text-right px-2 py-2">3s</th>
            <th class="text-right px-2 py-2">Hook%</th>
            <th class="text-right px-2 py-2">ThruPlay</th>
            <th class="text-right px-2 py-2">Hold%</th>
            <th class="text-right px-2 py-2">LPV</th>
            <th class="text-right px-2 py-2">VC</th>
            <th class="text-right px-2 py-2">Lead</th>
            <th class="text-right px-2 py-2">IC</th>
            <th class="text-right px-2 py-2 font-bold text-emerald-400">Pur</th>
            <th class="text-right px-2 py-2">CPA</th>
            <th class="text-right px-2 py-2">ROAS</th>
            <th class="text-right px-2 py-2"></th>
          </tr>
        </thead>
        <tbody id="accounts-body"></tbody>
        <tfoot class="bg-slate-800/30 font-semibold border-t border-slate-700"><tr id="totals-row"></tr></tfoot>
      </table>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-5">
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800"><h2 class="font-semibold text-sm">Leads (DB)</h2></div>
      <div id="leads" class="p-4"></div>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800"><h2 class="font-semibold text-sm">Stripe revenue</h2></div>
      <div id="stripe" class="p-4"></div>
    </div>
  </div>

  <p class="text-[10px] text-slate-500 mt-4 leading-relaxed">
    FX: CHF×1.05, BRL×0.16. Meta has 0-3h delay; "Today" uses account TZ (varies). Pixel + CAPI hybrid.
    Hook% = 3s plays / impressions. Hold% = ThruPlay / 3s plays.
  </p>
</div>

<!-- Drilldown modal -->
<div id="modal" class="fixed inset-0 bg-black/80 hidden z-50 overflow-y-auto p-4">
  <div class="max-w-[1500px] mx-auto bg-slate-900 border border-slate-700 rounded-xl mt-10 p-4">
    <div class="flex justify-between items-center mb-3">
      <h3 id="modal-title" class="font-semibold">Drilldown</h3>
      <button onclick="document.getElementById('modal').classList.add('hidden')" class="text-slate-400 hover:text-white px-2">✕ close</button>
    </div>
    <div id="modal-body"></div>
  </div>
</div>

<script>
const KEY = ${JSON.stringify(key)};
const fmtN = (n) => n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtM = (n) => n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n) => n == null || isNaN(n) ? "—" : (Number(n) * 100).toFixed(2) + "%";

let autoTimer = null;

async function load() {
  document.getElementById("meta").textContent = "Loading…";
  const preset = document.getElementById("preset").value;
  const r = await fetch("/admin/dashboard/data?preset=" + preset + "&key=" + encodeURIComponent(KEY));
  if (!r.ok) { document.getElementById("meta").textContent = "Error: " + r.status; return; }
  const d = await r.json();
  renderTotals(d); renderAccounts(d); renderLeads(d); renderStripe(d);
  const dt = new Date(d.generated_at);
  document.getElementById("meta").textContent = "Updated " + dt.toLocaleTimeString() + " · preset=" + d.preset + " · 15 accounts";
}

function renderTotals(d) {
  const a = d.accounts;
  const sumSpend = a.reduce((s, x) => s + (x.spend_eur || 0), 0);
  const sumImpr = a.reduce((s, x) => s + (x.impressions || 0), 0);
  const sumClicks = a.reduce((s, x) => s + (x.link_clicks || 0), 0);
  const sumLPV = a.reduce((s, x) => s + (x.landing_views || 0), 0);
  const sumLead = a.reduce((s, x) => s + (x.leads || 0), 0);
  const sumIC = a.reduce((s, x) => s + (x.initiated_checkout || 0), 0);
  const sumPur = a.reduce((s, x) => s + (x.purchases || 0), 0);
  const sumPurVal = a.reduce((s, x) => s + (x.purchase_value || 0), 0);
  const cpa = sumPur > 0 ? sumSpend / sumPur : null;
  const roas = sumSpend > 0 ? sumPurVal / sumSpend : null;
  const ctr = sumImpr > 0 ? (sumClicks / sumImpr) * 100 : 0;
  const cells = [
    ["Spend €", "€" + fmtM(sumSpend)],
    ["Impressions", fmtN(sumImpr)],
    ["Link Clicks", fmtN(sumClicks)],
    ["CTR", ctr.toFixed(2) + "%"],
    ["LPV", fmtN(sumLPV)],
    ["Leads", fmtN(sumLead)],
    ["IC", fmtN(sumIC)],
    ["Purchases · ROAS", sumPur + " · " + (roas ? roas.toFixed(2) + "x" : "—")],
  ];
  document.getElementById("totals").innerHTML = cells.map(([k, v]) =>
    \`<div class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
      <div class="text-[10px] uppercase tracking-wider text-slate-400">\${k}</div>
      <div class="text-base font-bold num mt-0.5">\${v}</div>
    </div>\`).join("");
}

function rowCells(a) {
  const dot = a.status_err ? '<span class="text-amber-400">⚠</span>' :
              (a.spend > 0 ? '<span class="text-emerald-400">●</span>' : '<span class="text-slate-600">○</span>');
  return [
    \`<td class="px-2 py-1.5 text-right text-slate-400">\${a.ccy || ""}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtM(a.spend)}</td>\`,
    \`<td class="px-2 py-1.5 text-right text-slate-400">€\${fmtM(a.spend_eur)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.impressions)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.reach)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.frequency ? a.frequency.toFixed(2) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.cpm ? fmtM(a.cpm) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.link_clicks)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.ctr ? a.ctr.toFixed(2) + "%" : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.cpc ? fmtM(a.cpc) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.v_3s)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.hook_rate != null ? fmtP(a.hook_rate) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.v_thruplay)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.hold_rate != null ? fmtP(a.hold_rate) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.landing_views)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.view_content)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.leads)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.initiated_checkout)}</td>\`,
    \`<td class="px-2 py-1.5 text-right font-bold \${a.purchases > 0 ? 'text-emerald-400' : 'text-slate-500'}">\${a.purchases}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.cpa ? "€" + fmtM(a.cpa) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.roas ? a.roas.toFixed(2) + "x" : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right" title="\${a.status_err || ''}">\${dot}</td>\`,
  ].join("");
}

function renderAccounts(d) {
  const sorted = [...d.accounts].sort((a, b) => b.spend_eur - a.spend_eur);
  document.getElementById("accounts-body").innerHTML = sorted.map(a =>
    \`<tr class="border-t border-slate-800/50 row-clickable" onclick="drilldown('\${a.account_id}', '\${a.name.replace(/'/g, "\\\\'")}')" >
      <td class="px-2 py-1.5 font-medium">\${a.name}</td>
      \${rowCells(a)}
    </tr>\`).join("");

  // Totals
  const totals = sorted.reduce((acc, x) => {
    acc.spend_eur += x.spend_eur || 0;
    acc.impressions += x.impressions || 0;
    acc.reach += x.reach || 0;
    acc.link_clicks += x.link_clicks || 0;
    acc.landing_views += x.landing_views || 0;
    acc.view_content += x.view_content || 0;
    acc.leads += x.leads || 0;
    acc.initiated_checkout += x.initiated_checkout || 0;
    acc.purchases += x.purchases || 0;
    acc.purchase_value += x.purchase_value || 0;
    acc.v_3s += x.v_3s || 0;
    acc.v_thruplay += x.v_thruplay || 0;
    return acc;
  }, { spend_eur: 0, impressions: 0, reach: 0, link_clicks: 0, landing_views: 0, view_content: 0, leads: 0, initiated_checkout: 0, purchases: 0, purchase_value: 0, v_3s: 0, v_thruplay: 0 });
  const tCpa = totals.purchases > 0 ? totals.spend_eur / totals.purchases : null;
  const tRoas = totals.spend_eur > 0 ? totals.purchase_value / totals.spend_eur : null;
  const tCtr = totals.impressions > 0 ? (totals.link_clicks / totals.impressions) * 100 : 0;
  const tHook = totals.impressions > 0 ? totals.v_3s / totals.impressions : null;
  const tHold = totals.v_3s > 0 ? totals.v_thruplay / totals.v_3s : null;
  document.getElementById("totals-row").innerHTML = \`
    <td class="px-2 py-2">TOTAL</td>
    <td colspan="2" class="px-2 py-2 text-right text-slate-500">—</td>
    <td class="px-2 py-2 text-right">€\${fmtM(totals.spend_eur)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.impressions)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.reach)}</td>
    <td colspan="2" class="px-2 py-2 text-right text-slate-500">—</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.link_clicks)}</td>
    <td class="px-2 py-2 text-right">\${tCtr.toFixed(2)}%</td>
    <td class="px-2 py-2 text-right text-slate-500">—</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.v_3s)}</td>
    <td class="px-2 py-2 text-right">\${tHook != null ? fmtP(tHook) : "—"}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.v_thruplay)}</td>
    <td class="px-2 py-2 text-right">\${tHold != null ? fmtP(tHold) : "—"}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.landing_views)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.view_content)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.leads)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.initiated_checkout)}</td>
    <td class="px-2 py-2 text-right text-emerald-400">\${totals.purchases}</td>
    <td class="px-2 py-2 text-right">\${tCpa ? "€" + fmtM(tCpa) : "—"}</td>
    <td class="px-2 py-2 text-right">\${tRoas ? tRoas.toFixed(2) + "x" : "—"}</td>
    <td></td>\`;
}

async function drilldown(accountId, name) {
  const preset = document.getElementById("preset").value;
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-title").textContent = "Drilldown — " + name + " (" + preset + ")";
  document.getElementById("modal-body").innerHTML = '<div class="text-slate-400 text-sm p-4">Loading…</div>';
  const r = await fetch("/admin/dashboard/breakdown?account=" + accountId + "&preset=" + preset + "&key=" + encodeURIComponent(KEY));
  const d = await r.json();
  if (d.error) {
    document.getElementById("modal-body").innerHTML = '<div class="text-amber-400 text-sm p-4">Error: ' + d.error + '</div>';
    return;
  }
  if (!d.campaigns || d.campaigns.length === 0) {
    document.getElementById("modal-body").innerHTML = '<div class="text-slate-500 text-sm p-4">No data for this period.</div>';
    return;
  }
  let html = '';
  for (const c of d.campaigns) {
    html += \`<details open class="mb-2 bg-slate-800/40 rounded p-2">
      <summary class="flex items-center gap-3 text-sm font-semibold">
        <span class="text-indigo-400">▸</span>
        <span class="flex-1 truncate">\${c.campaign_name}</span>
        <span class="text-slate-400 text-xs">€\${fmtM(c.spend_eur)}</span>
        <span class="text-xs">\${c.impressions} impr · \${c.link_clicks} clk · \${c.purchases} pur</span>
      </summary>
      <div class="ml-6 mt-2 space-y-1">\`;
    for (const a of c.adsets) {
      html += \`<details class="bg-slate-800/40 rounded p-2">
        <summary class="flex items-center gap-3 text-xs">
          <span class="text-indigo-400">▸</span>
          <span class="flex-1 truncate">\${a.adset_name}</span>
          <span class="text-slate-400">€\${fmtM(a.spend_eur)}</span>
          <span>\${a.impressions} impr · \${a.link_clicks} clk · \${a.purchases} pur · CPA \${a.cpa ? "€" + fmtM(a.cpa) : "—"}</span>
        </summary>
        <div class="ml-6 mt-1 space-y-1">\`;
      for (const ad of a.ads.sort((x, y) => y.spend - x.spend)) {
        html += \`<div class="text-xs flex items-center gap-3 py-0.5 px-1 border-l border-slate-700">
          <span class="flex-1 truncate text-slate-300">\${ad.ad_name}</span>
          <span class="text-slate-500">spend €\${fmtM(ad.spend_eur)} · impr \${ad.impressions} · clk \${ad.link_clicks} · CTR \${ad.ctr ? ad.ctr.toFixed(2) + "%" : "—"} · hook \${ad.hook_rate != null ? fmtP(ad.hook_rate) : "—"} · pur \${ad.purchases}</span>
        </div>\`;
      }
      html += \`</div></details>\`;
    }
    html += \`</div></details>\`;
  }
  document.getElementById("modal-body").innerHTML = html;
}

function renderLeads(d) {
  const l = d.leads;
  const hookRows = Object.entries(l.by_hook || {}).sort((a, b) => b[1] - a[1])
    .map(([h, n]) => \`<div class="flex justify-between text-xs py-0.5"><span class="text-slate-400">\${h}</span><span class="font-semibold">\${n}</span></div>\`).join("");
  document.getElementById("leads").innerHTML = \`
    <div class="grid grid-cols-3 gap-3 mb-3">
      <div><div class="text-[10px] uppercase text-slate-500">Total</div><div class="text-xl font-bold num">\${l.total}</div></div>
      <div><div class="text-[10px] uppercase text-slate-500">Purchased</div><div class="text-xl font-bold num text-emerald-400">\${l.purchased}</div></div>
      <div><div class="text-[10px] uppercase text-slate-500">24h</div><div class="text-xl font-bold num">\${l.recent_24h}</div></div>
    </div>
    <div class="text-xs text-slate-400 mb-3">Lead CVR: \${l.total > 0 ? ((l.purchased / l.total) * 100).toFixed(2) + "%" : "—"} · WA captured: \${l.with_whatsapp} · Name: \${l.with_name}</div>
    <div class="text-[10px] uppercase text-slate-500 mb-1">Recovery funnel</div>
    <div class="grid grid-cols-4 gap-1 mb-3 text-center text-xs">
      <div class="bg-slate-800 rounded p-1.5"><div class="text-[9px] text-slate-500">Untouched</div><div class="font-bold">\${l.recovery_0}</div></div>
      <div class="bg-slate-800 rounded p-1.5"><div class="text-[9px] text-slate-500">Sent 1</div><div class="font-bold">\${l.recovery_1}</div></div>
      <div class="bg-slate-800 rounded p-1.5"><div class="text-[9px] text-slate-500">Sent 2</div><div class="font-bold">\${l.recovery_2}</div></div>
      <div class="bg-slate-800 rounded p-1.5"><div class="text-[9px] text-slate-500">Sent 3</div><div class="font-bold">\${l.recovery_3}</div></div>
    </div>
    <div class="text-[10px] uppercase text-slate-500 mb-1">By hook variant</div>
    \${hookRows || '<div class="text-xs text-slate-500">no data</div>'}\`;
}

function renderStripe(d) {
  const s = d.stripe;
  const list = (s.recent_payments || []).map(p =>
    \`<div class="flex justify-between gap-2 text-xs py-1 border-b border-slate-800/40">
      <span class="text-slate-400 truncate" style="max-width:180px;">\${p.email}</span>
      <span class="num font-semibold">€\${fmtM(p.amount_eur)}</span>
      <span class="text-slate-500 text-[10px]">\${p.created}</span>
    </div>\`).join("");
  document.getElementById("stripe").innerHTML = \`
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div><div class="text-[10px] uppercase text-slate-500">Payments</div><div class="text-xl font-bold num text-emerald-400">\${s.total_payments}</div></div>
      <div><div class="text-[10px] uppercase text-slate-500">Revenue</div><div class="text-xl font-bold num">€\${fmtM(s.total_revenue_eur)}</div></div>
    </div>
    <div class="text-[10px] uppercase text-slate-500 mb-2">Last 10 payments</div>
    \${list || '<div class="text-xs text-slate-500">no payments yet</div>'}\`;
}

document.getElementById("refresh").addEventListener("click", load);
document.getElementById("preset").addEventListener("change", load);
document.getElementById("autorefresh").addEventListener("change", (e) => {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  if (e.target.checked) { autoTimer = setInterval(load, 60000); }
});
load();
</script>
</body>
</html>`;
}

export default router;
