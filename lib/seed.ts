import type { AppState, KPI, Target, TeamMember, Department } from "./types";

/**
 * Seed data — Carbinox roster + KPIs straight from
 * Carbinox_Performance_KPIs.pdf (April 2026).
 *
 * Targets are the monthly numbers from the PDF. KPIs are intentionally
 * scoped tight (3-5 per role). Open seats (COO, CMO, CRO, Head of Creative,
 * etc.) are not seeded — they'll be added when filled.
 */

const PERIOD = currentMonthKey();

const departments: Department[] = [
  // Main departments
  { id: "dep_exec", name: "Executive", color: "#f8f8f8", kind: "main", headId: "tm_jose" },
  { id: "dep_marketing", name: "Marketing & Advertising", color: "#f8c808", kind: "main", headId: "tm_damian" },
  { id: "dep_retention", name: "Retention", color: "#10a0f8", kind: "main", headId: "tm_samra" },
  { id: "dep_cx", name: "Experience", color: "#ffd833", kind: "main", headId: "tm_thaylu" },
  { id: "dep_revenue", name: "Revenue", color: "#48f088", kind: "main", headId: "tm_damian" },
  { id: "dep_finops", name: "Finance & Operations", color: "#a78bfa", kind: "main", headId: "tm_jaime" },

  // Marketing & Advertising sub-departments
  { id: "dep_advertising", name: "Advertising", color: "#f06020", kind: "sub", parentId: "dep_marketing", headId: "tm_damian" },
  { id: "dep_creative", name: "Creative", color: "#e83028", kind: "sub", parentId: "dep_marketing" },
  { id: "dep_content", name: "Content & Affiliate", color: "#d0f800", kind: "sub", parentId: "dep_marketing" },

  // Customer Experience sub-departments
  { id: "dep_cs", name: "Customer Success", color: "#ffd833", kind: "sub", parentId: "dep_cx", headId: "tm_doralee" },
  { id: "dep_team_success", name: "Team Success", color: "#ff6b4a", kind: "sub", parentId: "dep_cx", headId: "tm_thaylu" },

  // Revenue sub-departments
  { id: "dep_website", name: "Website", color: "#34d399", kind: "sub", parentId: "dep_revenue", headId: "tm_damian" },
  { id: "dep_marketplaces", name: "Marketplaces", color: "#2dd4bf", kind: "sub", parentId: "dep_revenue", headId: "tm_gyorgy" },

  // Finance & Operations sub-departments
  { id: "dep_finance", name: "Finance", color: "#ffffff", kind: "sub", parentId: "dep_finops", headId: "tm_jaime" },
  { id: "dep_logistics", name: "Logistics", color: "#86efac", kind: "sub", parentId: "dep_finops", headId: "tm_evelyn" },
  { id: "dep_supply_chain", name: "Supply Chain", color: "#4ade80", kind: "sub", parentId: "dep_finops", headId: "tm_thaylu" },
];

