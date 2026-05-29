/**
 * Sleep Wired — Dashboard data aggregator
 * Pulls live Meta Insights + Stripe + DB for the 15 Sleep ad accounts.
 */
import { db, leadsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getStripeClient } from "./stripeClient";

const META_API_VERSION = "v21.0";
const META_TOKEN = () => process.env.META_ACCESS_TOKEN || "";

export const SLEEP_ACCOUNTS = [
  { name: "swiss-chf-1",        id: "act_2168506510289919", ccy: "CHF" },
  { name: "conta02",            id: "act_1170983253695407", ccy: "EUR" },
  { name: "ads-04",             id: "act_1287159516312816", ccy: "EUR" },
  { name: "ads-05",             id: "act_1431195865644212", ccy: "EUR" },
  { name: "Compte drop",        id: "act_3819323995020440", ccy: "CHF" },
  { name: "FS-CHF-ADS-01",      id: "act_645632501939900",  ccy: "CHF" },
  { name: "FS-ADS-01",          id: "act_1979277123009440", ccy: "EUR" },
  { name: "dropteste-3",        id: "act_1501513365019424", ccy: "EUR" },
  { name: "dropteste-2",        id: "act_2069333970647303", ccy: "EUR" },
  { name: "fs-00-01",           id: "act_26610479328573613",ccy: "EUR" },
  { name: "FS1-ADS-CHF-01",     id: "act_1378473270690877", ccy: "CHF" },
  { name: "ashaugust-1",        id: "act_2109321369800503", ccy: "EUR" },
  { name: "fluyon-marketing-1", id: "act_26959626660315477",ccy: "EUR" },
  { name: "history-games-1",    id: "act_1557260155591025", ccy: "EUR" },
];
// Removed from scope (BRL contas with billing/permission issues — out of Fluyon user agent):
//   conta01 (act_1011385913107820), swservices-1 (act_1514589166045399),
//   drop-brasil-2024 (act_415411388307856), swservices-2 (act_867359391727411)

const FX_TO_EUR: Record<string, number> = { EUR: 1.0, CHF: 1.05, BRL: 0.16, USD: 0.92 };

const FIELDS = [
  "spend","impressions","reach","frequency","clicks","ctr","cpm","cpc",
  "actions","action_values",
  "video_play_actions",
  "video_p25_watched_actions",
  "video_p50_watched_actions",
  "video_p75_watched_actions",
  "video_p95_watched_actions",
  "video_thruplay_watched_actions",
  "video_avg_time_watched_actions",
].join(",");

export type Row = {
  // identity
  id?: string; name?: string; ccy?: string;
  // raw
  spend: number; spend_eur: number;
  impressions: number; reach: number; frequency: number;
  clicks: number; link_clicks: number; landing_views: number;
  ctr: number; cpm: number; cpc: number;
  // funnel actions (Meta Pixel/CAPI source)
  leads: number; initiated_checkout: number; purchases: number; purchase_value: number;
  view_content: number;
  // DB-attributed outcome (source of truth: Stripe + leads.utm_content=ad.id)
  db_leads: number;                            // all leads (purchased or not) attributed to this ad
  db_purchases: number; db_revenue_eur: number;
  db_roas: number | null; db_cpa: number | null; db_cpl: number | null;
  profit_eur: number; // db_revenue_eur - spend_eur
  // derived (Meta-based)
  cpa: number | null; roas: number | null;
  cpl: number | null; cost_per_lpv: number | null;
  // video
  v_3s: number; v_p25: number; v_p50: number; v_p75: number; v_p95: number;
  v_thruplay: number; v_avg_time: number;
  hook_rate: number | null; hold_rate: number | null;
  // ad-level status counts (live)
  ads_active: number;          // effective_status=ACTIVE
  ads_delivering: number;      // ACTIVE and impressions>0 today
  ads_throttled: number;       // ACTIVE and impressions=0 today
  ads_in_review: number;       // IN_PROCESS or PENDING_REVIEW
  ads_disapproved: number;     // DISAPPROVED or WITH_ISSUES
  // page distribution (1116215961574065 = Cognitive Shutdown Method, 1023528354186771 = Sleep Wired)
  ads_on_csm: number;
  ads_on_sleep: number;
  ads_on_other: number;
  // effective_status from Meta (ACTIVE/PAUSED/CAMPAIGN_PAUSED/ADSET_PAUSED/IN_PROCESS/DISAPPROVED/...)
  // populated only on breakdown/flat queries (campaign/adset/ad), not on account-level rollup
  effective_status?: string;
  // diagnostics
  status_err?: string;
};

export const PAGE_CSM = "1116215961574065";        // Cognitive Shutdown Method (nova)
export const PAGE_SLEEP_WIRED = "1023528354186771"; // Sleep Wired (legacy, mantida pros delivering)

// Average order value (default per-purchase price in EUR). Used when we don't have per-lead Stripe amount.
const UNIT_AOV_EUR = 27;

