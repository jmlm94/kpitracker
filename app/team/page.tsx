"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import {
  classifyStatus,
  pickProgressValue,
  progressRatio,
  statusBg,
} from "@/lib/format";

export default function TeamPage() {
  const { state, ready } = useStore();
  if (!ready) return null;

  return (
    <div>
      <div className="bracket">03 — Crew</div>
      <h1 className="section-title mt-1">Team</h1>
      <p className="mt-2 text-sm text-white/50">
        Every KPI owner across Carbinox and their current pacing this month.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.team.map((m) => {
          const dept = state.departments.find((d) => d.id === m.departmentId);
          const targets = state.targets.filter((t) => t.ownerId === m.id);
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
            <Link
              key={m.id}
              href={`/team/${m.id}`}
              className="card card-hover flex items-center gap-4 p-4"
            >
              <Avatar name={m.name} color={dept?.color} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-white">{m.name}</div>
                <div className="truncate text-xs text-white/50">
                  {m.position} · {dept?.name}
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, avg * 100)}%`,
                      background: dept?.color || "#ff6a3d",
                    }}
                  />
                </div>
              </div>
              <span className={`chip shrink-0 ${statusBg(status)}`}>
                {Math.round(avg * 100)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
