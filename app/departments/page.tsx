"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { DepartmentCard } from "@/components/DepartmentCard";
import { Avatar } from "@/components/Avatar";
import { rootDepartments, childDepartments, aggregateDepartmentStats } from "@/lib/hierarchy";
import { classifyStatus, statusBg, statusLabel } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export default function DepartmentsPage() {
  const { state, ready } = useStore();
  if (!ready) return null;
  const roots = rootDepartments(state);

  return (
    <div>
      <div className="bracket">02 — The Machine</div>
      <h1 className="section-title mt-1">Departments</h1>
      <p className="mt-2 text-sm text-white/50">
        Every team at Carbinox, organized as a hierarchy. Parent departments
        aggregate the stats of their sub-departments.
      </p>

      <div className="mt-8 space-y-10">
        {roots.map((root) => {
          const subs = childDepartments(state, root.id);
          return (
            <section key={root.id}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3"
                  style={{ background: root.color }}
                />
                <span className="bracket">{root.name}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DepartmentCard department={root} state={state} />
                {subs.map((s) => (
                  <DepartmentCard key={s.id} department={s} state={state} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Compact hierarchy tree — a quick org map */}
      <section className="mt-12">
        <h2 className="section-title">Hierarchy</h2>
        <div className="mt-4 card p-4">
          <ul className="space-y-2">
            {roots.map((root) => (
              <TreeRow key={root.id} department={root} state={state} depth={0} />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function TreeRow({
  department,
  state,
  depth,
}: {
  department: import("@/lib/types").Department;
  state: import("@/lib/types").AppState;
  depth: number;
}) {
  const subs = childDepartments(state, department.id);
  const head = state.team.find((m) => m.id === department.headId);
  const stats = aggregateDepartmentStats(state, department.id);
  const status = classifyStatus(stats.avgRatio);

  return (
    <>
      <li>
        <Link
          href={`/departments/${department.id}`}
          className="flex items-center gap-3 border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/[0.02]"
          style={{ paddingLeft: `${depth * 18 + 8}px` }}
        >
          {depth > 0 && <ChevronRight size={12} className="text-white/30" />}
          <span
            className="inline-block h-2.5 w-2.5"
            style={{ background: department.color }}
          />
          <span className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
            {department.name}
          </span>
          {head ? (
            <span className="ml-3 flex items-center gap-2 text-xs text-white/60">
              <Avatar name={head.name} size={18} color={department.color} />
              {head.name}
            </span>
          ) : (
            <span className="ml-3 text-xs text-white/30">No head assigned</span>
          )}
          <span className={`chip ml-auto ${statusBg(status)}`}>
            {statusLabel(status)} · {Math.round(stats.avgRatio * 100)}%
          </span>
        </Link>
      </li>
      {subs.map((s) => (
        <TreeRow key={s.id} department={s} state={state} depth={depth + 1} />
      ))}
    </>
  );
}
