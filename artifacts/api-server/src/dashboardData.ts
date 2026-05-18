/**
 * Sleep Wired — Dashboard data aggregator
 * Pulls live Meta Insights for the 15 Sleep ad accounts + Stripe revenue + lead funnel from our DB.
 */
import { db, leadsTable } from "@workspace/db";
import { sql, gte } from "drizzle-orm";
import { getStripeClient } from "./stripeClient";

const META_API_VERSION = "v21.0";
const META_TOKEN = () => process.env.META_ACCESS_TOKEN || process.env.META_DATASET_QUALITY_TOKEN || "";

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

// Approx FX rates to EUR (refresh manually or via API later)
const FX_TO_EUR: Record<string, number> = { EUR: 1.0, CHF: 1.05, BRL: 0.16, USD: 0.92 };

export type AccountInsights = {
  name: string;
  account_id: string;
  ccy: string;
  spend: number;
  spend_eur: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  link_clicks: number;
  landing_views: number;
  purchases: number;
  purchase_value: number;
  cpa: number | null;
  roas: number | null;
  hook_rate: number | null;
  status_err?: string;
};

async function fetchAccountInsights(acct: { name: string; id: string; ccy: string }, datePreset: string): Promise<AccountInsights> {
  const url = `https://graph.facebook.com/${META_API_VERSION}/${acct.id}/insights`;
  const params = new URLSearchParams({
    fields: "spend,impressions,reach,clicks,ctr,cpm,cpc,actions,action_values,video_thruplay_watched_actions,video_p25_watched_actions",
    date_preset: datePreset,
    level: "account",
    access_token: META_TOKEN(),
  });

  try {
    const resp = await fetch(`${url}?${params.toString()}`);
    const data = await resp.json();
    if (data.error) {
      return blank(acct, `API err: ${data.error.message?.slice(0, 80)}`);
    }
    const row = data.data?.[0];
    if (!row) {
      return blank(acct, "no data");
    }
    const actions: { action_type: string; value: string }[] = row.actions || [];
    const actionValues: { action_type: string; value: string }[] = row.action_values || [];
    const findAction = (t: string) => Number(actions.find((a) => a.action_type === t)?.value ?? 0);
    const findValue = (t: string) => Number(actionValues.find((a) => a.action_type === t)?.value ?? 0);
    const findThruPlay = () => Number((row.video_thruplay_watched_actions || [])[0]?.value ?? 0);
    const findP25 = () => Number((row.video_p25_watched_actions || [])[0]?.value ?? 0);

    const spend = Number(row.spend ?? 0);
    const impressions = Number(row.impressions ?? 0);
    const reach = Number(row.reach ?? 0);
    const clicks = Number(row.clicks ?? 0);
    const ctr = Number(row.ctr ?? 0);
    const cpm = Number(row.cpm ?? 0);
    const cpc = Number(row.cpc ?? 0);
    const link_clicks = findAction("link_click");
    const landing_views = findAction("landing_page_view");
    const purchases =
      findAction("purchase") ||
      findAction("omni_purchase") ||
      findAction("offsite_conversion.fb_pixel_purchase");
    const purchase_value =
      findValue("purchase") ||
      findValue("omni_purchase") ||
      findValue("offsite_conversion.fb_pixel_purchase");
    const thruPlay = findThruPlay();
    const p25 = findP25();

    return {
      name: acct.name,
      account_id: acct.id,
      ccy: acct.ccy,
      spend,
      spend_eur: spend * (FX_TO_EUR[acct.ccy] ?? 1),
      impressions,
      reach,
      clicks,
      ctr,
      cpm,
      cpc,
      link_clicks,
      landing_views,
      purchases,
      purchase_value,
      cpa: purchases > 0 ? spend / purchases : null,
      roas: spend > 0 ? purchase_value / spend : null,
      hook_rate: thruPlay > 0 && p25 > 0 ? thruPlay / p25 : null,
    };
  } catch (e) {
    return blank(acct, `fetch err: ${(e as Error).message?.slice(0, 80)}`);
  }
}

function blank(acct: { name: string; id: string; ccy: string }, err: string): AccountInsights {
  return {
    name: acct.name, account_id: acct.id, ccy: acct.ccy,
    spend: 0, spend_eur: 0, impressions: 0, reach: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0,
    link_clicks: 0, landing_views: 0, purchases: 0, purchase_value: 0,
    cpa: null, roas: null, hook_rate: null, status_err: err,
  };
}

export async function fetchAllAccounts(datePreset: string): Promise<AccountInsights[]> {
  return Promise.all(SLEEP_ACCOUNTS.map((a) => fetchAccountInsights(a, datePreset)));
}

export type LeadStats = {
  total: number;
  purchased: number;
  recovery_0: number;
  recovery_1: number;
  recovery_2: number;
  recovery_3: number;
  with_whatsapp: number;
  with_name: number;
  by_hook: Record<string, number>;
  recent_24h: number;
};

export async function fetchLeadStats(): Promise<LeadStats> {
  const overall = await db
    .select({
      total: sql<number>`count(*)::int`,
      purchased: sql<number>`count(*) filter (where purchased = true)::int`,
      recovery_0: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 0)::int`,
      recovery_1: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 1)::int`,
      recovery_2: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 2)::int`,
      recovery_3: sql<number>`count(*) filter (where purchased = false and recovery_sent_count = 3)::int`,
      with_whatsapp: sql<number>`count(*) filter (where whatsapp is not null and whatsapp <> '')::int`,
      with_name: sql<number>`count(*) filter (where name is not null and name <> '')::int`,
      recent_24h: sql<number>`count(*) filter (where created_at > now() - interval '24 hours')::int`,
    })
    .from(leadsTable);

  const hooks = await db
    .select({
      hero_variant: leadsTable.heroVariant,
      n: sql<number>`count(*)::int`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.heroVariant);

  const by_hook: Record<string, number> = {};
  for (const h of hooks) by_hook[h.hero_variant ?? "default"] = h.n;

  return { ...overall[0], by_hook };
}

export type StripeRevenue = {
  total_payments: number;
  total_revenue_eur: number;
  recent_payments: { email: string; amount_eur: number; created: string }[];
};

export async function fetchStripeRevenue(days = 7): Promise<StripeRevenue> {
  try {
    const stripe = getStripeClient();
    const since = Math.floor((Date.now() - days * 86400000) / 1000);
    const charges = await stripe.charges.list({
      created: { gte: since },
      limit: 100,
    });
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
