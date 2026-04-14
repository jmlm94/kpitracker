import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

/**
 * Triple Whale connector. Requires:
 *   TRIPLEWHALE_API_KEY
 *   TRIPLEWHALE_SHOP_ID
 *
 * Supported metricKeys include:
 *   meta.roas, google.roas, tiktok.roas, blended.roas
 *   meta.spend, blended.spend
 */
export async function fetchTripleWhaleMetric(
  kpi: KPI,
  target: Target,
): Promise<MetricResult> {
  const key = process.env.TRIPLEWHALE_API_KEY;
  const shop = process.env.TRIPLEWHALE_SHOP_ID;
  if (!key || !shop) {
    return simulate(kpi, target, "TRIPLEWHALE_API_KEY / TRIPLEWHALE_SHOP_ID not set");
  }

  // TODO: Hit https://api.triplewhale.com/api/v2/metrics
  // POST body: { shop, metric: kpi.metricKey, granularity: "day", window: "mtd" }
  return simulate(kpi, target, "Triple Whale connector stub — drop in real API call");
}
