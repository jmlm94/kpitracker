import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

const BASE_URL = "https://api.triplewhale.com/api/v2";

type TWCreds = { apiKey: string; shopDomain: string };

function getCreds(extras?: Record<string, string>): TWCreds | null {
  const apiKey = extras?.TRIPLEWHALE_API_KEY || process.env.TRIPLEWHALE_API_KEY;
  const shopDomain =
    extras?.TRIPLEWHALE_SHOP_ID ||
    extras?.SHOPIFY_SHOP ||
    process.env.TRIPLEWHALE_SHOP_ID ||
    process.env.SHOPIFY_SHOP;
  if (!apiKey || !shopDomain) return null;
  return {
    apiKey,
    shopDomain: shopDomain.replace(/^https?:\/\//i, "").replace(/\/$/, ""),
  };
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

async function twFetch(
  creds: TWCreds,
  path: string,
  body: Record<string, unknown>,
): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": creds.apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Triple Whale API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Channel key mapping between our KPI metricKeys and Triple Whale's API
 * channel identifiers.
 */
function channelFromMetricKey(key: string): string | null {
  const k = key.toLowerCase();
  if (k.startsWith("meta.")) return "facebook";
  if (k.startsWith("google.")) return "google";
  if (k.startsWith("tiktok.") && !k.includes("shop")) return "tiktok";
  if (k.startsWith("snap.")) return "snapchat";
  if (k.startsWith("applovin.")) return "applovin";
  if (k.startsWith("blended.")) return "all";
  return null;
}

function metricFromMetricKey(key: string): string {
  const parts = key.split(".");
  const suffix = parts[parts.length - 1];
  const map: Record<string, string> = {
    roas: "roas",
    spend: "adSpend",
    cpa: "cpa",
    ctr: "ctr",
    cpm: "cpm",
    cpc: "cpc",
    hook_rate: "hookRate",
    cvr: "cvr",
    revenue: "revenue",
    cpa_branded: "cpa",
    cpa_nonbranded: "cpa",
    swipe_up: "ctr",
  };
  return map[suffix] || suffix;
}

export async function fetchTripleWhaleMetric(
  kpi: KPI,
  target: Target,
  credentials?: Record<string, string>,
): Promise<MetricResult> {
  const creds = getCreds(credentials);
  if (!creds) {
    return simulate(kpi, target, "Triple Whale API key not set — add it in Integrations.");
  }

  const channel = channelFromMetricKey(kpi.metricKey);
  if (!channel) {
    return simulate(kpi, target, `Unknown channel in metric key: ${kpi.metricKey}`);
  }

  const metric = metricFromMetricKey(kpi.metricKey);
  const days = 30;
  const { start, end, dates } = dateRange(days);

  try {
    const data = await twFetch(creds, "/tw-metrics/get-metrics-data", {
      shop_domain: creds.shopDomain,
      period: "day",
      start_date: start,
      end_date: end,
      metrics: [metric],
      channels: channel === "all" ? [] : [channel],
    });

    const dailyValues = new Map<string, number>();
    for (const d of dates) dailyValues.set(d, 0);

    // Triple Whale returns various formats; try to parse
    const entries = Array.isArray(data) ? data : data?.data || data?.metrics || [];
    for (const entry of entries) {
      const day =
        (entry.date || entry.day || entry.created_at || "").toString().slice(0, 10);
      const value = Number(entry[metric] ?? entry.value ?? 0);
      if (day && dailyValues.has(day)) {
        dailyValues.set(day, value);
      }
    }

    const samples = dates.map((d) => ({
      date: d,
      value: Number((dailyValues.get(d) || 0).toFixed(2)),
    }));

    const isAccumulate = kpi.unit === "currency" || kpi.unit === "number";
    const today = samples[samples.length - 1]?.value ?? 0;
    const last7Slice = samples.slice(-7);
    const last7 = isAccumulate
      ? last7Slice.reduce((a, s) => a + s.value, 0)
      : last7Slice.reduce((a, s) => a + s.value, 0) / Math.max(1, last7Slice.length);
    const mtdSlice = samples.filter((s) => {
      const now = new Date();
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      return s.date.startsWith(prefix);
    });
    const mtd = isAccumulate
      ? mtdSlice.reduce((a, s) => a + s.value, 0)
      : mtdSlice.reduce((a, s) => a + s.value, 0) / Math.max(1, mtdSlice.length);

    return {
      today,
      last7: Number(last7.toFixed(2)),
      mtd: Number(mtd.toFixed(2)),
      samples,
      source: "live",
      note: `Triple Whale · ${channel} · ${metric}`,
    };
  } catch (err: any) {
    return simulate(kpi, target, `Triple Whale error: ${err?.message || "Unknown"}`);
  }
}

/* ───────────────────────────────────────────────────────────────────── */
/*  Summary (multi-channel × multi-window matrix for dashboard)       */
/* ───────────────────────────────────────────────────────────────────── */

export type TWChannelRow = {
  channel: string;
  label: string;
  roas: number;
  spend: number;
  revenue: number;
  cpa: number;
  ctr: number;
};

export type TWSummary = {
  source: "live" | "simulated";
  note?: string;
  windows: Record<
    string,
    TWChannelRow[]
  >;
};

export const TW_WINDOWS = [
  { key: "today", label: "Today", days: 1, offset: 0 },
  { key: "yesterday", label: "Yesterday", days: 1, offset: 1 },
  { key: "last_7d", label: "7 Days", days: 7, offset: 0 },
  { key: "last_14d", label: "14 Days", days: 14, offset: 0 },
  { key: "last_30d", label: "30 Days", days: 30, offset: 0 },
] as const;

const CHANNELS = [
  { id: "facebook", label: "Meta" },
  { id: "google", label: "Google" },
  { id: "tiktok", label: "TikTok" },
  { id: "snapchat", label: "Snap" },
  { id: "applovin", label: "AppLovin" },
  { id: "all", label: "Blended" },
];

export async function fetchTWSummary(
  credentials: Record<string, string> | undefined,
): Promise<TWSummary> {
  const creds = getCreds(credentials);
  if (!creds) {
    return simulateTWSummary("Triple Whale API key not set.");
  }

  const { start, end, dates } = dateRange(30);

  try {
    const data = await twFetch(creds, "/tw-metrics/get-metrics-data", {
      shop_domain: creds.shopDomain,
      period: "day",
      start_date: start,
      end_date: end,
      metrics: ["roas", "adSpend", "revenue", "cpa", "ctr"],
      channels: CHANNELS.filter((c) => c.id !== "all").map((c) => c.id),
    });

    // Parse daily per-channel data
    type DayChannel = { roas: number; spend: number; revenue: number; cpa: number; ctr: number };
    const daily = new Map<string, Map<string, DayChannel>>();
    for (const d of dates) {
      const chMap = new Map<string, DayChannel>();
      for (const ch of CHANNELS) {
        chMap.set(ch.id, { roas: 0, spend: 0, revenue: 0, cpa: 0, ctr: 0 });
      }
      daily.set(d, chMap);
    }

    const entries = Array.isArray(data) ? data : data?.data || data?.metrics || [];
    for (const entry of entries) {
      const day = (entry.date || entry.day || "").toString().slice(0, 10);
      const ch = (entry.channel || entry.source || "").toString().toLowerCase();
      const dayMap = daily.get(day);
      if (!dayMap) continue;
      const row = dayMap.get(ch) || dayMap.get("all");
      if (!row) continue;
      row.roas = Number(entry.roas ?? 0);
      row.spend = Number(entry.adSpend ?? entry.spend ?? 0);
      row.revenue = Number(entry.revenue ?? 0);
      row.cpa = Number(entry.cpa ?? 0);
      row.ctr = Number(entry.ctr ?? 0);
    }

    // Compute blended ("all") as sum/avg across channels per day
    for (const [, chMap] of daily) {
      let totalSpend = 0, totalRev = 0, totalOrders = 0;
      for (const [id, row] of chMap) {
        if (id === "all") continue;
        totalSpend += row.spend;
        totalRev += row.revenue;
      }
      const allRow = chMap.get("all")!;
      allRow.spend = totalSpend;
      allRow.revenue = totalRev;
      allRow.roas = totalSpend > 0 ? totalRev / totalSpend : 0;
    }

    return { source: "live", windows: computeTWWindows(daily, dates) };
  } catch (err: any) {
    return simulateTWSummary(`Triple Whale error: ${err?.message || "Unknown"}`);
  }
}

function computeTWWindows(
  daily: Map<string, Map<string, { roas: number; spend: number; revenue: number; cpa: number; ctr: number }>>,
  dates: string[],
): TWSummary["windows"] {
  const out: TWSummary["windows"] = {};
  const lastIdx = dates.length - 1;
  for (const w of TW_WINDOWS) {
    const endI = lastIdx - w.offset;
    const startI = Math.max(0, endI - w.days + 1);
    const slice = dates.slice(startI, endI + 1);
    const rows: TWChannelRow[] = CHANNELS.map((ch) => {
      let totalSpend = 0, totalRev = 0, totalCPA = 0, totalCTR = 0, count = 0;
      for (const d of slice) {
        const row = daily.get(d)?.get(ch.id);
        if (!row) continue;
        totalSpend += row.spend;
        totalRev += row.revenue;
        totalCPA += row.cpa;
        totalCTR += row.ctr;
        count++;
      }
      return {
        channel: ch.id,
        label: ch.label,
        roas: totalSpend > 0 ? Number((totalRev / totalSpend).toFixed(2)) : 0,
        spend: Math.round(totalSpend),
        revenue: Math.round(totalRev),
        cpa: count > 0 ? Number((totalCPA / count).toFixed(2)) : 0,
        ctr: count > 0 ? Number((totalCTR / count).toFixed(2)) : 0,
      };
    });
    out[w.key] = rows;
  }
  return out;
}

function simulateTWSummary(note: string): TWSummary {
  const windows: TWSummary["windows"] = {};
  for (const w of TW_WINDOWS) {
    windows[w.key] = CHANNELS.map((ch) => {
      const base = ch.id === "all" ? 3.0 : 1.5 + Math.random() * 2;
      const spend = ch.id === "all" ? 15000 * w.days : (2000 + Math.random() * 3000) * w.days;
      return {
        channel: ch.id,
        label: ch.label,
        roas: Number((base + (Math.random() - 0.5) * 0.4).toFixed(2)),
        spend: Math.round(spend),
        revenue: Math.round(spend * base),
        cpa: Number((40 + Math.random() * 20).toFixed(2)),
        ctr: Number((1 + Math.random() * 1.5).toFixed(2)),
      };
    });
  }
  return { source: "simulated", note, windows };
}