const team: TeamMember[] = [
  // Executive
  { id: "tm_jose", name: "Jose Lepage", position: "CEO", departmentId: "dep_exec" },
  // Thaylu wears multiple hats: EA / Acting CXO / Head of Team Success / Head of Supply Chain
  { id: "tm_thaylu", name: "Thaylu Rojas", position: "Chief of Experience · Head of Team Success · Head of Supply Chain", departmentId: "dep_exec", additionalDepartmentIds: ["dep_cx", "dep_team_success", "dep_supply_chain"], managerIds: ["tm_jose"] },

  // Marketing & Advertising — Advertising
  // Damian: Head of Advertising (primary) + TikTok/AppLovin/Reddit Buyer + Head of Website
  { id: "tm_damian", name: "Damian Perez", position: "Head of Advertising · Head of Website · TikTok / AppLovin / Reddit Buyer", departmentId: "dep_advertising", additionalDepartmentIds: ["dep_website"], managerIds: ["tm_jose"] },
  { id: "tm_simona", name: "Simona Saule", position: "Meta & Snap Media Buyer", departmentId: "dep_advertising", managerIds: ["tm_damian"] },
  { id: "tm_kristaps", name: "Kristaps Krauklis", position: "Meta & Snap Media Buyer", departmentId: "dep_advertising", managerIds: ["tm_damian"] },
  { id: "tm_ivana", name: "Ivana Vitali", position: "Google Media Buyer", departmentId: "dep_advertising", managerIds: ["tm_damian"] },

  // Creative — Four pods: each Strategist has an Editor under them + Winder in all pods
  // Pod 1: Oli → Paul R. + Winder
  { id: "tm_oli", name: "Oli Cimet", position: "Creative Strategist", departmentId: "dep_creative", managerIds: ["tm_damian"] },
  { id: "tm_paul", name: "Paul R.", position: "Video Editor", departmentId: "dep_creative", managerIds: ["tm_oli"] },
  // Pod 2: Malu → Dante + Winder
  { id: "tm_malu", name: "Malu Celestino", position: "Creative Strategist", departmentId: "dep_creative", managerIds: ["tm_damian"] },
  { id: "tm_dante", name: "Dante Vilar", position: "Creative Strategist · Video Editor", departmentId: "dep_creative", managerIds: ["tm_malu"] },
  // Pod 3: Maria → Pedro + Winder
  { id: "tm_maria", name: "Maria Paula Dominguez", position: "Creative Strategist · TikTok Shop Specialist", departmentId: "dep_creative", additionalDepartmentIds: ["dep_content"], managerIds: ["tm_damian"] },
  { id: "tm_pedro", name: "Pedro Raze", position: "Video Editor", departmentId: "dep_creative", managerIds: ["tm_maria"] },
  // Pod 4: Dante → Sami + Winder
  { id: "tm_sami", name: "Sami Mughal", position: "Video Editor", departmentId: "dep_creative", managerIds: ["tm_dante"] },
  // Winder is the shared graphic designer — reports to all 4 strategists
  { id: "tm_winder", name: "Winder Buznego", position: "Graphic Designer", departmentId: "dep_creative", managerIds: ["tm_oli", "tm_malu", "tm_maria", "tm_dante"] },

  // Content & Affiliate
  { id: "tm_jesus_dw", name: "Jesus de Windt", position: "Content Manager · TikTok Shop Specialist", departmentId: "dep_content", managerIds: ["tm_damian"] },

  // Retention
  { id: "tm_samra", name: "Samra Zuga", position: "Email & SMS Specialist", departmentId: "dep_retention", managerIds: ["tm_jose"] },

  // Customer Success
  { id: "tm_doralee", name: "Doralee Clemente", position: "Head of CX Success", departmentId: "dep_cs", managerIds: ["tm_thaylu"] },
  { id: "tm_anthony", name: "Anthony Burac", position: "CX Representative", departmentId: "dep_cs", managerIds: ["tm_doralee"] },
  { id: "tm_justine", name: "Justine Formacion", position: "CX Representative", departmentId: "dep_cs", managerIds: ["tm_doralee"] },
  { id: "tm_juan", name: "Juan Urena", position: "CX Representative", departmentId: "dep_cs", managerIds: ["tm_doralee"] },
  { id: "tm_felipe", name: "Felipe Osorio", position: "CX Representative", departmentId: "dep_cs", managerIds: ["tm_doralee"] },

  // Marketplaces
  { id: "tm_gyorgy", name: "Gyorgy Vagovits", position: "Head of Marketplaces", departmentId: "dep_marketplaces", managerIds: ["tm_jose"] },

  // Finance
  { id: "tm_jaime", name: "Jaime Trujillo", position: "Fractional CFO", departmentId: "dep_finance", managerIds: ["tm_jose"] },

  // Logistics
  { id: "tm_evelyn", name: "Evelyn Marin", position: "Head of Logistics", departmentId: "dep_logistics", managerIds: ["tm_thaylu"] },
];

type KpiSpec = KPI & {
  target: number;
  ownerId: string;
  watcherIds?: string[];
  /** What dept this target is logged under */
  targetDepartmentId?: string;
  /** Initial values for this month — actual data from connectors will override */
  today: number;
  last7: number;
  mtd: number;
};