function parseRow(row: any, ccy: string): Row {
  const actions: { action_type: string; value: string }[] = row.actions || [];
  const actionValues: { action_type: string; value: string }[] = row.action_values || [];
  const A = (t: string) => Number(actions.find((a) => a.action_type === t)?.value ?? 0);
  const AV = (t: string) => Number(actionValues.find((a) => a.action_type === t)?.value ?? 0);
  const V = (arr: any[]) => Number((arr || [])[0]?.value ?? 0);

  const spend = Number(row.spend ?? 0);
  const impressions = Number(row.impressions ?? 0);
  const purchases = A("purchase") || A("omni_purchase") || A("offsite_conversion.fb_pixel_purchase");
  const purchase_value = AV("purchase") || AV("omni_purchase") || AV("offsite_conversion.fb_pixel_purchase");
  const leads = A("lead") || A("offsite_conversion.fb_pixel_lead");
  const initiated_checkout = A("initiate_checkout") || A("offsite_conversion.fb_pixel_initiate_checkout");
  const link_clicks = A("link_click");
  const landing_views = A("landing_page_view");
  const view_content = A("view_content") || A("offsite_conversion.fb_pixel_view_content");
  // 3-sec views: prefer dedicated metric, fall back to action_type video_view
  const v_3s = V(row.video_play_actions) || A("video_view");
  const v_p25 = V(row.video_p25_watched_actions);
  const v_p50 = V(row.video_p50_watched_actions);
  const v_p75 = V(row.video_p75_watched_actions);
  const v_p95 = V(row.video_p95_watched_actions);
  const v_thruplay = V(row.video_thruplay_watched_actions);
  const v_avg_time = V(row.video_avg_time_watched_actions);

  return {
    spend,
    spend_eur: spend * (FX_TO_EUR[ccy] ?? 1),
    impressions,
    reach: Number(row.reach ?? 0),
    frequency: Number(row.frequency ?? 0),
    clicks: Number(row.clicks ?? 0),
    link_clicks,
    landing_views,
    ctr: Number(row.ctr ?? 0),
    cpm: Number(row.cpm ?? 0),
    cpc: Number(row.cpc ?? 0),
    leads, initiated_checkout, purchases, purchase_value, view_content,
    db_leads: 0, db_purchases: 0, db_revenue_eur: 0, db_roas: null, db_cpa: null, db_cpl: null, profit_eur: 0,
    cpa: purchases > 0 ? spend / purchases : null,
    roas: spend > 0 ? purchase_value / spend : null,
    cpl: leads > 0 ? spend / leads : null,
    cost_per_lpv: landing_views > 0 ? spend / landing_views : null,
    v_3s, v_p25, v_p50, v_p75, v_p95, v_thruplay, v_avg_time,
    hook_rate: impressions > 0 ? v_3s / impressions : null,
    hold_rate: v_3s > 0 ? v_thruplay / v_3s : null,
    ads_active: 0, ads_delivering: 0, ads_throttled: 0, ads_in_review: 0, ads_disapproved: 0,
    ads_on_csm: 0, ads_on_sleep: 0, ads_on_other: 0,
  };
}

