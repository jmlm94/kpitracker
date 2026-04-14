"use client";

import { useStore } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { DepartmentCard } from "@/components/DepartmentCard";
import { EmptyOnboarding } from "@/components/EmptyOnboarding";
import {
  classifyStatus,
  formatValue,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { AlertTriangle, Flame, Target as TargetIcon, Users2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { state, ready } = useStore();
  if (!ready) return null;

  const targets = state.targets;
  const totals = targets.reduce(
    (acc, t) => {
      const kpi = state.kpis.find((k) => k.id === t.kpiId);
      const p = state.progress[t.id];
      if (!kpi || !p) return acc;
      const actual = pickProgressValue(kpi, p);
      const r = progressRatio(kpi, t, actual);
      acc.sum += Math.min(1.2, r);
      const s = classifyStatus(r);
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

  // flag underperformers
  const risks = targets
    .map((t) => {
      const kpi = state.kpis.find((k) => k.id === t.kpiId);
      const p = state.progress[t.id];
      if (!kpi || !p) return null;
      const actual = pickProgressValue(kpi, p);
      const r = progressRatio(kpi, t, actual);
      return { target: t, kpi, progress: p, ratio: r };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 4);

  return (
    <div>
      {!state.onboarded && <EmptyOnboarding />}

      {/* Summary tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryTile
          label="Overall progress"
          value={`${Math.round(overallPct * 100)}%`}
          hint={statusLabel(classifyStatus(overallPct))}
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
          label="On track"
          value={String(totals.ahead + totals.on_track)}
          hint={`${totals.at_risk} at risk · ${totals.off_track} off`}
          icon={<Users2 size={16} />}
          tone="ok"
        />
        <SummaryTile
          label="Needs attention"
          value={String(totals.off_track + totals.at_risk)}
          hint="Targets below expected pace"
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

      {/* Risks */}
      {risks.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <div className="bracket text-bad">Red Flags</div>
              <h2 className="section-title mt-1">Needs Attention</h2>
              <p className="mt-1 text-sm text-white/50">
                KPIs furthest from pacing toward this month's target. If red for 2 months → CEO review.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
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
                />
              );
            })}
          </div>
        </section>
      )}

      {/* All KPIs */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="bracket">Full Board</div>
            <h2 className="section-title mt-1">All KPIs</h2>
            <p className="mt-1 text-sm text-white/50">
              Live metrics pulled from Shopify, Triple Whale, Klaviyo, Postscript, Zendesk & Google Sheets.
            </p>
          </div>
          <Link href="/kpis" className="btn-ghost">
            Manage KPIs
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.targets.map((t) => {
            const kpi = state.kpis.find((k) => k.id === t.kpiId);
            if (!kpi) return null;
            const owner = state.team.find((m) => m.id === t.ownerId);
            const dept = state.departments.find((d) => d.id === owner?.departmentId);
            return (
              <KPICard
                key={t.id}
                kpi={kpi}
                target={t}
                progress={state.progress[t.id]}
                owner={owner}
                deptColor={dept?.color}
              />
            );
          })}
        </div>
      </section>
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
