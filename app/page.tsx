"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { DepartmentCard } from "@/components/DepartmentCard";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { ShopifyLiveSection } from "@/components/ShopifyLiveSection";
import { TripleWhaleLiveSection } from "@/components/TripleWhaleLiveSection";
import {
  classifyStatus,
  progressRatio,
} from "@/lib/format";
import { aggregate, useTimeframe } from "@/lib/timeframe";
import { AlertTriangle, Flame, Target as TargetIcon, Trophy } from "lucide-react";

export default function DashboardPage() {
  const { state, ready } = useStore();
  const [timeframe, setTimeframe] = useTimeframe();
  if (!ready) return null;

  const rows = state.targets
    .map((t) => {
      const kpi = state.kpis.find((k) => k.id === t.kpiId);
      const p = state.progress[t.id];
      if (!kpi || !p) return null;
      const actual = aggregate(kpi, p, timeframe);
      const ratio = progressRatio(kpi, t, actual);
      return { target: t, kpi, progress: p, actual, ratio };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const totals = rows.reduce(
    (acc, r) => {
      acc.sum += Math.min(1.2, r.ratio);
      const s = classifyStatus(r.ratio);
      if (s === "ahead") acc.ahead++;
      else if (s === "on_track") acc.on_track++;
      else if (s === "at_risk") acc.at_risk++;
      else acc.off_track++;
      acc.count++;
      return acc;
    },
    { sum: 0, count: 0, ahead: 0, on_track: 0, at_risk: 0, off_track: 0 },
  );
  const overallPct = totals.count ? totals.sum / totals.count : 0;

  // Top N risks (sorted ascending by ratio — the most behind first)
  const risks = [...rows].sort((a, b) => a.ratio - b.ratio).slice(0, 6);
  // Winning KPIs (ahead of target, best first)
  const winning = rows
    .filter((r) => classifyStatus(r.ratio) === "ahead" || classifyStatus(r.ratio) === "on_track")
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 6);

  return (
    <div>
      {/* Timeframe bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="bracket">Viewing</div>
          <p className="mt-1 text-sm text-white/60">
            All KPI values below are aggregated over the selected timeframe.
          </p>
        </div>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Summary tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile
          label="Overall pace"
          value={`${Math.round(overallPct * 100)}%`}
          hint={overallPct >= 0.95 ? "On track" : overallPct >= 0.8 ? "At risk" : "Off track"}
          icon={<Flame size={16} />}
          tone={overallPct >= 0.95 ? "ok" : overallPct >= 0.8 ? "warn" : "bad"}
        />
        <SummaryTile
          label="Active KPIs"
          value={String(totals.count)}
          hint={`${state.kpis.length} defined`}
          icon={<TargetIcon size={16} />}
        />
        <SummaryTile
          label="Winning"
          value={String(totals.ahead + totals.on_track)}
          hint={`${totals.ahead} ahead · ${totals.on_track} on track`}
          icon={<Trophy size={16} />}
          tone="ok"
        />
        <SummaryTile
          label="Needs attention"
          value={String(totals.at_risk + totals.off_track)}
          hint={`${totals.at_risk} at risk · ${totals.off_track} off track`}
          icon={<AlertTriangle size={16} />}
          tone={totals.off_track ? "bad" : totals.at_risk ? "warn" : "ok"}
        />
      </div>

      {/* Shopify Live */}
      <ShopifyLiveSection timeframe={timeframe} />

      {/* Triple Whale Live */}
      <TripleWhaleLiveSection timeframe={timeframe} />

      {/* Departments */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="bracket">02 — The Machine</div>
            <h2 className="section-title mt-1">Departments</h2>
            <p className="mt-1 text-sm text-white/50">
              Aggregated progress across every team in the Carbinox revenue loop.
            </p>
          </div>
          <Link href="/departments" className="btn-ghost">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.departments
            .filter((d) => !d.parentId)
            .map((d) => (
              <DepartmentCard key={d.id} department={d} state={state} />
            ))}
        </div>
      </section>

      {/* Needs Attention */}
      {risks.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="bracket text-bad">Red Flags</div>
              <h2 className="section-title mt-1">Needs Attention</h2>
              <p className="mt-1 text-sm text-white/50">
                KPIs furthest from pacing toward this month's target — attack these first.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {risks.map(({ target, kpi, progress }) => {
              const owner = state.team.find((m) => m.id === target.ownerId);
              const dept = state.departments.find(
                (d) => d.id === owner?.departmentId,
              );
              return (
                <KPICard
                  key={target.id}
                  kpi={kpi}
                  target={target}
                  progress={progress}
                  owner={owner}
                  deptColor={dept?.color}
                  timeframe={timeframe}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Winning */}
      {winning.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="bracket text-ok">Green Light</div>
              <h2 className="section-title mt-1">Winning</h2>
              <p className="mt-1 text-sm text-white/50">
                KPIs pacing on or above target — keep the momentum.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {winning.map(({ target, kpi, progress }) => {
              const owner = state.team.find((m) => m.id === target.ownerId);
              const dept = state.departments.find(
                (d) => d.id === owner?.departmentId,
              );
              return (
                <KPICard
                  key={target.id}
                  kpi={kpi}
                  target={target}
                  progress={progress}
                  owner={owner}
                  deptColor={dept?.color}
                  timeframe={timeframe}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "ok" | "warn" | "bad";
}) {
  const toneClass =
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warn"
        : tone === "bad"
          ? "text-bad"
          : "text-white";
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="bracket">{label}</div>
        <div className="border border-white/10 bg-white/[0.02] p-1.5 text-white/70">{icon}</div>
      </div>
      <div className={`mt-2 font-numeric text-3xl font-bold ${toneClass}`}>{value}</div>
      {hint && (
        <div className="mt-1 font-heading text-[10px] uppercase tracking-brand text-white/50">
          {hint}
        </div>
      )}
    </div>
  );
}
