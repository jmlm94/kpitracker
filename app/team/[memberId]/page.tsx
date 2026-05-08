"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useRef } from "react";
import { ArrowLeft, Camera, ChevronDown, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { KPICard } from "@/components/KPICard";
import { Avatar } from "@/components/Avatar";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { MonthlyReportForm } from "@/components/MonthlyReportForm";
import {
  classifyStatus,
  cx,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { aggregate, useTimeframe } from "@/lib/timeframe";
import type { Department } from "@/lib/types";

export default function TeamMemberPage() {
  const { state, ready, upsertTeamMember } = useStore();
  const params = useParams();
  const memberId = params?.memberId as string;
  const [timeframe, setTimeframe] = useTimeframe();
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);
  if (!ready) return null;

  const member = state.team.find((m) => m.id === memberId);
  if (!member)
    return (
      <div className="card p-6">
        <div className="text-white/70">Team member not found.</div>
      </div>
    );

  const dept = state.departments.find((d) => d.id === member.departmentId);
  const additionalDepts = (member.additionalDepartmentIds || [])
    .map((id) => state.departments.find((d) => d.id === id))
    .filter((d): d is Department => !!d);
  const allDepts = [dept, ...additionalDepts].filter((d): d is Department => !!d);
  const managerIds = member.managerIds || (member.managerId ? [member.managerId] : []);
  const managers = managerIds
    .map((id) => state.team.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);
  const directReports = state.team.filter((m) => {
    const mids = m.managerIds || (m.managerId ? [m.managerId] : []);
    return mids.includes(member.id);
  });
  const allTargets = state.targets.filter((t) => t.ownerId === member.id);
  const targets =
    deptFilter === "all"
      ? allTargets
      : allTargets.filter((t) => t.departmentId === deptFilter);
  const watching = state.targets.filter((t) => t.watcherIds?.includes(member.id));

  let s = 0;
  allTargets.forEach((t) => {
    const kpi = state.kpis.find((k) => k.id === t.kpiId);
    const p = state.progress[t.id];
    if (!kpi || !p) return;
    s += Math.min(1.2, progressRatio(kpi, t, aggregate(kpi, p, timeframe)));
  });
  const avg = allTargets.length ? s / allTargets.length : 0;
  const status = classifyStatus(avg);

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert("Image too large — keep it under 500 KB.");
      return;
    }
    const m = member;
    if (!m) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      upsertTeamMember({ ...m, avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  // Group targets by department for the filter dropdown count
  const deptCounts = new Map<string, number>();
  allTargets.forEach((t) => {
    const key = t.departmentId || "unassigned";
    deptCounts.set(key, (deptCounts.get(key) || 0) + 1);
  });

  return (
    <div>
      <Link href="/team" className="btn-ghost">
        <ArrowLeft size={14} /> Team
      </Link>

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative group">
            <Avatar
              name={member.name}
              color={dept?.color}
              size={72}
              avatarUrl={member.avatarUrl}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
              title="Upload profile picture"
            >
              <Camera size={18} className="text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-brand text-white">
              {member.name}
            </h1>
            <div className="mt-1 text-sm text-white/60">
              {member.position}
              {managers.length > 0 && (
                <>
                  {" · Reports to "}
                  {managers.map((m, i) => (
                    <span key={m.id}>
                      {i > 0 && ", "}
                      <Link
                        href={`/team/${m.id}`}
                        className="text-white/80 hover:text-white"
                      >
                        {m.name}
                      </Link>
                    </span>
                  ))}
                </>
              )}
              {directReports.length > 0 && (
                <>
                  {" · Manages "}
                  <span className="text-white/80">{directReports.length}</span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allDepts.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/departments/${d.id}`}
                  className="inline-flex items-center gap-1 border px-2 py-1 text-[11px] font-heading font-semibold uppercase tracking-brand"
                  style={{
                    borderColor: d.color,
                    borderStyle: i === 0 ? "solid" : "dashed",
                  }}
                >
                  <span className="h-1.5 w-1.5" style={{ background: d.color }} />
                  {d.name}
                  {i === 0 && " ★"}
                </Link>
              ))}
            </div>
          </div>
          <span className={`chip ${statusBg(status)}`}>
            <span className="h-1.5 w-1.5 bg-current" />
            {statusLabel(status)} · {Math.round(avg * 100)}%
          </span>
        </div>
      </div>

      {/* Monthly self-report form */}
      <MonthlyReportForm member={member} />

      {/* Timeframe selector */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="bracket">Viewing</div>
          <p className="mt-1 text-[12px] text-white/50">
            KPI values below are aggregated over the selected timeframe.
          </p>
        </div>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Department filter for KPIs */}
      <div className="mt-4 inline-flex border border-white/10 bg-jet-900 p-0.5">
        <button
          onClick={() => setDeptFilter("all")}
          className={cx(
            "px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-brand transition",
            deptFilter === "all"
              ? "bg-carbinox text-jet-950"
              : "text-white/60 hover:text-white",
          )}
        >
          All ({allTargets.length})
        </button>
        {allDepts.map((d) => {
          const count = deptCounts.get(d.id) || 0;
          if (!count) return null;
          return (
            <button
              key={d.id}
              onClick={() => setDeptFilter(d.id)}
              className={cx(
                "px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-brand transition",
                deptFilter === d.id
                  ? "bg-carbinox text-jet-950"
                  : "text-white/60 hover:text-white",
              )}
            >
              {d.name} ({count})
            </button>
          );
        })}
      </div>

      <section className="mt-4">
        <h2 className="section-title">Owned KPIs</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {targets.length === 0 && (
            <div className="card p-6 text-sm text-white/50">
              No KPIs match the current filter.
            </div>
          )}
          {targets.map((t) => {
            const kpi = state.kpis.find((k) => k.id === t.kpiId);
            if (!kpi) return null;
            const tDept = state.departments.find((d) => d.id === t.departmentId);
            return (
              <KPICard
                key={t.id}
                kpi={kpi}
                target={t}
                progress={state.progress[t.id]}
                owner={member}
                deptColor={tDept?.color || dept?.color}
                timeframe={timeframe}
              />
            );
          })}
        </div>
      </section>

      {watching.length > 0 && (
        <WatchingSection watching={watching} state={state} timeframe={timeframe} memberName={member.name} />
      )}
    </div>
  );
}

function WatchingSection({
  watching,
  state,
  timeframe,
  memberName,
}: {
  watching: import("@/lib/types").Target[];
  state: import("@/lib/types").AppState;
  timeframe: import("@/lib/timeframe").Timeframe;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-left"
      >
        {open ? (
          <ChevronDown size={14} className="text-white/50" />
        ) : (
          <ChevronRight size={14} className="text-white/50" />
        )}
        <h2 className="section-title">Also watching</h2>
        <span className="font-numeric text-[12px] text-white/45">({watching.length})</span>
      </button>
      <p className="text-sm text-white/50">
        KPIs that roll up into {memberName.split(" ")[0]}'s responsibility. {!open && "Click to expand."}
      </p>
      {open && (
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
                timeframe={timeframe}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
