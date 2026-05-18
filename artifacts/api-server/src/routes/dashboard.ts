import { Router, type IRouter, type Request, type Response } from "express";
import { fetchAllAccounts, fetchLeadStats, fetchStripeRevenue, SLEEP_ACCOUNTS } from "../dashboardData";

const router: IRouter = Router();

function isAuthorized(req: Request): boolean {
  const expected = process.env.DASHBOARD_SECRET;
  if (!expected) return false;
  const got = (req.query.key as string | undefined) || (req.headers["x-dashboard-key"] as string | undefined);
  return got === expected;
}

// JSON API endpoint (consumed by HTML page below)
router.get("/admin/dashboard/data", async (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const datePreset = (req.query.preset as string) || "last_7d";
  try {
    const [accounts, leads, stripe] = await Promise.all([
      fetchAllAccounts(datePreset),
      fetchLeadStats(),
      fetchStripeRevenue(datePreset === "today" ? 1 : 7),
    ]);
    res.json({
      generated_at: new Date().toISOString(),
      date_preset: datePreset,
      accounts,
      leads,
      stripe,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// HTML dashboard
router.get("/admin/dashboard", (req: Request, res: Response) => {
  if (!isAuthorized(req)) {
    res.status(403).send("Forbidden — pass ?key=<DASHBOARD_SECRET>");
    return;
  }
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
    .scroll-x { overflow-x: auto; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">

<div class="max-w-7xl mx-auto px-5 py-6">

  <div class="flex items-center justify-between mb-5">
    <div>
      <h1 class="text-xl font-bold">Sleep Wired — Dashboard</h1>
      <p id="meta" class="text-xs text-slate-400 mt-1">Loading…</p>
    </div>
    <div class="flex items-center gap-2">
      <select id="preset" class="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm">
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last_3d">Last 3 days</option>
        <option value="last_7d" selected>Last 7 days</option>
        <option value="last_14d">Last 14 days</option>
        <option value="last_30d">Last 30 days</option>
        <option value="this_month">This month</option>
        <option value="lifetime">Lifetime</option>
      </select>
      <button id="refresh" class="bg-indigo-600 hover:bg-indigo-500 rounded px-4 py-1.5 text-sm font-semibold">Refresh</button>
    </div>
  </div>

  <!-- TOTALS strip -->
  <div id="totals" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6"></div>

  <!-- Accounts table -->
  <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-6">
    <div class="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
      <h2 class="font-semibold text-sm">Ad Accounts (sortable by spend)</h2>
      <span class="text-xs text-slate-400">Spend / Purchases / CPA per account</span>
    </div>
    <div class="scroll-x">
      <table class="w-full text-sm num">
        <thead class="bg-slate-800/50 text-xs uppercase text-slate-400 tracking-wider">
          <tr>
            <th class="text-left px-3 py-2">Account</th>
            <th class="text-right px-3 py-2">CCY</th>
            <th class="text-right px-3 py-2">Spend</th>
            <th class="text-right px-3 py-2">EUR</th>
            <th class="text-right px-3 py-2">Impr</th>
            <th class="text-right px-3 py-2">Clicks</th>
            <th class="text-right px-3 py-2">CTR</th>
            <th class="text-right px-3 py-2">CPM</th>
            <th class="text-right px-3 py-2">Lead</th>
            <th class="text-right px-3 py-2">LPV</th>
            <th class="text-right px-3 py-2">Pur</th>
            <th class="text-right px-3 py-2">CPA</th>
            <th class="text-right px-3 py-2">ROAS</th>
            <th class="text-right px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody id="accounts-body"></tbody>
        <tfoot class="bg-slate-800/30 font-semibold border-t border-slate-700">
          <tr id="totals-row"></tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- Leads + Stripe grids -->
  <div class="grid md:grid-cols-2 gap-6">

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800">
        <h2 class="font-semibold text-sm">Leads (our DB)</h2>
      </div>
      <div id="leads" class="p-4"></div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-800">
        <h2 class="font-semibold text-sm">Stripe revenue</h2>
      </div>
      <div id="stripe" class="p-4"></div>
    </div>
  </div>

  <p class="text-xs text-slate-500 mt-6">FX rates approx: CHF×1.05, BRL×0.16. Pixel attribution; CAPI hybrid active. iOS/adblock may underreport.</p>
</div>

<script>
const KEY = ${JSON.stringify(key)};
const fmtN = (n) => n == null ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtM = (n) => n == null ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtP = (n) => n == null ? "—" : (Number(n) * 1).toFixed(2) + "%";

async function load() {
  document.getElementById("meta").textContent = "Loading…";
  const preset = document.getElementById("preset").value;
  const r = await fetch("/admin/dashboard/data?preset=" + preset + "&key=" + encodeURIComponent(KEY));
  if (!r.ok) {
    document.getElementById("meta").textContent = "Error: " + r.status;
    return;
  }
  const d = await r.json();
  renderTotals(d);
  renderAccounts(d);
  renderLeads(d);
  renderStripe(d);
  document.getElementById("meta").textContent = "Generated " + d.generated_at + " · preset=" + d.date_preset;
}

function renderTotals(d) {
  const a = d.accounts;
  const sumSpend = a.reduce((s, x) => s + (x.spend_eur || 0), 0);
  const sumImpr = a.reduce((s, x) => s + (x.impressions || 0), 0);
  const sumClicks = a.reduce((s, x) => s + (x.link_clicks || x.clicks || 0), 0);
  const sumPur = a.reduce((s, x) => s + (x.purchases || 0), 0);
  const sumPurVal = a.reduce((s, x) => s + (x.purchase_value || 0), 0);
  const cpa = sumPur > 0 ? sumSpend / sumPur : null;
  const roas = sumSpend > 0 ? sumPurVal / sumSpend : null;
  const ctr = sumImpr > 0 ? (sumClicks / sumImpr) * 100 : 0;

  const cells = [
    ["Spend €", "€" + fmtM(sumSpend)],
    ["Impr", fmtN(sumImpr)],
    ["Link clicks", fmtN(sumClicks)],
    ["CTR", ctr.toFixed(2) + "%"],
    ["Purchases", fmtN(sumPur)],
    ["CPA", cpa ? "€" + fmtM(cpa) : "—"],
    ["ROAS", roas ? roas.toFixed(2) + "x" : "—"],
  ];
  document.getElementById("totals").innerHTML = cells.map(([k, v]) =>
    \`<div class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
      <div class="text-[10px] uppercase tracking-wider text-slate-400">\${k}</div>
      <div class="text-lg font-bold num mt-0.5">\${v}</div>
    </div>\`).join("");
}

function renderAccounts(d) {
  const sorted = [...d.accounts].sort((a, b) => b.spend_eur - a.spend_eur);
  const body = document.getElementById("accounts-body");
  body.innerHTML = sorted.map(a => {
    const errBadge = a.status_err
      ? \`<span class="text-amber-400 text-xs">⚠️</span>\`
      : (a.spend > 0 ? \`<span class="text-emerald-400 text-xs">●</span>\` : \`<span class="text-slate-500 text-xs">○</span>\`);
    return \`<tr class="border-t border-slate-800/50 hover:bg-slate-800/30">
      <td class="px-3 py-2 font-medium">\${a.name}</td>
      <td class="px-3 py-2 text-right text-slate-400">\${a.ccy}</td>
      <td class="px-3 py-2 text-right">\${fmtM(a.spend)}</td>
      <td class="px-3 py-2 text-right text-slate-400">€\${fmtM(a.spend_eur)}</td>
      <td class="px-3 py-2 text-right">\${fmtN(a.impressions)}</td>
      <td class="px-3 py-2 text-right">\${fmtN(a.link_clicks || a.clicks)}</td>
      <td class="px-3 py-2 text-right">\${a.ctr ? a.ctr.toFixed(2) + "%" : "—"}</td>
      <td class="px-3 py-2 text-right">\${a.cpm ? fmtM(a.cpm) : "—"}</td>
      <td class="px-3 py-2 text-right">\${fmtN(a.landing_views ? 0 : 0)}</td>
      <td class="px-3 py-2 text-right">\${fmtN(a.landing_views)}</td>
      <td class="px-3 py-2 text-right font-semibold \${a.purchases > 0 ? 'text-emerald-400' : 'text-slate-500'}">\${a.purchases}</td>
      <td class="px-3 py-2 text-right">\${a.cpa ? "€" + fmtM(a.cpa) : "—"}</td>
      <td class="px-3 py-2 text-right">\${a.roas ? a.roas.toFixed(2) + "x" : "—"}</td>
      <td class="px-3 py-2 text-right" title="\${a.status_err || ''}">\${errBadge}</td>
    </tr>\`;
  }).join("");

  // Totals row
  const sumSpend = sorted.reduce((s, x) => s + (x.spend || 0), 0);
  const sumSpendEur = sorted.reduce((s, x) => s + (x.spend_eur || 0), 0);
  const sumImpr = sorted.reduce((s, x) => s + (x.impressions || 0), 0);
  const sumClicks = sorted.reduce((s, x) => s + (x.link_clicks || x.clicks || 0), 0);
  const sumLpv = sorted.reduce((s, x) => s + (x.landing_views || 0), 0);
  const sumPur = sorted.reduce((s, x) => s + (x.purchases || 0), 0);
  const sumPurVal = sorted.reduce((s, x) => s + (x.purchase_value || 0), 0);
  const cpa = sumPur > 0 ? sumSpendEur / sumPur : null;
  const roas = sumSpendEur > 0 ? sumPurVal / sumSpendEur : null;
  document.getElementById("totals-row").innerHTML = \`
    <td class="px-3 py-2">TOTAL</td>
    <td class="px-3 py-2 text-right text-slate-500">—</td>
    <td class="px-3 py-2 text-right text-slate-500">—</td>
    <td class="px-3 py-2 text-right">€\${fmtM(sumSpendEur)}</td>
    <td class="px-3 py-2 text-right">\${fmtN(sumImpr)}</td>
    <td class="px-3 py-2 text-right">\${fmtN(sumClicks)}</td>
    <td class="px-3 py-2 text-right">—</td>
    <td class="px-3 py-2 text-right">—</td>
    <td class="px-3 py-2 text-right">—</td>
    <td class="px-3 py-2 text-right">\${fmtN(sumLpv)}</td>
    <td class="px-3 py-2 text-right text-emerald-400">\${sumPur}</td>
    <td class="px-3 py-2 text-right">\${cpa ? "€" + fmtM(cpa) : "—"}</td>
    <td class="px-3 py-2 text-right">\${roas ? roas.toFixed(2) + "x" : "—"}</td>
    <td></td>\`;
}

function renderLeads(d) {
  const l = d.leads;
  const hookRows = Object.entries(l.by_hook || {})
    .sort((a, b) => b[1] - a[1])
    .map(([h, n]) => \`<div class="flex justify-between text-xs py-0.5"><span class="text-slate-400">\${h}</span><span class="font-semibold">\${n}</span></div>\`).join("");
  document.getElementById("leads").innerHTML = \`
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div><div class="text-[10px] uppercase text-slate-500">Total</div><div class="text-2xl font-bold num">\${l.total}</div></div>
      <div><div class="text-[10px] uppercase text-slate-500">Purchased</div><div class="text-2xl font-bold num text-emerald-400">\${l.purchased}</div></div>
      <div><div class="text-[10px] uppercase text-slate-500">Last 24h</div><div class="text-2xl font-bold num">\${l.recent_24h}</div></div>
    </div>
    <div class="text-xs text-slate-400 mb-3">CVR: \${l.total > 0 ? ((l.purchased / l.total) * 100).toFixed(2) + "%" : "—"}</div>
    <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
      <div>WhatsApp captured: <span class="font-bold">\${l.with_whatsapp}</span></div>
      <div>Name captured: <span class="font-bold">\${l.with_name}</span></div>
    </div>
    <div class="mt-4">
      <div class="text-[10px] uppercase text-slate-500 mb-2">Recovery email funnel</div>
      <div class="grid grid-cols-4 gap-1 text-center">
        <div class="bg-slate-800 rounded p-2"><div class="text-[10px] text-slate-500">Untouched</div><div class="font-bold">\${l.recovery_0}</div></div>
        <div class="bg-slate-800 rounded p-2"><div class="text-[10px] text-slate-500">Sent 1</div><div class="font-bold">\${l.recovery_1}</div></div>
        <div class="bg-slate-800 rounded p-2"><div class="text-[10px] text-slate-500">Sent 2</div><div class="font-bold">\${l.recovery_2}</div></div>
        <div class="bg-slate-800 rounded p-2"><div class="text-[10px] text-slate-500">Sent 3</div><div class="font-bold">\${l.recovery_3}</div></div>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-[10px] uppercase text-slate-500 mb-2">By hook variant</div>
      \${hookRows || '<div class="text-xs text-slate-500">no data</div>'}
    </div>\`;
}

function renderStripe(d) {
  const s = d.stripe;
  const list = (s.recent_payments || []).map(p =>
    \`<div class="flex justify-between text-xs py-1 border-b border-slate-800/40">
      <span class="text-slate-400 truncate" style="max-width:170px;">\${p.email}</span>
      <span class="num font-semibold">€\${fmtM(p.amount_eur)}</span>
      <span class="text-slate-500 text-[10px]">\${p.created}</span>
    </div>\`).join("");
  document.getElementById("stripe").innerHTML = \`
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div><div class="text-[10px] uppercase text-slate-500">Payments</div><div class="text-2xl font-bold num text-emerald-400">\${s.total_payments}</div></div>
      <div><div class="text-[10px] uppercase text-slate-500">Revenue</div><div class="text-2xl font-bold num">€\${fmtM(s.total_revenue_eur)}</div></div>
    </div>
    <div class="text-[10px] uppercase text-slate-500 mb-2">Last 10 payments</div>
    \${list || '<div class="text-xs text-slate-500">no payments yet</div>'}\`;
}

document.getElementById("refresh").addEventListener("click", load);
document.getElementById("preset").addEventListener("change", load);
load();
</script>
</body>
</html>`;
}

export default router;
