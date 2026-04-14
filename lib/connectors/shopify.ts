import type { KPI, Target } from "../types";
import { simulate, type MetricResult } from "./index";

/**
 * Shopify Admin API connector. Requires:
 *   SHOPIFY_SHOP         - e.g. "carbinox.myshopify.com"
 *   SHOPIFY_ADMIN_TOKEN  - Admin API access token
 *
 * Supported metricKeys:
 *   orders.total_sales     - gross sales MTD
 *   fulfillment.sla_24h    - % orders fulfilled within 24h
 */
export async function fetchShopifyMetric(
  kpi: KPI,
  target: Target,
): Promise<MetricResult> {
  const shop = process.env.SHOPIFY_SHOP;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!shop || !token) {
    return simulate(kpi, target, "SHOPIFY_SHOP / SHOPIFY_ADMIN_TOKEN not set");
  }

  // TODO: implement real GraphQL query
  // Example query for orders.total_sales (MTD):
  //
  //   query {
  //     orders(first: 250, query: "created_at:>=2026-04-01") {
  //       edges { node { totalPriceSet { shopMoney { amount } } createdAt } }
  //     }
  //   }
  //
  // Aggregate the results into { today, last7, mtd, samples[] }.
  //
  // Until this is wired up we simulate so the UI works end-to-end.
  return simulate(kpi, target, "Shopify connector stub — replace with real Admin API call");
}