const kpiSpecs: KpiSpec[] = [
  // ── CEO — Jose Lepage ──────────────────────────────────────────────────
  k("ceo_revenue", "Company Revenue", "Total revenue across all channels (Shopify + Amazon + Others).", "currency", "higher_is_better", "shopify", "company.revenue", "mtd",
    1500000, "tm_jose", "dep_exec", [], 0, 0, 0),
  k("ceo_ebitda", "EBITDA Margin", "EBITDA ÷ Revenue.", "percent", "higher_is_better", "gsheets", "company.ebitda_margin", "mtd",
    10, "tm_jose", "dep_exec", [], 0, 0, 0),
  k("ceo_net_margin", "Net Profit Margin", "Net profit ÷ Revenue.", "percent", "higher_is_better", "gsheets", "company.net_margin", "mtd",
    15, "tm_jose", "dep_exec", [], 0, 0, 0),
  k("ceo_blended_roas", "Blended ROAS", "Total revenue ÷ total ad spend across all platforms.", "ratio", "higher_is_better", "triplewhale", "company.blended_roas", "mtd",
    2.28, "tm_jose", "dep_exec", [], 0, 0, 0),
  k("ceo_kpis_on_track", "% KPIs On Track", "Company-wide percentage of KPIs at or above target.", "percent", "higher_is_better", "manual", "company.kpis_on_track", "mtd",
    80, "tm_jose", "dep_exec", [], 0, 0, 0),

  // ── HEAD OF ADVERTISING — Damian ──────────────────────────────────────
  k("blended_roas", "Blended ROAS", "Total revenue ÷ total ad spend across all platforms.", "ratio", "higher_is_better", "triplewhale", "blended.roas", "mtd",
    2.28, "tm_damian", "dep_advertising", ["tm_jose"], 2.1, 2.2, 2.25),
  k("nc_roas", "NC ROAS", "New customer revenue ÷ total ad spend.", "ratio", "higher_is_better", "triplewhale", "blended.nc_roas", "mtd",
    1.9, "tm_damian", "dep_advertising", ["tm_jose"], 1.7, 1.8, 1.85),
  k("blended_cac", "Blended CAC", "Total ad spend ÷ # of new customers acquired.", "currency", "lower_is_better", "triplewhale", "blended.cac", "mtd",
    65, "tm_damian", "dep_advertising", ["tm_jose"], 70, 67, 66),
  k("winning_creative_rate", "Winning Creative Rate", "% of creatives that beat control.", "percent", "higher_is_better", "gsheets", "creative.winning_rate", "mtd",
    15, "tm_damian", "dep_advertising", ["tm_jose"], 12, 13, 14),
  k("spend_pacing_blended", "Spend Pacing", "Actual monthly spend vs. forecasted (±10% of forecast).", "percent", "band", "triplewhale", "blended.spend_pacing", "mtd",
    10, "tm_damian", "dep_advertising", ["tm_jose"], 6, 7, 8),

  // ── META MEDIA BUYER — Simona / Kristaps ──────────────────────────────
  k("meta_roas", "Meta Platform ROAS", "Meta revenue ÷ Meta spend.", "ratio", "higher_is_better", "triplewhale", "meta.roas", "mtd",
    1.66, "tm_simona", "dep_advertising", ["tm_kristaps", "tm_damian"], 1.5, 1.6, 1.62),
  k("meta_cac", "Meta CAC", "Meta spend ÷ new customers attributed to Meta.", "currency", "lower_is_better", "triplewhale", "meta.cac", "mtd",
    65, "tm_simona", "dep_advertising", ["tm_kristaps", "tm_damian"], 70, 67, 66),
  k("meta_pacing", "Meta Spend Pacing", "Actual Meta spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "meta.spend_pacing", "mtd",
    10, "tm_simona", "dep_advertising", ["tm_kristaps", "tm_damian"], 6, 7, 8),

  // ── META/SNAP MEDIA BUYER — Kristaps (same targets, separate ownership) ──
  k("kristaps_meta_roas", "Meta Platform ROAS", "Meta revenue ÷ Meta spend.", "ratio", "higher_is_better", "triplewhale", "meta.roas", "mtd",
    1.66, "tm_kristaps", "dep_advertising", ["tm_simona", "tm_damian"], 0, 0, 0),
  k("kristaps_meta_cac", "Meta CAC", "Meta spend ÷ new customers attributed to Meta.", "currency", "lower_is_better", "triplewhale", "meta.cac", "mtd",
    65, "tm_kristaps", "dep_advertising", ["tm_simona", "tm_damian"], 0, 0, 0),
  k("kristaps_meta_pacing", "Meta Spend Pacing", "Actual Meta spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "meta.spend_pacing", "mtd",
    10, "tm_kristaps", "dep_advertising", ["tm_simona", "tm_damian"], 0, 0, 0),
  k("kristaps_snap_roas", "Snap Platform ROAS", "Snap revenue ÷ Snap spend.", "ratio", "higher_is_better", "triplewhale", "snap.roas", "mtd",
    1.80, "tm_kristaps", "dep_advertising", ["tm_simona", "tm_damian"], 0, 0, 0),
  k("kristaps_snap_cac", "Snap CAC", "Snap spend ÷ new customers attributed to Snap.", "currency", "lower_is_better", "triplewhale", "snap.cac", "mtd",
    75, "tm_kristaps", "dep_advertising", ["tm_simona", "tm_damian"], 0, 0, 0),
  k("kristaps_snap_pacing", "Snap Spend Pacing", "Actual Snap spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "snap.spend_pacing", "mtd",
    10, "tm_kristaps", "dep_advertising", ["tm_simona", "tm_damian"], 0, 0, 0),

  // ── GOOGLE MEDIA BUYER — Ivana ────────────────────────────────────────
  k("google_roas", "Google Platform ROAS", "Google revenue ÷ Google spend.", "ratio", "higher_is_better", "triplewhale", "google.roas", "mtd",
    3.0, "tm_ivana", "dep_advertising", ["tm_damian"], 2.8, 2.9, 2.95),
  k("google_cac", "Google CAC", "Google spend ÷ new customers attributed to Google.", "currency", "lower_is_better", "triplewhale", "google.cac", "mtd",
    50, "tm_ivana", "dep_advertising", ["tm_damian"], 52, 51, 50),
  k("google_pacing", "Google Spend Pacing", "Actual Google spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "google.spend_pacing", "mtd",
    10, "tm_ivana", "dep_advertising", ["tm_damian"], 5, 6, 7),

  // ── SNAP MEDIA BUYER — Simona / Kristaps ──────────────────────────────
  k("snap_roas", "Snap Platform ROAS", "Snap revenue ÷ Snap spend.", "ratio", "higher_is_better", "triplewhale", "snap.roas", "mtd",
    1.80, "tm_simona", "dep_advertising", ["tm_kristaps", "tm_damian"], 1.6, 1.7, 1.75),
  k("snap_cac", "Snap CAC", "Snap spend ÷ new customers attributed to Snap.", "currency", "lower_is_better", "triplewhale", "snap.cac", "mtd",
    75, "tm_simona", "dep_advertising", ["tm_kristaps", "tm_damian"], 80, 77, 76),
  k("snap_pacing", "Snap Spend Pacing", "Actual Snap spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "snap.spend_pacing", "mtd",
    10, "tm_simona", "dep_advertising", ["tm_kristaps", "tm_damian"], 6, 7, 8),

  // ── TIKTOK MEDIA BUYER — Damian ───────────────────────────────────────
  k("tiktok_roas", "TikTok Platform ROAS", "TikTok revenue ÷ TikTok spend.", "ratio", "higher_is_better", "triplewhale", "tiktok.roas", "mtd",
    1.5, "tm_damian", "dep_advertising", ["tm_jose"], 1.3, 1.4, 1.45),
  k("tiktok_cac", "TikTok CAC", "TikTok spend ÷ new customers attributed to TikTok.", "currency", "lower_is_better", "triplewhale", "tiktok.cac", "mtd",
    70, "tm_damian", "dep_advertising", ["tm_jose"], 75, 72, 71),
  k("tiktok_pacing", "TikTok Spend Pacing", "Actual TikTok spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "tiktok.spend_pacing", "mtd",
    10, "tm_damian", "dep_advertising", ["tm_jose"], 5, 6, 7),

  // ── APPLOVIN MEDIA BUYER — Damian ─────────────────────────────────────
  k("applovin_roas", "AppLovin Platform ROAS", "AppLovin revenue ÷ AppLovin spend.", "ratio", "higher_is_better", "triplewhale", "applovin.roas", "mtd",
    1.5, "tm_damian", "dep_advertising", ["tm_jose"], 1.3, 1.4, 1.45),
  k("applovin_cac", "AppLovin CAC", "AppLovin spend ÷ new customers attributed.", "currency", "lower_is_better", "triplewhale", "applovin.cac", "mtd",
    80, "tm_damian", "dep_advertising", ["tm_jose"], 85, 82, 81),
  k("applovin_pacing", "AppLovin Spend Pacing", "Actual AppLovin spend vs. forecasted (±10%).", "percent", "band", "triplewhale", "applovin.spend_pacing", "mtd",
    10, "tm_damian", "dep_advertising", ["tm_jose"], 6, 7, 8),

  // ── REDDIT MEDIA BUYER — Damian ───────────────────────────────────────
  k("reddit_roas", "Reddit Platform ROAS", "Reddit revenue ÷ Reddit spend.", "ratio", "higher_is_better", "manual", "reddit.roas", "mtd",
    2.0, "tm_damian", "dep_advertising", ["tm_jose"], 1.8, 1.9, 1.95),
  k("reddit_cac", "Reddit CAC", "Reddit spend ÷ new customers attributed to Reddit.", "currency", "lower_is_better", "manual", "reddit.cac", "mtd",
    75, "tm_damian", "dep_advertising", ["tm_jose"], 80, 77, 76),
  k("reddit_pacing", "Reddit Spend Pacing", "Actual Reddit spend vs. forecasted (±10%).", "percent", "band", "manual", "reddit.spend_pacing", "mtd",
    10, "tm_damian", "dep_advertising", ["tm_jose"], 5, 6, 7),

  // ── CREATIVE STRATEGISTS — Oli ───────────────────────────────────────
  k("oli_winning_images", "% Winning Images", "Static creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.oli.winning_images", "mtd",
    15, "tm_oli", "dep_creative", ["tm_damian"], 13, 14, 14),
  k("oli_winning_videos", "% Winning Videos", "Video creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.oli.winning_videos", "mtd",
    15, "tm_oli", "dep_creative", ["tm_damian"], 12, 13, 14),
  k("oli_hook_rate", "Average Hook Rate", "Average 3-sec view rate across creatives.", "percent", "higher_is_better", "triplewhale", "creative.oli.hook_rate", "mtd",
    35, "tm_oli", "dep_creative", ["tm_damian"], 31, 33, 34),
  k("oli_ctr", "Average CTR", "Total clicks ÷ total impressions across creatives.", "percent", "higher_is_better", "triplewhale", "creative.oli.ctr", "mtd",
    1, "tm_oli", "dep_creative", ["tm_damian"], 0.8, 0.9, 0.95),
  k("oli_spend_concentration", "Spend Concentration", "Spend on their creatives ÷ total ad spend (~25% ±5%).", "percent", "higher_is_better", "gsheets", "creative.oli.spend_share", "mtd",
    25, "tm_oli", "dep_creative", ["tm_damian"], 23, 24, 25),

  // ── CREATIVE STRATEGISTS — Malu ───────────────────────────────────────
  k("malu_winning_images", "% Winning Images", "Static creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.malu.winning_images", "mtd",
    15, "tm_malu", "dep_creative", ["tm_damian"], 13, 14, 14),
  k("malu_winning_videos", "% Winning Videos", "Video creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.malu.winning_videos", "mtd",
    15, "tm_malu", "dep_creative", ["tm_damian"], 12, 13, 14),
  k("malu_hook_rate", "Average Hook Rate", "Average 3-sec view rate across creatives.", "percent", "higher_is_better", "triplewhale", "creative.malu.hook_rate", "mtd",
    35, "tm_malu", "dep_creative", ["tm_damian"], 31, 33, 34),
  k("malu_ctr", "Average CTR", "Total clicks ÷ total impressions across creatives.", "percent", "higher_is_better", "triplewhale", "creative.malu.ctr", "mtd",
    1, "tm_malu", "dep_creative", ["tm_damian"], 0.8, 0.9, 0.95),
  k("malu_spend_concentration", "Spend Concentration", "Spend on their creatives ÷ total ad spend (~25% ±5%).", "percent", "higher_is_better", "gsheets", "creative.malu.spend_share", "mtd",
    25, "tm_malu", "dep_creative", ["tm_damian"], 23, 24, 25),

  // ── CREATIVE STRATEGISTS — Maria Paula ────────────────────────────────
  k("maria_winning_images", "% Winning Images", "Static creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.maria.winning_images", "mtd",
    15, "tm_maria", "dep_creative", ["tm_damian"], 13, 14, 14),
  k("maria_winning_videos", "% Winning Videos", "Video creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.maria.winning_videos", "mtd",
    15, "tm_maria", "dep_creative", ["tm_damian"], 12, 13, 14),
  k("maria_hook_rate", "Average Hook Rate", "Average 3-sec view rate across creatives.", "percent", "higher_is_better", "triplewhale", "creative.maria.hook_rate", "mtd",
    35, "tm_maria", "dep_creative", ["tm_damian"], 31, 33, 34),
  k("maria_ctr", "Average CTR", "Total clicks ÷ total impressions across creatives.", "percent", "higher_is_better", "triplewhale", "creative.maria.ctr", "mtd",
    1, "tm_maria", "dep_creative", ["tm_damian"], 0.8, 0.9, 0.95),
  k("maria_spend_concentration", "Spend Concentration", "Spend on their creatives ÷ total ad spend (~25% ±5%).", "percent", "higher_is_better", "gsheets", "creative.maria.spend_share", "mtd",
    25, "tm_maria", "dep_creative", ["tm_damian"], 23, 24, 25),

  // ── CREATIVE STRATEGISTS — Dante ──────────────────────────────────────
  k("dante_winning_images", "% Winning Images", "Static creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.dante.winning_images", "mtd",
    15, "tm_dante", "dep_creative", ["tm_damian"], 13, 14, 14),
  k("dante_winning_videos", "% Winning Videos", "Video creatives that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "creative.dante.winning_videos", "mtd",
    15, "tm_dante", "dep_creative", ["tm_damian"], 12, 13, 14),
  k("dante_hook_rate", "Average Hook Rate", "Average 3-sec view rate across creatives.", "percent", "higher_is_better", "triplewhale", "creative.dante.hook_rate", "mtd",
    35, "tm_dante", "dep_creative", ["tm_damian"], 31, 33, 34),
  k("dante_ctr", "Average CTR", "Total clicks ÷ total impressions across creatives.", "percent", "higher_is_better", "triplewhale", "creative.dante.ctr", "mtd",
    1, "tm_dante", "dep_creative", ["tm_damian"], 0.8, 0.9, 0.95),
  k("dante_spend_concentration", "Spend Concentration", "Spend on their creatives ÷ total ad spend (~25% ±5%).", "percent", "higher_is_better", "gsheets", "creative.dante.spend_share", "mtd",
    25, "tm_dante", "dep_creative", ["tm_damian"], 23, 24, 25),

  // ── VIDEO EDITORS ─────────────────────────────────────────────────────
  ...videoEditorKPIs("dante", "tm_dante"),
  ...videoEditorKPIs("pedro", "tm_pedro"),
  ...videoEditorKPIs("sami", "tm_sami"),
  ...videoEditorKPIs("paul", "tm_paul"),

  // ── GRAPHIC DESIGNER — Winder ─────────────────────────────────────────
  k("winder_on_time", "On-Time Delivery Rate", "Designs delivered by deadline ÷ total assigned.", "percent", "higher_is_better", "gsheets", "design.winder.on_time", "mtd",
    95, "tm_winder", "dep_creative", ["tm_damian"], 92, 94, 95),
  k("winder_revision", "Revision Rate", "Designs requiring rework after first delivery ÷ total delivered.", "percent", "lower_is_better", "gsheets", "design.winder.revision_rate", "mtd",
    20, "tm_winder", "dep_creative", ["tm_damian"], 18, 17, 16),
  k("winder_ctr", "Average CTR on Designs", "Clicks ÷ impressions across his designs.", "percent", "higher_is_better", "triplewhale", "design.winder.ctr", "mtd",
    1, "tm_winder", "dep_creative", ["tm_damian"], 0.8, 0.9, 0.95),

  // ── CONTENT MANAGER — Jesus de Windt ─────────────────────────────────
  k("jdw_youtube_reviews", "YouTube Reviews Sourced", "New YouTube creator reviews uploaded to library.", "number", "higher_is_better", "gsheets", "content.youtube_reviews", "mtd",
    10, "tm_jesus_dw", "dep_content", ["tm_damian"], 0, 2, 3),
  k("jdw_ai_pieces", "AI Pieces Uploaded as Ads", "AI-generated creative pieces uploaded to ad library + tested.", "number", "higher_is_better", "gsheets", "content.ai_pieces", "mtd",
    64, "tm_jesus_dw", "dep_content", ["tm_damian"], 0, 12, 18),

  // ── TIKTOK SHOP SPECIALIST — Jesus / Maria ───────────────────────────
  k("tts_affiliates_signed", "New Affiliate Retainer Contracts", "New affiliate creators signed to a retainer per month.", "number", "higher_is_better", "gsheets", "tiktokshop.affiliates_signed", "mtd",
    25, "tm_jesus_dw", "dep_content", ["tm_maria", "tm_damian"], 0, 4, 6),
  k("tts_videos_posted", "Videos Posted by Affiliates", "Total TikTok videos posted by Carbinox affiliates.", "number", "higher_is_better", "gsheets", "tiktokshop.affiliate_videos", "mtd",
    500, "tm_jesus_dw", "dep_content", ["tm_maria", "tm_damian"], 0, 80, 120),
  k("tts_repurposed_winning", "Winning Rate on Meta (Repurposed)", "TikTok affiliate videos repurposed to Meta that beat control ÷ total tested.", "percent", "higher_is_better", "gsheets", "tiktokshop.repurposed_winning_rate", "mtd",
    15, "tm_jesus_dw", "dep_content", ["tm_maria", "tm_damian"], 12, 13, 14),

  // ── EMAIL & SMS — Samra ───────────────────────────────────────────────
  k("retention_revenue_share", "Retention Channel Revenue %", "Email + SMS revenue ÷ total store revenue.", "percent", "higher_is_better", "klaviyo", "retention.revenue_share", "mtd",
    25, "tm_samra", "dep_retention", ["tm_jose"], 22, 23, 24),
  k("flow_campaign_split", "Flow vs Campaign Revenue Split", "Flow revenue ÷ total email+SMS revenue (target 60% flow).", "percent", "higher_is_better", "klaviyo", "retention.flow_share", "mtd",
    60, "tm_samra", "dep_retention", ["tm_jose"], 55, 58, 59),
  k("list_growth", "List Growth Rate", "(New subs − unsubs − bounces) ÷ list size at start of month.", "percent", "higher_is_better", "klaviyo", "retention.list_growth", "mtd",
    5, "tm_samra", "dep_retention", ["tm_jose"], 3, 4, 4.5),
  k("email_open_rate", "Email Open Rate", "Opens ÷ delivered, averaged across all sends.", "percent", "higher_is_better", "klaviyo", "retention.open_rate", "mtd",
    50, "tm_samra", "dep_retention", ["tm_jose"], 47, 48, 49),
  k("retention_ctr", "Email/SMS CTR", "Clicks ÷ delivered, averaged across all sends.", "percent", "higher_is_better", "klaviyo", "retention.ctr", "mtd",
    1, "tm_samra", "dep_retention", ["tm_jose"], 0.85, 0.9, 0.95),
  k("unsubscribe_rate", "Unsubscribe Rate", "Unsubscribes ÷ delivered, averaged.", "percent", "lower_is_better", "klaviyo", "retention.unsub_rate", "mtd",
    0.3, "tm_samra", "dep_retention", ["tm_jose"], 0.25, 0.27, 0.28),

  // ── HEAD OF CX SUCCESS — Doralee ──────────────────────────────────────
  k("cx_csat", "CSAT", "Average post-ticket satisfaction rating.", "percent", "higher_is_better", "zendesk", "cx.csat", "mtd",
    90, "tm_doralee", "dep_cs", ["tm_thaylu", "tm_jose"], 87, 88, 89),
  k("cx_first_response", "Average First Response Time", "Time from ticket creation to first agent reply.", "duration_s", "lower_is_better", "zendesk", "cx.first_response_s", "mtd",
    14400, "tm_doralee", "dep_cs", ["tm_thaylu"], 12000, 13200, 13800),
  k("cx_tickets_per_100", "Tickets per 100 Orders", "(Total tickets ÷ total orders) × 100.", "ratio", "lower_is_better", "zendesk", "cx.tickets_per_100", "mtd",
    25, "tm_doralee", "dep_cs", ["tm_thaylu"], 22, 23, 24),
  k("cx_save_rate", "Save Rate", "Refund/return requests retained with offer ÷ total received.", "percent", "higher_is_better", "zendesk", "cx.save_rate", "mtd",
    30, "tm_doralee", "dep_cs", ["tm_thaylu"], 27, 28, 29),
  k("cx_chargeback", "Chargeback Rate", "Chargebacks ÷ total orders.", "percent", "lower_is_better", "shopify", "cx.chargeback_rate", "mtd",
    0.5, "tm_doralee", "dep_cs", ["tm_thaylu"], 0.4, 0.45, 0.48),

  // ── CX REPS — Anthony / Justine / Juan / Felipe ──────────────────────
  ...cxRepKPIs("anthony", "tm_anthony"),
  ...cxRepKPIs("justine", "tm_justine"),
  ...cxRepKPIs("juan", "tm_juan"),
  ...cxRepKPIs("felipe", "tm_felipe"),

  // ── HEAD OF TEAM SUCCESS — Thaylu ─────────────────────────────────────
  k("team_activities_completion", "% Completion of Monthly Activities", "Team members who completed all monthly activities ÷ total.", "percent", "higher_is_better", "gsheets", "team.activities_completion", "mtd",
    95, "tm_thaylu", "dep_team_success", ["tm_jose"], 90, 92, 93),
  k("team_slack_engagement", "% Engagement per Slack Post", "Average % of team that reacts/replies/views per leadership Slack post.", "percent", "higher_is_better", "gsheets", "team.slack_engagement", "mtd",
    50, "tm_thaylu", "dep_team_success", ["tm_jose"], 45, 47, 48),
  k("team_retention", "Employee Retention Rate", "Team retained at month-end ÷ at month-start.", "percent", "higher_is_better", "gsheets", "team.retention", "mtd",
    100, "tm_thaylu", "dep_team_success", ["tm_jose"], 100, 100, 100),

  // ── HEAD OF WEBSITE — Damian ──────────────────────────────────────────
  k("site_cvr", "Conversion Rate (CVR)", "Orders ÷ sessions (mobile + desktop).", "percent", "higher_is_better", "shopify", "site.cvr", "mtd",
    1.5, "tm_damian", "dep_website", ["tm_jose"], 1.3, 1.4, 1.45),
  k("site_aov", "Average Order Value (AOV)", "Total revenue ÷ total orders.", "currency", "higher_is_better", "shopify", "orders.aov", "mtd",
    130, "tm_damian", "dep_website", ["tm_jose"], 125, 128, 129),
  k("site_rpv", "Revenue per Visitor (RPV)", "Total revenue ÷ total sessions.", "currency", "higher_is_better", "shopify", "site.rpv", "mtd",
    2.5, "tm_damian", "dep_website", ["tm_jose"], 2.2, 2.3, 2.4),
  k("site_page_speed", "Page Speed", "PageSpeed Insights mobile score.", "percent", "higher_is_better", "manual", "site.page_speed", "mtd",
    85, "tm_damian", "dep_website", ["tm_jose"], 80, 82, 83),
  k("site_ab_test_win", "A/B Test Win Rate", "Tests beating control with stat sig ÷ total tests run.", "percent", "higher_is_better", "gsheets", "site.ab_test_win", "mtd",
    60, "tm_damian", "dep_website", ["tm_jose"], 55, 57, 58),

  // ── HEAD OF MARKETPLACES — Gyorgy ─────────────────────────────────────
  k("mp_revenue_growth", "Marketplace Revenue Growth", "Current month total marketplace revenue vs same month last year.", "percent", "higher_is_better", "gsheets", "marketplaces.yoy_growth", "mtd",
    30, "tm_gyorgy", "dep_marketplaces", ["tm_jose"], 25, 27, 28),
  k("mp_amazon_roas", "Amazon ROAS", "Amazon ad revenue ÷ Amazon ad spend.", "ratio", "higher_is_better", "gsheets", "marketplaces.amazon_roas", "mtd",
    4.0, "tm_gyorgy", "dep_marketplaces", ["tm_jose"], 3.6, 3.8, 3.9),
  k("mp_cvr", "Conversion Rate by Marketplace", "Orders ÷ visits per marketplace, averaged.", "percent", "higher_is_better", "gsheets", "marketplaces.cvr", "mtd",
    10, "tm_gyorgy", "dep_marketplaces", ["tm_jose"], 8, 9, 9.5),
  k("mp_margin", "Profit Margin per Marketplace", "Net margin per marketplace after fees, ads, returns, shipping.", "percent", "higher_is_better", "gsheets", "marketplaces.margin", "mtd",
    25, "tm_gyorgy", "dep_marketplaces", ["tm_jose"], 22, 23, 24),

  // ── CFO — Jaime ───────────────────────────────────────────────────────
  k("fin_gross_margin", "Gross Profit Margin %", "(Revenue − COGS) ÷ Revenue.", "percent", "higher_is_better", "gsheets", "finance.gross_margin", "mtd",
    60, "tm_jaime", "dep_finance", ["tm_jose"], 57, 58, 59),
  k("fin_net_margin", "Net Profit Margin %", "Net profit ÷ Revenue.", "percent", "higher_is_better", "gsheets", "finance.net_margin", "mtd",
    15, "tm_jaime", "dep_finance", ["tm_jose"], 12, 13, 14),
  k("fin_cash_runway", "Cash Runway (months)", "Cash on hand ÷ average monthly burn rate.", "number", "higher_is_better", "gsheets", "finance.cash_runway_months", "mtd",
    6, "tm_jaime", "dep_finance", ["tm_jose"], 6, 6, 6),
  k("fin_inventory_turn", "Inventory Turnover (annualized)", "COGS ÷ average inventory value.", "ratio", "higher_is_better", "gsheets", "finance.inventory_turnover", "mtd",
    4, "tm_jaime", "dep_finance", ["tm_jose"], 3.6, 3.8, 3.9),
  k("fin_ebitda", "EBITDA Margin", "EBITDA ÷ Revenue.", "percent", "higher_is_better", "gsheets", "finance.ebitda_margin", "mtd",
    10, "tm_jaime", "dep_finance", ["tm_jose"], 8, 9, 9.5),

  // ── HEAD OF LOGISTICS — Evelyn ────────────────────────────────────────
  k("log_order_accuracy", "Order Accuracy Rate", "Orders shipped correctly ÷ total shipped × 100.", "percent", "higher_is_better", "gsheets", "logistics.order_accuracy", "mtd",
    95, "tm_evelyn", "dep_logistics", ["tm_thaylu"], 93, 94, 94.5),
  k("log_on_time_ship", "On-Time Shipping Rate", "Orders shipped within SLA ÷ total shipped × 100.", "percent", "higher_is_better", "shopify", "logistics.on_time_shipping", "mtd",
    95, "tm_evelyn", "dep_logistics", ["tm_thaylu"], 93, 94, 95),
  k("log_inventory_count", "Inventory Count Accuracy", "Physical count vs system count via cycle counts.", "percent", "higher_is_better", "gsheets", "logistics.inventory_accuracy", "mtd",
    95, "tm_evelyn", "dep_logistics", ["tm_thaylu"], 93, 94, 95),

  // ── HEAD OF SUPPLY CHAIN — Thaylu ─────────────────────────────────────
  k("sc_in_stock", "In-Stock Rate", "% of SKUs in stock across all channels.", "percent", "higher_is_better", "gsheets", "supply.in_stock", "mtd",
    95, "tm_thaylu", "dep_supply_chain", ["tm_jose"], 93, 94, 94.5),
  k("sc_po_accuracy", "PO Tracking Accuracy", "POs correctly registered in Slack/Sortly/Shopify ÷ total POs.", "percent", "higher_is_better", "gsheets", "supply.po_accuracy", "mtd",
    100, "tm_thaylu", "dep_supply_chain", ["tm_jose"], 98, 99, 100),
  k("sc_days_inventory", "Days of Inventory on Hand", "Current inventory ÷ avg daily sales rate (target 60-90 days).", "number", "higher_is_better", "gsheets", "supply.days_inventory", "mtd",
    75, "tm_thaylu", "dep_supply_chain", ["tm_jose"], 72, 74, 75),
];

