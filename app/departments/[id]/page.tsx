"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { DepartmentCard } from "@/components/DepartmentCard";
import { Avatar } from "@/components/Avatar";
import {
  classifyStatus,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import {
  aggregateDepartmentStats,
  childDepartments,
  membersOfDepartment,
  targetsForDepartment,
} from "@/lib/hierarchy";
import { ArrowLeft, ChevronRight } from "lucide-react";

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
  const parent = dept.parentId ? state.departments.find((d) => d.id === dept.parentId) : undefined;
  const subs = childDepartments(state, id);
  const stats = aggregateDepartmentStats(state, id);
  const status = classifyStatus(stats.avgRatio);
  const head = state.team.find((m) => m.id === dept.headId);
  const directMembers = membersOfDepartment(state, id);
  const ownTargets = targetsForDepartment(state, id);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Link href="/departments" className="flex items-center gap-1 hover:text-white">
          <ArrowLeft size={12} /> Departments
        </Link>
        {parent && (
          <>
            <ChevronRight size={12} className="text-white/30" />
            <Link
              href={`/departments/${parent.id}`}
              className="hover:text-white"
            >
              {parent.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} className="text-white/30" />
        <span className="text-white">{dept.name}</span>
      </div>

      <div className="card crosshair mt-4 p-6">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: dept.color }}
        />
        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 border border-white/10"
            style={{ background: dept.color }}
          />
          <div>
            <div className="bracket">
              {subs.length > 0 ? "Parent Department" : "Department"}
            </div>
            <h1 className="mt-1 font-display text-4xl font-extrabold uppercase leading-none tracking-brand text-white">
              {dept.name}
            </h1>
            <div className="mt-1.5 font-numeric text-[11px] uppercase tracking-brand text-white/55">
              {directMembers.length} direct report{directMembers.length === 1 ? "" : "s"}
              {subs.length > 0 && ` · ${subs.length} sub-department${subs.length === 1 ? "" : "s"}`}
              {" · "}
              {ownTargets.length} KPI{ownTargets.length === 1 ? "" : "s"}
            </div>
          </div>
          <span className={`chip ml-auto ${statusBg(status)}`}>
            <span className="h-1.5 w-1.5 bg-current" />
            {statusLabel(status)} · {Math.round(stats.avgRatio * 100)}%
          </span>
        </div>

        {head ? (
          <div className="mt-5 flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3">
            <Avatar name={head.name} color={dept.color} size={36} />
            <div className="text-sm">
              <div className="bracket">Head of {dept.name}</div>
              <div className="mt-0.5 font-heading font-semibold uppercase tracking-brand text-white">
                {head.name}
              </div>
              <div className="text-xs text-white/50">{head.position}</div>
            </div>
            <Link href={`/team/${head.id}`} className="btn-ghost ml-auto">
              View profile
            </Link>
          </div>
        ) : (
          <div className="mt-5 border border-warn/30 bg-warn/5 p-3 text-sm text-warn">
            No head assigned. Pick one from Onboarding → Departments.
          </div>
        )}
      </div>

      {/* Sub-departments */}
      {subs.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title">Sub-departments</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subs.map((s) => (
              <DepartmentCard key={s.id} department={s} state={state} />
            ))}
          </div>
        </section>
      )}

      {/* Team members assigned directly to this department */}
      {directMembers.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title">
            {subs.length > 0 ? "Direct team" : "Team"}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {directMembers.map((m) => {
              const memberTargets = state.targets.filter((t) => t.ownerId === m.id);
              let s = 0;
              memberTargets.forEach((t) => {
                const kpi = state.kpis.find((k) => k.id === t.kpiId);
                const p = state.progress[t.id];
                if (!kpi || !p) return;
                s += Math.min(1.2, progressRatio(kpi, t, pickProgressValue(kpi, p)));
              });
              const a = memberTargets.length ? s / memberTargets.length : 0;
              const st = classifyStatus(a);
              return (
                <Link
                  key={m.id}
                  href={`/team/${m.id}`}
                  className="card card-hover flex items-center gap-3 p-4"
                >
                  <Avatar name={m.name} color={dept.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                      {m.name}
                    </div>
                    <div className="truncate text-xs text-white/50">{m.position}</div>
                  </div>
                  <span className={`chip ${statusBg(st)}`}>{Math.round(a * 100)}%</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Aggregated KPIs (inclusive of descendants) */}
      {ownTargets.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title">KPIs</h2>
          <p className="mt-1 text-sm text-white/50">
            Every KPI owned by someone in {dept.name}
            {subs.length > 0 && " or its sub-departments"}.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ownTargets.map((t) => {
              const kpi = state.kpis.find((k) => k.id === t.kpiId);
              if (!kpi) return null;
              const owner = state.team.find((m) => m.id === t.ownerId);
              const ownerDept = state.departments.find((d) => d.id === owner?.departmentId);
              return (
                <KPICard
                  key={t.id}
                  kpi={kpi}
                  target={t}
                  progress={state.progress[t.id]}
                  owner={owner}
                  deptColor={ownerDept?.color || dept.color}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
