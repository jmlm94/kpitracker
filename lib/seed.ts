import type { AppState, KPI, Target, TeamMember, Department } from "./types";

/**
 * Seed state derived from the Carbinox eCommerce Operations & KPI Management
 * Guide (April 2026). Departments, people, and KPI benchmarks mirror the
 * guide; targets for April 2026 use the documented benchmarks.
 *
 * Business context: DTC smartwatch brand, Miami FL. Revenue mix Shopify 60%
 * / Amazon 35% / Other 5%. Revenue loop = Creative → Advertising →
 * Website → Organic/Retention → Other Channels → Logistics → CS → Finance.
 */

const PERIOD = currentMonthKey();

const departments: Department[] = [
  // Main departments
  { id: "dep_exec", name: "Executive", color: "#f8f8f8", kind: "main", headId: "tm_ceo" },
  { id: "dep_marketing", name: "Marketing", color: "#f8c808", kind: "main", headId: "tm_ceo" },
  { id: "dep_experience", name: "Experience", color: "#ffd833", kind: "main", headId: "tm_ceo" },
  { id: "dep_website", name: "Website", color: "#48f088", kind: "main", headId: "tm_cro" },
  { id: "dep_channels", name: "Other Channels", color: "#d0f800", kind: "main", headId: "tm_amazon" },
  { id: "dep_logistics", name: "Logistics", color: "#408038", kind: "main", headId: "tm_supply" },
  { id: "dep_finance", name: "Finance", color: "#ffffff", kind: "main", headId: "tm_finance" },

  // Marketing sub-departments
  { id: "dep_advertising", name: "Advertising", color: "#f06020", kind: "sub", parentId: "dep_marketing", headId: "tm_damian" },
  { id: "dep_creative", name: "Creative", color: "#e83028", kind: "sub", parentId: "dep_marketing", headId: "tm_creative_strat" },
  { id: "dep_organic", name: "Organic & Retention", color: "#10a0f8", kind: "sub", parentId: "dep_marketing", headId: "tm_samra_email" },

  // Experience sub-departments
  { id: "dep_cs", name: "Customer Success", color: "#ffd833", kind: "sub", parentId: "dep_experience", headId: "tm_justine" },
  { id: "dep_team_success", name: "Team Success", color: "#ff6b4a", kind: "sub", parentId: "dep_experience", headId: "tm_ceo" },

  // Website sub-departments
  { id: "dep_lp", name: "Landing Pages", color: "#34d399", kind: "sub", parentId: "dep_website", headId: "tm_lp" },
  { id: "dep_cro", name: "CRO", color: "#2dd4bf", kind: "sub", parentId: "dep_website", headId: "tm_cro" },

  // Other Channels sub-departments
  { id: "dep_amazon", name: "Amazon", color: "#ff9900", kind: "sub", parentId: "dep_channels", headId: "tm_amazon" },
  { id: "dep_ttshop", name: "TikTok Shop", color: "#e83028", kind: "sub", parentId: "dep_channels", headId: "tm_ttshop" },
  { id: "dep_marketplace", name: "Walmart & Other", color: "#10a0f8", kind: "sub", parentId: "dep_channels", headId: "tm_walmart" },

  // Logistics sub-departments
  { id: "dep_supply", name: "Supply Chain", color: "#86efac", kind: "sub", parentId: "dep_logistics", headId: "tm_supply" },
  { id: "dep_fulfillment", name: "Fulfillment", color: "#4ade80", kind: "sub", parentId: "dep_logistics", headId: "tm_elias" },
];

