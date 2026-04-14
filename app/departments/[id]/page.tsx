"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { Avatar } from "@/components/Avatar";
import {
  classifyStatus,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export default function DepartmentDetailPage() {
  const { state, ready } = useStore();
  const params = useParams();
  const id = params?.id as string;
  if (!ready) return null;
  const dept = state.departments.find((d) => d.id === id);
  if (!dept) {
    return (
      <div className="card p-6">
        <div className="text-white/70">Department not found.</div>
        <Link href="/departments" className="btn-ghost mt-4">
          Back
        </Link>
      </div>
    );
  }
  const members = state.team.filter((t) => t.departmentId === id);
  const memberIds = new Set(members.map((m) => m.id));
  const targets = state.targets.filter((t) => memberIds.has(t.ownerId));
  const head = state.team.find((m) => m.id === dept.headId);

  let sum = 0;
  targets.forEach((t) => {
    const kpi = state.kpis.find((k) => k.id === t.kpiId);
    const p = state.progress[t.id];
    if (!kpi || !p) return;
    sum += Math.min(1.2, progressRatio(kpi, t, pickProgressValue(kpi, p)));
  });
  const avg = targets.length ? sum / targets.length : 0;
  const status = classifyStatus(avg);

  return (
    <div>
      <Link href="/departments" className="btn-ghost">
        <ArrowLeft size={14} /> Departments
      </Link>
      <div className="card mt-4 overflow-hidden p-6">
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ background: dept.color }}
        />
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${dept.color}, transparent)` }}
          />
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">{dept.name}</h1>
            <div className="text-sm text-white/50">
              {members.length} people · {targets.length} KPIs tracked
            </div>
          </div>
          <span className={`chip ml-auto ${statusBg(status)}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel(status)} · {Math.round(avg * 100)}%
          </span>
        </div>
        {head && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <Avatar name={head.name} color={dept.color} size={36} />
            <div className="text-sm">
              <div className="font-medium text-white">{head.name}</div>
              <div className="text-white/50">Head of department · {head.position}</div>
            </div>
            <Link href={`/team/${head.id}`} className="btn-ghost ml-auto">
              View profile
            </Link>
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="section-title">Team</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => {
            const ownerTargets = targets.filter((t) => t.ownerId === m.id);
            let s = 0;
            ownerTargets.forEach((t) => {
              const kpi = state.kpis.find((k) => k.id === t.kpiId);
              const p = state.progress[t.id];
              if (!kpi || !p) return;
              s += Math.min(1.2, progressRatio(kpi, t, pickProgressValue(kpi, p)));
            });
            const a = ownerTargets.length ? s / ownerTargets.length : 0;
            const st = classifyStatus(a);
            return (
              <Link
                key={m.id}
                href={`/team/${m.id}`}
                className="card card-hover flex items-center gap-3 p-4"
              >
                <Avatar name={m.name} color={dept.color} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{m.name}</div>
                  <div className="truncate text-xs text-white/50">{m.position}</div>
                </div>
                <span className={`chip ${statusBg(st)}`}>{Math.round(a * 100)}%</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="section-title">KPIs</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {targets.map((t) => {
            const kpi = state.kpis.find((k) => k.id === t.kpiId);
            if (!kpi) return null;
            const owner = state.team.find((m) => m.id === t.ownerId);
            return (
              <KPICard
                key={t.id}
                kpi={kpi}
                target={t}
                progress={state.progress[t.id]}
                owner={owner}
                deptColor={dept.color}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
