"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { KPI, Progress, Target, TeamMember } from "@/lib/types";
import {
  classifyStatus,
  cx,
  formatValue,
  formatValueFull,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { Avatar } from "./Avatar";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

export function KPICard({
  kpi,
  target,
  progress,
  owner,
  deptColor,
}: {
  kpi: KPI;
  target: Target;
  progress?: Progress;
  owner?: TeamMember;
  deptColor?: string;
}) {
  const actual = progress ? pickProgressValue(kpi, progress) : 0;
  const ratio = progress ? progressRatio(kpi, target, actual) : 0;
  const status = classifyStatus(ratio);
  const pct = Math.min(120, Math.round(ratio * 100));

  const todayValue = progress?.today ?? 0;
  const todayRatio = progress
    ? progressRatio(kpi, target, todayValue)
    : 0;
  const todayBetter =
    kpi.direction === "higher_is_better"
      ? todayValue >= actual
      : todayValue <= actual;

  const color = deptColor || "#ff6a3d";

  return (
    <div className="card card-hover group relative overflow-hidden p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/40">
            {kpi.window === "today" ? "Today" : kpi.window === "7d" ? "Last 7 days" : "Month-to-date"}
          </div>
          <h3 className="mt-1 font-display text-base font-semibold text-white">
            {kpi.name}
          </h3>
          {kpi.description && (
            <p className="mt-1 text-xs text-white/50 line-clamp-2">{kpi.description}</p>
          )}
        </div>
        <span className={cx("chip shrink-0", statusBg(status))}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <div className="font-display text-3xl font-semibold tracking-tight text-white">
            {formatValue(actual, kpi.unit)}
          </div>
          <div className="mt-1 text-xs text-white/50">
            Target {formatValueFull(target.target, kpi.unit)}
            <span className="mx-1.5 text-white/20">·</span>
            {pct}% of goal
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
                    <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
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

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.min(100, pct)}%`,
            background:
              status === "off_track"
                ? "linear-gradient(90deg, #f87171, #ef4444)"
                : status === "at_risk"
                  ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                  : `linear-gradient(90deg, ${color}, #34d399)`,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {owner ? (
          <Link
            href={`/team/${owner.id}`}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <Avatar name={owner.name} size={26} color={color} />
            <div className="leading-tight">
              <div className="text-[13px] font-medium">{owner.name}</div>
              <div className="text-[11px] text-white/40">{owner.position}</div>
            </div>
          </Link>
        ) : (
          <span className="text-xs text-white/40">Unassigned</span>
        )}
        <div className="flex items-center gap-1 text-[11px] text-white/50">
          {todayBetter ? (
            <TrendingUp size={12} className="text-ok" />
          ) : (
            <TrendingDown size={12} className="text-bad" />
          )}
          Today: {formatValue(todayValue, kpi.unit)}
          <span className="muted">({Math.round(todayRatio * 100)}%)</span>
        </div>
      </div>

      <Link
        href={`/kpis#${target.id}`}
        className="absolute right-4 top-4 opacity-0 transition group-hover:opacity-100"
      >
        <ArrowUpRight size={14} className="text-white/60" />
      </Link>
    </div>
  );
}
