"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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

export default function TeamMemberPage() {
  const { state, ready } = useStore();
  const params = useParams();
  const memberId = params?.memberId as string;
  if (!ready) return null;
  const member = state.team.find((m) => m.id === memberId);
  if (!member)
    return (
      <div className="card p-6">
        <div className="text-white/70">Team member not found.</div>
      </div>
    );
  const dept = state.departments.find((d) => d.id === member.departmentId);
  const manager = state.team.find((m) => m.id === member.managerId);
  const targets = state.targets.filter((t) => t.ownerId === member.id);
  const watching = state.targets.filter((t) => t.watcherIds?.includes(member.id));

  let s = 0;
  targets.forEach((t) => {
    const kpi = state.kpis.find((k) => k.id === t.kpiId);
    const p = state.progress[t.id];
    if (!kpi || !p) return;
    s += Math.min(1.2, progressRatio(kpi, t, pickProgressValue(kpi, p)));
  });
  const avg = targets.length ? s / targets.length : 0;
  const status = classifyStatus(avg);

  return (
    <div>
      <Link href="/team" className="btn-ghost">
        <ArrowLeft size={14} /> Team
      </Link>
      <div className="card mt-4 p-6">
        <div className="flex items-center gap-5">
          <Avatar name={member.name} color={dept?.color} size={60} />
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">
              {member.name}
            </h1>
            <div className="text-sm text-white/60">
              {member.position}
              {dept && (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    className="text-white/80 hover:text-white"
                    href={`/departments/${dept.id}`}
                  >
                    {dept.name}
                  </Link>
                </>
              )}
              {manager && (
                <>
                  {" "}
                  · Reports to{" "}
                  <Link href={`/team/${manager.id}`} className="text-white/80 hover:text-white">
                    {manager.name}
                  </Link>
                </>
              )}
            </div>
          </div>
          <span className={`chip ml-auto ${statusBg(status)}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel(status)} · {Math.round(avg * 100)}%
          </span>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="section-title">Owned KPIs</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {targets.length === 0 && (
            <div className="card p-6 text-sm text-white/50">No KPIs owned yet.</div>
          )}
          {targets.map((t) => {
            const kpi = state.kpis.find((k) => k.id === t.kpiId);
            if (!kpi) return null;
            return (
              <KPICard
                key={t.id}
                kpi={kpi}
                target={t}
                progress={state.progress[t.id]}
                owner={member}
                deptColor={dept?.color}
              />
            );
          })}
        </div>
      </section>

      {watching.length > 0 && (
        <section className="mt-8">
          <h2 className="section-title">Also watching</h2>
          <p className="text-sm text-white/50">
            KPIs that roll up into {member.name.split(" ")[0]}'s responsibility.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {watching.map((t) => {
              const kpi = state.kpis.find((k) => k.id === t.kpiId);
              const owner = state.team.find((m) => m.id === t.ownerId);
              const ownerDept = state.departments.find(
                (d) => d.id === owner?.departmentId,
              );
              if (!kpi) return null;
              return (
                <KPICard
                  key={t.id}
                  kpi={kpi}
                  target={t}
                  progress={state.progress[t.id]}
                  owner={owner}
                  deptColor={ownerDept?.color}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
