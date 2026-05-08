"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { DepartmentCard } from "@/components/DepartmentCard";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import {
  classifyStatus,
  formatValue,
  isReported,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { aggregate, useTimeframe } from "@/lib/timeframe";
import { AlertTriangle, Flame, MessageSquare, Search, Target as TargetIcon, Trophy } from "lucide-react";

export default function DashboardPage() {
  const { state, ready } = useStore();
  const [timeframe, setTimeframe] = useTimeframe();
  const [search, setSearch] = useState("");
  if (!ready) return null;

  const allRows = state.targets
    .map((t) => {
      const kpi = state.kpis.find((k) => k.id === t.kpiId);
      const p = state.progress[t.id];
      if (!kpi || !p) return null;
      const owner = state.team.find((m) => m.id === t.ownerId);
      const actual = aggregate(kpi, p, timeframe);
      const reported = isReported(p);
      const ratio = progressRatio(kpi, t, actual);
      return { target: t, kpi, progress: p, actual, ratio, owner, reported };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const q = search.trim().toLowerCase();
  const rows = q
    ? allRows.filter(
        (r) =>
          r.kpi.name.toLowerCase().includes(q) ||
          r.owner?.name.toLowerCase().includes(q) ||
          r.kpi.metricKey.toLowerCase().includes(q),
      )
    : allRows;

  const totals = rows.reduce(
    (acc, r) => {
      const s = classifyStatus(r.ratio, r.reported);
      if (s === "not_reported") { acc.not_reported++; acc.count++; return acc; }
      acc.sum += Math.min(1.2, r.ratio);
      if (s === "ahead") acc.ahead++;
      else if (s === "on_track") acc.on_track++;
      else if (s === "at_risk") acc.at_risk++;
      else acc.off_track++;
      acc.count++;
      acc.reportedCount++;
      return acc;
    },
    { sum: 0, count: 0, reportedCount: 0, ahead: 0, on_track: 0, at_risk: 0, off_track: 0, not_reported: 0 },
  );
  const overallPct = totals.reportedCount ? totals.sum / totals.reportedCount : 0;

  // Needs Attention: only reported KPIs that are OFF TRACK or AT RISK
  const risks = [...rows]
    .filter((r) => {
      if (!r.reported) return false;
      const s = classifyStatus(r.ratio, r.reported);
      return s === "off_track" || s === "at_risk";
    })
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 6);
  // Winning: only reported KPIs that are ON TRACK or AHEAD — no overlap with risks
  const winning = rows
    .filter((r) => {
      if (!r.reported) return false;
      const s = classifyStatus(r.ratio, r.reported);
      return s === "on_track" || s === "ahead";
    })
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 6);

  // Company Scorecard — Jose's CEO KPIs
  const ceoKpiIds = ["kpi_ceo_revenue", "kpi_ceo_blended_roas", "kpi_ceo_net_margin", "kpi_ceo_ebitda", "kpi_ceo_kpis_on_track"];
  const scorecard = ceoKpiIds
    .map((id) => {
      const kpi = state.kpis.find((k) => k.id === id);
      const target = state.targets.find((t) => t.kpiId === id);
      if (!kpi || !target) return null;
      if (id === "kpi_ceo_kpis_on_track") {
        const onTrack = totals.ahead + totals.on_track;
        const pct = totals.count ? (onTrack / totals.count) * 100 : 0;
        return { kpi, target, actual: pct };
      }
      const p = state.progress[target.id];
      const actual = p ? pickProgressValue(kpi, p) : 0;
      return { kpi, target, actual };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  // Recent notes for the Dashboard widget
  const recentNotes = (state.submissions || [])
    .filter((s) => !!s.notes?.trim())
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5);

  return (
    <div>
      {/* Company Scorecard */}
      {scorecard.length > 0 && (
        <section className="mb-6">
          <div className="bracket text-carbinox">Company Scorecard</div>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
            {scorecard.map(({ kpi, target, actual }) => {
              const ratio = progressRatio(kpi, target, actual);
              const status = classifyStatus(ratio);
              return (
                <div key={kpi.id} className="card relative p-3">
                  <div className="bracket text-[9px]">{kpi.name}</div>
                  <div className="mt-1 font-numeric text-xl font-bold text-white">
                    {actual === 0 ? "—" : formatValue(actual, kpi.unit)}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/45">
                    Target {formatValue(target.target, kpi.unit)}
                  </div>
                  <span className={`chip absolute right-2 top-2 ${statusBg(status)} px-1 py-0 text-[8px]`}>
                    {actual === 0 ? "—" : statusLabel(status)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Timeframe + search bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="bracket">Viewing</div>
            <p className="mt-1 text-sm text-white/60">
              All KPI values below are aggregated over the selected timeframe.
            </p>
          </div>
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search KPI or owner…"
              className="input pl-7 py-1.5 text-xs w-56"
            />
          </div>
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
          hint={`${totals.at_risk} at risk · ${totals.off_track} off track${totals.not_reported > 0 ? ` · ${totals.not_reported} pending` : ""}`}
          icon={<AlertTriangle size={16} />}
          tone={totals.off_track ? "bad" : totals.at_risk ? "warn" : "ok"}
        />
      </div>

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

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <section className="mt-10">
          <div className="bracket">Latest Notes from the Team</div>
          <h2 className="section-title mt-1">What's on people's minds</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentNotes.map((sub) => {
              const owner = state.team.find((m) => m.id === sub.ownerId);
              const dept = state.departments.find((d) => d.id === owner?.departmentId);
              const [y, m] = sub.periodKey.split("-").map(Number);
              const period = new Date(y, m - 1).toLocaleString(undefined, { month: "short", year: "numeric" });
              return (
                <Link
                  key={sub.id}
                  href={`/team/${owner?.id}`}
                  className="card flex items-start gap-3 p-4 transition hover:border-white/20"
                >
                  <div className="mt-0.5 bg-carbinox/15 p-2 text-carbinox">
                    <MessageSquare size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                        {owner?.name || "Unknown"}
                      </span>
                      <span className="font-numeric text-[10px] text-white/40">· {period}</span>
                      {dept && (
                        <span
                          className="font-numeric text-[10px] text-white/55"
                          style={{ color: dept.color }}
                        >
                          {dept.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[13px] text-white/75">
                      {sub.notes}
                    </p>
                  </div>
                </Link>
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
