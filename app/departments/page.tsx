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
        The full Carbinox hierarchy, one department at a time.
      </p>

      <div className="mt-8 space-y-8">
        {mains.map((main, mainIdx) => {
          const prefix = `${mainIdx + 1}`;
          const subs = childDepartments(state, main.id);
          return (
            <div key={main.id}>
              <DeptBlock dept={main} prefix={prefix} state={state} />
              {subs.map((sub, subIdx) => (
                <DeptBlock
                  key={sub.id}
                  dept={sub}
                  prefix={`${prefix}.${subIdx + 1}`}
                  state={state}
                  indent={1}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeptBlock({
  dept,
  prefix,
  state,
  indent = 0,
}: {
  dept: Department;
  prefix: string;
  state: AppState;
  indent?: number;
}) {
  const members = membersOfDepartment(state, dept.id);
  const targets = targetsForDepartment(state, dept.id);
  const head = state.team.find((m) => m.id === dept.headId);

  return (
    <div
      className="card mt-3 p-5"
      style={{ marginLeft: indent * 24 }}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: dept.color }}
      />
      <div className="flex items-start gap-3">
        <span className="font-numeric text-[13px] font-bold text-carbinox">
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
          <div className="mt-1.5 flex items-center gap-2.5">
            <Avatar name={head.name} size={30} color={dept.color} />
            <Link
              href={`/team/${head.id}`}
              className="leading-tight hover:text-carbinox"
            >
              <div className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                {head.name}
              </div>
              <div className="text-[11px] text-white/50">{head.position}</div>
            </Link>
          </div>
        </div>
      )}

      {/* Team members with progress bars */}
      {members.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="bracket">Team ({members.length})</div>
          <div className="mt-2 space-y-2">
            {members.map((m) => (
              <PersonProgressRow
                key={m.id}
                person={m}
                state={state}
                deptColor={dept.color}
                isHead={m.id === head?.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonProgressRow({
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

  return (
    <Link
      href={`/team/${person.id}`}
      className="flex items-center gap-3 border border-white/5 bg-white/[0.02] px-3 py-2 transition hover:border-white/10 hover:bg-white/[0.04]"
    >
      <Avatar name={person.name} size={28} color={deptColor} />
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
        </div>
        <div className="text-[10px] text-white/45">{person.position}</div>
        {/* Progress bar */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 border border-white/5 bg-white/[0.03]">
            <div
              className="h-full transition-[width] duration-500"
              style={{ width: `${pct}%`, background: fillColor }}
            />
          </div>
          <span className="font-numeric text-[10px] font-semibold" style={{ color: fillColor }}>
            {pct}%
          </span>
        </div>
      </div>
    </Link>
  );
}
