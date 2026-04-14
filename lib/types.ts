export type Provider =
  | "shopify"
  | "triplewhale"
  | "klaviyo"
  | "postscript"
  | "zendesk"
  | "gsheets"
  | "manual";

export type Direction = "higher_is_better" | "lower_is_better";

export type Unit = "number" | "currency" | "percent" | "ratio" | "duration_s";

export type KPI = {
  id: string;
  name: string;
  description?: string;
  unit: Unit;
  direction: Direction;
  provider: Provider;
  /** e.g. "orders.total_sales", "meta.roas", dataset id for gsheets */
  metricKey: string;
  /** 7d / 30d / mtd window used for aggregation */
  window: "today" | "7d" | "mtd" | "30d";
};

export type Target = {
  id: string;
  kpiId: string;
  /** Owner team member who's accountable */
  ownerId: string;
  /** Optional secondary owners (e.g. department head) */
  watcherIds?: string[];
  target: number;
  period: "daily" | "weekly" | "monthly";
  /** e.g. "2026-04" for monthly MTD */
  periodKey: string;
};

export type Progress = {
  targetId: string;
  today: number;
  last7: number;
  mtd: number;
  /** ISO datetime of the last refresh from the data source */
  updatedAt: string;
  /** Raw samples for spark line (daily buckets, ascending) */
  samples: { date: string; value: number }[];
};

export type TeamMember = {
  id: string;
  name: string;
  position: string;
  email?: string;
  departmentId: string;
  /** Optional manager (used to propagate underperformance signals upward) */
  managerId?: string;
  avatarInitials?: string;
};

export type Department = {
  id: string;
  name: string;
  color: string;
  headId?: string;
};

export type IntegrationConfig = {
  provider: Provider;
  label: string;
  connected: boolean;
  /** Only flags we surface in UI — real secrets stay in env vars on Vercel */
  envVarsExpected: string[];
  lastSyncAt?: string;
  lastSyncStatus?: "ok" | "error" | "never";
  lastSyncMessage?: string;
};

export type AppState = {
  onboarded: boolean;
  departments: Department[];
  team: TeamMember[];
  kpis: KPI[];
  targets: Target[];
  progress: Record<string, Progress>; // keyed by targetId
  integrations: IntegrationConfig[];
};
