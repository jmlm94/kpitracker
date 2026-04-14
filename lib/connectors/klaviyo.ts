import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

/** Klaviyo Reporting API connector. Requires KLAVIYO_PRIVATE_KEY. */
export async function fetchKlaviyoMetric(
  kpi: KPI,
  target: Target,
): Promise<MetricResult> {
  if (!process.env.KLAVIYO_PRIVATE_KEY) {
    return simulate(kpi, target, "KLAVIYO_PRIVATE_KEY not set");
  }
  // TODO: use /api/metric-aggregates/ to fetch daily attributed revenue.
  return simulate(kpi, target, "Klaviyo connector stub");
}
