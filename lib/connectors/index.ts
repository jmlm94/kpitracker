import type { KPI, Progress, Target } from "../types";
import { fetchShopifyMetric } from "./shopify";
import { fetchTripleWhaleMetric } from "./triplewhale";
import { fetchKlaviyoMetric } from "./klaviyo";
import { fetchPostscriptMetric } from "./postscript";
import { fetchZendeskMetric } from "./zendesk";
import { fetchGoogleSheetsMetric } from "./gsheets";

export type MetricResult = {
  today: number;
  last7: number;
  mtd: number;
  samples: { date: string; value: number }[];
  source: "live" | "simulated";
  note?: string;
};

/**
 * Dispatches to the correct provider. Each connector is expected to be
 * self-contained — if credentials are missing, it must fall back to
 * `simulated` mode so the UI always has numbers to display.
 */
export async function fetchMetric(kpi: KPI, target: Target): Promise<MetricResult> {
  try {
    switch (kpi.provider) {
      case "shopify":
        return await fetchShopifyMetric(kpi, target);
      case "triplewhale":
        return await fetchTripleWhaleMetric(kpi, target);
      case "klaviyo":
        return await fetchKlaviyoMetric(kpi, target);
      case "postscript":
        return await fetchPostscriptMetric(kpi, target);
      case "zendesk":
        return await fetchZendeskMetric(kpi, target);
      case "gsheets":
        return await fetchGoogleSheetsMetric(kpi, target);
      case "manual":
      default:
        return simulate(kpi, target, "Manual provider — using last stored values");
    }
  } catch (err: any) {
    return simulate(kpi, target, err?.message || "Connector error — falling back to simulated data");
  }
}

/**
 * Produces realistic-looking daily samples that drift around the target.
 * Used as a fallback when a real integration isn't configured yet so the
 * dashboard is never empty.
 */
export function simulate(kpi: KPI, target: Target, note?: string): MetricResult {
  const days = 14;
  const center = target.target * (0.9 + Math.random() * 0.25);
  const noise = Math.abs(center) * 0.08;
  const samples = Array.from({ length: days }).map((_, i) => {
    const drift = Math.sin(i * 0.7 + Date.now() / 1_000_000) * noise;
    const jitter = (Math.random() - 0.5) * noise * 1.5;
    const value = Math.max(0, center + drift + jitter);
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), value: round(value, kpi.unit) };
  });

  const today = samples[samples.length - 1].value;
  const last7 = avg(samples.slice(-7).map((s) => s.value));

  // For MTD (currency/number) sum — for ratios/percent/durations, average.
  const accum = kpi.unit === "currency" || kpi.unit === "number";
  const mtd = accum
    ? samples.reduce((a, s) => a + s.value, 0)
    : avg(samples.map((s) => s.value));

  return {
    today,
    last7: round(last7, kpi.unit),
    mtd: round(mtd, kpi.unit),
    samples,
    source: "simulated",
    note,
  };
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function round(n: number, unit: KPI["unit"]): number {
  if (unit === "ratio" || unit === "percent") return Number(n.toFixed(2));
  if (unit === "duration_s") return Math.round(n);
  if (unit === "currency" || unit === "number") return Math.round(n);
  return Number(n.toFixed(2));
}

export function emptyProgress(): Progress {
  return {
    targetId: "",
    today: 0,
    last7: 0,
    mtd: 0,
    updatedAt: new Date().toISOString(),
    samples: [],
  };
}
