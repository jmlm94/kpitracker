"use client";

import { useEffect, useState } from "react";
import type { KPI, Progress } from "./types";

export type Timeframe =
  | "today"
  | "7d"
  | "mtd"
  | "last_month"
  | "90d"
  | "180d"
  | "365d";

export const TIMEFRAMES: { value: Timeframe; label: string; short: string }[] = [
  { value: "mtd", label: "This month", short: "MTD" },
  { value: "last_month", label: "Last month", short: "1 MO" },
  { value: "90d", label: "Last 90 days", short: "90 D" },
  { value: "180d", label: "Last 180 days", short: "180 D" },
  { value: "365d", label: "Last 365 days", short: "365 D" },
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
    case "90d":
      start.setDate(end.getDate() - 89);
      break;
    case "180d":
      start.setDate(end.getDate() - 179);
      break;
    case "365d":
      start.setDate(end.getDate() - 364);
      break;
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
