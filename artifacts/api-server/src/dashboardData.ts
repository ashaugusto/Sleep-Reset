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
  { name: "conta01",            id: "act_1011385913107820", ccy: "BRL" },
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
  // funnel actions
  leads: number; initiated_checkout: number; purchases: number; purchase_value: number;
  view_content: number;
  // derived
  cpa: number | null; roas: number | null;
  cpl: number | null; cost_per_lpv: number | null;
  // video
  v_3s: number; v_p25: number; v_p50: number; v_p75: number; v_p95: number;
  v_thruplay: number; v_avg_time: number;
  hook_rate: number | null; hold_rate: number | null;
  // diagnostics
  status_err?: string;
};

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
    cpa: purchases > 0 ? spend / purchases : null,
    roas: spend > 0 ? purchase_value / spend : null,
    cpl: leads > 0 ? spend / leads : null,
    cost_per_lpv: landing_views > 0 ? spend / landing_views : null,
    v_3s, v_p25, v_p50, v_p75, v_p95, v_thruplay, v_avg_time,
    hook_rate: impressions > 0 ? v_3s / impressions : null,
    hold_rate: v_3s > 0 ? v_thruplay / v_3s : null,
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

export async function fetchAccountInsights(acct: { name: string; id: string; ccy: string }, preset: string): Promise<Row & { name: string; account_id: string; ccy: string }> {
  try {
    const data = await metaGet(`${acct.id}/insights`, {
      fields: FIELDS,
      level: "account",
      ...buildTimeParams(preset),
    });
    if (data.error) {
      return { ...blank(acct.ccy), name: acct.name, account_id: acct.id, ccy: acct.ccy, status_err: `API: ${data.error.message?.slice(0, 80)}` };
    }
    const row = data.data?.[0];
    if (!row) return { ...blank(acct.ccy), name: acct.name, account_id: acct.id, ccy: acct.ccy, status_err: "no data" };
    return { ...parseRow(row, acct.ccy), name: acct.name, account_id: acct.id, ccy: acct.ccy };
  } catch (e) {
    return { ...blank(acct.ccy), name: acct.name, account_id: acct.id, ccy: acct.ccy, status_err: `fetch: ${(e as Error).message?.slice(0, 80)}` };
  }
}

function blank(ccy: string): Row {
  return {
    spend: 0, spend_eur: 0, impressions: 0, reach: 0, frequency: 0,
    clicks: 0, link_clicks: 0, landing_views: 0, ctr: 0, cpm: 0, cpc: 0,
    leads: 0, initiated_checkout: 0, purchases: 0, purchase_value: 0, view_content: 0,
    cpa: null, roas: null, cpl: null, cost_per_lpv: null,
    v_3s: 0, v_p25: 0, v_p50: 0, v_p75: 0, v_p95: 0, v_thruplay: 0, v_avg_time: 0,
    hook_rate: null, hold_rate: null,
  };
}

export async function fetchAllAccounts(preset: string) {
  return Promise.all(SLEEP_ACCOUNTS.map((a) => fetchAccountInsights(a, preset)));
}

// ─── Drilldown: campaigns → adsets → ads inside one account ───────────────────
export async function fetchAccountBreakdown(accountId: string, preset: string) {
  const acct = SLEEP_ACCOUNTS.find((a) => a.id === accountId);
  if (!acct) return { error: "unknown account" };

  // Get insights at level=ad with breakdown (each row = ad + parent ids)
  const data = await metaGet(`${acct.id}/insights`, {
    fields: `campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,${FIELDS}`,
    level: "ad",
    limit: "200",
    ...buildTimeParams(preset),
  });
  if (data.error) return { error: data.error.message };

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
      camps[cid] = { ...blank(acct.ccy), campaign_id: cid, campaign_name: row.campaign_name, adsets: {} };
    }
    if (!camps[cid].adsets[asid]) {
      camps[cid].adsets[asid] = { ...blank(acct.ccy), adset_id: asid, adset_name: row.adset_name, ads: [] };
    }
    camps[cid].adsets[asid].ads.push({ ...parsed, ad_id: aid, ad_name: row.ad_name });
  }

  // Aggregate ads → adsets → camps
  for (const c of Object.values(camps)) {
    for (const a of Object.values(c.adsets)) {
      a.spend = a.ads.reduce((s, x) => s + x.spend, 0);
      a.spend_eur = a.ads.reduce((s, x) => s + x.spend_eur, 0);
      a.impressions = a.ads.reduce((s, x) => s + x.impressions, 0);
      a.link_clicks = a.ads.reduce((s, x) => s + x.link_clicks, 0);
      a.landing_views = a.ads.reduce((s, x) => s + x.landing_views, 0);
      a.purchases = a.ads.reduce((s, x) => s + x.purchases, 0);
      a.purchase_value = a.ads.reduce((s, x) => s + x.purchase_value, 0);
      a.leads = a.ads.reduce((s, x) => s + x.leads, 0);
      a.initiated_checkout = a.ads.reduce((s, x) => s + x.initiated_checkout, 0);
      a.v_3s = a.ads.reduce((s, x) => s + x.v_3s, 0);
      a.v_thruplay = a.ads.reduce((s, x) => s + x.v_thruplay, 0);
      a.cpa = a.purchases > 0 ? a.spend / a.purchases : null;
      a.roas = a.spend > 0 ? a.purchase_value / a.spend : null;
      a.hook_rate = a.impressions > 0 ? a.v_3s / a.impressions : null;
    }
    const adsets = Object.values(c.adsets);
    c.spend = adsets.reduce((s, x) => s + x.spend, 0);
    c.spend_eur = adsets.reduce((s, x) => s + x.spend_eur, 0);
    c.impressions = adsets.reduce((s, x) => s + x.impressions, 0);
    c.link_clicks = adsets.reduce((s, x) => s + x.link_clicks, 0);
    c.landing_views = adsets.reduce((s, x) => s + x.landing_views, 0);
    c.purchases = adsets.reduce((s, x) => s + x.purchases, 0);
    c.purchase_value = adsets.reduce((s, x) => s + x.purchase_value, 0);
    c.leads = adsets.reduce((s, x) => s + x.leads, 0);
    c.cpa = c.purchases > 0 ? c.spend / c.purchases : null;
    c.roas = c.spend > 0 ? c.purchase_value / c.spend : null;
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

// ─── Lead stats ────────────────────────────────────────────────────────────────
export type LeadStats = {
  total: number; purchased: number;
  recovery_0: number; recovery_1: number; recovery_2: number; recovery_3: number;
  with_whatsapp: number; with_name: number;
  by_hook: Record<string, number>;
  recent_24h: number;
};

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

  const by_hook: Record<string, number> = {};
  for (const h of hooks) by_hook[h.hero_variant ?? "default"] = h.n;
  return { ...overall[0], by_hook };
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
