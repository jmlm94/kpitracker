"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import {
  classifyStatus,
  pickProgressValue,
  progressRatio,
  statusSolid,
} from "@/lib/format";
import {
  childDepartments,
  membersOfDepartment,
  targetsForDepartment,
} from "@/lib/hierarchy";
import type { Department, AppState, TeamMember } from "@/lib/types";

export default function DepartmentsPage() {
  const { state, ready } = useStore();
  if (!ready) return null;
  const mains = state.departments.filter((d) => d.kind === "main");

  return (
    <div>
      <div className="bracket">02 — The Machine</div>
      <h1 className="section-title mt-1">Departments</h1>
      <p className="mt-2 text-sm text-white/50">
        The full Carbinox hierarchy. Each department shows its head, team, and
        reporting structure.
      </p>

      <div className="mt-8 space-y-6">
        {mains.map((main, i) => {
          const subs = childDepartments(state, main.id);
          return (
            <section key={main.id}>
              {/* Main department card */}
              <DeptCard dept={main} prefix={`${i + 1}`} state={state} />

              {/* Sub-departments */}
              {subs.map((sub, j) => (
                <div key={sub.id} className="ml-6 mt-3">
                  <DeptCard
                    dept={sub}
                    prefix={`${i + 1}.${j + 1}`}
                    state={state}
                  />
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DeptCard({
  dept,
  prefix,
  state,
}: {
  dept: Department;
  prefix: string;
  state: AppState;
}) {
  const members = membersOfDepartment(state, dept.id);
  const targets = targetsForDepartment(state, dept.id);
  const head = state.team.find((m) => m.id === dept.headId);

  // Build reporting tree for this department
  function getReports(managerId: string): TeamMember[] {
    return members.filter((m) => {
      const mids = m.managerIds || (m.managerId ? [m.managerId] : []);
      return mids.includes(managerId) && m.id !== managerId;
    });
  }

  return (
    <div className="card relative p-5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: dept.color }}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="font-numeric text-[14px] font-bold text-carbinox">
          {prefix}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            href={`/departments/${dept.id}`}
            className="font-display text-2xl font-extrabold uppercase leading-none tracking-brand text-white hover:text-carbinox"
          >
            {dept.name}
          </Link>
          <div className="mt-1 font-numeric text-[11px] uppercase tracking-brand text-white/50">
            {dept.kind === "main" ? "Main" : "Sub-department"} ·{" "}
            {members.length} people · {targets.length} KPIs
          </div>
        </div>
      </div>

      {/* Head */}
      {head && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="bracket">Head</div>
          <PersonRow person={head} state={state} deptColor={dept.color} isHead />
        </div>
      )}

      {/* Team as reporting tree */}
      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="bracket">Team ({members.length})</div>
        <div className="mt-2 space-y-1">
          {head ? (
            <ReportingTree
              managerId={head.id}
              members={members}
              state={state}
              deptColor={dept.color}
              depth={0}
            />
          ) : (
            members.map((m) => (
              <PersonRow
                key={m.id}
                person={m}
                state={state}
                deptColor={dept.color}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReportingTree({
  managerId,
  members,
  state,
  deptColor,
  depth,
}: {
  managerId: string;
  members: TeamMember[];
  state: AppState;
  deptColor: string;
  depth: number;
}) {
  const reports = members.filter((m) => {
    if (m.id === managerId) return false;
    const mids = m.managerIds || (m.managerId ? [m.managerId] : []);
    return mids.includes(managerId);
  });

  if (reports.length === 0) return null;

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      {reports.map((r) => (
        <div key={r.id}>
          <PersonRow person={r} state={state} deptColor={deptColor} />
          <ReportingTree
            managerId={r.id}
            members={members}
            state={state}
            deptColor={deptColor}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  );
}

function PersonRow({
  person,
  state,
  deptColor,
  isHead,
}: {
  person: TeamMember;
  state: AppState;
  deptColor: string;
  isHead?: boolean;
}) {
  const targets = state.targets.filter((t) => t.ownerId === person.id);
  let sum = 0;
  let count = 0;
  targets.forEach((t) => {
    const kpi = state.kpis.find((k) => k.id === t.kpiId);
    const p = state.progress[t.id];
    if (!kpi || !p) return;
    sum += Math.min(1.2, progressRatio(kpi, t, pickProgressValue(kpi, p)));
    count++;
  });
  const avg = count ? sum / count : 0;
  const status = classifyStatus(avg);
  const pct = Math.min(100, Math.round(avg * 100));
  const fillColor = statusSolid(status);
  const isShared =
    (person.managerIds?.length || 0) > 1;

  return (
    <Link
      href={`/team/${person.id}`}
      className="flex items-center gap-3 border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-white/10 hover:bg-white/[0.04]"
    >
      <Avatar
        name={person.name}
        size={28}
        color={deptColor}
        avatarUrl={person.avatarUrl}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
            {person.name}
          </span>
          {isHead && (
            <span className="chip border-carbinox/40 bg-carbinox/10 text-carbinox px-1 py-0 text-[9px]">
              Head
            </span>
          )}
          {isShared && (
            <span className="chip border-white/20 bg-white/5 text-white/50 px-1 py-0 text-[9px]">
              Shared
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/45">{person.position}</div>
        {count > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 border border-white/5 bg-white/[0.03]">
              <div
                className="h-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: fillColor }}
              />
            </div>
            <span
              className="font-numeric text-[10px] font-semibold"
              style={{ color: fillColor }}
            >
              {pct}%
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
