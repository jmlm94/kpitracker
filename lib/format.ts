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
 * Handles inverted metrics (lower is better).
 */
export function progressRatio(kpi: KPI, target: Target, actual: number): number {
  if (target.target <= 0) return 0;
  if (kpi.direction === "higher_is_better") {
    return actual / target.target;
  }
  // lower_is_better: invert so that "at or below target" yields >= 1
  if (actual <= 0) return 1;
  return target.target / actual;
}

export type Status = "ahead" | "on_track" | "at_risk" | "off_track";

export function classifyStatus(ratio: number): Status {
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
  }
}

export function statusColor(s: Status): string {
  switch (s) {
    case "ahead":
      return "text-ok";
    case "on_track":
      return "text-ok";
    case "at_risk":
      return "text-warn";
    case "off_track":
      return "text-bad";
  }
}

export function statusBg(s: Status): string {
  switch (s) {
    case "ahead":
      return "bg-ok/15 text-ok border-ok/30";
    case "on_track":
      return "bg-ok/10 text-ok border-ok/25";
    case "at_risk":
      return "bg-warn/15 text-warn border-warn/30";
    case "off_track":
      return "bg-bad/15 text-bad border-bad/30";
  }
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
