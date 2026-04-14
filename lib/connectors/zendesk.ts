import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

/**
 * Zendesk connector. Requires:
 *   ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN
 */
export async function fetchZendeskMetric(
  kpi: KPI,
  target: Target,
): Promise<MetricResult> {
  if (
    !process.env.ZENDESK_SUBDOMAIN ||
    !process.env.ZENDESK_EMAIL ||
    !process.env.ZENDESK_API_TOKEN
  ) {
    return simulate(kpi, target, "Zendesk env vars not set");
  }
  // TODO: /api/v2/incremental/tickets or Explore API for CSAT / FRT
  return simulate(kpi, target, "Zendesk connector stub");
}
