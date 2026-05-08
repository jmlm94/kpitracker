"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { useStore } from "@/lib/store";
import type { KPI, Progress, Target, TeamMember } from "@/lib/types";
import {
  classifyStatus,
  cx,
  formatValue,
  formatValueFull,
  isReported as checkReported,
  pickProgressValue,
  progressRatio,
  roundForUnit,
  statusBg,
  statusLabel,
  statusSolid,
} from "@/lib/format";
import {
  TIMEFRAMES,
  aggregate,
  currentPeriodKey,
  shiftPeriod,
  todayValue as tfToday,
  type Timeframe,
} from "@/lib/timeframe";
import { Avatar } from "./Avatar";
import { TrendingDown, TrendingUp } from "lucide-react";

export function KPICard({
  kpi,
  target,
  progress,
  owner,
  deptColor,
  timeframe,
}: {
  kpi: KPI;
  target: Target;
  progress?: Progress;
  owner?: TeamMember;
  deptColor?: string;
  /** When provided, overrides kpi.window for aggregation */
  timeframe?: Timeframe;
}) {
  // If a timeframe is supplied, compute from samples; otherwise fall back to
  // the KPI's configured window.
  const actual = timeframe
    ? aggregate(kpi, progress, timeframe)
    : progress
      ? pickProgressValue(kpi, progress)
      : 0;
  const reported = checkReported(progress);
  const ratio = progress ? progressRatio(kpi, target, actual) : 0;
  const status = classifyStatus(ratio, reported);
  const pct = Math.min(100, Math.round(ratio * 100));
  const statusColor = statusSolid(status);

  const todayValue = progress ? tfToday(progress) : 0;
  const todayBetter =
    kpi.direction === "higher_is_better"
      ? todayValue >= actual
      : todayValue <= actual;

  // Month-over-month delta from previous period's submission
  const { state } = useStore();
  const priorPeriodKey = shiftPeriod(currentPeriodKey(), -1);
  const priorSubmission = (state.submissions || []).find(
    (s) => s.ownerId === target.ownerId && s.periodKey === priorPeriodKey,
  );
  const priorValue = priorSubmission?.values[target.id];
  const hasMoM = priorValue !== undefined && priorValue !== 0 && actual !== 0;
  const momDelta = hasMoM ? actual - priorValue! : 0;
  const momPct = hasMoM && priorValue! !== 0 ? (momDelta / priorValue!) * 100 : 0;
  const momImproved =
    kpi.direction === "higher_is_better" ? momDelta > 0 : momDelta < 0;

  const accent = deptColor || "#f8c808";
  const windowLabel = timeframe
    ? TIMEFRAMES.find((t) => t.value === timeframe)?.label ||
      kpi.window.toUpperCase()
    : kpi.window === "today"
      ? "Today"
      : kpi.window === "7d"
        ? "Last 7 Days"
        : kpi.window === "30d"
          ? "Last 30 Days"
          : "Month-to-Date";

  return (
    <div className="card card-hover group relative p-5">
      {/* Top rail — solid accent color, no gradient */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[2px]" style={{ background: accent }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="bracket">{windowLabel}</div>
          <h3 className="mt-1 font-heading text-[15px] font-semibold uppercase tracking-brand text-white">
            {kpi.name}
          </h3>
          {kpi.description && (
            <p className="mt-1 text-[11px] leading-snug text-white/50 line-clamp-2">
              {kpi.description}
            </p>
          )}
        </div>
        <span className={cx("chip shrink-0", statusBg(status))}>
          <span className="h-1.5 w-1.5 bg-current" />
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="font-numeric text-[38px] font-bold leading-none tracking-tight text-white">
            {formatValue(actual, kpi.unit)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 font-heading text-[10px] uppercase tracking-brand text-white/50">
            <span className="text-white/40">Target</span>
            <span className="text-white">{formatValueFull(target.target, kpi.unit)}</span>
            <span className="text-white/30">·</span>
            <span style={{ color: statusColor }} className="font-semibold">
              {pct}% of goal
            </span>
          </div>
        </div>
        <div className="h-14 w-32">
          {progress?.samples && progress.samples.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progress.samples}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id={`g-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accent}
                  strokeWidth={1.5}
                  fill={`url(#g-${kpi.id})`}
                  dot={false}
                  isAnimationActive={false}
                />
                <Tooltip
                  cursor={false}
                  labelFormatter={(l) => l as string}
                  formatter={(v: number) => [formatValueFull(v, kpi.unit), kpi.name]}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Progress bar — flat fill, no gradient */}
      <div className="mt-4 h-1.5 w-full overflow-hidden border border-white/5 bg-white/[0.03]">
        <div
          className="h-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: statusColor,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {owner ? (
          <Link
            href={`/team/${owner.id}`}
            className="flex items-center gap-2.5 text-sm text-white/85 hover:text-white"
          >
            <Avatar name={owner.name} size={28} color={accent} />
            <div className="leading-tight">
              <div className="font-heading text-[12px] font-semibold uppercase tracking-brand">
                {owner.name}
              </div>
              <div className="text-[10px] text-white/45">{owner.position}</div>
            </div>
          </Link>
        ) : (
          <span className="text-xs text-white/40">Unassigned</span>
        )}
        <div className="flex items-center gap-1 font-numeric text-[10px] uppercase tracking-brand text-white/55">
          {hasMoM ? (
            <>
              {momImproved ? (
                <TrendingUp size={12} className="text-ok" />
              ) : (
                <TrendingDown size={12} className="text-bad" />
              )}
              <span className={cx(momImproved ? "text-ok" : "text-bad")}>
                {momDelta > 0 ? "+" : ""}
                {momPct.toFixed(0)}%
              </span>
              <span className="text-white/40">vs last mo</span>
            </>
          ) : (
            <>
              {todayBetter ? (
                <TrendingUp size={12} className="text-ok" />
              ) : (
                <TrendingDown size={12} className="text-bad" />
              )}
              Today {formatValue(todayValue, kpi.unit)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
