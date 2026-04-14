import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

/**
 * Google Sheets connector. Requires a service account:
 *   GOOGLE_SHEETS_CLIENT_EMAIL
 *   GOOGLE_SHEETS_PRIVATE_KEY
 *
 * metricKey format is `{sheetId}!{range}`, e.g. "1abc…xyz!KPIs!B2"
 */
export async function fetchGoogleSheetsMetric(
  kpi: KPI,
  target: Target,
): Promise<MetricResult> {
  if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    return simulate(kpi, target, "Google Sheets service account not set");
  }
  // TODO: auth via google-auth-library and read via sheets.googleapis.com
  return simulate(kpi, target, "Google Sheets connector stub");
}
