import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

const API_VERSION = "2024-10";

type ShopifyCreds = { shop: string; token: string };

function getCreds(extras?: Record<string, string>): ShopifyCreds | null {
  const shop = extras?.SHOPIFY_SHOP || process.env.SHOPIFY_SHOP;
  const token = extras?.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;
  if (!shop || !token) return null;
  return { shop: shop.replace(/^https?:\/\//, "").replace(/\/$/, ""), token };
}

async function gql(
  creds: ShopifyCreds,
  query: string,
  variables?: Record<string, unknown>,
): Promise<any> {
  const url = `https://${creds.shop}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": creds.token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GQL: ${json.errors[0].message}`);
  }
  return json.data;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(days: number): { start: string; end: string; dates: string[] } {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(isoDay(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return { start: isoDay(start), end: isoDay(end), dates };
}

type OrderNode = {
  createdAt: string;
  totalPriceSet: { shopMoney: { amount: string } };
  displayFulfillmentStatus: string;
  fulfillments: { createdAt: string }[];
};

async function fetchOrders(
  creds: ShopifyCreds,
  sinceDate: string,
  untilDate: string,
): Promise<OrderNode[]> {
  const orders: OrderNode[] = [];
  let cursor: string | null = null;
  const maxPages = 20;

  for (let page = 0; page < maxPages; page++) {
    const afterClause = cursor ? `, after: "${cursor}"` : "";
    const query = `{
      orders(first: 250, query: "created_at:>=${sinceDate} created_at:<=${untilDate}T23:59:59Z", sortKey: CREATED_AT${afterClause}) {
        edges {
          cursor
          node {
            createdAt
            totalPriceSet { shopMoney { amount } }
            displayFulfillmentStatus
            fulfillments(first: 1) { createdAt }
          }
        }
        pageInfo { hasNextPage }
      }
    }`;
    const data = await gql(creds, query);
    const edges = data.orders.edges;
    for (const edge of edges) {
      orders.push(edge.node);
      cursor = edge.cursor;
    }
    if (!data.orders.pageInfo.hasNextPage) break;
  }
  return orders;
}

function bucketByDay(
  orders: OrderNode[],
  dates: string[],
): Map<string, OrderNode[]> {
  const map = new Map<string, OrderNode[]>();
  for (const d of dates) map.set(d, []);
  for (const o of orders) {
    const day = o.createdAt.slice(0, 10);
    const bucket = map.get(day);
    if (bucket) bucket.push(o);
  }
  return map;
}

function buildSamples(
  dailyValues: Map<string, number>,
  dates: string[],
): { date: string; value: number }[] {
  return dates.map((d) => ({ date: d, value: dailyValues.get(d) ?? 0 }));
}

export async function fetchShopifyMetric(
  kpi: KPI,
  target: Target,
  credentials?: Record<string, string>,
): Promise<MetricResult> {
  const creds = getCreds(credentials);
  if (!creds) {
    return simulate(kpi, target, "Shopify credentials not configured — add them in Integrations.");
  }

  try {
    const days = 30;
    const { start, end, dates } = dateRange(days);
    const orders = await fetchOrders(creds, start, end);
    const buckets = bucketByDay(orders, dates);

    const key = kpi.metricKey.toLowerCase();

    if (key === "orders.total_sales" || key.includes("total_sales")) {
      return buildRevenueResult(kpi, buckets, dates);
    }
    if (key === "orders.aov" || key.includes("aov")) {
      return buildAOVResult(kpi, buckets, dates);
    }
    if (key === "orders.count" || key.includes("order_count")) {
      return buildOrderCountResult(kpi, buckets, dates);
    }
    if (key.includes("fulfillment") || key.includes("sla")) {
      return buildFulfillmentSLAResult(kpi, buckets, dates);
    }
    if (key.includes("checkout") || key.includes("completion")) {
      return buildCheckoutResult(kpi, buckets, dates);
    }
    if (key.includes("conversion") || key.includes("cvr")) {
      return simulate(kpi, target,
        "Conversion rate requires Shopify Analytics API (ShopifyQL) — not yet implemented. Using simulated data.");
    }

    // Fallback: try revenue
    return buildRevenueResult(kpi, buckets, dates);
  } catch (err: any) {
    return simulate(kpi, target, `Shopify error: ${err?.message || "Unknown"}`);
  }
}

function buildRevenueResult(
  kpi: KPI,
  buckets: Map<string, OrderNode[]>,
  dates: string[],
): MetricResult {
  const dailyRevenue = new Map<string, number>();
  for (const [day, orders] of buckets) {
    dailyRevenue.set(
      day,
      orders.reduce((sum, o) => sum + parseFloat(o.totalPriceSet.shopMoney.amount), 0),
    );
  }
  const samples = buildSamples(dailyRevenue, dates);
  const today = samples[samples.length - 1]?.value ?? 0;
  const last7 = samples.slice(-7).reduce((a, s) => a + s.value, 0);
  const mtd = mtdSum(samples);
  return { today, last7, mtd, samples, source: "live", note: "Shopify Orders API" };
}

function buildAOVResult(
  kpi: KPI,
  buckets: Map<string, OrderNode[]>,
  dates: string[],
): MetricResult {
  const dailyAOV = new Map<string, number>();
  for (const [day, orders] of buckets) {
    if (orders.length === 0) { dailyAOV.set(day, 0); continue; }
    const total = orders.reduce((s, o) => s + parseFloat(o.totalPriceSet.shopMoney.amount), 0);
    dailyAOV.set(day, Math.round(total / orders.length));
  }
  const samples = buildSamples(dailyAOV, dates);
  const nonZero = samples.filter((s) => s.value > 0);
  const today = samples[samples.length - 1]?.value ?? 0;
  const last7Vals = samples.slice(-7).filter((s) => s.value > 0);
  const last7 = last7Vals.length ? Math.round(last7Vals.reduce((a, s) => a + s.value, 0) / last7Vals.length) : 0;
  const mtdVals = mtdSamples(samples).filter((s) => s.value > 0);
  const mtd = mtdVals.length ? Math.round(mtdVals.reduce((a, s) => a + s.value, 0) / mtdVals.length) : 0;
  return { today, last7, mtd, samples, source: "live", note: "Shopify Orders API (AOV)" };
}

function buildOrderCountResult(
  kpi: KPI,
  buckets: Map<string, OrderNode[]>,
  dates: string[],
): MetricResult {
  const daily = new Map<string, number>();
  for (const [day, orders] of buckets) daily.set(day, orders.length);
  const samples = buildSamples(daily, dates);
  const today = samples[samples.length - 1]?.value ?? 0;
  const last7 = samples.slice(-7).reduce((a, s) => a + s.value, 0);
  const mtd = mtdSum(samples);
  return { today, last7, mtd, samples, source: "live", note: "Shopify Orders API (count)" };
}

function buildFulfillmentSLAResult(
  kpi: KPI,
  buckets: Map<string, OrderNode[]>,
  dates: string[],
): MetricResult {
  const slaHours = 24;
  const dailyPct = new Map<string, number>();
  for (const [day, orders] of buckets) {
    if (orders.length === 0) { dailyPct.set(day, 100); continue; }
    let withinSLA = 0;
    for (const o of orders) {
      if (o.fulfillments.length > 0) {
        const orderTime = new Date(o.createdAt).getTime();
        const fulfillTime = new Date(o.fulfillments[0].createdAt).getTime();
        if ((fulfillTime - orderTime) / 3600000 <= slaHours) withinSLA++;
      }
    }
    dailyPct.set(day, orders.length > 0 ? Number(((withinSLA / orders.length) * 100).toFixed(1)) : 100);
  }
  const samples = buildSamples(dailyPct, dates);
  const today = samples[samples.length - 1]?.value ?? 0;
  const last7Vals = samples.slice(-7);
  const last7 = Number((last7Vals.reduce((a, s) => a + s.value, 0) / last7Vals.length).toFixed(1));
  const mtdVals = mtdSamples(samples);
  const mtd = mtdVals.length ? Number((mtdVals.reduce((a, s) => a + s.value, 0) / mtdVals.length).toFixed(1)) : 0;
  return { today, last7, mtd, samples, source: "live", note: "Shopify Fulfillments (24h SLA)" };
}

function buildCheckoutResult(
  kpi: KPI,
  buckets: Map<string, OrderNode[]>,
  dates: string[],
): MetricResult {
  // Checkout completion isn't directly available from the Orders API.
  // As a proxy, we count fulfilled/paid orders vs total orders.
  const dailyPct = new Map<string, number>();
  for (const [day, orders] of buckets) {
    if (orders.length === 0) { dailyPct.set(day, 0); continue; }
    const paid = orders.filter((o) =>
      o.displayFulfillmentStatus !== "RESTOCKED" &&
      parseFloat(o.totalPriceSet.shopMoney.amount) > 0
    ).length;
    dailyPct.set(day, Number(((paid / orders.length) * 100).toFixed(1)));
  }
  const samples = buildSamples(dailyPct, dates);
  const today = samples[samples.length - 1]?.value ?? 0;
  const last7Vals = samples.slice(-7);
  const last7 = Number((last7Vals.reduce((a, s) => a + s.value, 0) / last7Vals.length).toFixed(1));
  const mtdVals = mtdSamples(samples);
  const mtd = mtdVals.length ? Number((mtdVals.reduce((a, s) => a + s.value, 0) / mtdVals.length).toFixed(1)) : 0;
  return { today, last7, mtd, samples, source: "live", note: "Shopify Orders (paid ratio proxy)" };
}

function mtdSamples(samples: { date: string; value: number }[]): typeof samples {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return samples.filter((s) => s.date.startsWith(prefix));
}

function mtdSum(samples: { date: string; value: number }[]): number {
  return mtdSamples(samples).reduce((a, s) => a + s.value, 0);
}

export type ShopifySummary = {
  source: "live" | "simulated";
  note?: string;
  dateRange: { start: string; end: string; days: number };
  /** Daily samples — one entry per day in the range */
  samples: {
    date: string;
    revenue: number;
    orders: number;
    fulfillmentsWithinSLA: number;
    paidOrders: number;
  }[];
  totals: {
    revenue: number;
    orders: number;
    aov: number;
    fulfillmentSLAPct: number;
    paidRatioPct: number;
  };
};

/**
 * Pull a single 1-pass summary for the dashboard. Fetches every order in
 * [startISO, endISO] and computes daily revenue / order count / fulfillment
 * SLA / paid ratio, plus overall totals.
 *
 * Uses credentials from the request (or env vars as fallback). Returns a
 * simulated summary if credentials are missing so the UI still renders.
 */
export async function fetchShopifySummary(
  credentials: Record<string, string> | undefined,
  startISO: string,
  endISO: string,
): Promise<ShopifySummary> {
  const creds = getCreds(credentials);
  const days = Math.max(
    1,
    Math.round(
      (new Date(endISO).getTime() - new Date(startISO).getTime()) / 86400000,
    ) + 1,
  );

  const dates: string[] = [];
  const cur = new Date(startISO);
  cur.setHours(0, 0, 0, 0);
  const endDate = new Date(endISO);
  endDate.setHours(0, 0, 0, 0);
  while (cur <= endDate) {
    dates.push(isoDay(cur));
    cur.setDate(cur.getDate() + 1);
  }

  if (!creds) {
    return simulateSummary(startISO, endISO, dates);
  }

  try {
    const orders = await fetchOrders(creds, startISO, endISO);
    return buildSummary(orders, dates, startISO, endISO);
  } catch (err: any) {
    return simulateSummary(
      startISO,
      endISO,
      dates,
      `Shopify error: ${err?.message || "Unknown"} — showing simulated data.`,
    );
  }
}

function buildSummary(
  orders: OrderNode[],
  dates: string[],
  startISO: string,
  endISO: string,
): ShopifySummary {
  const dailyRevenue = new Map<string, number>();
  const dailyOrders = new Map<string, number>();
  const dailyInSLA = new Map<string, number>();
  const dailyPaid = new Map<string, number>();
  for (const d of dates) {
    dailyRevenue.set(d, 0);
    dailyOrders.set(d, 0);
    dailyInSLA.set(d, 0);
    dailyPaid.set(d, 0);
  }
  for (const o of orders) {
    const day = o.createdAt.slice(0, 10);
    if (!dailyRevenue.has(day)) continue;
    const amount = parseFloat(o.totalPriceSet.shopMoney.amount);
    dailyRevenue.set(day, (dailyRevenue.get(day) || 0) + amount);
    dailyOrders.set(day, (dailyOrders.get(day) || 0) + 1);
    if (amount > 0) dailyPaid.set(day, (dailyPaid.get(day) || 0) + 1);
    if (o.fulfillments.length > 0) {
      const diffH =
        (new Date(o.fulfillments[0].createdAt).getTime() -
          new Date(o.createdAt).getTime()) /
        3_600_000;
      if (diffH <= 24) dailyInSLA.set(day, (dailyInSLA.get(day) || 0) + 1);
    }
  }

  const samples = dates.map((d) => ({
    date: d,
    revenue: round2(dailyRevenue.get(d) || 0),
    orders: dailyOrders.get(d) || 0,
    fulfillmentsWithinSLA: dailyInSLA.get(d) || 0,
    paidOrders: dailyPaid.get(d) || 0,
  }));

  const totalRev = samples.reduce((a, s) => a + s.revenue, 0);
  const totalOrders = samples.reduce((a, s) => a + s.orders, 0);
  const totalInSLA = samples.reduce((a, s) => a + s.fulfillmentsWithinSLA, 0);
  const totalPaid = samples.reduce((a, s) => a + s.paidOrders, 0);
  const fulfillable = samples.reduce(
    (a, s) => a + Math.min(s.orders, s.fulfillmentsWithinSLA === 0 ? s.orders : s.orders),
    0,
  );

  return {
    source: "live",
    dateRange: { start: startISO, end: endISO, days: dates.length },
    samples,
    totals: {
      revenue: round2(totalRev),
      orders: totalOrders,
      aov: totalOrders > 0 ? round2(totalRev / totalOrders) : 0,
      fulfillmentSLAPct:
        fulfillable > 0 ? Number(((totalInSLA / Math.max(1, totalOrders)) * 100).toFixed(1)) : 0,
      paidRatioPct:
        totalOrders > 0 ? Number(((totalPaid / totalOrders) * 100).toFixed(1)) : 0,
    },
  };
}

function simulateSummary(
  startISO: string,
  endISO: string,
  dates: string[],
  note = "Shopify credentials not configured — showing simulated data.",
): ShopifySummary {
  const avgDailyRev = 45000; // placeholder daily avg
  const avgOrders = 300;
  const samples = dates.map((d, i) => {
    const drift = Math.sin(i * 0.6) * 0.15;
    const jitter = (Math.random() - 0.5) * 0.2;
    const rev = Math.max(0, Math.round(avgDailyRev * (1 + drift + jitter)));
    const ords = Math.max(0, Math.round(avgOrders * (1 + drift + jitter)));
    return {
      date: d,
      revenue: rev,
      orders: ords,
      fulfillmentsWithinSLA: Math.round(ords * (0.95 + Math.random() * 0.04)),
      paidOrders: Math.round(ords * (0.97 + Math.random() * 0.02)),
    };
  });
  const totalRev = samples.reduce((a, s) => a + s.revenue, 0);
  const totalOrders = samples.reduce((a, s) => a + s.orders, 0);
  const totalInSLA = samples.reduce((a, s) => a + s.fulfillmentsWithinSLA, 0);
  const totalPaid = samples.reduce((a, s) => a + s.paidOrders, 0);
  return {
    source: "simulated",
    note,
    dateRange: { start: startISO, end: endISO, days: dates.length },
    samples,
    totals: {
      revenue: totalRev,
      orders: totalOrders,
      aov: totalOrders > 0 ? round2(totalRev / totalOrders) : 0,
      fulfillmentSLAPct:
        totalOrders > 0 ? Number(((totalInSLA / totalOrders) * 100).toFixed(1)) : 0,
      paidRatioPct:
        totalOrders > 0 ? Number(((totalPaid / totalOrders) * 100).toFixed(1)) : 0,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
