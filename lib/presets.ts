import type { KPI, Provider, Unit } from "./types";

/**
 * Role-keyed library of KPI presets.
 *
 * The keys are case-insensitive substring matches against a person's
 * `position` text — e.g. someone whose position contains "Meta Media Buyer"
 * gets all the Meta presets suggested when adding KPIs to their card.
 *
 * Targets reflect the benchmarks from the Carbinox eCommerce Operations &
 * KPI Management Guide (April 2026).
 */

export type KPIPreset = {
  name: string;
  description?: string;
  unit: Unit;
  direction: KPI["direction"];
  provider: Provider;
  metricKey: string;
  window: KPI["window"];
  target: number;
};

export const KPI_PRESETS: Record<string, KPIPreset[]> = {
  "Meta Media Buyer": [
    { name: "Meta ROAS", description: "Blended Meta ROAS", unit: "ratio", direction: "higher_is_better", provider: "triplewhale", metricKey: "meta.roas", window: "mtd", target: 2.5 },
    { name: "Meta Ad Spend", description: "Monthly Meta budget deployed", unit: "currency", direction: "higher_is_better", provider: "triplewhale", metricKey: "meta.spend", window: "mtd", target: 320000 },
    { name: "Meta CPA", description: "Cost per new customer via Meta", unit: "currency", direction: "lower_is_better", provider: "triplewhale", metricKey: "meta.cpa", window: "mtd", target: 50 },
    { name: "Meta CTR", description: "Link click-through rate", unit: "percent", direction: "higher_is_better", provider: "triplewhale", metricKey: "meta.ctr", window: "mtd", target: 1.2 },
  ],
  "Google Media Buyer": [
    { name: "Google ROAS", unit: "ratio", direction: "higher_is_better", provider: "triplewhale", metricKey: "google.roas", window: "mtd", target: 3.0 },
    { name: "Google Branded CPA", unit: "currency", direction: "lower_is_better", provider: "triplewhale", metricKey: "google.cpa_branded", window: "mtd", target: 40 },
    { name: "Google Non-Branded CPA", unit: "currency", direction: "lower_is_better", provider: "triplewhale", metricKey: "google.cpa_nonbranded", window: "mtd", target: 55 },
    { name: "Search Conversion Rate", unit: "percent", direction: "higher_is_better", provider: "triplewhale", metricKey: "google.cvr_search", window: "mtd", target: 3.5 },
  ],
  "TikTok Media Buyer": [
    { name: "TikTok ROAS", unit: "ratio", direction: "higher_is_better", provider: "triplewhale", metricKey: "tiktok.roas", window: "mtd", target: 2.0 },
    { name: "TikTok Hook Rate", description: "3-sec view rate", unit: "percent", direction: "higher_is_better", provider: "triplewhale", metricKey: "tiktok.hook_rate", window: "mtd", target: 30 },
    { name: "TikTok CPA", unit: "currency", direction: "lower_is_better", provider: "triplewhale", metricKey: "tiktok.cpa", window: "mtd", target: 60 },
  ],
  "Snap Media Buyer": [
    { name: "Snap ROAS", unit: "ratio", direction: "higher_is_better", provider: "triplewhale", metricKey: "snap.roas", window: "mtd", target: 2.0 },
    { name: "Snap CPA", unit: "currency", direction: "lower_is_better", provider: "triplewhale", metricKey: "snap.cpa", window: "mtd", target: 60 },
    { name: "Snap Swipe-Up Rate", unit: "percent", direction: "higher_is_better", provider: "triplewhale", metricKey: "snap.swipe_up", window: "mtd", target: 0.8 },
  ],
  "AppLovin": [
    { name: "AppLovin ROAS", unit: "ratio", direction: "higher_is_better", provider: "triplewhale", metricKey: "applovin.roas", window: "mtd", target: 2.0 },
    { name: "AppLovin CPA", unit: "currency", direction: "lower_is_better", provider: "triplewhale", metricKey: "applovin.cpa", window: "mtd", target: 60 },
  ],
  "Head of Advertising": [
    { name: "Blended ROAS", description: "Overall store ROAS across all channels", unit: "ratio", direction: "higher_is_better", provider: "triplewhale", metricKey: "blended.roas", window: "mtd", target: 3.0 },
  ],
  "Creative Strategist": [
    { name: "Creative Win Rate", description: "% of new creatives hitting target in 72h", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "creative.win_rate", window: "mtd", target: 20 },
    { name: "Briefs / Week", unit: "number", direction: "higher_is_better", provider: "gsheets", metricKey: "creative.briefs_per_week", window: "7d", target: 5 },
  ],
  "Video Editor": [
    { name: "Videos Delivered / Week", unit: "number", direction: "higher_is_better", provider: "gsheets", metricKey: "creative.videos_per_week", window: "7d", target: 10 },
    { name: "On-Time Delivery Rate", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "creative.video_on_time", window: "mtd", target: 95 },
  ],
  "Graphic Designer": [
    { name: "Static Assets / Week", unit: "number", direction: "higher_is_better", provider: "gsheets", metricKey: "creative.assets_per_week", window: "7d", target: 12 },
    { name: "On-Time Delivery Rate", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "creative.assets_on_time", window: "mtd", target: 95 },
  ],
  "Content Strategist": [
    { name: "Content Calendar Adherence", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "content.calendar_adherence", window: "mtd", target: 90 },
    { name: "New Angles Tested / Month", unit: "number", direction: "higher_is_better", provider: "gsheets", metricKey: "content.new_angles", window: "mtd", target: 3 },
  ],
  "Email": [
    { name: "Email Revenue % of Total", unit: "percent", direction: "higher_is_better", provider: "klaviyo", metricKey: "email.share_of_total", window: "mtd", target: 30 },
    { name: "Email Open Rate", unit: "percent", direction: "higher_is_better", provider: "klaviyo", metricKey: "email.open_rate", window: "mtd", target: 35 },
    { name: "Email Click Rate", unit: "percent", direction: "higher_is_better", provider: "klaviyo", metricKey: "email.click_rate", window: "mtd", target: 2.5 },
  ],
  "SMS": [
    { name: "SMS Revenue % of Total", unit: "percent", direction: "higher_is_better", provider: "postscript", metricKey: "sms.share_of_total", window: "mtd", target: 10 },
    { name: "SMS Click-Through Rate", unit: "percent", direction: "higher_is_better", provider: "postscript", metricKey: "sms.ctr", window: "mtd", target: 10 },
    { name: "SMS Opt-Out Rate", unit: "percent", direction: "lower_is_better", provider: "postscript", metricKey: "sms.opt_out", window: "mtd", target: 2 },
  ],
  "Social Media Manager": [
    { name: "Social Engagement Rate", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "social.engagement", window: "mtd", target: 3 },
    { name: "Follower Growth MoM", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "social.follower_growth_mom", window: "mtd", target: 3 },
  ],
  "LP Specialist": [
    { name: "Landing Page CVR", unit: "percent", direction: "higher_is_better", provider: "shopify", metricKey: "lp.conversion_rate", window: "mtd", target: 3.5 },
    { name: "Page Load Speed", unit: "duration_s", direction: "lower_is_better", provider: "gsheets", metricKey: "lp.mobile_tti_s", window: "7d", target: 2.5 },
  ],
  "CRO Specialist": [
    { name: "Sitewide CVR", unit: "percent", direction: "higher_is_better", provider: "shopify", metricKey: "site.conversion_rate", window: "mtd", target: 2.5 },
    { name: "A/B Tests / Month", unit: "number", direction: "higher_is_better", provider: "gsheets", metricKey: "cro.ab_tests_per_month", window: "mtd", target: 4 },
    { name: "AOV", unit: "currency", direction: "higher_is_better", provider: "shopify", metricKey: "orders.aov", window: "mtd", target: 120 },
    { name: "Checkout Completion", unit: "percent", direction: "higher_is_better", provider: "shopify", metricKey: "checkout.completion", window: "mtd", target: 55 },
  ],
  "Amazon": [
    { name: "Amazon Revenue", unit: "currency", direction: "higher_is_better", provider: "gsheets", metricKey: "amazon.revenue", window: "mtd", target: 525000 },
    { name: "Amazon TACoS", unit: "percent", direction: "lower_is_better", provider: "gsheets", metricKey: "amazon.tacos", window: "mtd", target: 15 },
    { name: "Amazon Buy Box", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "amazon.buy_box_win", window: "mtd", target: 95 },
  ],
  "TikTok Shop": [
    { name: "TikTok Shop Revenue", unit: "currency", direction: "higher_is_better", provider: "gsheets", metricKey: "tiktokshop.revenue", window: "mtd", target: 45000 },
    { name: "Active Affiliate Creators", unit: "number", direction: "higher_is_better", provider: "gsheets", metricKey: "tiktokshop.creators_active", window: "mtd", target: 20 },
  ],
  "Walmart": [
    { name: "Marketplace Revenue", unit: "currency", direction: "higher_is_better", provider: "gsheets", metricKey: "marketplaces.revenue", window: "mtd", target: 75000 },
    { name: "Order Defect Rate", unit: "percent", direction: "lower_is_better", provider: "gsheets", metricKey: "marketplaces.order_defect_rate", window: "mtd", target: 1 },
  ],
  "Supply Chain": [
    { name: "Stockout Rate (Top 3 SKUs)", unit: "percent", direction: "lower_is_better", provider: "gsheets", metricKey: "supply.stockout_top3", window: "mtd", target: 0 },
    { name: "Inbound Defect Rate", unit: "percent", direction: "lower_is_better", provider: "gsheets", metricKey: "supply.defect_inbound", window: "mtd", target: 2 },
    { name: "Inventory Turnover", unit: "ratio", direction: "higher_is_better", provider: "gsheets", metricKey: "supply.inventory_turnover", window: "mtd", target: 6 },
  ],
  "Warehouse Manager": [
    { name: "Order Accuracy Rate", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "fulfillment.order_accuracy", window: "mtd", target: 99.5 },
    { name: "Ship-by-SLA Rate", unit: "percent", direction: "higher_is_better", provider: "shopify", metricKey: "fulfillment.sla", window: "mtd", target: 98 },
  ],
  "Warehouse Rep": [
    { name: "Ship-by-SLA Rate", unit: "percent", direction: "higher_is_better", provider: "shopify", metricKey: "fulfillment.sla", window: "mtd", target: 98 },
    { name: "Order Accuracy Rate", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "fulfillment.order_accuracy", window: "mtd", target: 99.5 },
  ],
  "CS Rep": [
    { name: "First Response Time", description: "Time to first human response (email)", unit: "duration_s", direction: "lower_is_better", provider: "zendesk", metricKey: "cs.frt", window: "7d", target: 14400 },
    { name: "Resolution Rate", unit: "percent", direction: "higher_is_better", provider: "zendesk", metricKey: "cs.resolution_rate", window: "mtd", target: 85 },
    { name: "Tickets / Day", unit: "number", direction: "higher_is_better", provider: "zendesk", metricKey: "cs.tickets_per_day", window: "7d", target: 30 },
  ],
  "Head of Customer Success": [
    { name: "Company CSAT", unit: "ratio", direction: "higher_is_better", provider: "zendesk", metricKey: "cs.csat_blended", window: "mtd", target: 4.2 },
    { name: "Chargeback Prevention Rate", unit: "percent", direction: "higher_is_better", provider: "zendesk", metricKey: "cs.chargeback_prevention", window: "mtd", target: 70 },
  ],
  "CFO": [
    { name: "Net Profit Margin", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "finance.net_margin", window: "mtd", target: 15 },
    { name: "MER", description: "Marketing Efficiency Ratio", unit: "ratio", direction: "higher_is_better", provider: "gsheets", metricKey: "finance.mer", window: "mtd", target: 3.0 },
    { name: "Gross Margin", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "finance.gross_margin", window: "mtd", target: 60 },
  ],
  "Finance Manager": [
    { name: "Budget Variance", unit: "percent", direction: "lower_is_better", provider: "gsheets", metricKey: "finance.budget_variance", window: "mtd", target: 5 },
  ],
  "Executive Assistant": [
    { name: "Action Item Follow-Through", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "ea.action_item_follow_through", window: "mtd", target: 95 },
    { name: "EA Response Time", unit: "duration_s", direction: "lower_is_better", provider: "gsheets", metricKey: "ea.response_time_s", window: "7d", target: 3600 },
  ],
  "CEO": [
    { name: "Total Revenue", unit: "currency", direction: "higher_is_better", provider: "gsheets", metricKey: "company.total_revenue", window: "mtd", target: 1500000 },
    { name: "LTV : CAC", unit: "ratio", direction: "higher_is_better", provider: "gsheets", metricKey: "company.ltv_to_cac", window: "mtd", target: 3.0 },
    { name: "Repeat Purchase Rate", unit: "percent", direction: "higher_is_better", provider: "gsheets", metricKey: "company.repeat_purchase_rate", window: "mtd", target: 15 },
  ],
};

/** Returns presets relevant to a person's position (case-insensitive substring matches). */
export function presetsForPosition(position: string): KPIPreset[] {
  const haystack = (position || "").toLowerCase();
  const out: KPIPreset[] = [];
  const seen = new Set<string>();
  for (const [key, presets] of Object.entries(KPI_PRESETS)) {
    if (haystack.includes(key.toLowerCase())) {
      for (const p of presets) {
        const id = `${p.name}::${p.metricKey}`;
        if (!seen.has(id)) {
          seen.add(id);
          out.push(p);
        }
      }
    }
  }
  return out;
}
