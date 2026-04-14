"use client";

import Link from "next/link";
import type { Department, AppState } from "@/lib/types";
import {
  classifyStatus,
  cx,
  statusBg,
  statusLabel,
  statusSolid,
} from "@/lib/format";
import { aggregateDepartmentStats, childDepartments } from "@/lib/hierarchy";
import { Avatar } from "./Avatar";

export function DepartmentCard({
  department,
  state,
}: {
  department: Department;
  state: AppState;
}) {
  const stats = aggregateDepartmentStats(state, department.id);
  const status = classifyStatus(stats.avgRatio);
  const fillColor = statusSolid(status);
  const head = state.team.find((m) => m.id === department.headId);
  const subs = childDepartments(state, department.id);
  const directMembers = state.team.filter((t) => t.departmentId === department.id);

  return (
    <Link
      href={`/departments/${department.id}`}
      className="card card-hover group relative block p-5"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: department.color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="bracket">{subs.length > 0 ? "Parent Dept" : "Department"}</div>
          <h3 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-brand text-white">
            {department.name}
          </h3>
          <div className="mt-1.5 font-numeric text-[11px] uppercase tracking-brand text-white/55">
            {directMembers.length + subs.reduce((n, s) => n + state.team.filter((t) => t.departmentId === s.id).length, 0)}{" "}
            people · {stats.count} KPI{stats.count === 1 ? "" : "s"}
            {subs.length > 0 && ` · ${subs.length} sub-depts`}
          </div>
        </div>
        <span className={cx("chip", statusBg(status))}>
          <span className="h-1.5 w-1.5 bg-current" />
          {statusLabel(status)}
        </span>
      </div>

      {head && (
        <div className="mt-4 flex items-center gap-2.5 border-t border-white/5 pt-3">
          <Avatar name={head.name} size={26} color={department.color} />
          <div className="min-w-0 leading-tight">
            <div className="bracket">Head</div>
            <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
              {head.name}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between font-heading text-[10px] uppercase tracking-brand text-white/50">
          <span>Overall Progress</span>
          <span className="font-numeric text-white">{Math.round(stats.avgRatio * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full border border-white/5 bg-white/[0.03]">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, stats.avgRatio * 100)}%`,
              background: fillColor,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="On track" value={stats.ahead + stats.on_track} color="#48f088" />
        <Stat label="At risk" value={stats.at_risk} color="#f8c808" />
        <Stat label="Off track" value={stats.off_track} color="#e83028" />
      </div>

      {subs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {subs.map((s) => (
            <span
              key={s.id}
              className="chip border-white/10 bg-white/[0.03] text-white/70"
              style={{ borderColor: `${s.color}40` }}
            >
              <span className="h-1.5 w-1.5" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-white/5 bg-white/[0.02] py-2">
      <div className="font-numeric text-xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="font-heading text-[9px] font-semibold uppercase tracking-brand text-white/45">
        {label}
      </div>
    </div>
  );
}
