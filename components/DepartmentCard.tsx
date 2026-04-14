"use client";

import Link from "next/link";
import type { Department, AppState } from "@/lib/types";
import {
  classifyStatus,
  cx,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
  statusSolid,
} from "@/lib/format";

export function DepartmentCard({
  department,
  state,
}: {
  department: Department;
  state: AppState;
}) {
  const members = state.team.filter((t) => t.departmentId === department.id);
  const memberIds = new Set(members.map((m) => m.id));
  const deptTargets = state.targets.filter((t) => memberIds.has(t.ownerId));

  let sum = 0;
  let ok = 0;
  let risk = 0;
  let off = 0;
  deptTargets.forEach((t) => {
    const kpi = state.kpis.find((k) => k.id === t.kpiId);
    const p = state.progress[t.id];
    if (!kpi || !p) return;
    const actual = pickProgressValue(kpi, p);
    const r = progressRatio(kpi, t, actual);
    sum += Math.min(1.2, r);
    const s = classifyStatus(r);
    if (s === "ahead" || s === "on_track") ok++;
    else if (s === "at_risk") risk++;
    else off++;
  });

  const avg = deptTargets.length ? sum / deptTargets.length : 0;
  const status = classifyStatus(avg);
  const fillColor = statusSolid(status);

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
          <div className="bracket">{department.name}</div>
          <h3 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-brand text-white">
            {department.name}
          </h3>
          <div className="mt-1.5 font-numeric text-[11px] uppercase tracking-brand text-white/55">
            {members.length} {members.length === 1 ? "person" : "people"} ·{" "}
            {deptTargets.length} KPI{deptTargets.length === 1 ? "" : "s"}
          </div>
        </div>
        <span className={cx("chip", statusBg(status))}>
          <span className="h-1.5 w-1.5 bg-current" />
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between font-heading text-[10px] uppercase tracking-brand text-white/50">
          <span>Overall Progress</span>
          <span className="font-numeric text-white">{Math.round(avg * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full border border-white/5 bg-white/[0.03]">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, avg * 100)}%`,
              background: fillColor,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="On track" value={ok} color="#48f088" />
        <Stat label="At risk" value={risk} color="#f8c808" />
        <Stat label="Off track" value={off} color="#e83028" />
      </div>
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
