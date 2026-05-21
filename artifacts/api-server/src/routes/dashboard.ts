import { Router, type IRouter, type Request, type Response } from "express";
import { fetchAllAccounts, fetchLeadStats, fetchStripeRevenue, fetchAccountBreakdown, fetchAttribution, fetchAllAdsFlat, fetchAllCampaignsFlat, fetchAllAdsetsFlat } from "../dashboardData";

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

// ─── CSV export — Excel-compatible (UTF-8 BOM + comma separator) ─────────────
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map(h => csvEscape(r[h])).join(","));
  // UTF-8 BOM so Excel detects encoding
  return "﻿" + lines.join("\r\n");
}
function expandRow(r: Record<string, unknown>): Record<string, unknown> {
  // Add computed fields useful for the spreadsheet
  const spend_eur = Number(r.spend_eur ?? 0);
  const imp = Number(r.impressions ?? 0);
  const lc = Number(r.link_clicks ?? 0);
  const lpv = Number(r.landing_views ?? 0);
  const v_3s = Number(r.v_3s ?? 0);
  const v_thruplay = Number(r.v_thruplay ?? 0);
  return {
    ...r,
    ctr_link_pct: imp > 0 ? +(lc / imp * 100).toFixed(2) : 0,
    cost_per_link_click: lc > 0 ? +(spend_eur / lc).toFixed(4) : "",
    hook_pct: imp > 0 ? +(v_3s / imp * 100).toFixed(2) : 0,
    hold_pct: v_3s > 0 ? +(v_thruplay / v_3s * 100).toFixed(2) : 0,
  };
}
async function csvForLevel(req: Request, res: Response, level: "ad" | "adset" | "campaign") {
  if (!isAuthorized(req)) { res.status(403).send("Forbidden"); return; }
  const preset = (req.query.preset as string) || "last_72h";
  try {
    const attribution = await fetchAttribution(preset);
    let rows: Record<string, unknown>[];
    let baseCols: string[];
    if (level === "ad") {
      rows = (await fetchAllAdsFlat(preset, attribution)) as unknown as Record<string, unknown>[];
      baseCols = ["account_name", "campaign_name", "adset_name", "ad_name", "ad_id", "effective_status"];
    } else if (level === "adset") {
      rows = (await fetchAllAdsetsFlat(preset, attribution)) as unknown as Record<string, unknown>[];
      baseCols = ["account_name", "campaign_name", "adset_name", "adset_id", "effective_status", "ad_count", "ads_active", "ads_delivering"];
    } else {
      rows = (await fetchAllCampaignsFlat(preset, attribution)) as unknown as Record<string, unknown>[];
      baseCols = ["account_name", "campaign_name", "campaign_id", "effective_status", "adset_count", "ad_count", "ads_delivering"];
    }
    const metricCols = [
      "ccy", "spend", "spend_eur",
      "impressions", "reach", "frequency",
      "clicks", "link_clicks", "ctr", "ctr_link_pct",
      "cpc", "cost_per_link_click", "cpm",
      "landing_views", "cost_per_lpv",
      "v_3s", "v_thruplay", "hook_pct", "hold_pct",
      "leads", "initiated_checkout", "purchases", "purchase_value",
      "db_leads", "db_purchases", "db_revenue_eur", "db_roas", "db_cpa", "db_cpl", "profit_eur",
    ];
    const headers = [...baseCols, ...metricCols];
    const expanded = rows.map(expandRow);
    const csv = toCsv(headers, expanded);
    const filename = `sleep-${level}s-${preset}-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) { res.status(500).send(`error: ${(e as Error).message}`); }
}
router.get("/admin/dashboard/ads/export",       (req, res) => { void csvForLevel(req, res, "ad"); });
router.get("/admin/dashboard/adsets/export",    (req, res) => { void csvForLevel(req, res, "adset"); });
router.get("/admin/dashboard/campaigns/export", (req, res) => { void csvForLevel(req, res, "campaign"); });

router.get("/admin/dashboard/ads-data", async (req, res) => {
  if (!isAuthorized(req)) return res.status(403).json({ error: "Forbidden" });
  const preset = (req.query.preset as string) || "last_72h";
  try {
    const attribution = await fetchAttribution(preset);
    const ads = await fetchAllAdsFlat(preset, attribution);
    res.json({ generated_at: new Date().toISOString(), preset, ads });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get("/admin/dashboard/ads", (req, res) => {
  if (!isAuthorized(req)) return res.status(403).send("Forbidden — pass ?key=<DASHBOARD_SECRET>");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderFlatDashboard(req.query.key as string, "ad"));
});

router.get("/admin/dashboard/campaigns-data", async (req, res) => {
  if (!isAuthorized(req)) return res.status(403).json({ error: "Forbidden" });
  const preset = (req.query.preset as string) || "last_72h";
  try {
    const attribution = await fetchAttribution(preset);
    const rows = await fetchAllCampaignsFlat(preset, attribution);
    res.json({ generated_at: new Date().toISOString(), preset, rows });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get("/admin/dashboard/campaigns", (req, res) => {
  if (!isAuthorized(req)) return res.status(403).send("Forbidden — pass ?key=<DASHBOARD_SECRET>");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderFlatDashboard(req.query.key as string, "campaign"));
});

router.get("/admin/dashboard/adsets-data", async (req, res) => {
  if (!isAuthorized(req)) return res.status(403).json({ error: "Forbidden" });
  const preset = (req.query.preset as string) || "last_72h";
  try {
    const attribution = await fetchAttribution(preset);
    const rows = await fetchAllAdsetsFlat(preset, attribution);
    res.json({ generated_at: new Date().toISOString(), preset, rows });
  } catch (e) { res.status(500).json({ error: (e as Error).message }); }
});

router.get("/admin/dashboard/adsets", (req, res) => {
  if (!isAuthorized(req)) return res.status(403).send("Forbidden — pass ?key=<DASHBOARD_SECRET>");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(renderFlatDashboard(req.query.key as string, "adset"));
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
      <div class="inline-flex rounded border border-slate-700 overflow-hidden text-xs">
        <span class="px-3 py-1.5 bg-indigo-600 text-white font-semibold">By Account</span>
        <a id="link-camp" href="#" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300">By Campaign</a>
        <a id="link-adset" href="#" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300">By Ad Set</a>
        <a id="link-ads" href="#" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300">By Ad</a>
      </div>
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

  <!-- Ads health summary (live) + Page comparison -->
  <div id="ads-health-section" class="grid lg:grid-cols-2 gap-4 mb-5">
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800">
        <h2 class="font-semibold text-sm">Ads Health (live, all accounts)</h2>
      </div>
      <div id="ads-health" class="p-4"></div>
    </div>
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800">
        <h2 class="font-semibold text-sm">By Page — Cognitive Shutdown vs Sleep Wired</h2>
      </div>
      <div id="by-page" class="p-4"></div>
    </div>
  </div>

  <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-5">
    <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
      <h2 class="font-semibold text-sm">Ad Accounts <span class="text-xs text-slate-500 font-normal">(click row to drilldown campaigns→adsets→ads)</span></h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs num">
        <thead>
          <tr class="bg-slate-800/70 text-[9px] uppercase text-slate-400 tracking-wider border-b border-slate-700">
            <th class="text-left px-2 py-1.5"></th>
            <th class="text-center px-2 py-1.5 border-x border-slate-700" colspan="3">Ads status</th>
            <th class="text-right px-2 py-1.5" colspan="4">Cost</th>
            <th class="text-right px-2 py-1.5 bg-emerald-900/20 border-x border-slate-700" colspan="7">Outcome (DB-attributed)</th>
            <th class="text-right px-2 py-1.5" colspan="6">Funnel</th>
            <th class="text-right px-2 py-1.5" colspan="3">Video</th>
            <th class="text-right px-2 py-1.5" colspan="3">Meta Pixel</th>
            <th></th>
          </tr>
          <tr class="bg-slate-800/50 text-[10px] uppercase text-slate-400 tracking-wider">
            <th class="text-left px-2 py-2">Account</th>
            <th class="text-center px-2 py-2 border-l border-slate-700" title="ACTIVE delivering today / total ACTIVE">Deliv</th>
            <th class="text-center px-2 py-2" title="ACTIVE but 0 impressions today">Throttled</th>
            <th class="text-center px-2 py-2 border-r border-slate-700" title="Page distribution: Cognitive Shutdown / Sleep Wired">CSM/SW</th>
            <th class="text-right px-2 py-2">Spend</th>
            <th class="text-right px-2 py-2">€</th>
            <th class="text-right px-2 py-2" title="Cost per 1000 impressions">CPM</th>
            <th class="text-right px-2 py-2" title="Cost per link click">CPC</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">Lead</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">CPL</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300" title="Pur / Lead">L→P%</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">Pur</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">Rev €</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300">ROAS</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 font-bold text-emerald-300 border-r border-slate-700">Profit</th>
            <th class="text-right px-2 py-2">Impr</th>
            <th class="text-right px-2 py-2">Reach</th>
            <th class="text-right px-2 py-2" title="Avg times same user saw the ad">Freq</th>
            <th class="text-right px-2 py-2">CTR</th>
            <th class="text-right px-2 py-2">LPV</th>
            <th class="text-right px-2 py-2" title="Cost per landing page view">CPLPV</th>
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
function statusPill(s) {
  if (!s) return '<span class="text-slate-600">—</span>';
  const map = {
    ACTIVE:           ['bg-emerald-500/20 text-emerald-300', 'ACTIVE'],
    PAUSED:           ['bg-slate-500/20 text-slate-400',     'PAUSED'],
    CAMPAIGN_PAUSED:  ['bg-orange-500/20 text-orange-300',   'CAMP·PSE'],
    ADSET_PAUSED:     ['bg-orange-500/20 text-orange-300',   'AS·PSE'],
    DELETED:          ['bg-slate-700/30 text-slate-500',     'DEL'],
    ARCHIVED:         ['bg-slate-700/30 text-slate-500',     'ARCH'],
    IN_PROCESS:       ['bg-blue-500/20 text-blue-300',       'REVIEW'],
    PENDING_REVIEW:   ['bg-blue-500/20 text-blue-300',       'PENDING'],
    DISAPPROVED:      ['bg-red-500/20 text-red-300',         'DISAPP'],
    WITH_ISSUES:      ['bg-red-500/20 text-red-300',         'ISSUES'],
    PENDING_BILLING_INFO: ['bg-amber-500/20 text-amber-300', 'BILLING'],
    UNKNOWN:          ['bg-slate-500/20 text-slate-400',     '?'],
  };
  const e = map[s] || ['bg-slate-500/20 text-slate-400', s];
  return '<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ' + e[0] + '" title="' + s + '">' + e[1] + '</span>';
}

let autoTimer = null;

async function load() {
  document.getElementById("meta").textContent = "Loading…";
  const preset = document.getElementById("preset").value;
  const r = await fetch("/admin/dashboard/data?preset=" + preset + "&key=" + encodeURIComponent(KEY));
  if (!r.ok) { document.getElementById("meta").textContent = "Error: " + r.status; return; }
  const d = await r.json();
  renderTotals(d); renderAdsHealth(d); renderByPage(d); renderAccounts(d); renderLeads(d); renderStripe(d);
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

function renderAdsHealth(d) {
  const a = d.accounts;
  const active = a.reduce((s, x) => s + (x.ads_active || 0), 0);
  const deliv = a.reduce((s, x) => s + (x.ads_delivering || 0), 0);
  const throttled = a.reduce((s, x) => s + (x.ads_throttled || 0), 0);
  const inReview = a.reduce((s, x) => s + (x.ads_in_review || 0), 0);
  const disapproved = a.reduce((s, x) => s + (x.ads_disapproved || 0), 0);
  const delivPct = active > 0 ? (deliv / active) * 100 : 0;
  const barCls = delivPct >= 70 ? 'bg-emerald-500' : delivPct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const html = \`
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-400">Delivering today</div>
        <div class="text-2xl font-bold num \${deliv > 0 ? 'text-emerald-300' : 'text-slate-400'}">\${deliv} <span class="text-sm text-slate-500">/ \${active}</span></div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-wider text-slate-400">Throttled</div>
        <div class="text-2xl font-bold num \${throttled > 0 ? 'text-amber-400' : 'text-slate-500'}">\${throttled}</div>
      </div>
    </div>
    <div class="w-full h-2 bg-slate-800 rounded overflow-hidden mb-3">
      <div class="\${barCls} h-2" style="width:\${delivPct.toFixed(1)}%"></div>
    </div>
    <div class="text-[11px] text-slate-400 leading-relaxed">
      <span class="text-emerald-300 font-semibold">●</span> \${deliv} delivering ·
      <span class="text-amber-400 font-semibold">●</span> \${throttled} throttled (ACTIVE 0 impr)
      \${inReview > 0 ? '· <span class="text-blue-400 font-semibold">⏳</span> ' + inReview + ' in review' : ''}
      \${disapproved > 0 ? '· <span class="text-red-400 font-semibold">✕</span> ' + disapproved + ' with issues' : ''}
    </div>
    <div class="text-[10px] text-slate-500 mt-1">Delivery rate: <b>\${delivPct.toFixed(1)}%</b> · target ≥70%</div>\`;
  document.getElementById("ads-health").innerHTML = html;
}

function renderByPage(d) {
  const a = d.accounts;
  const csm = a.reduce((s, x) => s + (x.ads_on_csm || 0), 0);
  const sw = a.reduce((s, x) => s + (x.ads_on_sleep || 0), 0);
  const other = a.reduce((s, x) => s + (x.ads_on_other || 0), 0);
  const total = csm + sw + other;
  const pct = (n) => total > 0 ? (n / total) * 100 : 0;
  const csmPct = pct(csm), swPct = pct(sw), otherPct = pct(other);
  const html = \`
    <div class="space-y-3">
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="text-cyan-300 font-semibold">Cognitive Shutdown (nova)</span>
          <span class="text-slate-300 num">\${csm} <span class="text-slate-500">(\${csmPct.toFixed(0)}%)</span></span>
        </div>
        <div class="w-full h-2 bg-slate-800 rounded overflow-hidden">
          <div class="bg-cyan-500 h-2" style="width:\${csmPct.toFixed(1)}%"></div>
        </div>
      </div>
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="text-purple-300 font-semibold">Sleep Wired (legacy)</span>
          <span class="text-slate-300 num">\${sw} <span class="text-slate-500">(\${swPct.toFixed(0)}%)</span></span>
        </div>
        <div class="w-full h-2 bg-slate-800 rounded overflow-hidden">
          <div class="bg-purple-500 h-2" style="width:\${swPct.toFixed(1)}%"></div>
        </div>
      </div>
      \${other > 0 ? \`
      <div>
        <div class="flex justify-between text-xs mb-1">
          <span class="text-amber-300 font-semibold">Other pages (legacy)</span>
          <span class="text-slate-300 num">\${other} <span class="text-slate-500">(\${otherPct.toFixed(0)}%)</span></span>
        </div>
        <div class="w-full h-2 bg-slate-800 rounded overflow-hidden">
          <div class="bg-amber-500 h-2" style="width:\${otherPct.toFixed(1)}%"></div>
        </div>
      </div>\` : ''}
    </div>
    <div class="text-[10px] text-slate-500 mt-3 leading-relaxed">
      ACTIVE ads only. Migration target: maximize Cognitive Shutdown share (sai do Page Volume Limit da Sleep Wired).
    </div>\`;
  document.getElementById("by-page").innerHTML = html;
}

function rowCells(a) {
  const dot = a.status_err ? '<span class="text-amber-400">⚠</span>' :
              (a.spend > 0 ? '<span class="text-emerald-400">●</span>' : '<span class="text-slate-600">○</span>');
  const purCls = a.db_purchases > 0 ? 'font-bold text-emerald-300' : 'text-slate-500';
  const leadCls = a.db_leads > 0 ? 'font-semibold text-emerald-300' : 'text-slate-500';
  // Ads status cells
  const deliv = a.ads_active > 0
    ? \`<span class="\${a.ads_delivering > 0 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}">\${a.ads_delivering}/\${a.ads_active}</span>\`
    : '<span class="text-slate-600">—</span>';
  const throttled = a.ads_throttled > 0
    ? \`<span class="text-amber-400">\${a.ads_throttled}</span>\`
    : '<span class="text-slate-600">0</span>';
  let extraStatus = '';
  if (a.ads_in_review > 0) extraStatus += \` <span class="text-blue-400" title="In review">⏳\${a.ads_in_review}</span>\`;
  if (a.ads_disapproved > 0) extraStatus += \` <span class="text-red-400" title="Disapproved">✕\${a.ads_disapproved}</span>\`;
  // Page split: CSM / Sleep / other
  const csmCls = a.ads_on_csm > 0 ? 'text-cyan-300' : 'text-slate-600';
  const swCls = a.ads_on_sleep > 0 ? 'text-purple-300' : 'text-slate-600';
  const otherTag = a.ads_on_other > 0 ? \` <span class="text-amber-400" title="On other page">+\${a.ads_on_other}</span>\` : '';
  const pageSplit = \`<span class="\${csmCls}">\${a.ads_on_csm}</span>/<span class="\${swCls}">\${a.ads_on_sleep}</span>\${otherTag}\`;
  const l2p = (a.db_leads > 0) ? (a.db_purchases / a.db_leads * 100) : null;
  const l2pCls = l2p != null && l2p >= 5 ? 'text-emerald-300 font-semibold' : 'text-slate-500';
  return [
    \`<td class="px-2 py-1.5 text-center border-l border-slate-700">\${deliv}\${extraStatus}</td>\`,
    \`<td class="px-2 py-1.5 text-center">\${throttled}</td>\`,
    \`<td class="px-2 py-1.5 text-center text-[10px] border-r border-slate-700">\${pageSplit}</td>\`,
    // Cost
    \`<td class="px-2 py-1.5 text-right"><span class="text-slate-500 text-[10px]">\${a.ccy || ""}</span> \${fmtM(a.spend)}</td>\`,
    \`<td class="px-2 py-1.5 text-right text-slate-400">€\${fmtM(a.spend_eur)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.cpm ? "€" + fmtM(a.cpm) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.cpc ? "€" + fmtM(a.cpc) : "—"}</td>\`,
    // Outcome (DB)
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${leadCls}">\${a.db_leads || 0}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 text-slate-400">\${a.db_cpl ? "€" + fmtM(a.db_cpl) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${l2pCls}">\${l2p != null ? l2p.toFixed(0) + "%" : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${purCls}">\${a.db_purchases || 0}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 \${a.db_revenue_eur > 0 ? 'font-semibold text-emerald-300' : 'text-slate-500'}">€\${fmtM(a.db_revenue_eur)}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10">\${roasBadge(a.spend_eur, a.db_purchases, a.db_roas)}</td>\`,
    \`<td class="px-2 py-1.5 text-right bg-emerald-900/10 border-r border-slate-700">\${profitText(a.profit_eur)}</td>\`,
    // Funnel
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.impressions)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.reach)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.frequency ? a.frequency.toFixed(2) : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.ctr ? a.ctr.toFixed(2) + "%" : "—"}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${fmtN(a.landing_views)}</td>\`,
    \`<td class="px-2 py-1.5 text-right">\${a.cost_per_lpv != null ? "€" + fmtM(a.cost_per_lpv) : "—"}</td>\`,
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
    acc.ads_active += x.ads_active || 0;
    acc.ads_delivering += x.ads_delivering || 0;
    acc.ads_throttled += x.ads_throttled || 0;
    acc.ads_on_csm += x.ads_on_csm || 0;
    acc.ads_on_sleep += x.ads_on_sleep || 0;
    return acc;
  }, { spend_eur: 0, impressions: 0, link_clicks: 0, landing_views: 0, leads: 0, initiated_checkout: 0, purchases: 0, db_leads: 0, db_purchases: 0, db_revenue_eur: 0, v_3s: 0, v_thruplay: 0, ads_active: 0, ads_delivering: 0, ads_throttled: 0, ads_on_csm: 0, ads_on_sleep: 0 });
  const tRoas = totals.spend_eur > 0 ? totals.db_revenue_eur / totals.spend_eur : null;
  const tCpl = totals.db_leads > 0 ? totals.spend_eur / totals.db_leads : null;
  const tProfit = totals.db_revenue_eur - totals.spend_eur;
  const tCtr = totals.impressions > 0 ? (totals.link_clicks / totals.impressions) * 100 : 0;
  const tHook = totals.impressions > 0 ? totals.v_3s / totals.impressions : null;
  const tHold = totals.v_3s > 0 ? totals.v_thruplay / totals.v_3s : null;
  document.getElementById("totals-row").innerHTML = \`
    <td class="px-2 py-2">TOTAL</td>
    <td class="px-2 py-2 text-center border-l border-slate-700 font-semibold \${totals.ads_delivering > 0 ? 'text-emerald-300' : 'text-slate-500'}">\${totals.ads_delivering}/\${totals.ads_active}</td>
    <td class="px-2 py-2 text-center font-semibold \${totals.ads_throttled > 0 ? 'text-amber-400' : 'text-slate-500'}">\${totals.ads_throttled}</td>
    <td class="px-2 py-2 text-center text-[10px] border-r border-slate-700"><span class="text-cyan-300 font-semibold">\${totals.ads_on_csm}</span>/<span class="text-purple-300 font-semibold">\${totals.ads_on_sleep}</span></td>
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
        \${statusPill(c.effective_status)}
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
          \${statusPill(a.effective_status)}
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
          <span class="col-span-4 truncate text-slate-300" title="\${ad.ad_name}">\${ad.ad_name}</span>
          <span class="col-span-1 text-center">\${statusPill(ad.effective_status)}</span>
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

function syncNavLinks() {
  const p = document.getElementById("preset").value;
  const k = encodeURIComponent(KEY);
  document.getElementById("link-ads").href = "/admin/dashboard/ads?preset=" + p + "&key=" + k;
  document.getElementById("link-camp").href = "/admin/dashboard/campaigns?preset=" + p + "&key=" + k;
  document.getElementById("link-adset").href = "/admin/dashboard/adsets?preset=" + p + "&key=" + k;
}
document.getElementById("refresh").addEventListener("click", load);
document.getElementById("preset").addEventListener("change", () => { syncNavLinks(); load(); });
syncNavLinks();
document.getElementById("autorefresh").addEventListener("change", (e) => {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  if (e.target.checked) { autoTimer = setInterval(load, 60000); }
});
load();
</script>
</body>
</html>`;
}

type DashLevel = "ad" | "adset" | "campaign";
const LEVEL_CONFIG: Record<DashLevel, {
  title: string;
  endpoint: string;
  dataKey: string;
  primaryName: string;
  primaryId: string;
  subName?: string;
  extraCols: { label: string; field: string; align?: "left" | "right" }[];
  adsManagerSelector: string; // 'selected_ad_ids' | 'selected_campaign_ids' | 'selected_adset_ids'
}> = {
  ad: {
    title: "By Ad",
    endpoint: "/admin/dashboard/ads-data",
    dataKey: "ads",
    primaryName: "ad_name",
    primaryId: "ad_id",
    subName: "adset_name",
    extraCols: [{ label: "Campaign", field: "campaign_name" }],
    adsManagerSelector: "selected_ad_ids",
  },
  adset: {
    title: "By Ad Set",
    endpoint: "/admin/dashboard/adsets-data",
    dataKey: "rows",
    primaryName: "adset_name",
    primaryId: "adset_id",
    subName: "campaign_name",
    extraCols: [{ label: "Ads", field: "ad_count", align: "right" }],
    adsManagerSelector: "selected_adset_ids",
  },
  campaign: {
    title: "By Campaign",
    endpoint: "/admin/dashboard/campaigns-data",
    dataKey: "rows",
    primaryName: "campaign_name",
    primaryId: "campaign_id",
    extraCols: [
      { label: "Adsets", field: "adset_count", align: "right" },
      { label: "Ads", field: "ad_count", align: "right" },
    ],
    adsManagerSelector: "selected_campaign_ids",
  },
};

function renderFlatDashboard(key: string, level: DashLevel): string {
  const cfg = LEVEL_CONFIG[level];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Sleep Wired — ${cfg.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }
    .num { font-variant-numeric: tabular-nums; }
    th.sortable { cursor: pointer; user-select: none; }
    th.sortable:hover { background: rgb(51 65 85 / 0.7); }
    th.sortable.active { color: #e0e7ff; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

<div class="max-w-[1900px] mx-auto px-4 py-5">

  <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div>
      <h1 class="text-xl font-bold">Sleep Wired — ${cfg.title}</h1>
      <p id="meta" class="text-xs text-slate-400 mt-1">Loading…</p>
    </div>
    <div class="flex items-center gap-2">
      <div class="inline-flex rounded border border-slate-700 overflow-hidden text-xs">
        ${["By Account|/admin/dashboard|account","By Campaign|/admin/dashboard/campaigns|campaign","By Ad Set|/admin/dashboard/adsets|adset","By Ad|/admin/dashboard/ads|ad"].map(s=>{const [lbl,path,lv]=s.split("|");const active=lv===level;return active?`<span class="px-3 py-1.5 bg-indigo-600 text-white font-semibold">${lbl}</span>`:`<a href="${path}?key=__KEY__" class="nav-link px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300">${lbl}</a>`}).join("")}
      </div>
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
      <button id="export-csv" class="bg-emerald-600 hover:bg-emerald-500 rounded px-4 py-1.5 text-sm font-semibold" title="Export current view as CSV (Excel-compatible)">⬇ Export CSV</button>
      <button id="refresh" class="bg-indigo-600 hover:bg-indigo-500 rounded px-4 py-1.5 text-sm font-semibold">Refresh</button>
    </div>
  </div>

  <!-- Totals -->
  <div id="totals" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4"></div>

  <!-- Filters -->
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-4 flex flex-wrap gap-3 items-center text-xs">
    <input id="search" type="text" placeholder="Search ad / campaign / adset" class="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 flex-1 min-w-[200px]" />
    <select id="f-account" class="bg-slate-800 border border-slate-700 rounded px-2 py-1.5">
      <option value="">All accounts</option>
    </select>
    <select id="f-spend" class="bg-slate-800 border border-slate-700 rounded px-2 py-1.5">
      <option value="any">Any spend</option>
      <option value="delivering" selected>Spend &gt; 0 (delivering)</option>
      <option value="purchasing">With purchases (DB)</option>
    </select>
    <select id="f-status" class="bg-slate-800 border border-slate-700 rounded px-2 py-1.5" title="Filter by effective_status">
      <option value="">All statuses</option>
      <option value="ACTIVE">Only ACTIVE</option>
      <option value="PAUSED_ANY">Any paused</option>
      <option value="ISSUES">Review / Disapproved</option>
    </select>
    <label class="flex items-center gap-1 text-slate-400">
      <input type="checkbox" id="f-zero" class="accent-indigo-500" /> Hide zero spend
    </label>
    <span class="text-slate-500 text-[10px] ml-auto"><span id="row-count">0</span> ads</span>
  </div>

  <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-xs num">
        <thead>
          <tr class="bg-slate-800/70 text-[10px] uppercase text-slate-400 tracking-wider border-b border-slate-700">
            <th class="text-left px-2 py-2 sortable" data-sort="account_name">Acct</th>
            <th class="text-left px-2 py-2 sortable min-w-[180px]" data-sort="${cfg.primaryName}">${cfg.title.replace("By ","")}</th>
            ${cfg.extraCols.map(c=>`<th class="text-${c.align||"left"} px-2 py-2 sortable ${c.align==="right"?"":"min-w-[140px]"}" data-sort="${c.field}">${c.label}</th>`).join("")}
            <th class="text-center px-2 py-2 sortable" data-sort="effective_status" title="Meta effective_status (live)">Status</th>
            ${level !== "ad" ? '<th class="text-right px-2 py-2 sortable" data-sort="deliv_pct" title="ads delivering / total active">%Deliv</th>' : '<th class="text-center px-2 py-2" title="● delivering ◌ throttled">St</th>'}
            <th class="text-right px-2 py-2 sortable" data-sort="spend_eur">Spend €</th>
            <th class="text-right px-2 py-2 sortable" data-sort="cpm" title="Cost per 1000 impressions — account-friendship proxy">CPM</th>
            <th class="text-right px-2 py-2 sortable" data-sort="cpc" title="Cost per link click">CPC</th>
            <th class="text-right px-2 py-2 sortable" data-sort="impressions">Impr</th>
            <th class="text-right px-2 py-2 sortable" data-sort="reach">Reach</th>
            <th class="text-right px-2 py-2 sortable" data-sort="frequency" title="Avg times same user saw the ad">Freq</th>
            <th class="text-right px-2 py-2 sortable" data-sort="ctr">CTR</th>
            <th class="text-right px-2 py-2 sortable" data-sort="hook_rate">Hook%</th>
            <th class="text-right px-2 py-2 sortable" data-sort="hold_rate">Hold%</th>
            <th class="text-right px-2 py-2 sortable" data-sort="landing_views">LPV</th>
            <th class="text-right px-2 py-2 sortable" data-sort="cost_per_lpv" title="Cost per landing page view">CPLPV</th>
            <th class="text-right px-2 py-2 sortable" data-sort="initiated_checkout">IC·px</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="db_leads">Lead</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="db_cpl">CPL</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="lead_to_pur" title="DB Purchases / DB Leads">L→P%</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="db_purchases">Pur</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="db_revenue_eur">Rev €</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="db_roas">ROAS</th>
            <th class="text-right px-2 py-2 bg-emerald-900/10 sortable text-emerald-300" data-sort="profit_eur">Profit</th>
            <th class="text-right px-2 py-2"></th>
          </tr>
        </thead>
        <tbody id="ads-body"></tbody>
        <tfoot class="bg-slate-800/30 font-semibold border-t border-slate-700"><tr id="totals-row"></tr></tfoot>
      </table>
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
    Outcome cols (Lead/CPL/Pur/Rev/ROAS/Profit) = DB-attributed via leads.utm_content (ad_id), AOV €27.
    Hook% = 3s plays / impr. Hold% = ThruPlay / 3s. Default sort: Profit desc. Click any header to sort.
  </p>
</div>

<script>
const KEY = ${JSON.stringify(key)};
const LEVEL = ${JSON.stringify({ endpoint: cfg.endpoint, dataKey: cfg.dataKey, primaryName: cfg.primaryName, primaryId: cfg.primaryId, subName: cfg.subName ?? null, extraCols: cfg.extraCols, adsManagerSelector: cfg.adsManagerSelector, title: cfg.title })};
// Fix nav links with KEY
document.querySelectorAll(".nav-link").forEach(a => { a.href = a.getAttribute("href").replace("__KEY__", encodeURIComponent(KEY)); });
const fmtN = (n) => n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtM = (n) => n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n) => n == null || isNaN(n) ? "—" : (Number(n) * 100).toFixed(2) + "%";

function roiTint(spendEur, dbPurchases, dbRoas) {
  if (!spendEur || spendEur <= 0) return "";
  if (!dbPurchases || dbPurchases <= 0) return "bg-red-950/40 border-l-2 border-red-500";
  if (dbRoas == null) return "";
  if (dbRoas >= 2) return "bg-emerald-900/50 border-l-2 border-emerald-400";
  if (dbRoas >= 1) return "bg-emerald-950/40 border-l-2 border-emerald-600";
  return "bg-amber-950/40 border-l-2 border-amber-500";
}
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
// Effective status pill — short, color-coded
function statusPill(s) {
  if (!s) return '<span class="text-slate-600">—</span>';
  const map = {
    ACTIVE:           ['bg-emerald-500/20 text-emerald-300', 'ACTIVE'],
    PAUSED:           ['bg-slate-500/20 text-slate-400',     'PAUSED'],
    CAMPAIGN_PAUSED:  ['bg-orange-500/20 text-orange-300',   'CAMP·PSE'],
    ADSET_PAUSED:     ['bg-orange-500/20 text-orange-300',   'AS·PSE'],
    DELETED:          ['bg-slate-700/30 text-slate-500',     'DEL'],
    ARCHIVED:         ['bg-slate-700/30 text-slate-500',     'ARCH'],
    IN_PROCESS:       ['bg-blue-500/20 text-blue-300',       'REVIEW'],
    PENDING_REVIEW:   ['bg-blue-500/20 text-blue-300',       'PENDING'],
    DISAPPROVED:      ['bg-red-500/20 text-red-300',         'DISAPP'],
    WITH_ISSUES:      ['bg-red-500/20 text-red-300',         'ISSUES'],
    PENDING_BILLING_INFO: ['bg-amber-500/20 text-amber-300', 'BILLING'],
    UNKNOWN:          ['bg-slate-500/20 text-slate-400',     '?'],
  };
  const e = map[s] || ['bg-slate-500/20 text-slate-400', s];
  return '<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold ' + e[0] + '" title="' + s + '">' + e[1] + '</span>';
}

let allAds = [];
let sortCol = "profit_eur";
let sortDir = -1; // -1 desc, 1 asc
let autoTimer = null;

async function load() {
  document.getElementById("meta").textContent = "Loading…";
  const preset = document.getElementById("preset").value;
  const r = await fetch(LEVEL.endpoint + "?preset=" + preset + "&key=" + encodeURIComponent(KEY));
  if (!r.ok) { document.getElementById("meta").textContent = "Error: " + r.status; return; }
  const d = await r.json();
  allAds = (d[LEVEL.dataKey] || []).map(a => {
    const aa = a.ads_active || 0;
    const ad = a.ads_delivering || 0;
    const deliv_pct = aa > 0 ? (ad / aa * 100) : (a.impressions > 0 ? 100 : 0);
    const lead_to_pur = (a.db_leads > 0) ? (a.db_purchases / a.db_leads * 100) : null;
    return { ...a, deliv_pct, lead_to_pur };
  });
  populateAccountFilter(allAds);
  render();
  const dt = new Date(d.generated_at);
  document.getElementById("meta").textContent = "Updated " + dt.toLocaleTimeString() + " · preset=" + d.preset + " · " + allAds.length + " " + LEVEL.title.toLowerCase() + " rows";
}

function populateAccountFilter(ads) {
  const sel = document.getElementById("f-account");
  const current = sel.value;
  const accts = [...new Set(ads.map(a => a.account_name))].sort();
  sel.innerHTML = '<option value="">All accounts (' + accts.length + ')</option>' + accts.map(a => '<option value="' + a + '">' + a + '</option>').join("");
  if (current) sel.value = current;
}

function applyFilters(ads) {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const fAcct = document.getElementById("f-account").value;
  const fSpend = document.getElementById("f-spend").value;
  const fZero = document.getElementById("f-zero").checked;
  const fStatus = document.getElementById("f-status").value;
  return ads.filter(a => {
    if (fAcct && a.account_name !== fAcct) return false;
    if (fSpend === "delivering" && (!a.spend_eur || a.spend_eur <= 0)) return false;
    if (fSpend === "purchasing" && (!a.db_purchases || a.db_purchases <= 0)) return false;
    if (fZero && (!a.spend_eur || a.spend_eur <= 0)) return false;
    if (fStatus) {
      const s = a.effective_status || "";
      if (fStatus === "ACTIVE" && s !== "ACTIVE") return false;
      if (fStatus === "PAUSED_ANY" && !(s === "PAUSED" || s === "CAMPAIGN_PAUSED" || s === "ADSET_PAUSED" || s === "ARCHIVED")) return false;
      if (fStatus === "ISSUES" && !(s === "IN_PROCESS" || s === "PENDING_REVIEW" || s === "DISAPPROVED" || s === "WITH_ISSUES" || s === "PENDING_BILLING_INFO")) return false;
    }
    if (search) {
      const hay = ((a.ad_name||"") + " " + (a.campaign_name||"") + " " + (a.adset_name||"") + " " + (a.account_name||"")).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function sortAds(ads) {
  return [...ads].sort((x, y) => {
    const a = x[sortCol]; const b = y[sortCol];
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    if (typeof a === "string") return a.localeCompare(b) * sortDir;
    return (a - b) * sortDir;
  });
}

function renderTotals(filtered) {
  const sumSpend = filtered.reduce((s, x) => s + (x.spend_eur || 0), 0);
  const sumImpr = filtered.reduce((s, x) => s + (x.impressions || 0), 0);
  const sumClicks = filtered.reduce((s, x) => s + (x.link_clicks || 0), 0);
  const sumLPV = filtered.reduce((s, x) => s + (x.landing_views || 0), 0);
  const sumLead = filtered.reduce((s, x) => s + (x.db_leads || 0), 0);
  const sumPur = filtered.reduce((s, x) => s + (x.db_purchases || 0), 0);
  const sumRev = filtered.reduce((s, x) => s + (x.db_revenue_eur || 0), 0);
  const profit = sumRev - sumSpend;
  const roas = sumSpend > 0 ? sumRev / sumSpend : null;
  const ctr = sumImpr > 0 ? (sumClicks / sumImpr) * 100 : 0;

  const cells = [
    { label: "Ads (filtered)", html: '<div class="text-base font-bold num mt-0.5">' + filtered.length + '</div>' },
    { label: "Spend €", html: '<div class="text-base font-bold num mt-0.5">€' + fmtM(sumSpend) + '</div>' },
    { label: "Revenue €", html: '<div class="text-base font-bold num mt-0.5 ' + (sumRev > 0 ? 'text-emerald-300' : 'text-slate-400') + '">€' + fmtM(sumRev) + '</div>' },
    { label: "ROAS (DB)", html: '<div class="text-base font-bold num mt-0.5">' + (roas != null ? roas.toFixed(2) + 'x' : '—') + '</div>' },
    { label: "Profit", html: '<div class="text-base font-bold num mt-0.5 ' + (profit > 0 ? 'text-emerald-300' : profit < 0 ? 'text-red-400' : 'text-slate-400') + '">' + (profit > 0 ? '+' : '') + '€' + fmtM(profit) + '</div>' },
    { label: "Leads (DB)", html: '<div class="text-base font-bold num mt-0.5 ' + (sumLead > 0 ? 'text-emerald-300' : 'text-slate-400') + '">' + fmtN(sumLead) + '</div>' },
    { label: "Purchases", html: '<div class="text-base font-bold num mt-0.5 ' + (sumPur > 0 ? 'text-emerald-300' : 'text-slate-400') + '">' + sumPur + '</div>' },
  ];
  document.getElementById("totals").innerHTML = cells.map(c =>
    '<div class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"><div class="text-[10px] uppercase tracking-wider text-slate-400">' + c.label + '</div>' + c.html + '</div>'
  ).join("");
}

function render() {
  const filtered = applyFilters(allAds);
  const sorted = sortAds(filtered);
  renderTotals(filtered);
  document.getElementById("row-count").textContent = filtered.length;

  document.querySelectorAll("th.sortable").forEach(th => {
    th.classList.toggle("active", th.dataset.sort === sortCol);
    const base = th.textContent.replace(/[▲▼]\\s*$/, "").trim();
    th.textContent = base + (th.dataset.sort === sortCol ? (sortDir < 0 ? " ▼" : " ▲") : "");
  });

  const tbody = document.getElementById("ads-body");
  tbody.innerHTML = sorted.map(a => {
    const tint = roiTint(a.spend_eur, a.db_purchases, a.db_roas);
    const adLink = "https://business.facebook.com/adsmanager/manage/ads?act=" + (a.account_id || "").replace("act_","") + "&" + LEVEL.adsManagerSelector + "=" + (a[LEVEL.primaryId] || "");
    const primaryName = a[LEVEL.primaryName] || "?";
    const subName = LEVEL.subName ? (a[LEVEL.subName] || "") : "";
    const extraTds = LEVEL.extraCols.map(function(c) {
      const v = a[c.field];
      const align = c.align === "right" ? "text-right" : "text-left";
      const shown = (typeof v === "number") ? fmtN(v) : (v || "—");
      return '<td class="px-2 py-1.5 text-[10px] text-slate-400 ' + align + ' truncate max-w-[200px]" title="' + String(v||"") + '">' + shown + '</td>';
    }).join("");
    const statusCell = LEVEL.title === "By Ad"
      ? '<td class="px-2 py-1.5 text-center">' + (a.impressions > 0 ? '<span class="text-emerald-400">●</span>' : '<span class="text-slate-600">◌</span>') + '</td>'
      : '<td class="px-2 py-1.5 text-right text-[10px] ' + (a.deliv_pct >= 80 ? 'text-emerald-400' : a.deliv_pct >= 40 ? 'text-amber-400' : 'text-red-400') + '">' + (a.ads_active > 0 ? (a.ads_delivering + '/' + a.ads_active) : '—') + '</td>';
    return '<tr class="border-b border-slate-800/60 hover:bg-slate-800/40 ' + tint + '">' +
      '<td class="px-2 py-1.5 text-[10px] text-slate-400">' + (a.account_name || "?") + '</td>' +
      '<td class="px-2 py-1.5"><div class="font-medium text-slate-200 truncate max-w-[260px]" title="' + primaryName + '">' + primaryName + '</div>' + (subName ? '<div class="text-[10px] text-slate-500 truncate max-w-[260px]" title="' + subName + '">' + subName + '</div>' : '') + '</td>' +
      extraTds +
      '<td class="px-2 py-1.5 text-center">' + statusPill(a.effective_status) + '</td>' +
      statusCell +
      '<td class="px-2 py-1.5 text-right">€' + fmtM(a.spend_eur || 0) + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + (a.cpm ? '€' + fmtM(a.cpm) : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + (a.cpc ? '€' + fmtM(a.cpc) : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + fmtN(a.impressions) + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + fmtN(a.reach) + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + (a.frequency ? Number(a.frequency).toFixed(2) : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + (a.ctr != null ? Number(a.ctr).toFixed(2) + "%" : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + fmtP(a.hook_rate) + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + fmtP(a.hold_rate) + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + fmtN(a.landing_views) + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + (a.cost_per_lpv != null ? '€' + fmtM(a.cost_per_lpv) : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right">' + fmtN(a.initiated_checkout) + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10 ' + (a.db_leads > 0 ? "text-emerald-300 font-semibold" : "text-slate-500") + '">' + (a.db_leads || 0) + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10">' + (a.db_cpl != null ? "€" + fmtM(a.db_cpl) : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10 ' + (a.lead_to_pur != null && a.lead_to_pur >= 5 ? "text-emerald-300 font-semibold" : "text-slate-500") + '">' + (a.lead_to_pur != null ? a.lead_to_pur.toFixed(0) + "%" : "—") + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10 ' + (a.db_purchases > 0 ? "text-emerald-300 font-semibold" : "text-slate-500") + '">' + (a.db_purchases || 0) + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10">€' + fmtM(a.db_revenue_eur || 0) + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10">' + roasBadge(a.spend_eur, a.db_purchases, a.db_roas) + '</td>' +
      '<td class="px-2 py-1.5 text-right bg-emerald-900/10">' + profitText(a.profit_eur) + '</td>' +
      '<td class="px-2 py-1.5 text-right"><a href="' + adLink + '" target="_blank" class="text-indigo-400 hover:underline text-[10px]">↗</a></td>' +
    '</tr>';
  }).join("");

  if (sorted.length === 0) {
    const totalCols = 24 + LEVEL.extraCols.length;
    tbody.innerHTML = '<tr><td colspan="' + totalCols + '" class="text-center px-2 py-8 text-slate-500">No rows match the filters</td></tr>';
  }
}

document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    if (sortCol === th.dataset.sort) sortDir = -sortDir; else { sortCol = th.dataset.sort; sortDir = -1; }
    render();
  });
});
document.getElementById("search").addEventListener("input", render);
document.getElementById("f-account").addEventListener("change", render);
document.getElementById("f-spend").addEventListener("change", render);
document.getElementById("f-status").addEventListener("change", render);
document.getElementById("f-zero").addEventListener("change", render);
document.getElementById("refresh").addEventListener("click", load);
document.getElementById("export-csv").addEventListener("click", () => {
  const preset = document.getElementById("preset").value;
  const exportUrl = LEVEL.endpoint.replace("-data", "/export") + "?preset=" + preset + "&key=" + encodeURIComponent(KEY);
  window.location.href = exportUrl;
});
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
