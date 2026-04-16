"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Search } from "lucide-react";
import {
  classifyStatus,
  formatValueFull,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { membersOfDepartment } from "@/lib/hierarchy";

export default function KPIsPage() {
  const { state, ready } = useStore();
  const [query, setQuery] = useState("");
  if (!ready) return null;

  const mains = state.departments.filter((d) => d.kind === "main");

  // Build a per-department section structure
  type Row = {
    target: (typeof state.targets)[0];
    kpi: (typeof state.kpis)[0];
    owner: (typeof state.team)[0];
  };

  type Section = {
    dept: (typeof state.departments)[0];
    rows: Row[];
    children: Section[];
  };

  const sections = useMemo(() => {
    const q = query.toLowerCase();
    const result: Section[] = [];

    for (const main of mains) {
      const subs = state.departments.filter(
        (d) => d.kind === "sub" && d.parentId === main.id,
      );

      function buildSection(dept: (typeof state.departments)[0]): Section {
        const members = membersOfDepartment(state, dept.id);
        const memberIds = new Set(members.map((m) => m.id));
        const rows: Row[] = [];

        for (const t of state.targets) {
          if (!memberIds.has(t.ownerId)) continue;
          const kpi = state.kpis.find((k) => k.id === t.kpiId);
          const owner = state.team.find((m) => m.id === t.ownerId);
          if (!kpi || !owner) continue;
          if (
            q &&
            !kpi.name.toLowerCase().includes(q) &&
            !owner.name.toLowerCase().includes(q)
          ) {
            continue;
          }
          rows.push({ target: t, kpi, owner });
        }

        return { dept, rows, children: [] };
      }

      const mainSection = buildSection(main);
      const childSections = subs
        .map(buildSection)
        .filter((s) => s.rows.length > 0);
      mainSection.children = childSections;

      if (mainSection.rows.length > 0 || childSections.length > 0) {
        result.push(mainSection);
      }
    }
    return result;
  }, [state, query, mains]);

  const totalRows = sections.reduce(
    (n, s) =>
      n + s.rows.length + s.children.reduce((m, c) => m + c.rows.length, 0),
    0,
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="bracket">04 — Scoreboard</div>
          <h1 className="section-title mt-1">KPIs & Targets</h1>
          <p className="mt-2 text-sm text-white/50">
            Organized by department. Edit KPIs from{" "}
            <Link href="/settings" className="text-carbinox hover:underline">
              Settings
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6 card flex items-end gap-3 p-4">
        <div className="flex-1 max-w-sm">
          <label className="label">Search person or KPI</label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Simona, Meta ROAS"
              className="input pl-7 py-1.5 text-xs"
            />
          </div>
        </div>
        {query && (
          <button onClick={() => setQuery("")} className="btn-ghost py-1.5">
            Clear
          </button>
        )}
        <div className="ml-auto font-heading text-[11px] uppercase tracking-brand text-white/50">
          {totalRows} KPI{totalRows === 1 ? "" : "s"}
        </div>
      </div>

      {/* Department-grouped sections */}
      <div className="mt-6 space-y-8">
        {sections.map((section) => (
          <DeptKPISection key={section.dept.id} section={section} />
        ))}
        {sections.length === 0 && (
          <div className="card p-8 text-center text-white/40">
            No KPIs match the current search.
          </div>
        )}
      </div>
    </div>
  );
}

function DeptKPISection({
  section,
}: {
  section: {
    dept: import("@/lib/types").Department;
    rows: {
      target: import("@/lib/types").Target;
      kpi: import("@/lib/types").KPI;
      owner: import("@/lib/types").TeamMember;
    }[];
    children: typeof section extends never ? never : any[];
  };
}) {
  const { state } = useStore();
  const { dept, rows, children } = section;

  return (
    <section>
      {/* Department header */}
      <div className="mb-3 flex items-center gap-3 border-b border-white/5 pb-2">
        <div className="h-3 w-3" style={{ background: dept.color }} />
        <Link
          href={`/departments/${dept.id}`}
          className="font-display text-2xl font-extrabold uppercase tracking-brand text-white hover:text-carbinox"
        >
          {dept.name}
        </Link>
        <span className="chip border-white/10 text-white/45">
          {dept.kind === "main" ? "Main" : "Sub"}
        </span>
      </div>

      {/* Direct KPIs for this department */}
      {rows.length > 0 && <KPITable rows={rows} state={state} />}

      {/* Sub-department sections */}
      {children.map((child: typeof section) => (
        <div key={child.dept.id} className="mt-5 ml-6">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-2 w-2"
              style={{ background: child.dept.color }}
            />
            <Link
              href={`/departments/${child.dept.id}`}
              className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white hover:text-carbinox"
            >
              {child.dept.name}
            </Link>
          </div>
          <KPITable rows={child.rows} state={state} />
        </div>
      ))}
    </section>
  );
}

function KPITable({
  rows,
  state,
}: {
  rows: {
    target: import("@/lib/types").Target;
    kpi: import("@/lib/types").KPI;
    owner: import("@/lib/types").TeamMember;
  }[];
  state: import("@/lib/types").AppState;
}) {
  return (
    <div className="overflow-hidden border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-4 py-2">KPI</th>
            <th className="px-4 py-2">Owner</th>
            <th className="px-4 py-2 text-right">Target</th>
            <th className="px-4 py-2 text-right">Actual</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map(({ target: t, kpi, owner }) => {
            const p = state.progress[t.id];
            const actual = p ? pickProgressValue(kpi, p) : 0;
            const ratio = p ? progressRatio(kpi, t, actual) : 0;
            const status = classifyStatus(ratio);
            return (
              <tr key={t.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-2.5">
                  <div className="font-medium text-white">{kpi.name}</div>
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/team/${owner.id}`}
                    className="text-white hover:underline"
                  >
                    {owner.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-numeric text-white">
                  {formatValueFull(t.target, kpi.unit)}
                </td>
                <td className="px-4 py-2.5 text-right font-numeric text-white">
                  {p ? formatValueFull(actual, kpi.unit) : "—"}
                  {p && (
                    <div className="text-[11px] text-white/40">
                      {Math.round(ratio * 100)}%
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`chip ${statusBg(status)}`}>
                    <span className="h-1.5 w-1.5 bg-current" />
                    {statusLabel(status)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
