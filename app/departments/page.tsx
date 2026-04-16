"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import {
  childDepartments,
  membersOfDepartment,
  targetsForDepartment,
} from "@/lib/hierarchy";

export default function DepartmentsPage() {
  const { state, ready } = useStore();
  if (!ready) return null;
  const mains = state.departments.filter((d) => d.kind === "main");
  const subs = state.departments.filter((d) => d.kind === "sub");

  return (
    <div>
      <div className="bracket">02 — The Machine</div>
      <h1 className="section-title mt-1">Departments</h1>
      <p className="mt-2 text-sm text-white/50">
        Who's in each team and how many KPIs they own. Main departments group
        their sub-departments below.
      </p>

      {/* Main departments */}
      <section className="mt-8">
        <div className="bracket">Main Departments ({mains.length})</div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mains.map((d) => (
            <DeptInfoCard key={d.id} id={d.id} />
          ))}
        </div>
      </section>

      {/* Sub-departments grouped by parent */}
      <section className="mt-12">
        <div className="bracket">Sub-Departments ({subs.length})</div>
        <div className="mt-3 space-y-8">
          {mains.map((main) => {
            const children = childDepartments(state, main.id);
            if (children.length === 0) return null;
            return (
              <div key={main.id}>
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3"
                    style={{ background: main.color }}
                  />
                  <span className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white/70">
                    {main.name}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {children.map((s) => (
                    <DeptInfoCard key={s.id} id={s.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function DeptInfoCard({ id }: { id: string }) {
  const { state } = useStore();
  const dept = state.departments.find((d) => d.id === id);
  if (!dept) return null;

  const members = membersOfDepartment(state, id);
  const targets = targetsForDepartment(state, id);
  const head = state.team.find((m) => m.id === dept.headId);
  const others = members.filter((m) => m.id !== head?.id);

  return (
    <Link
      href={`/departments/${id}`}
      className="card card-hover relative block p-5"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: dept.color }}
      />
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 shrink-0 border border-white/10"
          style={{ background: dept.color }}
        />
        <div className="min-w-0 flex-1">
          <div className="bracket">
            {dept.kind === "main" ? "Main" : "Sub-department"}
          </div>
          <h3 className="mt-1 font-display text-2xl font-extrabold uppercase leading-none tracking-brand text-white">
            {dept.name}
          </h3>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="People" value={members.length} />
        <Stat label="KPIs" value={targets.length} />
      </div>

      {/* Head */}
      <div className="mt-4 border-t border-white/5 pt-3">
        <div className="bracket">Head</div>
        {head ? (
          <div className="mt-1.5 flex items-center gap-2.5">
            <Avatar name={head.name} size={28} color={dept.color} />
            <div className="leading-tight">
              <div className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                {head.name}
              </div>
              <div className="text-[11px] text-white/50">{head.position}</div>
            </div>
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-warn">No head assigned</div>
        )}
      </div>

      {/* Other members */}
      {others.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="bracket">Team ({others.length})</div>
          <ul className="mt-1.5 space-y-0.5 text-[12px] text-white/70">
            {others.slice(0, 8).map((m) => (
              <li key={m.id} className="truncate">
                {m.name}
                <span className="ml-1 text-white/40">· {m.position}</span>
              </li>
            ))}
            {others.length > 8 && (
              <li className="text-[11px] text-white/40">
                +{others.length - 8} more…
              </li>
            )}
          </ul>
        </div>
      )}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/5 bg-white/[0.02] p-2 text-center">
      <div className="font-numeric text-xl font-bold text-white">{value}</div>
      <div className="font-heading text-[9px] font-semibold uppercase tracking-brand text-white/45">
        {label}
      </div>
    </div>
  );
}
