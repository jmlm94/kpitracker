"use client";

import { useEffect, useState } from "react";
import type { KPI, Progress } from "./types";

export type Timeframe =
  | "today"
  | "7d"
  | "mtd"
  | "last_month"
  | "last_3m"
  | "last_6m"
  | "last_12m";

export const TIMEFRAMES: { value: Timeframe; label: string; short: string }[] = [
  { value: "mtd", label: "This month", short: "MTD" },
  { value: "last_month", label: "Last month", short: "1 MO" },
  { value: "last_3m", label: "Last 3 months", short: "3 MO" },
  { value: "last_6m", label: "Last 6 months", short: "6 MO" },
  { value: "last_12m", label: "Last 12 months", short: "12 MO" },
];

const STORAGE_KEY = "carbinox-kpi-tracker:timeframe";

/** Shared timeframe state — persists across pages + sessions via localStorage. */
export function useTimeframe(): [Timeframe, (t: Timeframe) => void] {
  const [tf, setTf] = useState<Timeframe>("mtd");
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setTf(raw as Timeframe);
    } catch {}
    // broadcast/receive updates across sibling components
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setTf(e.newValue as Timeframe);
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<Timeframe>).detail;
      if (detail) setTf(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("carbinox:timeframe", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("carbinox:timeframe", onCustom as EventListener);
    };
  }, []);

  function set(next: Timeframe) {
    setTf(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent("carbinox:timeframe", { detail: next }));
    } catch {}
  }
  return [tf, set];
}

/** Return the date range [startISO, endISO] (inclusive) for a timeframe. */
export function rangeFor(timeframe: Timeframe, now = new Date()): [string, string] {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);

  switch (timeframe) {
    case "today":
      break;
    case "7d":
      start.setDate(end.getDate() - 6);
      break;
    case "mtd":
      start.setDate(1);
      break;
    case "last_month": {
      const lastMonthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
      const lastMonthStart = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      return [isoDay(lastMonthStart), isoDay(lastMonthEnd)];
    }
    case "last_3m": {
      const s = new Date(end.getFullYear(), end.getMonth() - 2, 1);
      return [isoDay(s), isoDay(end)];
    }
    case "last_6m": {
      const s = new Date(end.getFullYear(), end.getMonth() - 5, 1);
      return [isoDay(s), isoDay(end)];
    }
    case "last_12m": {
      const s = new Date(end.getFullYear(), end.getMonth() - 11, 1);
      return [isoDay(s), isoDay(end)];
    }
  }
  return [isoDay(start), isoDay(end)];
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Aggregate a KPI's samples over a timeframe. Sums for currency/number; averages for ratios/percents/durations. */
export function aggregate(
  kpi: Pick<KPI, "unit">,
  progress: Progress | undefined,
  timeframe: Timeframe,
): number {
  if (!progress?.samples?.length) return 0;
  const [start, end] = rangeFor(timeframe);
  const inRange = progress.samples.filter((s) => s.date >= start && s.date <= end);
  if (!inRange.length) return 0;
  const values = inRange.map((s) => s.value);
  if (kpi.unit === "currency" || kpi.unit === "number") {
    return values.reduce((a, b) => a + b, 0);
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Today's value (most recent sample). */
export function todayValue(progress: Progress | undefined): number {
  if (!progress?.samples?.length) return progress?.today ?? 0;
  return progress.samples[progress.samples.length - 1].value;
}

export function currentPeriodKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftPeriod(periodKey: string, delta: number): string {
  const [y, m] = periodKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