const team: TeamMember[] = [
  // Executive
  { id: "tm_ceo", name: "Carbinox CEO", position: "Chief Executive Officer", departmentId: "dep_exec" },
  { id: "tm_ea", name: "Executive Assistant", position: "Executive Assistant", departmentId: "dep_exec", managerId: "tm_ceo" },

  // Advertising
  { id: "tm_damian", name: "Damian Perez", position: "Head of Advertising", departmentId: "dep_advertising", managerId: "tm_ceo" },
  { id: "tm_simona", name: "Simona Saule", position: "Meta Media Buyer", departmentId: "dep_advertising", managerId: "tm_damian" },
  { id: "tm_google", name: "Google Media Buyer", position: "Google / Search & Shopping", departmentId: "dep_advertising", managerId: "tm_damian" },
  { id: "tm_tiktok", name: "TikTok Media Buyer", position: "TikTok Ads", departmentId: "dep_advertising", managerId: "tm_damian" },
  { id: "tm_snap", name: "Snap Media Buyer", position: "Snapchat Ads", departmentId: "dep_advertising", managerId: "tm_damian" },
  { id: "tm_applovin", name: "AppLovin Buyer", position: "AppLovin", departmentId: "dep_advertising", managerId: "tm_damian" },

  // Creative
  { id: "tm_creative_strat", name: "Creative Strategist", position: "Creative Strategist", departmentId: "dep_creative", managerId: "tm_ceo" },
  { id: "tm_video_editor", name: "Video Editor", position: "Video Editor", departmentId: "dep_creative", managerId: "tm_creative_strat" },
  { id: "tm_graphic", name: "Graphic Designer", position: "Graphic Designer", departmentId: "dep_creative", managerId: "tm_creative_strat" },
  { id: "tm_content_strat", name: "Content Strategist", position: "Content Strategist", departmentId: "dep_creative", managerId: "tm_ceo" },

  // Organic / Retention
  { id: "tm_samra_email", name: "Samra", position: "Email & SMS Specialist", departmentId: "dep_organic", managerId: "tm_ceo" },
  { id: "tm_jesus", name: "Jesus", position: "Social Media Manager", departmentId: "dep_organic", managerId: "tm_ceo" },

  // Website → Landing Pages / CRO
  { id: "tm_lp", name: "Landing Page Specialist", position: "LP Specialist", departmentId: "dep_lp", managerId: "tm_ceo" },
  { id: "tm_cro", name: "CRO Specialist", position: "CRO Specialist", departmentId: "dep_cro", managerId: "tm_ceo" },

  // Other Channels → Amazon / TikTok Shop / Walmart
  { id: "tm_amazon", name: "Amazon Channel Manager", position: "Amazon Manager", departmentId: "dep_amazon", managerId: "tm_ceo" },
  { id: "tm_ttshop", name: "TikTok Shop Manager", position: "TikTok Shop Manager", departmentId: "dep_ttshop", managerId: "tm_ceo" },
  { id: "tm_walmart", name: "Walmart & Other", position: "Marketplace Manager", departmentId: "dep_marketplace", managerId: "tm_ceo" },

  // Logistics → Supply Chain / Fulfillment
  { id: "tm_supply", name: "Supply Chain Lead", position: "Supply Chain", departmentId: "dep_supply", managerId: "tm_ceo" },
  { id: "tm_elias", name: "Elias", position: "Warehouse Rep", departmentId: "dep_fulfillment", managerId: "tm_supply" },
  { id: "tm_heidy", name: "Heidy", position: "Warehouse Rep", departmentId: "dep_fulfillment", managerId: "tm_supply" },
  { id: "tm_miet", name: "Miet", position: "Warehouse Rep", departmentId: "dep_fulfillment", managerId: "tm_supply" },

  // CS
  { id: "tm_justine", name: "Justine", position: "CS Rep", departmentId: "dep_cs", managerId: "tm_ceo" },
  { id: "tm_juan", name: "Juan", position: "CS Rep", departmentId: "dep_cs", managerId: "tm_ceo" },
  { id: "tm_felipe", name: "Felipe", position: "CS Rep", departmentId: "dep_cs", managerId: "tm_ceo" },
  { id: "tm_anthony", name: "Anthony", position: "CS Rep", departmentId: "dep_cs", managerId: "tm_ceo" },

  // Finance
  { id: "tm_finance", name: "Finance Lead", position: "Finance Lead / CFO", departmentId: "dep_finance", managerId: "tm_ceo" },
];

type KpiSpec = KPI & {
  /** Target for the April 2026 period */
  target: number;
  ownerId: string;
  watcherIds?: string[];
  /** Actual numbers (tuned to produce a realistic mix of statuses) */
  today: number;
  last7: number;
  mtd: number;
};

