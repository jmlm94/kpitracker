import type { AppState } from "./types";

/**
 * Seed state demonstrating the example from the spec:
 *   Simona Saule (Media Buyer - Meta) → ROAS target 1.6
 *   Damian Perez (Head of Advertising) → overall channel performance
 * Plus additional departments common to a DTC brand (Carbinox).
 */
export const seedState: AppState = {
  onboarded: false,
  departments: [
    { id: "dep_adv", name: "Advertising", color: "#ff6a3d", headId: "tm_damian" },
    { id: "dep_retention", name: "Retention", color: "#60a5fa", headId: "tm_retlead" },
    { id: "dep_cs", name: "Customer Support", color: "#a78bfa", headId: "tm_cslead" },
    { id: "dep_ops", name: "Operations", color: "#34d399", headId: "tm_opslead" },
    { id: "dep_creative", name: "Creative", color: "#f472b6" },
  ],
  team: [
    {
      id: "tm_damian",
      name: "Damian Perez",
      position: "Head of Advertising",
      departmentId: "dep_adv",
      avatarInitials: "DP",
    },
    {
      id: "tm_simona",
      name: "Simona Saule",
      position: "Media Buyer - Meta",
      departmentId: "dep_adv",
      managerId: "tm_damian",
      avatarInitials: "SS",
    },
    {
      id: "tm_retlead",
      name: "Alex Rivera",
      position: "Retention Lead",
      departmentId: "dep_retention",
      avatarInitials: "AR",
    },
    {
      id: "tm_cslead",
      name: "Mia Chen",
      position: "CS Manager",
      departmentId: "dep_cs",
      avatarInitials: "MC",
    },
    {
      id: "tm_opslead",
      name: "Jordan Blake",
      position: "Operations Lead",
      departmentId: "dep_ops",
      avatarInitials: "JB",
    },
  ],
  kpis: [
    {
      id: "kpi_meta_roas",
      name: "Meta ROAS",
      description: "Return on ad spend for Meta (Facebook/Instagram)",
      unit: "ratio",
      direction: "higher_is_better",
      provider: "triplewhale",
      metricKey: "meta.roas",
      window: "mtd",
    },
    {
      id: "kpi_blended_roas",
      name: "Blended ROAS",
      description: "Overall store ROAS across all channels",
      unit: "ratio",
      direction: "higher_is_better",
      provider: "triplewhale",
      metricKey: "blended.roas",
      window: "mtd",
    },
    {
      id: "kpi_revenue",
      name: "Total Revenue",
      description: "Shopify gross sales",
      unit: "currency",
      direction: "higher_is_better",
      provider: "shopify",
      metricKey: "orders.total_sales",
      window: "mtd",
    },
    {
      id: "kpi_klaviyo_rev",
      name: "Email Attributed Revenue",
      description: "Klaviyo attributed revenue (flows + campaigns)",
      unit: "currency",
      direction: "higher_is_better",
      provider: "klaviyo",
      metricKey: "attributed_revenue",
      window: "mtd",
    },
    {
      id: "kpi_sms_rev",
      name: "SMS Attributed Revenue",
      description: "Postscript attributed revenue",
      unit: "currency",
      direction: "higher_is_better",
      provider: "postscript",
      metricKey: "attributed_revenue",
      window: "mtd",
    },
    {
      id: "kpi_cs_frt",
      name: "First Response Time",
      description: "Zendesk average first-response time (seconds, lower is better)",
      unit: "duration_s",
      direction: "lower_is_better",
      provider: "zendesk",
      metricKey: "first_response_time_s",
      window: "7d",
    },
    {
      id: "kpi_cs_csat",
      name: "CSAT",
      description: "Zendesk CSAT score",
      unit: "percent",
      direction: "higher_is_better",
      provider: "zendesk",
      metricKey: "csat",
      window: "mtd",
    },
    {
      id: "kpi_fulfill_sla",
      name: "Fulfillment SLA",
      description: "% orders shipped within 24h",
      unit: "percent",
      direction: "higher_is_better",
      provider: "shopify",
      metricKey: "fulfillment.sla_24h",
      window: "mtd",
    },
  ],
  targets: [
    { id: "t1", kpiId: "kpi_meta_roas", ownerId: "tm_simona", watcherIds: ["tm_damian"], target: 1.6, period: "monthly", periodKey: "2026-04" },
    { id: "t2", kpiId: "kpi_blended_roas", ownerId: "tm_damian", target: 2.4, period: "monthly", periodKey: "2026-04" },
    { id: "t3", kpiId: "kpi_revenue", ownerId: "tm_damian", target: 850000, period: "monthly", periodKey: "2026-04" },
    { id: "t4", kpiId: "kpi_klaviyo_rev", ownerId: "tm_retlead", target: 180000, period: "monthly", periodKey: "2026-04" },
    { id: "t5", kpiId: "kpi_sms_rev", ownerId: "tm_retlead", target: 65000, period: "monthly", periodKey: "2026-04" },
    { id: "t6", kpiId: "kpi_cs_frt", ownerId: "tm_cslead", target: 1800, period: "monthly", periodKey: "2026-04" },
    { id: "t7", kpiId: "kpi_cs_csat", ownerId: "tm_cslead", target: 94, period: "monthly", periodKey: "2026-04" },
    { id: "t8", kpiId: "kpi_fulfill_sla", ownerId: "tm_opslead", target: 97, period: "monthly", periodKey: "2026-04" },
  ],
  progress: {
    t1: buildProgress(1.2, 1.63, 1.58, 14),
    t2: buildProgress(2.1, 2.28, 2.31, 14),
    t3: buildProgress(24500, 22100, 398000, 14, 1000),
    t4: buildProgress(5200, 4800, 82000, 14, 500),
    t5: buildProgress(1900, 1750, 29500, 14, 200),
    t6: buildProgress(1650, 1720, 1705, 14),
    t7: buildProgress(93.2, 93.8, 93.5, 14),
    t8: buildProgress(95.4, 96.1, 96.4, 14),
  },
  integrations: [
    {
      provider: "shopify",
      label: "Shopify",
      connected: false,
      envVarsExpected: ["SHOPIFY_SHOP", "SHOPIFY_ADMIN_TOKEN"],
      lastSyncStatus: "never",
    },
    {
      provider: "triplewhale",
      label: "Triple Whale",
      connected: false,
      envVarsExpected: ["TRIPLEWHALE_API_KEY", "TRIPLEWHALE_SHOP_ID"],
      lastSyncStatus: "never",
    },
    {
      provider: "klaviyo",
      label: "Klaviyo",
      connected: false,
      envVarsExpected: ["KLAVIYO_PRIVATE_KEY"],
      lastSyncStatus: "never",
    },
    {
      provider: "postscript",
      label: "Postscript",
      connected: false,
      envVarsExpected: ["POSTSCRIPT_API_KEY"],
      lastSyncStatus: "never",
    },
    {
      provider: "zendesk",
      label: "Zendesk",
      connected: false,
      envVarsExpected: ["ZENDESK_SUBDOMAIN", "ZENDESK_EMAIL", "ZENDESK_API_TOKEN"],
      lastSyncStatus: "never",
    },
    {
      provider: "gsheets",
      label: "Google Sheets",
      connected: false,
      envVarsExpected: ["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"],
      lastSyncStatus: "never",
    },
  ],
};

function buildProgress(
  today: number,
  last7: number,
  mtd: number,
  days: number,
  noise: number = 0.05,
) {
  const samples = Array.from({ length: days }).map((_, i) => {
    const base = last7;
    const drift = (Math.sin(i * 0.9) + Math.cos(i * 0.4)) * (base * 0.06);
    const jitter = (Math.random() - 0.5) * base * noise;
    const value = Math.max(0, base + drift + jitter);
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString().slice(0, 10), value: Number(value.toFixed(2)) };
  });
  return {
    targetId: "",
    today,
    last7,
    mtd,
    updatedAt: new Date().toISOString(),
    samples,
  };
}
