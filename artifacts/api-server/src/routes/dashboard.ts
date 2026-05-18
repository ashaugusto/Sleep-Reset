import { Router, type IRouter, type Request, type Response } from "express";
import { fetchAllAccounts, fetchLeadStats, fetchStripeRevenue, fetchAccountBreakdown, fetchAttribution } from "../dashboardData";

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
    const attribution = await fetchAttribution(preset);
    const [accounts, leads, stripe] = await Promise.all([
      fetchAllAccounts(preset, attribution),
      fetchLeadStats(),
      fetchStripeRevenue(preset === "today" || preset === "yesterday" ? 1 : preset === "last_72h" ? 3 : preset === "last_7d" ? 7 : preset === "last_14d" ? 14 : preset === "last_30d" ? 30 : 30),
    ]);
    const unattributed = {
      purchases: attribution.unattributed.purchases,
      revenue_eur: attribution.unattributed.revenue_eur,
    };
    res.json({ generated_at: new Date().toISOString(), preset, accounts, leads, stripe, unattributed });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get("/admin/dashboard/breakdown", async (req, res) => {
  if (!isAuthorized(req)) return res.status(403).json({ error: "Forbidden" });
  const accountId = req.query.account as string;
  const preset = (req.query.preset as string) || "last_72h";
  if (!accountId) return res.status(400).json({ error: "account required" });
  try {
    const attribution = await fetchAttribution(preset);
    const data = await fetchAccountBreakdown(accountId, preset, attribution);
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
        <thead>
          <tr class="bg-slate-800/70 text-[9px] uppercase text-slate-400 tracking-wider border-b border-slate-700">
            <th class="text-left px-2 py-1.5"></th>
            <th class="text-right px-2 py-1.5" colspan="2">Cost</th>
            <th class="text-right px-2 py-1.5 bg-emerald-900/20 border-x border-slate-700" colspan="6">Outcome (DB-attributed)</th>
            <th class="text-right px-2 py-1.5" colspan="3">Funnel</th>
            <th class="text-right px-2 py-1.5" colspan="3">Video</th>
            <th class="text-right px-2 py-1.5" colspan="3">Meta Pixel</th>
            <th></th>
          </tr>
          <tr class="bg-slate-800/50 text-[10px] uppercase text-slate-400 tracking-wider">
            <th class="text-left px-2 py-2">Account</th>
            <th class="text-right px-2 py-2">Spend</th>
            <th class="text-right px-2 py-2">€</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">Lead</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">CPL</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">Pur</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">Rev €</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">ROAS</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300 border-r border-slate-700">Profit</th>
            <th class="text-right px-2 py-2">Impr</th>
            <th class="text-right px-2 py-2">CTR</th>
            <th class="text-right px-2 py-2">LPV</th>
            <th class="text-right px-2 py-2">3s</th>
            <th class="text-right px-2 py-2">Hook%</th>
            <th class="text-right px-2 py-2">Hold%</th>
            <th class="text-right px-2 py-2">Lead·px</th>
            <th class="text-right px-2 py-2">IC·px</th>
            <th class="text-right px-2 py-2">Pur·px</th>
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

  <div class="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500 leading-relaxed">
    <span class="font-semibold">Color legend:</span>
    <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 bg-emerald-900/40 border-l-2 border-emerald-400"></span> ROAS ≥ 2x</span>
    <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 bg-emerald-950/30 border-l-2 border-emerald-600"></span> ROAS 1-2x</span>
    <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 bg-amber-950/30 border-l-2 border-amber-500"></span> ROAS &lt; 1x</span>
    <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 bg-red-950/40 border-l-2 border-red-500"></span> Spend &gt; 0, no purchases</span>
    <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 border-l-2 border-slate-700"></span> No spend</span>
  </div>
  <p class="text-[10px] text-slate-500 mt-2 leading-relaxed">
    <b>Outcome cols (Pur/Rev/ROAS/Profit)</b> = DB-attributed: leads.purchased + utm_content (ad_id), AOV €27.
    <b>Pur·px</b> = Meta Pixel (may lag 0-3h). FX: CHF×1.05, BRL×0.16.
    Hook% = 3s plays / impr. Hold% = ThruPlay / 3s.
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

// ROI tint: returns Tailwind classes to color a row by DB-attributed ROAS performance.
// db_roas uses real revenue from leads.purchased + Stripe, not Meta pixel (which may be delayed).
function roiTint(spendEur, dbPurchases, dbRoas) {
  if (!spendEur || spendEur <= 0) return "";
  if (!dbPurchases || dbPurchases <= 0) return "bg-red-950/40 border-l-2 border-red-500";
  if (dbRoas == null) return "";
  if (dbRoas >= 2) return "bg-emerald-900/50 border-l-2 border-emerald-400";
  if (dbRoas >= 1) return "bg-emerald-950/40 border-l-2 border-emerald-600";
  return "bg-amber-950/40 border-l-2 border-amber-500";
}
// Inline badge for ROAS — colored pill on the metric itself
function roasBadge(spendEur, dbPurchases, dbRoas) {
  if (!spendEur || spendEur <= 0) return '<span class="text-slate-600">—</span>';
  if (!dbPurchases || dbPurchases <= 0) return '<span class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">0.00x</span>';
  if (dbRoas == null) return '<span class="text-slate-500">—</span>';
  let cls = 'bg-amber-500/20 text-amber-300';
  if (dbRoas >= 2) cls = 'bg-emerald-500/30 text-emerald-200';
  else if (dbRoas >= 1) cls = 'bg-emerald-600/20 text-emerald-300';
  return \`<span class="px-1.5 py-0.5 rounded font-semibold \${cls}">\${dbRoas.toFixed(2)}x</span>\`;
}
function profitText(profitEur) {
  if (profitEur == null) return '<span class="text-slate-500">—</span>';
  const cls = profitEur > 0 ? 'text-emerald-400' : profitEur < 0 ? 'text-red-400' : 'text-slate-400';
  const sign = profitEur > 0 ? '+' : '';
  return \`<span class="font-semibold \${cls}">\${sign}€\${fmtM(profitEur)}</span>\`;
}

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
  const sumLead = a.reduce((s, x) => s + (x.db_leads || 0), 0);
  const sumLeadPx = a.reduce((s, x) => s + (x.leads || 0), 0);
  const sumPur = a.reduce((s, x) => s + (x.db_purchases || 0), 0);
  const sumRev = a.reduce((s, x) => s + (x.db_revenue_eur || 0), 0);
  const profit = sumRev - sumSpend;
  const roas = sumSpend > 0 ? sumRev / sumSpend : null;
  const ctr = sumImpr > 0 ? (sumClicks / sumImpr) * 100 : 0;
  const unattrib = d.unattributed || { purchases: 0, revenue_eur: 0 };

  const roasCard = (() => {
    let cls = 'text-slate-400';
    if (roas != null) {
      if (roas >= 2) cls = 'text-emerald-300';
      else if (roas >= 1) cls = 'text-emerald-400';
      else if (sumPur > 0) cls = 'text-amber-400';
      else cls = 'text-red-400';
    }
    return \`<div class="text-base font-bold num mt-0.5 \${cls}">\${roas != null ? roas.toFixed(2) + 'x' : (sumSpend > 0 ? '0.00x' : '—')}</div>\`;
  })();
  const profitCard = (() => {
    const cls = profit > 0 ? 'text-emerald-300' : profit < 0 ? 'text-red-400' : 'text-slate-400';
    const sign = profit > 0 ? '+' : '';
    return \`<div class="text-base font-bold num mt-0.5 \${cls}">\${sign}€\${fmtM(profit)}</div>\`;
  })();

  const cells = [
    { label: "Spend €", html: \`<div class="text-base font-bold num mt-0.5">€\${fmtM(sumSpend)}</div>\` },
    { label: "Revenue €", html: \`<div class="text-base font-bold num mt-0.5 \${sumRev > 0 ? 'text-emerald-300' : 'text-slate-400'}">€\${fmtM(sumRev)}</div>\` },
    { label: "ROAS (DB)", html: roasCard },
    { label: "Profit €", html: profitCard },
    { label: "Leads (DB)", html: \`<div class="text-base font-bold num mt-0.5 \${sumLead > 0 ? 'text-emerald-300' : 'text-slate-400'}">\${fmtN(sumLead)}</div>\` },
    { label: "Purchases", html: \`<div class="text-base font-bold num mt-0.5 \${sumPur > 0 ? 'text-emerald-300' : 'text-slate-400'}">\${sumPur}</div>\` },
    { label: "CTR", html: \`<div class="text-base font-bold num mt-0.5">\${ctr.toFixed(2)}%</div>\` },
    { label: "LPV", html: \`<div class="text-base font-bold num mt-0.5">\${fmtN(sumLPV)}</div>\` },
  ];
  let html = cells.map(c =>
    \`<div class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
      <div class="text-[10px] uppercase tracking-wider text-slate-400">\${c.label}</div>
      \${c.html}
    </div>\`).join("");
  if (unattrib.purchases > 0) {
    html += \`<div class="col-span-2 md:col-span-4 lg:col-span-8 bg-amber-950/30 border border-amber-700/40 rounded-lg px-3 py-2 text-xs text-amber-300">
      ⚠ \${unattrib.purchases} purchase(s) without ad attribution (€\${fmtM(unattrib.revenue_eur)} revenue) — likely organic/test. Not included in ROAS by-ad.
    </div>\`;
  }
  document.getElementById("totals").innerHTML = html;
}

function rowCells(a) {
  const dot = a.status_err ? '<span class="text-amber-400">⚠</span>' :
              (a.spend > 0 ? '<span class="text-emerald-400">●</span>' : '<span class="text-slate-600">○</span>');
  const purCls = a.db_purchases > 0 ? 'font-bold text-emerald-300' : 'text-slate-500';
  const leadCls = a.db_leads > 0 ? 'font-semibold text-emerald-300' : 'text-slate-500';
  return [
    // Cost
    \`<td class="px-2 py-1.5 text-right"><span class="text-slate-500 text-[10px]">\${a.ccy || ""}</span> \${fmtM(a.spend)}</td>\`,
    \`<td class="px-2 py-1.5 text-right text-slate-400">€\${fmtM(a.spend_eur)}</td>\`,
    // Outcome (DB)
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${leadCls}">\${a.db_leads || 0}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 text-slate-400">\${a.db_cpl ? "€" + fmtM(a.db_cpl) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${purCls}">\${a.db_purchases || 0}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${a.db_revenue_eur > 0 ? 'font-semibold text-emerald-300' : 'text-slate-500'}">€\${fmtM(a.db_revenue_eur)}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10">\${roasBadge(a.spend_eur, a.db_purchases, a.db_roas)}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 border-r border-slate-700">\${profitText(a.profit_eur)}</td>\`,
    // Funnel
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.impressions)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.ctr ? a.ctr.toFixed(2) + "%" : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.landing_views)}</td>\`,
    // Video
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.v_3s)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.hook_rate != null ? fmtP(a.hook_rate) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.hold_rate != null ? fmtP(a.hold_rate) : "—"}</td>\`,
    // Meta Pixel
    \`<td class="px-2 py-1.5 text-right text-slate-500" title="Meta pixel Lead event (may not fire)">\${fmtN(a.leads)}</td>\`,
    \`<td class="px-2 py-1.5 text-right text-slate-500">\${fmtN(a.initiated_checkout)}</td>\`,
    \`<td class="px-2 py-1.5 text-right \${a.purchases > 0 ? 'text-emerald-400' : 'text-slate-500'}" title="Meta pixel attribution (may lag)">\${a.purchases}</td>\`,
    \`<td class="px-2 py-1.5 text-right" title="\${a.status_err || ''}">\${dot}</td>\`,
  ].join("");
}

function renderAccounts(d) {
  // Sort: profitable first (highest profit), then biggest losers, then no-spend last
  const sorted = [...d.accounts].sort((a, b) => {
    const ap = a.spend_eur > 0 ? a.profit_eur : -1e9;
    const bp = b.spend_eur > 0 ? b.profit_eur : -1e9;
    return bp - ap;
  });
  document.getElementById("accounts-body").innerHTML = sorted.map(a => {
    const tint = roiTint(a.spend_eur, a.db_purchases, a.db_roas);
    return \`<tr class="border-t border-slate-800/50 row-clickable \${tint}" onclick="drilldown('\${a.account_id}', '\${a.name.replace(/'/g, "\\\\'")}')" >
      <td class="px-2 py-1.5 font-medium">\${a.name}</td>
      \${rowCells(a)}
    </tr>\`;
  }).join("");

  // Totals
  const totals = sorted.reduce((acc, x) => {
    acc.spend_eur += x.spend_eur || 0;
    acc.impressions += x.impressions || 0;
    acc.link_clicks += x.link_clicks || 0;
    acc.landing_views += x.landing_views || 0;
    acc.leads += x.leads || 0;
    acc.initiated_checkout += x.initiated_checkout || 0;
    acc.purchases += x.purchases || 0;
    acc.db_leads += x.db_leads || 0;
    acc.db_purchases += x.db_purchases || 0;
    acc.db_revenue_eur += x.db_revenue_eur || 0;
    acc.v_3s += x.v_3s || 0;
    acc.v_thruplay += x.v_thruplay || 0;
    return acc;
  }, { spend_eur: 0, impressions: 0, link_clicks: 0, landing_views: 0, leads: 0, initiated_checkout: 0, purchases: 0, db_leads: 0, db_purchases: 0, db_revenue_eur: 0, v_3s: 0, v_thruplay: 0 });
  const tRoas = totals.spend_eur > 0 ? totals.db_revenue_eur / totals.spend_eur : null;
  const tCpl = totals.db_leads > 0 ? totals.spend_eur / totals.db_leads : null;
  const tProfit = totals.db_revenue_eur - totals.spend_eur;
  const tCtr = totals.impressions > 0 ? (totals.link_clicks / totals.impressions) * 100 : 0;
  const tHook = totals.impressions > 0 ? totals.v_3s / totals.impressions : null;
  const tHold = totals.v_3s > 0 ? totals.v_thruplay / totals.v_3s : null;
  document.getElementById("totals-row").innerHTML = \`
    <td class="px-2 py-2">TOTAL</td>
    <td class="px-2 py-2 text-right text-slate-500">—</td>
    <td class="px-2 py-2 text-right">€\${fmtM(totals.spend_eur)}</td>
    <td class="px-2 py-2 text-right bg-emerald-900/10 font-bold text-emerald-300">\${totals.db_leads}</td>
    <td class="px-2 py-2 text-right bg-emerald-900/10">\${tCpl ? "€" + fmtM(tCpl) : "—"}</td>
    <td class="px-2 py-2 text-right bg-emerald-900/10 font-bold text-emerald-300">\${totals.db_purchases}</td>
    <td class="px-2 py-2 text-right bg-emerald-900/10 font-semibold text-emerald-300">€\${fmtM(totals.db_revenue_eur)}</td>
    <td class="px-2 py-2 text-right bg-emerald-900/10">\${roasBadge(totals.spend_eur, totals.db_purchases, tRoas)}</td>
    <td class="px-2 py-2 text-right bg-emerald-900/10 border-r border-slate-700">\${profitText(tProfit)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.impressions)}</td>
    <td class="px-2 py-2 text-right">\${tCtr.toFixed(2)}%</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.landing_views)}</td>
    <td class="px-2 py-2 text-right">\${fmtN(totals.v_3s)}</td>
    <td class="px-2 py-2 text-right">\${tHook != null ? fmtP(tHook) : "—"}</td>
    <td class="px-2 py-2 text-right">\${tHold != null ? fmtP(tHold) : "—"}</td>
    <td class="px-2 py-2 text-right text-slate-500">\${fmtN(totals.leads)}</td>
    <td class="px-2 py-2 text-right text-slate-500">\${fmtN(totals.initiated_checkout)}</td>
    <td class="px-2 py-2 text-right \${totals.purchases > 0 ? 'text-emerald-400' : 'text-slate-500'}">\${totals.purchases}</td>
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
  // Sort campaigns by profit desc; no-spend last
  const byProfit = (x, y) => {
    const xp = x.spend_eur > 0 ? (x.profit_eur ?? -1e9) : -2e9;
    const yp = y.spend_eur > 0 ? (y.profit_eur ?? -1e9) : -2e9;
    return yp - xp;
  };
  const sortedCamps = [...d.campaigns].sort(byProfit);
  for (const c of sortedCamps) {
    const cTint = roiTint(c.spend_eur, c.db_purchases, c.db_roas);
    html += \`<details open class="mb-2 bg-slate-800/40 rounded p-2 \${cTint}">
      <summary class="flex items-center gap-3 text-sm font-semibold">
        <span class="text-indigo-400">▸</span>
        <span class="flex-1 truncate">\${c.campaign_name}</span>
        <span class="text-slate-400 text-xs">spend €\${fmtM(c.spend_eur)}</span>
        <span class="text-emerald-300 text-xs">rev €\${fmtM(c.db_revenue_eur)}</span>
        <span class="text-xs">\${profitText(c.profit_eur)}</span>
        \${roasBadge(c.spend_eur, c.db_purchases, c.db_roas)}
        <span class="text-xs text-slate-400">\${c.db_leads} lead · \${c.db_purchases} pur · CPL \${c.db_cpl ? "€" + fmtM(c.db_cpl) : "—"}</span>
      </summary>
      <div class="ml-6 mt-2 space-y-1">\`;
    const sortedAdsets = [...c.adsets].sort(byProfit);
    for (const a of sortedAdsets) {
      const aTint = roiTint(a.spend_eur, a.db_purchases, a.db_roas);
      html += \`<details class="bg-slate-800/40 rounded p-2 \${aTint}">
        <summary class="flex items-center gap-3 text-xs">
          <span class="text-indigo-400">▸</span>
          <span class="flex-1 truncate">\${a.adset_name}</span>
          <span class="text-slate-400">spend €\${fmtM(a.spend_eur)}</span>
          <span class="text-emerald-300">rev €\${fmtM(a.db_revenue_eur)}</span>
          \${profitText(a.profit_eur)}
          \${roasBadge(a.spend_eur, a.db_purchases, a.db_roas)}
          <span class="text-slate-400">\${a.db_leads} lead · \${a.db_purchases} pur · CPL \${a.db_cpl ? "€" + fmtM(a.db_cpl) : "—"} · CTR \${a.ctr ? a.ctr.toFixed(2) + "%" : "—"} · hook \${a.hook_rate != null ? fmtP(a.hook_rate) : "—"}</span>
        </summary>
        <div class="ml-6 mt-1 space-y-1">\`;
      for (const ad of a.ads.sort(byProfit)) {
        const adTint = roiTint(ad.spend_eur, ad.db_purchases, ad.db_roas);
        html += \`<div class="text-xs grid grid-cols-12 gap-2 items-center py-0.5 px-1 border-l border-slate-700 \${adTint}">
          <span class="col-span-5 truncate text-slate-300" title="\${ad.ad_name}">\${ad.ad_name}</span>
          <span class="col-span-1 text-right text-slate-500">€\${fmtM(ad.spend_eur)}</span>
          <span class="col-span-1 text-right text-emerald-300">€\${fmtM(ad.db_revenue_eur)}</span>
          <span class="col-span-1 text-right">\${profitText(ad.profit_eur)}</span>
          <span class="col-span-1 text-right">\${roasBadge(ad.spend_eur, ad.db_purchases, ad.db_roas)}</span>
          <span class="col-span-1 text-right text-slate-400">\${ad.db_leads}L · \${ad.db_purchases}P</span>
          <span class="col-span-2 text-right text-slate-500 text-[10px]">CTR \${ad.ctr ? ad.ctr.toFixed(2) + "%" : "—"} · hook \${ad.hook_rate != null ? fmtP(ad.hook_rate) : "—"}</span>
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
  const recent = (l.recent_leads || []).slice(0, 15).map(r => {
    const status = r.purchased
      ? '<span class="text-emerald-400 font-semibold">✓ paid</span>'
      : '<span class="text-amber-400">lead</span>';
    const campaign = r.utm_campaign || '<span class="text-slate-600">—</span>';
    const adRef = r.fb_ad_id
      ? \`<a class="text-indigo-400 hover:underline" target="_blank" href="https://www.facebook.com/adsmanager/manage/ads?selected_ad_ids=\${r.fb_ad_id}">ad \${r.fb_ad_id.slice(-6)}</a>\`
      : (r.utm_content ? \`<span class="text-slate-500">\${r.utm_content.slice(0, 20)}</span>\` : '');
    const dt = new Date(r.created_at).toLocaleString('en-GB', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    return \`<div class="grid grid-cols-12 gap-2 text-[11px] py-1 border-b border-slate-800/40 items-center">
      <span class="col-span-3 truncate text-slate-300" title="\${r.email}">\${r.email}</span>
      <span class="col-span-1">\${status}</span>
      <span class="col-span-1 text-slate-500">\${r.hero_variant || '—'}</span>
      <span class="col-span-3 truncate text-slate-400" title="\${campaign}">\${campaign}</span>
      <span class="col-span-2 truncate">\${adRef}</span>
      <span class="col-span-2 text-right text-slate-500 text-[10px]">\${dt}</span>
    </div>\`;
  }).join("");
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
    <div class="text-[10px] uppercase text-slate-500 mb-1">Recent leads (source)</div>
    <div class="mb-3">
      <div class="grid grid-cols-12 gap-2 text-[9px] uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-800">
        <span class="col-span-3">email</span>
        <span class="col-span-1">status</span>
        <span class="col-span-1">hero</span>
        <span class="col-span-3">campaign</span>
        <span class="col-span-2">ad</span>
        <span class="col-span-2 text-right">when</span>
      </div>
      \${recent || '<div class="text-xs text-slate-500 py-2">no leads</div>'}
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
