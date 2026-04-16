import type { AppState, KPI, Target, TeamMember, Department } from "./types";

/**
 * Seed state for Carbinox, using the real org roster.
 *
 * Business context: DTC smartwatch brand, Miami FL. Revenue mix Shopify 60%
 * / Amazon 35% / Other 5%. Revenue loop = Creative → Advertising →
 * Website → Organic/Retention → Other Channels → Logistics → CS → Finance.
 *
 * A number of people wear multiple hats (the primary `departmentId` is
 * their home base; additional KPIs they own are listed on the same team
 * member record and show up on whichever department those KPIs belong to).
 */

const PERIOD = currentMonthKey();

const departments: Department[] = [
  // Main departments
  { id: "dep_exec", name: "Executive", color: "#f8f8f8", kind: "main", headId: "tm_jose" },
  { id: "dep_marketing", name: "Marketing", color: "#f8c808", kind: "main", headId: "tm_jose" },
  { id: "dep_experience", name: "Experience", color: "#ffd833", kind: "main", headId: "tm_thaylu" },
  { id: "dep_website", name: "Website", color: "#48f088", kind: "main", headId: "tm_damian" },
  { id: "dep_channels", name: "Other Channels", color: "#d0f800", kind: "main", headId: "tm_gyorgy" },
  { id: "dep_logistics", name: "Logistics", color: "#408038", kind: "main", headId: "tm_thaylu" },
  { id: "dep_finance", name: "Finance", color: "#ffffff", kind: "main", headId: "tm_jaime" },

  // Marketing sub-departments
  { id: "dep_advertising", name: "Advertising", color: "#f06020", kind: "sub", parentId: "dep_marketing", headId: "tm_damian" },
  { id: "dep_creative", name: "Creative", color: "#e83028", kind: "sub", parentId: "dep_marketing", headId: "tm_jose" },
  { id: "dep_organic", name: "Organic & Retention", color: "#10a0f8", kind: "sub", parentId: "dep_marketing", headId: "tm_jose" },

  // Experience sub-departments
  { id: "dep_cs", name: "Customer Success", color: "#ffd833", kind: "sub", parentId: "dep_experience", headId: "tm_doralee" },
  { id: "dep_team_success", name: "Team Success", color: "#ff6b4a", kind: "sub", parentId: "dep_experience", headId: "tm_thaylu" },

  // Website sub-departments
  { id: "dep_lp", name: "Landing Pages", color: "#34d399", kind: "sub", parentId: "dep_website", headId: "tm_damian" },
  { id: "dep_cro", name: "CRO", color: "#2dd4bf", kind: "sub", parentId: "dep_website", headId: "tm_jesus_m" },

  // Other Channels sub-departments
  { id: "dep_amazon", name: "Amazon", color: "#ff9900", kind: "sub", parentId: "dep_channels", headId: "tm_gyorgy" },
  { id: "dep_ttshop", name: "TikTok Shop", color: "#e83028", kind: "sub", parentId: "dep_channels", headId: "tm_gyorgy" },
  { id: "dep_marketplace", name: "Walmart & Other", color: "#10a0f8", kind: "sub", parentId: "dep_channels", headId: "tm_gyorgy" },

  // Logistics sub-departments
  { id: "dep_supply", name: "Supply Chain", color: "#86efac", kind: "sub", parentId: "dep_logistics", headId: "tm_thaylu" },
  { id: "dep_fulfillment", name: "Fulfillment", color: "#4ade80", kind: "sub", parentId: "dep_logistics", headId: "tm_evelyn" },
];

