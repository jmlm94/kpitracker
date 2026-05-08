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
  /** Department this KPI belongs to (matters when the owner is multi-hat) */
  departmentId?: string;
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
  /** Primary "home" department (counts for headcount, manager chain, etc.) */
  departmentId: string;
  /** Additional departments this person also belongs to (multi-hat roles) */
  additionalDepartmentIds?: string[];
  /** Direct managers — a person can have more than one (e.g. shared resources) */
  managerIds?: string[];
  /** @deprecated kept only for migration; use managerIds */
  managerId?: string;
  avatarInitials?: string;
  /** Simple 4-digit PIN for self-service auth on /fill */
  pin?: string;
  /** URL for profile picture (external URL or base64 data URI) */
  avatarUrl?: string;
};

export type Department = {
  id: string;
  name: string;
  color: string;
  /** Main = top-level department. Sub = nested underneath a Main. */
  kind: "main" | "sub";
  /** For Subs: the Main department they belong to (undefined = unassigned) */
  parentId?: string;
  /** Team member responsible for this department / sub-department */
  headId?: string;
};

export type IntegrationConfig = {
  provider: Provider;
  label: string;
  connected: boolean;
  /** Only flags we surface in UI — real secrets stay in env vars on Vercel */
  envVarsExpected: string[];
  /** Client-side credentials entered through the UI (shop, token, etc.) */
  credentials?: Record<string, string>;
  lastSyncAt?: string;
  lastSyncStatus?: "ok" | "error" | "never";
  lastSyncMessage?: string;
};

/**
 * Monthly self-report. Each team member fills out their actual numbers for
 * the month against the targets they own. Stored per-period so the CEO can
 * scroll back through prior months.
 */
export type MonthlySubmission = {
  id: string;
  ownerId: string;
  /** "2026-04" — calendar month being reported */
  periodKey: string;
  submittedAt: string;
  /** Reported value keyed by target id */
  values: Record<string, number>;
  /** Optional context the team member adds */
  notes?: string;
};

export type AppState = {
  onboarded: boolean;
  departments: Department[];
  team: TeamMember[];
  kpis: KPI[];
  targets: Target[];
  progress: Record<string, Progress>; // keyed by targetId
  integrations: IntegrationConfig[];
  /** Monthly self-reported KPI submissions, keyed by id */
  submissions?: MonthlySubmission[];
};
