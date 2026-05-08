import type { KPI, Progress, Target, Unit } from "./types";

export function formatValue(value: number, unit: Unit): string {
  if (!Number.isFinite(value)) return "—";
  switch (unit) {
    case "currency":
      return value >= 1000
        ? `$${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
        : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    case "percent":
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    case "ratio":
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    case "duration_s":
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`;
      if (value >= 60) return `${Math.round(value / 60)}m`;
      return `${Math.round(value)}s`;
    case "number":
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
}

export function formatValueFull(value: number, unit: Unit): string {
  if (!Number.isFinite(value)) return "—";
  switch (unit) {
    case "currency":
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    case "percent":
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    case "ratio":
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    case "duration_s":
      if (value >= 3600) return `${(value / 3600).toFixed(2)}h`;
      if (value >= 60) return `${(value / 60).toFixed(1)}m`;
      return `${Math.round(value)}s`;
    default:
      return value.toLocaleString();
  }
}

/**
 * Ratio of progress-to-target, normalised so that 1 = "on track".
 * Handles higher_is_better, lower_is_better, and band metrics.
 * Returns null when there's no data to evaluate.
 */
/**
 * Ratio of progress-to-target, normalised so that 1 = "on track".
 * Handles higher_is_better, lower_is_better, and band metrics.
 */
export function progressRatio(kpi: KPI, target: Target, actual: number): number {
  if (target.target <= 0) return 0;
  // Band metrics: ratio = 1 - |actual - target| / target (perfect = 1, diverging → 0)
  if (kpi.direction === "band") {
    const deviation = Math.abs(actual - target.target) / target.target;
    return Math.max(0, 1 - deviation);
  }
  if (kpi.direction === "higher_is_better") {
    if (actual <= 0) return 0;
    return actual / target.target;
  }
  // lower_is_better: invert so that "at or below target" yields >= 1
  if (actual <= 0) return 0;
  return target.target / actual;
}

export type Status = "ahead" | "on_track" | "at_risk" | "off_track" | "not_reported";

/** Check if a KPI has real data (vs seed default zeros / never submitted). */
export function isReported(progress: Progress | undefined): boolean {
  if (!progress) return false;
  // Seed sets samples=[] for unreported. Any submission creates a sample.
  if (progress.samples && progress.samples.length > 0) return true;
  if (progress.today !== 0 || progress.last7 !== 0 || progress.mtd !== 0) return true;
  return false;
}

/**
 * Classify KPI status. Pass reported=false to get "not_reported" for unfilled KPIs.
 * Thresholds: off_track <80%, at_risk 80-95%, on_track 95-105%, ahead >105%.
 */
export function classifyStatus(ratio: number, reported = true): Status {
  if (!reported) return "not_reported";
  if (ratio >= 1.05) return "ahead";
  if (ratio >= 0.95) return "on_track";
  if (ratio >= 0.8) return "at_risk";
  return "off_track";
}

export function statusLabel(s: Status): string {
  switch (s) {
    case "ahead":
      return "Ahead of target";
    case "on_track":
      return "On track";
    case "at_risk":
      return "At risk";
    case "off_track":
      return "Off track";
    case "not_reported":
      return "Not reported";
  }
}

export function statusIcon(s: Status): string {
  switch (s) {
    case "ahead":
      return "✅";
    case "on_track":
      return "✅";
    case "at_risk":
      return "⚠️";
    case "off_track":
      return "❌";
    case "not_reported":
      return "⏳";
  }
}

export function statusColor(s: Status): string {
  switch (s) {
    case "ahead":
    case "on_track":
      return "text-ok";
    case "at_risk":
      return "text-warn";
    case "off_track":
      return "text-bad";
    case "not_reported":
      return "text-white/40";
  }
}

export function statusBg(s: Status): string {
  switch (s) {
    case "ahead":
      return "border-ok/60 bg-ok/15 text-ok";
    case "on_track":
      return "border-ok/40 bg-ok/10 text-ok";
    case "at_risk":
      return "border-warn/60 bg-warn/15 text-warn";
    case "off_track":
      return "border-bad/60 bg-bad/15 text-bad";
    case "not_reported":
      return "border-white/20 bg-white/5 text-white/50";
  }
}

export function statusSolid(s: Status): string {
  switch (s) {
    case "ahead":
    case "on_track":
      return "#48f088";
    case "at_risk":
      return "#f8c808";
    case "off_track":
      return "#e83028";
    case "not_reported":
      return "#6b6b6b";
  }
}

/** Round a KPI value to clean display precision based on unit type. */
export function roundForUnit(value: number, unit: Unit): number {
  if (unit === "currency") return Math.round(value * 100) / 100;
  if (unit === "ratio") return Math.round(value * 100) / 100;
  if (unit === "percent") return Math.round(value * 10) / 10;
  if (unit === "duration_s") return Math.round(value);
  return Math.round(value * 100) / 100;
}

export function pickProgressValue(kpi: KPI, p: Progress): number {
  switch (kpi.window) {
    case "today":
      return p.today;
    case "7d":
      return p.last7;
    case "30d":
    case "mtd":
    default:
      return p.mtd;
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function cx(...xs: Array<string | false | null | undefined>): string {
  return xs.filter(Boolean).join(" ");
}