const team: TeamMember[] = [
  // Executive
  { id: "tm_jose", name: "Jose Lepage", position: "CEO", departmentId: "dep_exec", additionalDepartmentIds: ["dep_marketing", "dep_creative", "dep_organic"] },
  // Thaylu wears multiple hats: EA + Head of Experience + Head of Team Success + Head of Logistics + Head of Supply Chain
  { id: "tm_thaylu", name: "Thaylu Rojas", position: "Executive Assistant · Head of Experience · Logistics · Supply Chain", departmentId: "dep_exec", additionalDepartmentIds: ["dep_experience", "dep_team_success", "dep_logistics", "dep_supply"], managerIds: ["tm_jose"] },

  // Finance
  { id: "tm_jaime", name: "Jaime Trujillo", position: "Fractional CFO", departmentId: "dep_finance", managerIds: ["tm_jose"] },
  // Gyorgy: Finance primary + Other Channels (main + 3 subs)
  { id: "tm_gyorgy", name: "Gyorgy Vagovits", position: "Finance Manager · Amazon / TTS / Walmart Manager", departmentId: "dep_finance", additionalDepartmentIds: ["dep_channels", "dep_amazon", "dep_ttshop", "dep_marketplace"], managerIds: ["tm_jaime"] },

  // Advertising
  // Damian: Head of Advertising primary + AppLovin (Advertising) + LP Specialist (Website main + LP sub)
  { id: "tm_damian", name: "Damian Perez", position: "Head of Advertising · AppLovin · LP Specialist", departmentId: "dep_advertising", additionalDepartmentIds: ["dep_website", "dep_lp"], managerIds: ["tm_jose"] },
  { id: "tm_simona", name: "Simona Saule", position: "Meta & Snap Media Buyer", departmentId: "dep_advertising", managerIds: ["tm_damian"] },
  { id: "tm_kristaps", name: "Kristaps Krauklis", position: "Meta & Snap Media Buyer", departmentId: "dep_advertising", managerIds: ["tm_damian"] },
  { id: "tm_ivana", name: "Ivana Vitali", position: "Google & TikTok Media Buyer", departmentId: "dep_advertising", managerIds: ["tm_damian"] },

  // Creative — Jose is the head; three Creative Strategists each lead their own pod
  { id: "tm_oli", name: "Oli Cimet", position: "Creative Strategist", departmentId: "dep_creative", managerIds: ["tm_jose"] },
  { id: "tm_malu", name: "Malu Celestino", position: "Creative Strategist", departmentId: "dep_creative", managerIds: ["tm_jose"] },
  { id: "tm_maria", name: "Maria Paula Dominguez", position: "Creative Strategist", departmentId: "dep_creative", managerIds: ["tm_jose"] },
  // Dante: dual role (Video Editor + Creative Strategist), reports to Malu, has Sami under
  { id: "tm_dante", name: "Dante Vilar", position: "Video Editor · Creative Strategist", departmentId: "dep_creative", managerIds: ["tm_malu"] },
  { id: "tm_sami", name: "Sami Mughal", position: "Video Editor", departmentId: "dep_creative", managerIds: ["tm_dante"] },
  { id: "tm_pedro", name: "Pedro Raze", position: "Video Editor", departmentId: "dep_creative", managerIds: ["tm_maria"] },
  { id: "tm_paul", name: "Paul R.", position: "Video Editor", departmentId: "dep_creative", managerIds: ["tm_oli"] },
  // Winder reports to Oli, Malu, AND Maria (shared graphic designer)
  { id: "tm_winder", name: "Winder Buznego", position: "Graphic Designer", departmentId: "dep_creative", managerIds: ["tm_oli", "tm_malu", "tm_maria"] },
  // Jesus de Windt: Content Strategist (Creative) + Social Media Manager (Organic). No reports.
  { id: "tm_jesus_dw", name: "Jesus de Windt", position: "Content Strategist · Social Media Manager", departmentId: "dep_creative", additionalDepartmentIds: ["dep_organic"], managerIds: ["tm_jose"] },

  // Organic & Retention — Jose is head
  { id: "tm_samra", name: "Samra Zuga", position: "Email & SMS Specialist", departmentId: "dep_organic", managerIds: ["tm_jose"] },
  { id: "tm_sharon", name: "Sharon", position: "Copywriter", departmentId: "dep_organic", managerIds: ["tm_samra"] },

  // Customer Success — Doralee leads CS; reports to Thaylu (head of Experience)
  { id: "tm_doralee", name: "Doralee Clemente", position: "Head of Customer Success", departmentId: "dep_cs", managerIds: ["tm_thaylu"] },
  { id: "tm_justine", name: "Justine Formacion", position: "CS Rep", departmentId: "dep_cs", managerIds: ["tm_doralee"] },
  { id: "tm_juan", name: "Juan Urena", position: "CS Rep", departmentId: "dep_cs", managerIds: ["tm_doralee"] },
  { id: "tm_felipe", name: "Felipe Osorio", position: "CS Rep", departmentId: "dep_cs", managerIds: ["tm_doralee"] },
  { id: "tm_anthony", name: "Anthony Burcac", position: "CS Rep", departmentId: "dep_cs", managerIds: ["tm_doralee"] },

  // Website — LP (Damian above) + CRO
  { id: "tm_jesus_m", name: "Jesus Mendoza", position: "CRO Specialist", departmentId: "dep_cro", managerIds: ["tm_jose"] },
  { id: "tm_mateo", name: "Mateo Costa", position: "CRO Specialist", departmentId: "dep_cro", managerIds: ["tm_jose"] },

  // Logistics → Fulfillment
  { id: "tm_evelyn", name: "Evelyn Marin", position: "Warehouse Manager", departmentId: "dep_fulfillment", managerIds: ["tm_thaylu"] },
  { id: "tm_heidi", name: "Heidi Aguilera", position: "Warehouse Rep", departmentId: "dep_fulfillment", managerIds: ["tm_evelyn"] },
  { id: "tm_miet", name: "Miet Aguilera", position: "Warehouse Rep", departmentId: "dep_fulfillment", managerIds: ["tm_evelyn"] },
  { id: "tm_jose_torres", name: "Jose Torres", position: "Warehouse Rep", departmentId: "dep_fulfillment", managerIds: ["tm_evelyn"] },
];