// Time range: support both "last_72h" (rolling) and Meta presets.
function buildTimeParams(preset: string): Record<string, string> {
  if (preset === "last_72h") {
    const now = new Date();
    const since = new Date(now.getTime() - 72 * 3600_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { time_range: JSON.stringify({ since: fmt(since), until: fmt(now) }) };
  }
  return { date_preset: preset };
}

async function metaGet(path: string, extra: Record<string, string> = {}): Promise<any> {
  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/${path}`);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", META_TOKEN());
  const resp = await fetch(url.toString());
  return resp.json();
}

export async function fetchAccountInsights(acct: { name: string; id: string; ccy: string }, preset: string, attribution?: Attribution): Promise<Row & { name: string; account_id: string; ccy: string }> {
  try {
    // Parallel: insights + ads status summary
    const [data, adsStatus] = await Promise.all([
      metaGet(`${acct.id}/insights`, {
        fields: FIELDS,
        level: "account",
        ...buildTimeParams(preset),
      }),
      fetchAccountAdsStatus(acct.id),
    ]);
    if (data.error) {
      return { ...blank(acct.ccy), ...adsStatus, name: acct.name, account_id: acct.id, ccy: acct.ccy, status_err: `API: ${data.error.message?.slice(0, 80)}` };
    }
    const row = data.data?.[0];
    const parsed: Row = row ? parseRow(row, acct.ccy) : blank(acct.ccy);
    // merge ads status counts
    Object.assign(parsed, adsStatus);
    // Apply DB attribution (account_id without "act_" prefix)
    const accIdNoPrefix = acct.id.replace(/^act_/, "");
    const bucket = attribution?.byAccount.get(accIdNoPrefix);
    if (bucket) {
      parsed.db_leads = bucket.leads;
      parsed.db_purchases = bucket.purchases;
      parsed.db_revenue_eur = bucket.revenue_eur;
    }
    recomputeDb(parsed);
    const status_err = !row ? "no data" : undefined;
    return { ...parsed, name: acct.name, account_id: acct.id, ccy: acct.ccy, ...(status_err ? { status_err } : {}) };
  } catch (e) {
    return { ...blank(acct.ccy), name: acct.name, account_id: acct.id, ccy: acct.ccy, status_err: `fetch: ${(e as Error).message?.slice(0, 80)}` };
  }
}

function blank(ccy: string): Row {
  return {
    spend: 0, spend_eur: 0, impressions: 0, reach: 0, frequency: 0,
    clicks: 0, link_clicks: 0, landing_views: 0, ctr: 0, cpm: 0, cpc: 0,
    leads: 0, initiated_checkout: 0, purchases: 0, purchase_value: 0, view_content: 0,
    db_leads: 0, db_purchases: 0, db_revenue_eur: 0, db_roas: null, db_cpa: null, db_cpl: null, profit_eur: 0,
    cpa: null, roas: null, cpl: null, cost_per_lpv: null,
    v_3s: 0, v_p25: 0, v_p50: 0, v_p75: 0, v_p95: 0, v_thruplay: 0, v_avg_time: 0,
    hook_rate: null, hold_rate: null,
    ads_active: 0, ads_delivering: 0, ads_throttled: 0, ads_in_review: 0, ads_disapproved: 0,
    ads_on_csm: 0, ads_on_sleep: 0, ads_on_other: 0,
  };
}

// ─── Per-account ads status + page distribution (1 Meta call each) ────────────
type AdStatusSummary = {
  ads_active: number;
  ads_delivering: number;   // ACTIVE with impressions>0 today
  ads_throttled: number;    // ACTIVE with 0 impressions today
  ads_in_review: number;
  ads_disapproved: number;
  ads_on_csm: number;
  ads_on_sleep: number;
  ads_on_other: number;
};

async function fetchAccountAdsStatus(accountId: string): Promise<AdStatusSummary> {
  const summary: AdStatusSummary = {
    ads_active: 0, ads_delivering: 0, ads_throttled: 0,
    ads_in_review: 0, ads_disapproved: 0,
    ads_on_csm: 0, ads_on_sleep: 0, ads_on_other: 0,
  };
  try {
    const data = await metaGet(`${accountId}/ads`, {
      fields: "id,effective_status,creative{object_story_spec},insights.date_preset(today){impressions}",
      limit: "300",
    });
    const ads: Array<{
      id: string;
      effective_status?: string;
      creative?: { object_story_spec?: { page_id?: string } };
      insights?: { data?: Array<{ impressions?: string }> };
    }> = data.data ?? [];

    for (const a of ads) {
      const status = a.effective_status ?? "UNKNOWN";
      const pageId = a.creative?.object_story_spec?.page_id;
      const todayImpr = Number(a.insights?.data?.[0]?.impressions ?? 0);

      if (status === "ACTIVE") {
        summary.ads_active++;
        if (todayImpr > 0) summary.ads_delivering++;
        else summary.ads_throttled++;
        // Page distribution only for ACTIVE ads (the ones we care about)
        if (pageId === PAGE_CSM) summary.ads_on_csm++;
        else if (pageId === PAGE_SLEEP_WIRED) summary.ads_on_sleep++;
        else if (pageId) summary.ads_on_other++;
      } else if (status === "IN_PROCESS" || status === "PENDING_REVIEW") {
        summary.ads_in_review++;
      } else if (status === "DISAPPROVED" || status === "WITH_ISSUES") {
        summary.ads_disapproved++;
      }
    }
  } catch {
    // silent — keep zeros
  }
  return summary;
}

// Recompute db-derived metrics after attribution sums change
function recomputeDb(r: Row): void {
  r.db_roas = r.spend_eur > 0 ? r.db_revenue_eur / r.spend_eur : null;
  r.db_cpa = r.db_purchases > 0 ? r.spend_eur / r.db_purchases : null;
  r.db_cpl = r.db_leads > 0 ? r.spend_eur / r.db_leads : null;
  r.profit_eur = r.db_revenue_eur - r.spend_eur;
}

// ─── DB attribution ────────────────────────────────────────────────────────────
function presetToRange(preset: string): { since: Date; until: Date } {
  const now = new Date();
  const today0 = new Date(now); today0.setUTCHours(0, 0, 0, 0);
  switch (preset) {
    case "today": return { since: today0, until: now };
    case "yesterday": { const y = new Date(today0); y.setUTCDate(y.getUTCDate() - 1); return { since: y, until: today0 }; }
    case "last_72h": return { since: new Date(now.getTime() - 72 * 3600_000), until: now };
    case "last_3d": return { since: new Date(now.getTime() - 3 * 86400_000), until: now };
    case "last_7d": return { since: new Date(now.getTime() - 7 * 86400_000), until: now };
    case "last_14d": return { since: new Date(now.getTime() - 14 * 86400_000), until: now };
    case "last_30d": return { since: new Date(now.getTime() - 30 * 86400_000), until: now };
    case "this_month": { const d = new Date(now); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return { since: d, until: now }; }
    case "lifetime": return { since: new Date(0), until: now };
    default: return { since: new Date(now.getTime() - 72 * 3600_000), until: now };
  }
}

export type AttributionBucket = { leads: number; purchases: number; revenue_eur: number };
export type Attribution = {
  byAd: Map<string, AttributionBucket>;        // ad_id (utm_content) → bucket
  byAccount: Map<string, AttributionBucket>;   // account_id (no act_ prefix) → bucket
  byCampaign: Map<string, AttributionBucket>;  // campaign_id → bucket
  byAdset: Map<string, AttributionBucket>;     // adset_id → bucket
  unattributed: AttributionBucket;             // leads/purchases w/o ad_id (organic/test)
};

function emptyBucket(): AttributionBucket { return { leads: 0, purchases: 0, revenue_eur: 0 }; }

// Resolve ad_ids to their account/campaign/adset via Meta bulk endpoint.
// Returns map: ad_id → { account_id, campaign_id, adset_id, ad_name } (only for valid ids).
async function resolveAdIds(adIds: string[]): Promise<Map<string, { account_id: string; campaign_id: string; adset_id: string; ad_name?: string }>> {
  const out = new Map<string, { account_id: string; campaign_id: string; adset_id: string; ad_name?: string }>();
  if (adIds.length === 0) return out;
  // Chunk in groups of 50 (Meta batch limit)
  const chunks: string[][] = [];
  for (let i = 0; i < adIds.length; i += 50) chunks.push(adIds.slice(i, i + 50));
  for (const chunk of chunks) {
    try {
      const data = await metaGet("", {
        ids: chunk.join(","),
        fields: "id,name,account_id,campaign_id,adset_id",
      });
      for (const [adId, info] of Object.entries(data || {})) {
        const i = info as any;
        if (i?.error || !i?.account_id) continue;
        out.set(adId, {
          account_id: i.account_id,
          campaign_id: i.campaign_id,
          adset_id: i.adset_id,
          ad_name: i.name,
        });
      }
    } catch {
      // skip chunk on error
    }
  }
  return out;
}

export async function fetchAttribution(preset: string): Promise<Attribution> {
  const { since, until } = presetToRange(preset);
  // Single query: count both leads (created_at in window) and purchases (purchased_at in window) per utm_content
  const rows = await db.execute<{ utm_content: string | null; leads_n: number; purchases_n: number }>(sql`
    SELECT utm_content,
           count(*) FILTER (WHERE created_at >= ${since.toISOString()} AND created_at < ${until.toISOString()})::int AS leads_n,
           count(*) FILTER (WHERE purchased = true AND purchased_at >= ${since.toISOString()} AND purchased_at < ${until.toISOString()})::int AS purchases_n
    FROM leads
    WHERE created_at >= ${since.toISOString()}
       OR (purchased = true AND purchased_at >= ${since.toISOString()} AND purchased_at < ${until.toISOString()})
    GROUP BY utm_content
  `);
  const dataRows: any[] = Array.isArray(rows) ? rows : ((rows as any).rows ?? []);
  const byAd = new Map<string, AttributionBucket>();
  const unattrib = emptyBucket();
  const adIdsToResolve: string[] = [];
  for (const r of dataRows) {
    const leadsN = Number(r.leads_n ?? 0);
    const purN = Number(r.purchases_n ?? 0);
    if (leadsN === 0 && purN === 0) continue;
    const adId = r.utm_content && /^\d{10,}$/.test(r.utm_content.trim()) ? r.utm_content.trim() : null;
    if (!adId) {
      unattrib.leads += leadsN;
      unattrib.purchases += purN;
      unattrib.revenue_eur += purN * UNIT_AOV_EUR;
      continue;
    }
    byAd.set(adId, { leads: leadsN, purchases: purN, revenue_eur: purN * UNIT_AOV_EUR });
    adIdsToResolve.push(adId);
  }
  const meta = await resolveAdIds(adIdsToResolve);
  const byAccount = new Map<string, AttributionBucket>();
  const byCampaign = new Map<string, AttributionBucket>();
  const byAdset = new Map<string, AttributionBucket>();
  const addInto = (m: Map<string, AttributionBucket>, key: string, b: AttributionBucket) => {
    const cur = m.get(key) ?? emptyBucket();
    cur.leads += b.leads; cur.purchases += b.purchases; cur.revenue_eur += b.revenue_eur;
    m.set(key, cur);
  };
  for (const [adId, bucket] of byAd.entries()) {
    const m = meta.get(adId);
    if (!m) continue;
    addInto(byAccount, m.account_id, bucket);
    addInto(byCampaign, m.campaign_id, bucket);
    addInto(byAdset, m.adset_id, bucket);
  }
  return { byAd, byAccount, byCampaign, byAdset, unattributed: unattrib };
}

export async function fetchAllAccounts(preset: string, attribution?: Attribution) {
  return Promise.all(SLEEP_ACCOUNTS.map((a) => fetchAccountInsights(a, preset, attribution)));
}

// ─── Effective status maps for one account (campaigns/adsets/ads) ─────────────
type AccountStatusMaps = {
  campaigns: Map<string, string>;
  adsets: Map<string, string>;
  ads: Map<string, string>;
};

async function fetchAccountStatuses(accountId: string): Promise<AccountStatusMaps> {
  const out: AccountStatusMaps = {
    campaigns: new Map(),
    adsets: new Map(),
    ads: new Map(),
  };
  try {
    const [camps, asets, ads] = await Promise.all([
      metaGet(`${accountId}/campaigns`, { fields: "id,effective_status", limit: "200" }),
      metaGet(`${accountId}/adsets`, { fields: "id,effective_status", limit: "500" }),
      metaGet(`${accountId}/ads`, { fields: "id,effective_status", limit: "500" }),
    ]);
    for (const c of (camps.data || [])) if (c.id) out.campaigns.set(c.id, c.effective_status || "UNKNOWN");
    for (const a of (asets.data || [])) if (a.id) out.adsets.set(a.id, a.effective_status || "UNKNOWN");
    for (const a of (ads.data || []))   if (a.id) out.ads.set(a.id, a.effective_status || "UNKNOWN");
  } catch {
    // silent — keep empty maps
  }
  return out;
}

// ─── Drilldown: campaigns → adsets → ads inside one account ───────────────────
export async function fetchAccountBreakdown(accountId: string, preset: string, attribution?: Attribution) {
  const acct = SLEEP_ACCOUNTS.find((a) => a.id === accountId);
  if (!acct) return { error: "unknown account" };

  // Get insights at level=ad with breakdown (each row = ad + parent ids) + status maps in parallel
  const [data, statuses] = await Promise.all([
    metaGet(`${acct.id}/insights`, {
      fields: `campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,${FIELDS}`,
      level: "ad",
      limit: "200",
      ...buildTimeParams(preset),
    }),
    fetchAccountStatuses(acct.id),
  ]);
  if (data.error) return { error: data.error.message };

  const attrib = attribution ?? await fetchAttribution(preset);

  type AdNode = Row & { ad_id: string; ad_name: string };
  type AdsetNode = Row & { adset_id: string; adset_name: string; ads: AdNode[] };
  type CampNode = Row & { campaign_id: string; campaign_name: string; adsets: Record<string, AdsetNode> };

  const camps: Record<string, CampNode> = {};
  for (const row of data.data || []) {
    const parsed = parseRow(row, acct.ccy);
    const cid = row.campaign_id;
    const asid = row.adset_id;
    const aid = row.ad_id;
    if (!camps[cid]) {
      camps[cid] = { ...blank(acct.ccy), campaign_id: cid, campaign_name: row.campaign_name, adsets: {}, effective_status: statuses.campaigns.get(cid) };
    }
    if (!camps[cid].adsets[asid]) {
      camps[cid].adsets[asid] = { ...blank(acct.ccy), adset_id: asid, adset_name: row.adset_name, ads: [], effective_status: statuses.adsets.get(asid) };
    }
    // Apply ad-level DB attribution
    const adBucket = attrib.byAd.get(aid);
    if (adBucket) {
      parsed.db_leads = adBucket.leads;
      parsed.db_purchases = adBucket.purchases;
      parsed.db_revenue_eur = adBucket.revenue_eur;
    }
    recomputeDb(parsed);
    camps[cid].adsets[asid].ads.push({ ...parsed, ad_id: aid, ad_name: row.ad_name, effective_status: statuses.ads.get(aid) });
  }

  // Aggregate ads → adsets → camps
  for (const c of Object.values(camps)) {
    for (const a of Object.values(c.adsets)) {
      a.spend = a.ads.reduce((s, x) => s + x.spend, 0);
      a.spend_eur = a.ads.reduce((s, x) => s + x.spend_eur, 0);
      a.impressions = a.ads.reduce((s, x) => s + x.impressions, 0);
      a.reach = a.ads.reduce((s, x) => s + (x.reach || 0), 0);
      a.clicks = a.ads.reduce((s, x) => s + (x.clicks || 0), 0);
      a.link_clicks = a.ads.reduce((s, x) => s + x.link_clicks, 0);
      a.landing_views = a.ads.reduce((s, x) => s + x.landing_views, 0);
      a.purchases = a.ads.reduce((s, x) => s + x.purchases, 0);
      a.purchase_value = a.ads.reduce((s, x) => s + x.purchase_value, 0);
      a.leads = a.ads.reduce((s, x) => s + x.leads, 0);
      a.initiated_checkout = a.ads.reduce((s, x) => s + x.initiated_checkout, 0);
      a.v_3s = a.ads.reduce((s, x) => s + x.v_3s, 0);
      a.v_thruplay = a.ads.reduce((s, x) => s + x.v_thruplay, 0);
      a.db_leads = a.ads.reduce((s, x) => s + x.db_leads, 0);
      a.db_purchases = a.ads.reduce((s, x) => s + x.db_purchases, 0);
      a.db_revenue_eur = a.ads.reduce((s, x) => s + x.db_revenue_eur, 0);
      a.cpa = a.purchases > 0 ? a.spend / a.purchases : null;
      a.roas = a.spend > 0 ? a.purchase_value / a.spend : null;
      a.hook_rate = a.impressions > 0 ? a.v_3s / a.impressions : null;
      a.hold_rate = a.v_3s > 0 ? a.v_thruplay / a.v_3s : null;
      // Derived: cpm, cpc, ctr, freq, cost_per_lpv, cpl
      a.cpm = a.impressions > 0 ? (a.spend / a.impressions) * 1000 : 0;
      a.cpc = a.link_clicks > 0 ? a.spend / a.link_clicks : 0;
      a.ctr = a.impressions > 0 ? (a.link_clicks / a.impressions) * 100 : 0;
      a.frequency = a.reach > 0 ? a.impressions / a.reach : 0;
      a.cost_per_lpv = a.landing_views > 0 ? a.spend / a.landing_views : null;
      a.cpl = a.leads > 0 ? a.spend / a.leads : null;
      recomputeDb(a);
    }
    const adsets = Object.values(c.adsets);
    c.spend = adsets.reduce((s, x) => s + x.spend, 0);
    c.spend_eur = adsets.reduce((s, x) => s + x.spend_eur, 0);
    c.impressions = adsets.reduce((s, x) => s + x.impressions, 0);
    c.reach = adsets.reduce((s, x) => s + (x.reach || 0), 0);
    c.clicks = adsets.reduce((s, x) => s + (x.clicks || 0), 0);
    c.link_clicks = adsets.reduce((s, x) => s + x.link_clicks, 0);
    c.landing_views = adsets.reduce((s, x) => s + x.landing_views, 0);
    c.purchases = adsets.reduce((s, x) => s + x.purchases, 0);
    c.purchase_value = adsets.reduce((s, x) => s + x.purchase_value, 0);
    c.leads = adsets.reduce((s, x) => s + x.leads, 0);
    c.initiated_checkout = adsets.reduce((s, x) => s + (x.initiated_checkout || 0), 0);
    c.v_3s = adsets.reduce((s, x) => s + (x.v_3s || 0), 0);
    c.v_thruplay = adsets.reduce((s, x) => s + (x.v_thruplay || 0), 0);
    c.db_leads = adsets.reduce((s, x) => s + x.db_leads, 0);
    c.db_purchases = adsets.reduce((s, x) => s + x.db_purchases, 0);
    c.db_revenue_eur = adsets.reduce((s, x) => s + x.db_revenue_eur, 0);
    c.cpa = c.purchases > 0 ? c.spend / c.purchases : null;
    c.roas = c.spend > 0 ? c.purchase_value / c.spend : null;
    c.hook_rate = c.impressions > 0 ? c.v_3s / c.impressions : null;
    c.hold_rate = c.v_3s > 0 ? c.v_thruplay / c.v_3s : null;
    c.cpm = c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0;
    c.cpc = c.link_clicks > 0 ? c.spend / c.link_clicks : 0;
    c.ctr = c.impressions > 0 ? (c.link_clicks / c.impressions) * 100 : 0;
    c.frequency = c.reach > 0 ? c.impressions / c.reach : 0;
    c.cost_per_lpv = c.landing_views > 0 ? c.spend / c.landing_views : null;
    c.cpl = c.leads > 0 ? c.spend / c.leads : null;
    recomputeDb(c);
  }

  return {
    account: { name: acct.name, id: acct.id, ccy: acct.ccy },
    preset,
    campaigns: Object.values(camps).map((c) => ({
      ...c,
      adsets: Object.values(c.adsets).map((a) => ({ ...a })),
    })),
  };
}

// ─── Flat ad-level view across all accounts (1 row per ad) ───────────────────
export type AdFlatRow = Row & {
  account_id: string;
  account_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  ad_id: string;
  ad_name: string;
};

export async function fetchAllAdsFlat(preset: string, attribution?: Attribution): Promise<AdFlatRow[]> {
  const attrib = attribution ?? await fetchAttribution(preset);
  const results = await Promise.all(SLEEP_ACCOUNTS.map(async (a) => {
    const bd: any = await fetchAccountBreakdown(a.id, preset, attrib);
    if (bd.error) return [] as AdFlatRow[];
    const ads: AdFlatRow[] = [];
    for (const c of bd.campaigns || []) {
      for (const aset of c.adsets || []) {
        for (const ad of aset.ads || []) {
          ads.push({
            ...ad,
            ccy: a.ccy,
            account_id: a.id,
            account_name: a.name,
            campaign_id: c.campaign_id,
            campaign_name: c.campaign_name,
            adset_id: aset.adset_id,
            adset_name: aset.adset_name,
          });
        }
      }
    }
    return ads;
  }));
  return results.flat();
}

// ─── Flat campaign-level view across all accounts (1 row per campaign) ───────
export type CampaignFlatRow = Row & {
  account_id: string;
  account_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_count: number;
  ad_count: number;
};

export async function fetchAllCampaignsFlat(preset: string, attribution?: Attribution): Promise<CampaignFlatRow[]> {
  const attrib = attribution ?? await fetchAttribution(preset);
  const results = await Promise.all(SLEEP_ACCOUNTS.map(async (a) => {
    const bd: any = await fetchAccountBreakdown(a.id, preset, attrib);
    if (bd.error) return [] as CampaignFlatRow[];
    const camps: CampaignFlatRow[] = [];
    for (const c of bd.campaigns || []) {
      const allAds = (c.adsets || []).flatMap((x: any) => x.ads || []);
      camps.push({
        ...c,
        ccy: a.ccy,
        account_id: a.id,
        account_name: a.name,
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        adset_count: (c.adsets || []).length,
        ad_count: allAds.length,
        ads_active: allAds.length,
        ads_delivering: allAds.filter((x: any) => (x.impressions || 0) > 0).length,
      });
    }
    return camps;
  }));
  return results.flat();
}

// ─── Flat adset-level view across all accounts (1 row per adset) ─────────────
export type AdsetFlatRow = Row & {
  account_id: string;
  account_name: string;
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  ad_count: number;
};

export async function fetchAllAdsetsFlat(preset: string, attribution?: Attribution): Promise<AdsetFlatRow[]> {
  const attrib = attribution ?? await fetchAttribution(preset);
  const results = await Promise.all(SLEEP_ACCOUNTS.map(async (a) => {
    const bd: any = await fetchAccountBreakdown(a.id, preset, attrib);
    if (bd.error) return [] as AdsetFlatRow[];
    const rows: AdsetFlatRow[] = [];
    for (const c of bd.campaigns || []) {
      for (const aset of c.adsets || []) {
        const ads = aset.ads || [];
        rows.push({
          ...aset,
          ccy: a.ccy,
          account_id: a.id,
          account_name: a.name,
          campaign_id: c.campaign_id,
          campaign_name: c.campaign_name,
          adset_id: aset.adset_id,
          adset_name: aset.adset_name,
          ad_count: ads.length,
          ads_active: ads.length,
          ads_delivering: ads.filter((x: any) => (x.impressions || 0) > 0).length,
        });
      }
    }
    return rows;
  }));
  return results.flat();
}

// ─── Lead stats ────────────────────────────────────────────────────────────────
export type RecentLead = {
  email: string;
  created_at: string;
  purchased: boolean;
  hero_variant: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  fb_ad_id: string | null;
};

export type LeadStats = {
  total: number; purchased: number;
  recovery_0: number; recovery_1: number; recovery_2: number; recovery_3: number;
  with_whatsapp: number; with_name: number;
  by_hook: Record<string, number>;
  recent_24h: number;
  recent_leads: RecentLead[];
};

// Extract Meta ad_id from fbc cookie value.
// fbc format: fb.<subdomainIndex>.<creationTimestamp>.<fbclid>
// Meta does not embed ad_id in fbc directly. We instead use utm_content (we set it to {{ad.id}} in URL params).
function extractAdId(utm_content: string | null): string | null {
  if (!utm_content) return null;
  // utm_content set to {{ad.id}} → resolves to numeric ad id
  if (/^\d{10,}$/.test(utm_content.trim())) return utm_content.trim();
  return null;
}

export async function fetchLeadStats(): Promise<LeadStats> {
  const overall = await db.select({
    total: sql<number>`count(*)::int`,
    purchased: sql<number>`count(*) filter (where purchased = true)::int`,
    recovery_0: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 0)::int`,
    recovery_1: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 1)::int`,
    recovery_2: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 2)::int`,
    recovery_3: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 3)::int`,
    with_whatsapp: sql<number>`count(*) filter (where whatsapp is not null and whatsapp <> '')::int`,
    with_name: sql<number>`count(*) filter (where name is not null and name <> '')::int`,
    recent_24h: sql<number>`count(*) filter (where created_at > now() - interval '24 hours')::int`,
  }).from(leadsTable);

  const hooks = await db.select({
    hero_variant: leadsTable.heroVariant,
    n: sql<number>`count(*)::int`,
  }).from(leadsTable).groupBy(leadsTable.heroVariant);

  const recentRows = await db.select({
    email: leadsTable.email,
    created_at: leadsTable.createdAt,
    purchased: leadsTable.purchased,
    hero_variant: leadsTable.heroVariant,
    utm_source: leadsTable.utmSource,
    utm_medium: leadsTable.utmMedium,
    utm_campaign: leadsTable.utmCampaign,
    utm_content: leadsTable.utmContent,
  }).from(leadsTable).orderBy(sql`created_at desc`).limit(25);

  const recent_leads: RecentLead[] = recentRows.map((r: any) => ({
    email: r.email,
    created_at: (r.created_at as unknown as Date).toISOString(),
    purchased: r.purchased,
    hero_variant: r.hero_variant ?? null,
    utm_source: r.utm_source ?? null,
    utm_medium: r.utm_medium ?? null,
    utm_campaign: r.utm_campaign ?? null,
    utm_content: r.utm_content ?? null,
    fb_ad_id: extractAdId(r.utm_content ?? null),
  }));

  const by_hook: Record<string, number> = {};
  for (const h of hooks) by_hook[h.hero_variant ?? "default"] = h.n;
  return { ...overall[0], by_hook, recent_leads };
}

// ─── Stripe revenue ────────────────────────────────────────────────────────────
export type StripeRevenue = {
  total_payments: number; total_revenue_eur: number;
  recent_payments: { email: string; amount_eur: number; created: string }[];
};

export async function fetchStripeRevenue(days = 7): Promise<StripeRevenue> {
  try {
    const stripe = getStripeClient();
    const since = Math.floor((Date.now() - days * 86400000) / 1000);
    const charges = await stripe.charges.list({ created: { gte: since }, limit: 100 });
    const paid = charges.data.filter((c) => c.paid && !c.refunded);
    const total_revenue_eur = paid.reduce((acc, c) => {
      const rate = FX_TO_EUR[(c.currency ?? "eur").toUpperCase()] ?? 1;
      return acc + (c.amount / 100) * rate;
    }, 0);
    return {
      total_payments: paid.length,
      total_revenue_eur,
      recent_payments: paid.slice(0, 10).map((c) => ({
        email: c.billing_details?.email ?? c.receipt_email ?? "—",
        amount_eur: (c.amount / 100) * (FX_TO_EUR[(c.currency ?? "eur").toUpperCase()] ?? 1),
        created: new Date(c.created * 1000).toISOString().slice(0, 16).replace("T", " "),
      })),
    };
  } catch (e) {
    return { total_payments: 0, total_revenue_eur: 0, recent_payments: [] };
  }
}

// ─── Home page funnel (Meta ad delivery → DB engagement → leads → purchases) ───
export type HomeFunnelStep = {
  key: string;
  label: string;
  n: number;
  source: "meta" | "db";
  note?: string;
};
export type HomeFunnel = {
  preset: string;
  since: string;
  until: string;
  steps: HomeFunnelStep[];
};

export async function fetchHomeFunnel(preset: string): Promise<HomeFunnel> {
  const { since, until } = presetToRange(preset);

  // ── Meta side: impressions + LPV + IC + Purchase across all accounts ─────
  let metaImpr = 0, metaLpv = 0, metaIc = 0;
  try {
    const accounts = await fetchAllAccounts(preset);
    for (const a of accounts) {
      metaImpr += a.impressions || 0;
      metaLpv += a.landing_views || 0;
      metaIc += a.initiated_checkout || 0;
    }
  } catch { /* keep zeros */ }

  // ── DB side: engagement_events grouped by event, distinct client_id ─────
  const evRows = await db.execute<{ event: string; n: number }>(sql`
    SELECT event, COUNT(DISTINCT client_id)::int AS n
    FROM engagement_events
    WHERE created_at >= ${since.toISOString()} AND created_at < ${until.toISOString()}
    GROUP BY event
  `);
  const ev: Record<string, number> = {};
  // drizzle returns either { rows: [...] } or [...] depending on driver — handle both
  const evArr: any[] = Array.isArray((evRows as any).rows) ? (evRows as any).rows : (evRows as any);
  for (const r of evArr) ev[r.event] = Number(r.n) || 0;

  // ── DB side: leads + paid leads in window ────────────────────────────────
  const leadRows = await db.execute<{ leads: number; paid: number }>(sql`
    SELECT
      COUNT(*) FILTER (WHERE created_at >= ${since.toISOString()} AND created_at < ${until.toISOString()})::int AS leads,
      COUNT(*) FILTER (WHERE purchased = true
                       AND purchased_at >= ${since.toISOString()}
                       AND purchased_at < ${until.toISOString()})::int AS paid
    FROM leads
  `);
  const leadArr: any[] = Array.isArray((leadRows as any).rows) ? (leadRows as any).rows : (leadRows as any);
  const dbLeads = Number(leadArr[0]?.leads ?? 0);
  const dbPaid  = Number(leadArr[0]?.paid ?? 0);

  const steps: HomeFunnelStep[] = [
    { key: "impr",       label: "Impressions (Meta)",        n: metaImpr,                source: "meta", note: "ad views in feed" },
    { key: "lpv",        label: "Landing Page View (Meta)",  n: metaLpv,                 source: "meta", note: "browser reached home (Meta count)" },
    { key: "page_view",  label: "Page View (DB)",            n: ev.page_view || 0,       source: "db",   note: "distinct visitors logged on our server (adblocker-affected)" },
    { key: "scroll_50",  label: "Scroll 50%",                n: ev.scroll_50 || 0,       source: "db" },
    { key: "scroll_75",  label: "Scroll 75%",                n: ev.scroll_75 || 0,       source: "db" },
    { key: "vsl_play",   label: "VSL Play (unmute)",         n: ev.vsl_play || 0,        source: "db",   note: "tapped 'tap for sound'" },
    { key: "vsl_25",     label: "VSL 25% watched",           n: ev.vsl_25 || 0,          source: "db" },
    { key: "vsl_50",     label: "VSL 50% watched",           n: ev.vsl_50 || 0,          source: "db" },
    { key: "vsl_75",     label: "VSL 75% watched",           n: ev.vsl_75 || 0,          source: "db" },
    { key: "vsl_done",   label: "VSL completed",             n: ev.vsl_complete || 0,    source: "db" },
    { key: "cta_click",  label: "CTA click (scroll to form)",n: ev.cta_click || 0,       source: "db" },
    { key: "form_submit",label: "Form submitted",            n: ev.form_submit || 0,     source: "db",   note: "clicked Continue to Stripe" },
    { key: "lead",       label: "Lead (DB row created)",     n: dbLeads,                 source: "db",   note: "server-side, not blocked by adblocker" },
    { key: "ic_meta",    label: "Initiate Checkout (Meta px)",n: metaIc,                 source: "meta" },
    { key: "purchase",   label: "Purchase (DB)",             n: dbPaid,                  source: "db",   note: "Stripe-confirmed" },
  ];

  return { preset, since: since.toISOString(), until: until.toISOString(), steps };
}