const kpiSpecs: KpiSpec[] = [
  // ── ADVERTISING ─────────────────────────────────────────────────────
  k("meta_roas", "Meta ROAS", "Blended Meta ROAS (prospecting + retargeting)", "ratio", "higher_is_better", "triplewhale", "meta.roas", "mtd",
    2.5, "tm_simona", ["tm_damian", "tm_ceo"], 1.2, 1.63, 2.38),
  k("meta_spend", "Meta Ad Spend", "Monthly Meta budget deployed", "currency", "higher_is_better", "triplewhale", "meta.spend", "mtd",
    320000, "tm_simona", ["tm_damian"], 9800, 10500, 296000),
  k("meta_cpa", "Meta CPA", "Cost per new customer acquired via Meta", "currency", "lower_is_better", "triplewhale", "meta.cpa", "mtd",
    50, "tm_simona", ["tm_damian"], 58, 51, 49),
  k("meta_ctr", "Meta CTR", "Link click-through rate across Meta ads", "percent", "higher_is_better", "triplewhale", "meta.ctr", "mtd",
    1.2, "tm_simona", ["tm_damian"], 1.1, 1.18, 1.24),
  k("google_roas", "Google ROAS", "Revenue/spend across Search, Shopping, YouTube, Bing", "ratio", "higher_is_better", "triplewhale", "google.roas", "mtd",
    3.0, "tm_google", ["tm_damian"], 3.2, 3.05, 3.12),
  k("google_cpa_brand", "Google Branded CPA", "Cost per acquisition on branded search", "currency", "lower_is_better", "triplewhale", "google.cpa_branded", "mtd",
    40, "tm_google", ["tm_damian"], 38, 41, 39),
  k("tiktok_roas", "TikTok ROAS", "Revenue per dollar on TikTok ads", "ratio", "higher_is_better", "triplewhale", "tiktok.roas", "mtd",
    2.0, "tm_tiktok", ["tm_damian"], 1.7, 1.85, 1.92),
  k("tiktok_hook", "TikTok Hook Rate", "3-sec view rate on TikTok ads", "percent", "higher_is_better", "triplewhale", "tiktok.hook_rate", "mtd",
    30, "tm_tiktok", ["tm_damian", "tm_creative_strat"], 28, 31, 32),
  k("snap_roas", "Snap ROAS", "Revenue per dollar spent on Snapchat ads", "ratio", "higher_is_better", "triplewhale", "snap.roas", "mtd",
    2.0, "tm_snap", ["tm_damian"], 1.9, 2.0, 2.08),
  k("applovin_roas", "AppLovin ROAS", "Revenue per dollar on AppLovin network", "ratio", "higher_is_better", "triplewhale", "applovin.roas", "mtd",
    2.0, "tm_applovin", ["tm_damian"], 1.6, 1.8, 1.78),
  k("blended_roas", "Blended ROAS", "Overall store ROAS across all channels", "ratio", "higher_is_better", "triplewhale", "blended.roas", "mtd",
    3.0, "tm_damian", ["tm_ceo"], 2.7, 2.9, 2.95),

  // ── CREATIVE ────────────────────────────────────────────────────────
  k("cs_win_rate", "Creative Win Rate", "% of launched creatives hitting ROAS/CPA targets in 72h", "percent", "higher_is_better", "gsheets", "creative.win_rate", "mtd",
    20, "tm_creative_strat", ["tm_ceo"], 18, 21, 22),
  k("briefs_week", "Briefs / Week", "New creative concepts briefed each week", "number", "higher_is_better", "gsheets", "creative.briefs_per_week", "7d",
    5, "tm_creative_strat", [], 1, 5, 4),
  k("videos_week", "Videos Delivered / Week", "Finished video ads delivered to media buyers", "number", "higher_is_better", "gsheets", "creative.videos_per_week", "7d",
    10, "tm_video_editor", ["tm_creative_strat"], 2, 10, 9),
  k("assets_week", "Static Assets / Week", "Image ads, banners, email graphics, LP visuals", "number", "higher_is_better", "gsheets", "creative.assets_per_week", "7d",
    12, "tm_graphic", ["tm_creative_strat"], 3, 13, 11),
  k("content_adherence", "Content Calendar Adherence", "Planned content published on schedule", "percent", "higher_is_better", "gsheets", "content.calendar_adherence", "mtd",
    90, "tm_content_strat", ["tm_ceo"], 92, 91, 92),

  // ── ORGANIC / RETENTION ────────────────────────────────────────────
  k("klaviyo_rev_pct", "Email Revenue % of Total", "Klaviyo attributed revenue share of DTC revenue", "percent", "higher_is_better", "klaviyo", "email.share_of_total", "mtd",
    30, "tm_samra_email", ["tm_ceo"], 28, 29, 31),
  k("klaviyo_open", "Email Open Rate", "Average open rate across campaigns", "percent", "higher_is_better", "klaviyo", "email.open_rate", "mtd",
    35, "tm_samra_email", [], 36, 35, 37),
  k("klaviyo_click", "Email Click Rate", "Average click rate across campaigns", "percent", "higher_is_better", "klaviyo", "email.click_rate", "mtd",
    2.5, "tm_samra_email", [], 2.4, 2.45, 2.62),
  k("sms_rev_pct", "SMS Revenue % of Total", "Postscript attributed revenue share", "percent", "higher_is_better", "postscript", "sms.share_of_total", "mtd",
    10, "tm_samra_email", [], 8, 9.5, 10.4),
  k("sms_ctr", "SMS Click-Through Rate", "Recipients who click the SMS link", "percent", "higher_is_better", "postscript", "sms.ctr", "mtd",
    10, "tm_samra_email", [], 9, 10, 10.2),
  k("sms_optout", "SMS Opt-Out Rate", "Unsubscribes per campaign (lower is better)", "percent", "lower_is_better", "postscript", "sms.opt_out", "mtd",
    2, "tm_samra_email", [], 1.8, 1.9, 1.7),
  k("social_engagement", "Social Engagement Rate", "Engagement / reach across IG & TikTok organic", "percent", "higher_is_better", "gsheets", "social.engagement", "mtd",
    3, "tm_jesus", [], 2.6, 2.9, 3.1),
  k("social_followers", "Follower Growth MoM", "Net new followers as % of total", "percent", "higher_is_better", "gsheets", "social.follower_growth_mom", "mtd",
    3, "tm_jesus", [], 2.5, 2.8, 3.2),

  // ── WEBSITE ─────────────────────────────────────────────────────────
  k("lp_cvr", "Landing Page CVR", "Conversion rate on key landing pages", "percent", "higher_is_better", "shopify", "lp.conversion_rate", "mtd",
    3.5, "tm_lp", ["tm_ceo"], 3.2, 3.4, 3.55),
  k("lp_speed", "Page Load Speed", "Mobile time-to-interactive (lower is better)", "duration_s", "lower_is_better", "gsheets", "lp.mobile_tti_s", "7d",
    2.5, "tm_lp", [], 2.7, 2.6, 2.55),
  k("site_cvr", "Sitewide CVR", "Blended Shopify conversion rate", "percent", "higher_is_better", "shopify", "site.conversion_rate", "mtd",
    2.5, "tm_cro", ["tm_ceo"], 2.3, 2.45, 2.48),
  k("ab_tests", "A/B Tests / Month", "Properly structured tests launched", "number", "higher_is_better", "gsheets", "cro.ab_tests_per_month", "mtd",
    4, "tm_cro", [], 0, 1, 4),
  k("aov", "AOV", "Average order value across DTC", "currency", "higher_is_better", "shopify", "orders.aov", "mtd",
    120, "tm_cro", ["tm_ceo"], 118, 121, 124),
  k("checkout_rate", "Checkout Completion", "Started checkouts that complete", "percent", "higher_is_better", "shopify", "checkout.completion", "mtd",
    55, "tm_cro", [], 52, 54, 56),

  // ── OTHER CHANNELS ─────────────────────────────────────────────────
  k("amazon_rev", "Amazon Revenue", "Total monthly revenue on Amazon", "currency", "higher_is_better", "gsheets", "amazon.revenue", "mtd",
    525000, "tm_amazon", ["tm_ceo"], 17200, 18600, 504000),
  k("amazon_tacos", "Amazon TACoS", "Ad spend / total Amazon revenue (lower is better)", "percent", "lower_is_better", "gsheets", "amazon.tacos", "mtd",
    15, "tm_amazon", [], 16, 15.2, 14.8),
  k("amazon_buybox", "Amazon Buy Box", "% of time Carbinox owns its Buy Box", "percent", "higher_is_better", "gsheets", "amazon.buy_box_win", "mtd",
    95, "tm_amazon", [], 97, 96, 96.5),
  k("ttshop_rev", "TikTok Shop Revenue", "Monthly GMV on TikTok Shop", "currency", "higher_is_better", "gsheets", "tiktokshop.revenue", "mtd",
    45000, "tm_ttshop", [], 1200, 1400, 38000),
  k("ttshop_creators", "Active Affiliate Creators", "Affiliates driving sales this month", "number", "higher_is_better", "gsheets", "tiktokshop.creators_active", "mtd",
    20, "tm_ttshop", [], 0, 19, 22),
  k("walmart_rev", "Marketplace Revenue", "Walmart / Best Buy / eBay combined revenue", "currency", "higher_is_better", "gsheets", "marketplaces.revenue", "mtd",
    75000, "tm_walmart", [], 2100, 2400, 64000),
  k("walmart_odr", "Order Defect Rate", "Late/cancelled/return rate across marketplaces", "percent", "lower_is_better", "gsheets", "marketplaces.order_defect_rate", "mtd",
    1, "tm_walmart", [], 0.8, 0.9, 0.95),

  // ── LOGISTICS ──────────────────────────────────────────────────────
  k("stockout", "Stockout Rate (Top 3 SKUs)", "% of days top-3 SKUs were out of stock", "percent", "lower_is_better", "gsheets", "supply.stockout_top3", "mtd",
    0, "tm_supply", ["tm_ceo"], 0, 0, 0.5),
  k("inbound_defect", "Inbound Defect Rate", "Units arriving from manufacturer with defects", "percent", "lower_is_better", "gsheets", "supply.defect_inbound", "mtd",
    2, "tm_supply", [], 1.6, 1.8, 1.9),
  k("inventory_turn", "Inventory Turnover", "Times inventory sells & replaces per year (annualized)", "ratio", "higher_is_better", "gsheets", "supply.inventory_turnover", "mtd",
    6, "tm_supply", [], 5.8, 5.9, 6.1),
  k("ship_sla_elias", "Ship-by-SLA (Elias)", "Orders shipped within promised SLA", "percent", "higher_is_better", "shopify", "fulfillment.sla.elias", "mtd",
    98, "tm_elias", ["tm_supply"], 97, 98, 98.5),
  k("ship_sla_heidy", "Ship-by-SLA (Heidy)", "Orders shipped within promised SLA", "percent", "higher_is_better", "shopify", "fulfillment.sla.heidy", "mtd",
    98, "tm_heidy", ["tm_supply"], 95, 96, 96.2),
  k("ship_sla_miet", "Ship-by-SLA (Miet)", "Orders shipped within promised SLA", "percent", "higher_is_better", "shopify", "fulfillment.sla.miet", "mtd",
    98, "tm_miet", ["tm_supply"], 99, 99, 99.1),

  // ── CUSTOMER SUCCESS ───────────────────────────────────────────────
  k("frt_justine", "First Response Time (Justine)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.justine", "7d",
    14400, "tm_justine", ["tm_ceo"], 13200, 13800, 13400),
  k("frt_juan", "First Response Time (Juan)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.juan", "7d",
    14400, "tm_juan", ["tm_ceo"], 18000, 16200, 15600),
  k("frt_felipe", "First Response Time (Felipe)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.felipe", "7d",
    14400, "tm_felipe", ["tm_ceo"], 13200, 12800, 13500),
  k("frt_anthony", "First Response Time (Anthony)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.anthony", "7d",
    14400, "tm_anthony", ["tm_ceo"], 13800, 13200, 13900),
  k("csat", "Company CSAT", "Blended CSAT across all reps", "ratio", "higher_is_better", "zendesk", "cs.csat_blended", "mtd",
    4.2, "tm_justine", ["tm_ceo"], 4.3, 4.25, 4.28),

  // ── FINANCE ────────────────────────────────────────────────────────
  k("net_margin", "Net Profit Margin", "Bottom-line profit after ALL expenses", "percent", "higher_is_better", "gsheets", "finance.net_margin", "mtd",
    15, "tm_finance", ["tm_ceo"], 13, 14.2, 15.6),
  k("mer", "MER", "Total revenue ÷ total marketing spend", "ratio", "higher_is_better", "gsheets", "finance.mer", "mtd",
    3.0, "tm_finance", ["tm_ceo"], 2.8, 2.95, 3.08),
  k("gross_margin", "Gross Margin", "Revenue minus COGS as % of revenue", "percent", "higher_is_better", "gsheets", "finance.gross_margin", "mtd",
    60, "tm_finance", ["tm_ceo"], 61, 60.5, 61.2),
  k("ccc", "Cash Conversion Cycle", "Days between paying inventory and getting paid (lower is better)", "duration_s", "lower_is_better", "gsheets", "finance.ccc_days_seconds", "mtd",
    45 * 86400, "tm_finance", ["tm_ceo"], 43 * 86400, 44 * 86400, 42 * 86400),

  // ── EXECUTIVE ──────────────────────────────────────────────────────
  k("ea_action", "Action Item Follow-Through", "Leadership action items tracked & completed on time", "percent", "higher_is_better", "gsheets", "ea.action_item_follow_through", "mtd",
    95, "tm_ea", ["tm_ceo"], 94, 95, 96),
  k("ea_response", "EA Response Time", "Avg response time during business hours", "duration_s", "lower_is_better", "gsheets", "ea.response_time_s", "7d",
    3600, "tm_ea", [], 3300, 3200, 3400),

  // Company-level (CEO dashboard)
  k("co_revenue", "Total Revenue", "Shopify + Amazon + Other Channels (MTD)", "currency", "higher_is_better", "gsheets", "company.total_revenue", "mtd",
    1500000, "tm_ceo", [], 47000, 49500, 1395000),
  k("co_ltv_cac", "LTV : CAC", "Lifetime value divided by blended CAC", "ratio", "higher_is_better", "gsheets", "company.ltv_to_cac", "mtd",
    3.0, "tm_ceo", [], 2.9, 2.95, 3.1),
  k("co_repeat", "Repeat Purchase Rate", "% of customers who buy more than once", "percent", "higher_is_better", "gsheets", "company.repeat_purchase_rate", "mtd",
    15, "tm_ceo", [], 14.2, 14.8, 15.3),
];