type KpiSpec = KPI & {
  target: number;
  ownerId: string;
  watcherIds?: string[];
  today: number;
  last7: number;
  mtd: number;
};

const kpiSpecs: KpiSpec[] = [
  // ── ADVERTISING ─────────────────────────────────────────────────────
  k("meta_roas", "Meta ROAS", "Blended Meta ROAS (prospecting + retargeting)", "ratio", "higher_is_better", "triplewhale", "meta.roas", "mtd",
    2.5, "tm_simona", ["tm_kristaps", "tm_damian", "tm_jose"], 1.2, 1.63, 2.38),
  k("meta_spend", "Meta Ad Spend", "Monthly Meta budget deployed", "currency", "higher_is_better", "triplewhale", "meta.spend", "mtd",
    320000, "tm_simona", ["tm_kristaps", "tm_damian"], 9800, 10500, 296000),
  k("meta_cpa", "Meta CPA", "Cost per new customer acquired via Meta", "currency", "lower_is_better", "triplewhale", "meta.cpa", "mtd",
    50, "tm_simona", ["tm_kristaps", "tm_damian"], 58, 51, 49),
  k("meta_ctr", "Meta CTR", "Link click-through rate across Meta ads", "percent", "higher_is_better", "triplewhale", "meta.ctr", "mtd",
    1.2, "tm_simona", ["tm_kristaps", "tm_damian"], 1.1, 1.18, 1.24),
  k("google_roas", "Google ROAS", "Revenue/spend across Search, Shopping, YouTube, Bing", "ratio", "higher_is_better", "triplewhale", "google.roas", "mtd",
    3.0, "tm_ivana", ["tm_damian"], 3.2, 3.05, 3.12),
  k("google_cpa_brand", "Google Branded CPA", "Cost per acquisition on branded search", "currency", "lower_is_better", "triplewhale", "google.cpa_branded", "mtd",
    40, "tm_ivana", ["tm_damian"], 38, 41, 39),
  k("tiktok_roas", "TikTok ROAS", "Revenue per dollar on TikTok ads", "ratio", "higher_is_better", "triplewhale", "tiktok.roas", "mtd",
    2.0, "tm_ivana", ["tm_damian"], 1.7, 1.85, 1.92),
  k("tiktok_hook", "TikTok Hook Rate", "3-sec view rate on TikTok ads", "percent", "higher_is_better", "triplewhale", "tiktok.hook_rate", "mtd",
    30, "tm_ivana", ["tm_damian", "tm_oli"], 28, 31, 32),
  k("snap_roas", "Snap ROAS", "Revenue per dollar spent on Snapchat ads", "ratio", "higher_is_better", "triplewhale", "snap.roas", "mtd",
    2.0, "tm_simona", ["tm_kristaps", "tm_damian"], 1.9, 2.0, 2.08),
  k("applovin_roas", "AppLovin ROAS", "Revenue per dollar on AppLovin network", "ratio", "higher_is_better", "triplewhale", "applovin.roas", "mtd",
    2.0, "tm_damian", ["tm_jose"], 1.6, 1.8, 1.78),
  k("blended_roas", "Blended ROAS", "Overall store ROAS across all channels", "ratio", "higher_is_better", "triplewhale", "blended.roas", "mtd",
    3.0, "tm_damian", ["tm_jose"], 2.7, 2.9, 2.95),

  // ── CREATIVE ────────────────────────────────────────────────────────
  k("cs_win_rate", "Creative Win Rate", "% of launched creatives hitting ROAS/CPA targets in 72h", "percent", "higher_is_better", "gsheets", "creative.win_rate", "mtd",
    20, "tm_oli", ["tm_malu", "tm_maria", "tm_jose"], 18, 21, 22),
  k("briefs_week", "Briefs / Week", "New creative concepts briefed each week", "number", "higher_is_better", "gsheets", "creative.briefs_per_week", "7d",
    5, "tm_oli", ["tm_malu", "tm_maria"], 1, 5, 4),
  k("videos_week", "Videos Delivered / Week", "Finished video ads delivered to media buyers", "number", "higher_is_better", "gsheets", "creative.videos_per_week", "7d",
    10, "tm_dante", ["tm_sami", "tm_pedro", "tm_paul", "tm_oli"], 2, 10, 9),
  k("assets_week", "Static Assets / Week", "Image ads, banners, email graphics, LP visuals", "number", "higher_is_better", "gsheets", "creative.assets_per_week", "7d",
    12, "tm_winder", ["tm_oli"], 3, 13, 11),
  k("content_adherence", "Content Calendar Adherence", "Planned content published on schedule", "percent", "higher_is_better", "gsheets", "content.calendar_adherence", "mtd",
    90, "tm_jesus_dw", ["tm_jose"], 92, 91, 92),

  // ── ORGANIC / RETENTION ────────────────────────────────────────────
  k("klaviyo_rev_pct", "Email Revenue % of Total", "Klaviyo attributed revenue share of DTC revenue", "percent", "higher_is_better", "klaviyo", "email.share_of_total", "mtd",
    30, "tm_samra", ["tm_jose"], 28, 29, 31),
  k("klaviyo_open", "Email Open Rate", "Average open rate across campaigns", "percent", "higher_is_better", "klaviyo", "email.open_rate", "mtd",
    35, "tm_samra", ["tm_sharon"], 36, 35, 37),
  k("klaviyo_click", "Email Click Rate", "Average click rate across campaigns", "percent", "higher_is_better", "klaviyo", "email.click_rate", "mtd",
    2.5, "tm_samra", ["tm_sharon"], 2.4, 2.45, 2.62),
  k("sms_rev_pct", "SMS Revenue % of Total", "Postscript attributed revenue share", "percent", "higher_is_better", "postscript", "sms.share_of_total", "mtd",
    10, "tm_samra", [], 8, 9.5, 10.4),
  k("sms_ctr", "SMS Click-Through Rate", "Recipients who click the SMS link", "percent", "higher_is_better", "postscript", "sms.ctr", "mtd",
    10, "tm_samra", [], 9, 10, 10.2),
  k("sms_optout", "SMS Opt-Out Rate", "Unsubscribes per campaign (lower is better)", "percent", "lower_is_better", "postscript", "sms.opt_out", "mtd",
    2, "tm_samra", [], 1.8, 1.9, 1.7),
  k("social_engagement", "Social Engagement Rate", "Engagement / reach across IG & TikTok organic", "percent", "higher_is_better", "gsheets", "social.engagement", "mtd",
    3, "tm_jesus_dw", ["tm_jose"], 2.6, 2.9, 3.1),
  k("social_followers", "Follower Growth MoM", "Net new followers as % of total", "percent", "higher_is_better", "gsheets", "social.follower_growth_mom", "mtd",
    3, "tm_jesus_dw", [], 2.5, 2.8, 3.2),

  // ── WEBSITE ─────────────────────────────────────────────────────────
  k("lp_cvr", "Landing Page CVR", "Conversion rate on key landing pages", "percent", "higher_is_better", "shopify", "lp.conversion_rate", "mtd",
    3.5, "tm_damian", ["tm_jose"], 3.2, 3.4, 3.55),
  k("lp_speed", "Page Load Speed", "Mobile time-to-interactive (lower is better)", "duration_s", "lower_is_better", "gsheets", "lp.mobile_tti_s", "7d",
    2.5, "tm_damian", [], 2.7, 2.6, 2.55),
  k("site_cvr", "Sitewide CVR", "Blended Shopify conversion rate", "percent", "higher_is_better", "shopify", "site.conversion_rate", "mtd",
    2.5, "tm_jesus_m", ["tm_mateo", "tm_jose"], 2.3, 2.45, 2.48),
  k("ab_tests", "A/B Tests / Month", "Properly structured tests launched", "number", "higher_is_better", "gsheets", "cro.ab_tests_per_month", "mtd",
    4, "tm_jesus_m", ["tm_mateo"], 0, 1, 4),
  k("aov", "AOV", "Average order value across DTC", "currency", "higher_is_better", "shopify", "orders.aov", "mtd",
    120, "tm_jesus_m", ["tm_mateo", "tm_jose"], 118, 121, 124),
  k("checkout_rate", "Checkout Completion", "Started checkouts that complete", "percent", "higher_is_better", "shopify", "checkout.completion", "mtd",
    55, "tm_jesus_m", ["tm_mateo"], 52, 54, 56),

  // ── OTHER CHANNELS ─────────────────────────────────────────────────
  k("amazon_rev", "Amazon Revenue", "Total monthly revenue on Amazon", "currency", "higher_is_better", "gsheets", "amazon.revenue", "mtd",
    525000, "tm_gyorgy", ["tm_jose"], 17200, 18600, 504000),
  k("amazon_tacos", "Amazon TACoS", "Ad spend / total Amazon revenue (lower is better)", "percent", "lower_is_better", "gsheets", "amazon.tacos", "mtd",
    15, "tm_gyorgy", [], 16, 15.2, 14.8),
  k("amazon_buybox", "Amazon Buy Box", "% of time Carbinox owns its Buy Box", "percent", "higher_is_better", "gsheets", "amazon.buy_box_win", "mtd",
    95, "tm_gyorgy", [], 97, 96, 96.5),
  k("ttshop_rev", "TikTok Shop Revenue", "Monthly GMV on TikTok Shop", "currency", "higher_is_better", "gsheets", "tiktokshop.revenue", "mtd",
    45000, "tm_gyorgy", [], 1200, 1400, 38000),
  k("ttshop_creators", "Active Affiliate Creators", "Affiliates driving sales this month", "number", "higher_is_better", "gsheets", "tiktokshop.creators_active", "mtd",
    20, "tm_gyorgy", [], 0, 19, 22),
  k("walmart_rev", "Marketplace Revenue", "Walmart / Best Buy / eBay combined revenue", "currency", "higher_is_better", "gsheets", "marketplaces.revenue", "mtd",
    75000, "tm_gyorgy", [], 2100, 2400, 64000),
  k("walmart_odr", "Order Defect Rate", "Late/cancelled/return rate across marketplaces", "percent", "lower_is_better", "gsheets", "marketplaces.order_defect_rate", "mtd",
    1, "tm_gyorgy", [], 0.8, 0.9, 0.95),

  // ── LOGISTICS ──────────────────────────────────────────────────────
  k("stockout", "Stockout Rate (Top 3 SKUs)", "% of days top-3 SKUs were out of stock", "percent", "lower_is_better", "gsheets", "supply.stockout_top3", "mtd",
    0, "tm_thaylu", ["tm_jose"], 0, 0, 0.5),
  k("inbound_defect", "Inbound Defect Rate", "Units arriving from manufacturer with defects", "percent", "lower_is_better", "gsheets", "supply.defect_inbound", "mtd",
    2, "tm_thaylu", [], 1.6, 1.8, 1.9),
  k("inventory_turn", "Inventory Turnover", "Times inventory sells & replaces per year (annualized)", "ratio", "higher_is_better", "gsheets", "supply.inventory_turnover", "mtd",
    6, "tm_thaylu", [], 5.8, 5.9, 6.1),
  k("ship_sla_heidi", "Ship-by-SLA (Heidi)", "Orders shipped within promised SLA", "percent", "higher_is_better", "shopify", "fulfillment.sla.heidi", "mtd",
    98, "tm_heidi", ["tm_evelyn", "tm_thaylu"], 97, 98, 98.5),
  k("ship_sla_miet", "Ship-by-SLA (Miet)", "Orders shipped within promised SLA", "percent", "higher_is_better", "shopify", "fulfillment.sla.miet", "mtd",
    98, "tm_miet", ["tm_evelyn", "tm_thaylu"], 99, 99, 99.1),
  k("ship_sla_jose_torres", "Ship-by-SLA (Jose)", "Orders shipped within promised SLA", "percent", "higher_is_better", "shopify", "fulfillment.sla.jose_torres", "mtd",
    98, "tm_jose_torres", ["tm_evelyn", "tm_thaylu"], 95, 96, 96.2),
  k("order_accuracy", "Order Accuracy Rate", "Correct items, quantities, and packaging", "percent", "higher_is_better", "gsheets", "fulfillment.order_accuracy", "mtd",
    99.5, "tm_evelyn", ["tm_thaylu"], 99.2, 99.4, 99.5),

  // ── CUSTOMER SUCCESS ───────────────────────────────────────────────
  k("frt_justine", "First Response Time (Justine)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.justine", "7d",
    14400, "tm_justine", ["tm_doralee"], 13200, 13800, 13400),
  k("frt_juan", "First Response Time (Juan)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.juan", "7d",
    14400, "tm_juan", ["tm_doralee"], 18000, 16200, 15600),
  k("frt_felipe", "First Response Time (Felipe)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.felipe", "7d",
    14400, "tm_felipe", ["tm_doralee"], 13200, 12800, 13500),
  k("frt_anthony", "First Response Time (Anthony)", "Time to first human response (email)", "duration_s", "lower_is_better", "zendesk", "cs.frt.anthony", "7d",
    14400, "tm_anthony", ["tm_doralee"], 13800, 13200, 13900),
  k("csat", "Company CSAT", "Blended CSAT across all reps", "ratio", "higher_is_better", "zendesk", "cs.csat_blended", "mtd",
    4.2, "tm_doralee", ["tm_jose"], 4.3, 4.25, 4.28),

  // ── FINANCE ────────────────────────────────────────────────────────
  k("net_margin", "Net Profit Margin", "Bottom-line profit after ALL expenses", "percent", "higher_is_better", "gsheets", "finance.net_margin", "mtd",
    15, "tm_jaime", ["tm_jose"], 13, 14.2, 15.6),
  k("mer", "MER", "Total revenue ÷ total marketing spend", "ratio", "higher_is_better", "gsheets", "finance.mer", "mtd",
    3.0, "tm_jaime", ["tm_jose"], 2.8, 2.95, 3.08),
  k("gross_margin", "Gross Margin", "Revenue minus COGS as % of revenue", "percent", "higher_is_better", "gsheets", "finance.gross_margin", "mtd",
    60, "tm_jaime", ["tm_jose"], 61, 60.5, 61.2),
  k("ccc", "Cash Conversion Cycle", "Days between paying inventory and getting paid (lower is better)", "duration_s", "lower_is_better", "gsheets", "finance.ccc_days_seconds", "mtd",
    45 * 86400, "tm_jaime", ["tm_jose"], 43 * 86400, 44 * 86400, 42 * 86400),
  k("budget_variance", "Budget Variance", "Actual spend vs. planned budget per department", "percent", "lower_is_better", "gsheets", "finance.budget_variance", "mtd",
    5, "tm_gyorgy", ["tm_jaime"], 3.2, 4.1, 3.8),

  // ── EXECUTIVE ──────────────────────────────────────────────────────
  k("ea_action", "Action Item Follow-Through", "Leadership action items tracked & completed on time", "percent", "higher_is_better", "gsheets", "ea.action_item_follow_through", "mtd",
    95, "tm_thaylu", ["tm_jose"], 94, 95, 96),
  k("ea_response", "EA Response Time", "Avg response time during business hours", "duration_s", "lower_is_better", "gsheets", "ea.response_time_s", "7d",
    3600, "tm_thaylu", ["tm_jose"], 3300, 3200, 3400),

  // Company-level (CEO dashboard)
  k("co_revenue", "Total Revenue", "Shopify + Amazon + Other Channels (MTD)", "currency", "higher_is_better", "gsheets", "company.total_revenue", "mtd",
    1500000, "tm_jose", [], 47000, 49500, 1395000),
  k("co_ltv_cac", "LTV : CAC", "Lifetime value divided by blended CAC", "ratio", "higher_is_better", "gsheets", "company.ltv_to_cac", "mtd",
    3.0, "tm_jose", [], 2.9, 2.95, 3.1),
  k("co_repeat", "Repeat Purchase Rate", "% of customers who buy more than once", "percent", "higher_is_better", "gsheets", "company.repeat_purchase_rate", "mtd",
    15, "tm_jose", [], 14.2, 14.8, 15.3),
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
        // 400 days of samples so 90/180/365-day views have real data to chew on.
        samples: buildSamples(s.last7, 400, s.unit),
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
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}