function videoEditorKPIs(key: string, ownerId: string): KpiSpec[] {
  return [
    k(`${key}_on_time`, "On-Time Delivery Rate", "Videos delivered by deadline ÷ total videos assigned.", "percent", "higher_is_better", "gsheets", `video.${key}.on_time`, "mtd",
      95, ownerId, "dep_creative", ["tm_damian"], 92, 94, 94.5),
    k(`${key}_revision`, "Revision Rate", "Videos requiring rework after first delivery ÷ total delivered.", "percent", "lower_is_better", "gsheets", `video.${key}.revision_rate`, "mtd",
      20, ownerId, "dep_creative", ["tm_damian"], 18, 17, 16),
    k(`${key}_hold_rate`, "Hold Rate", "% of viewers still watching at the defined hold-rate timestamp.", "percent", "higher_is_better", "triplewhale", `video.${key}.hold_rate`, "mtd",
      5, ownerId, "dep_creative", ["tm_damian"], 4, 4.5, 4.8),
  ];
}

function cxRepKPIs(key: string, ownerId: string): KpiSpec[] {
  return [
    k(`${key}_tickets_per_day`, "Tickets Resolved per Day", "Tickets closed per shift, averaged across the month.", "number", "higher_is_better", "zendesk", `cx.${key}.tickets_per_day`, "mtd",
      50, ownerId, "dep_cs", ["tm_doralee"], 45, 47, 48),
    k(`${key}_response_time`, "Average Response Time", "Average time from ticket assignment to first reply.", "duration_s", "lower_is_better", "zendesk", `cx.${key}.response_time_s`, "mtd",
      14400, ownerId, "dep_cs", ["tm_doralee"], 12000, 13000, 13500),
    k(`${key}_csat`, "CSAT (per rep)", "Average rating on tickets they personally handled.", "percent", "higher_is_better", "zendesk", `cx.${key}.csat`, "mtd",
      90, ownerId, "dep_cs", ["tm_doralee"], 87, 88, 89),
    k(`${key}_save_rate`, "Save Rate (per rep)", "Refund/return requests retained ÷ total received.", "percent", "higher_is_better", "zendesk", `cx.${key}.save_rate`, "mtd",
      30, ownerId, "dep_cs", ["tm_doralee"], 27, 28, 29),
    k(`${key}_first_touch`, "First-Touch Resolution Rate", "Tickets solved in one reply ÷ total handled.", "percent", "higher_is_better", "zendesk", `cx.${key}.first_touch`, "mtd",
      70, ownerId, "dep_cs", ["tm_doralee"], 65, 67, 68),
  ];
}

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
  targetDepartmentId: string,
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
    targetDepartmentId,
    watcherIds,
    today,
    last7,
    mtd,
  };
}

const kpis: KPI[] = kpiSpecs.map(({ target, ownerId, watcherIds, today, last7, mtd, targetDepartmentId, ...kpi }) => kpi);

const targets: Target[] = kpiSpecs.map((s) => ({
  id: `t_${s.id.replace("kpi_", "")}`,
  kpiId: s.id,
  ownerId: s.ownerId,
  departmentId: s.targetDepartmentId,
  watcherIds: s.watcherIds?.length ? s.watcherIds : undefined,
  target: s.target,
  period: "monthly",
  periodKey: PERIOD,
}));

// Default progress is ZERO for everything — actuals get filled in via the
// "Fill KPIs Here" flow / Settings / Monthly Reports.
const progress = Object.fromEntries(
  kpiSpecs.map((s) => {
    const tid = `t_${s.id.replace("kpi_", "")}`;
    return [
      tid,
      {
        targetId: tid,
        today: 0,
        last7: 0,
        mtd: 0,
        updatedAt: new Date().toISOString(),
        samples: [],
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
  submissions: [],
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
