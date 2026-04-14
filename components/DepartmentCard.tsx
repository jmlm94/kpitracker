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

  return (
    <Link
      href={`/departments/${department.id}`}
      className="card card-hover group relative block overflow-hidden p-5"
    >
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: department.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className="inline-block h-1 w-8 rounded-full"
            style={{ background: department.color }}
          />
          <h3 className="mt-2 font-display text-lg font-semibold text-white">
            {department.name}
          </h3>
          <div className="text-xs text-white/50">
            {members.length} {members.length === 1 ? "person" : "people"} ·{" "}
            {deptTargets.length} KPI{deptTargets.length === 1 ? "" : "s"}
          </div>
        </div>
        <span className={cx("chip", statusBg(status))}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>Overall progress</span>
          <span className="text-white/80">{Math.round(avg * 100)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, avg * 100)}%`,
              background: `linear-gradient(90deg, ${department.color}, #34d399)`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Stat label="On track" value={ok} tone="ok" />
        <Stat label="At risk" value={risk} tone="warn" />
        <Stat label="Off track" value={off} tone="bad" />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "bad";
}) {
  const color = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad";
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] py-2">
      <div className={cx("font-display text-lg font-semibold", color)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}
