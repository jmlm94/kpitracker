"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import {
  classifyStatus,
  cx,
  pickProgressValue,
  progressRatio,
  statusBg,
} from "@/lib/format";
import { childDepartments, membersOfDepartment } from "@/lib/hierarchy";

export default function TeamPage() {
  const { state, ready } = useStore();
  if (!ready) return null;

  const mains = state.departments.filter((d) => d.kind === "main");

  return (
    <div>
      <div className="bracket">03 — Crew</div>
      <h1 className="section-title mt-1">Team</h1>
      <p className="mt-2 text-sm text-white/50">
        Every team member, organized by department. Click any card for their
        full KPI profile.
      </p>

      <div className="mt-8 space-y-10">
        {mains.map((main) => {
          const subs = childDepartments(state, main.id);
          const directMembers = state.team.filter(
            (t) => t.departmentId === main.id,
          );
          return (
            <section key={main.id}>
              {/* Main department header */}
              <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-2">
                <div className="h-3 w-3" style={{ background: main.color }} />
                <h2 className="font-display text-2xl font-extrabold uppercase tracking-brand text-white">
                  {main.name}
                </h2>
                <span className="font-numeric text-[11px] uppercase tracking-brand text-white/45">
                  {membersOfDepartment(state, main.id).length} people
                </span>
              </div>

              {/* Direct reports of the Main */}
              {directMembers.length > 0 && (
                <div className="mb-5">
                  <div className="bracket">{main.name} · direct team</div>
                  <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {directMembers.map((m) => (
                      <TeamCard key={m.id} id={m.id} deptColor={main.color} isHead={m.id === main.headId} />
                    ))}
                  </div>
                </div>
              )}

              {/* Each sub-department gets its own mini-section */}
              {subs.map((sub) => {
                const subMembers = state.team.filter(
                  (t) => t.departmentId === sub.id,
                );
                if (subMembers.length === 0) return null;
                return (
                  <div key={sub.id} className="mb-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-2 w-2"
                        style={{ background: sub.color }}
                      />
                      <span className="font-heading text-[11px] font-semibold uppercase tracking-brand text-white/65">
                        {sub.name}
                      </span>
                      <span className="font-numeric text-[10px] uppercase tracking-brand text-white/40">
                        {subMembers.length} people
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {subMembers.map((m) => (
                        <TeamCard key={m.id} id={m.id} deptColor={sub.color} isHead={m.id === sub.headId} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TeamCard({ id, deptColor, isHead }: { id: string; deptColor?: string; isHead?: boolean }) {
  const { state } = useStore();
  const m = state.team.find((t) => t.id === id);
  if (!m) return null;

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
      href={`/team/${m.id}`}
      className={cx(
        "card card-hover flex items-center gap-3 p-3",
        isHead ? "border-carbinox/40" : "",
      )}
    >
      <Avatar name={m.name} color={deptColor} size={42} avatarUrl={m.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
            {m.name}
          </span>
          {isHead && (
            <span className="chip border-carbinox/40 bg-carbinox/10 text-carbinox px-1 py-0 text-[9px]">
              Head
            </span>
          )}
        </div>
        <div className="truncate text-[11px] text-white/50">{m.position}</div>
        <div className="mt-1 font-numeric text-[10px] uppercase tracking-brand text-white/40">
          {targets.length} KPI{targets.length === 1 ? "" : "s"}
        </div>
      </div>
      {targets.length > 0 && (
        <span className={`chip shrink-0 ${statusBg(status)}`}>
          {Math.round(avg * 100)}%
        </span>
      )}
    </Link>
  );
}