function k(
  idSuffix: string,
  name: string,
  description: string,
  unit: KPI["unit"],
  direction: KPI["direction"],
  provider: KPI["provider"],
  metricKey: string,
  window: KPI["window"],
  target: number,
  ownerId: string,
  watcherIds: string[] | undefined,
  today: number,
  last7: number,
  mtd: number,
): KpiSpec {
  return {
    id: `kpi_${idSuffix}`,
    name,
    description,
    unit,
    direction,
    provider,
    metricKey,
    window,
    target,
    ownerId,
    watcherIds,
    today,
    last7,
    mtd,
  };
}

const kpis: KPI[] = kpiSpecs.map(({ target, ownerId, watcherIds, today, last7, mtd, ...kpi }) => kpi);

const targets: Target[] = kpiSpecs.map((s) => ({
  id: `t_${s.id.replace("kpi_", "")}`,
  kpiId: s.id,
  ownerId: s.ownerId,
  watcherIds: s.watcherIds?.length ? s.watcherIds : undefined,
  target: s.target,
  period: "monthly",
  periodKey: PERIOD,
}));

const progress = Object.fromEntries(
  kpiSpecs.map((s) => {
    const tid = `t_${s.id.replace("kpi_", "")}`;
    return [
      tid,
      {
        targetId: tid,
        today: s.today,
        last7: s.last7,
        mtd: s.mtd,
        updatedAt: new Date().toISOString(),
        samples: buildSamples(s.last7, 14, s.unit),
      },
    ];
  }),
);

