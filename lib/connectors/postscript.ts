import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

/** Postscript SMS API connector. Requires POSTSCRIPT_API_KEY. */
export async function fetchPostscriptMetric(
  kpi: KPI,
  target: Target,
): Promise<MetricResult> {
  if (!process.env.POSTSCRIPT_API_KEY) {
    return simulate(kpi, target, "POSTSCRIPT_API_KEY not set");
  }
  // TODO: hit /api/v2/reports/revenue
  return simulate(kpi, target, "Postscript connector stub");
}