export const seedState: AppState = {
  onboarded: false,
  departments,
  team,
  kpis,
  targets,
  progress,
  integrations: [
    { provider: "shopify", label: "Shopify", connected: false, envVarsExpected: ["SHOPIFY_SHOP", "SHOPIFY_ADMIN_TOKEN"], lastSyncStatus: "never" },
    { provider: "triplewhale", label: "Triple Whale", connected: false, envVarsExpected: ["TRIPLEWHALE_API_KEY", "TRIPLEWHALE_SHOP_ID"], lastSyncStatus: "never" },
    { provider: "klaviyo", label: "Klaviyo", connected: false, envVarsExpected: ["KLAVIYO_PRIVATE_KEY"], lastSyncStatus: "never" },
    { provider: "postscript", label: "Postscript", connected: false, envVarsExpected: ["POSTSCRIPT_API_KEY"], lastSyncStatus: "never" },
    { provider: "zendesk", label: "Zendesk", connected: false, envVarsExpected: ["ZENDESK_SUBDOMAIN", "ZENDESK_EMAIL", "ZENDESK_API_TOKEN"], lastSyncStatus: "never" },
    { provider: "gsheets", label: "Google Sheets", connected: false, envVarsExpected: ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"], lastSyncStatus: "never" },
  ],
};

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildSamples(center: number, days: number, unit: KPI["unit"]) {
  const noise = Math.abs(center) * 0.08;
  const out: { date: string; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const drift = Math.sin(i * 0.8) * noise;
    const jitter = (pseudo(i + center) - 0.5) * noise * 1.4;
    let v = Math.max(0, center + drift + jitter);
    v = unit === "ratio" || unit === "percent" ? Number(v.toFixed(2)) : Math.round(v);
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    out.push({ date: d.toISOString().slice(0, 10), value: v });
  }
  return out;
}

function pseudo(x: number): number {
  // Deterministic jitter so server-render and hydration match.
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
