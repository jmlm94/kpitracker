"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Search } from "lucide-react";
import {
  classifyStatus,
  formatValueFull,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import { descendantDepartmentIds } from "@/lib/hierarchy";

export default function KPIsPage() {
  const { state, ready } = useStore();
  const [mainFilter, setMainFilter] = useState<string>("");
  const [subFilter, setSubFilter] = useState<string>("");
  const [personQuery, setPersonQuery] = useState<string>("");
  if (!ready) return null;

  const mains = state.departments.filter((d) => d.kind === "main");
  const availableSubs = state.departments.filter(
    (d) => d.kind === "sub" && (!mainFilter || d.parentId === mainFilter),
  );

  // Which departments does the filter resolve to?
  const allowedDeptIds = useMemo(() => {
    if (subFilter) return new Set([subFilter]);
    if (mainFilter) return new Set(descendantDepartmentIds(state, mainFilter));
    return null;
  }, [mainFilter, subFilter, state.departments]);

  const rows = state.targets
    .map((t) => {
      const kpi = state.kpis.find((k) => k.id === t.kpiId);
      if (!kpi) return null;
      const owner = state.team.find((m) => m.id === t.ownerId);
      if (!owner) return null;
      const dept = state.departments.find((d) => d.id === owner.departmentId);
      return { target: t, kpi, owner, dept };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .filter((r) => {
      // Department filter: either the owner's primary dept or any of their
      // additional memberships should be in the allowed set.
      if (allowedDeptIds) {
        const memberDepts = [
          r.owner.departmentId,
          ...(r.owner.additionalDepartmentIds || []),
        ];
        if (!memberDepts.some((id) => allowedDeptIds.has(id))) return false;
      }
      if (personQuery) {
        const q = personQuery.toLowerCase();
        if (
          !r.owner.name.toLowerCase().includes(q) &&
          !r.kpi.name.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="bracket">04 — Scoreboard</div>
          <h1 className="section-title mt-1">KPIs & Targets</h1>
          <p className="mt-2 text-sm text-white/50">
            Every tracked metric. Edit per-person KPIs from{" "}
            <Link href="/settings" className="text-carbinox hover:underline">
              Settings
            </Link>
            .
          </p>
        </div>
        <Link href="/settings" className="btn-primary">
          <Plus size={14} /> Edit KPIs
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[160px]">
          <label className="label">Department</label>
          <select
            className="input py-1.5 text-xs"
            value={mainFilter}
            onChange={(e) => {
              setMainFilter(e.target.value);
              setSubFilter("");
            }}
          >
            <option value="">All departments</option>
            {mains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="label">Sub-department</label>
          <select
            className="input py-1.5 text-xs"
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
            disabled={availableSubs.length === 0}
          >
            <option value="">All sub-departments</option>
            {availableSubs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search person or KPI</label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              className="input pl-7 py-1.5 text-xs"
              placeholder="e.g. Simona, Meta ROAS, Doralee"
              value={personQuery}
              onChange={(e) => setPersonQuery(e.target.value)}
            />
          </div>
        </div>
        {(mainFilter || subFilter || personQuery) && (
          <button
            onClick={() => {
              setMainFilter("");
              setSubFilter("");
              setPersonQuery("");
            }}
            className="btn-ghost py-1.5"
          >
            Clear
          </button>
        )}
        <div className="ml-auto font-heading text-[11px] uppercase tracking-brand text-white/50">
          {rows.length} KPI{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3">KPI</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(({ target: t, kpi, owner, dept }) => {
              const p = state.progress[t.id];
              const actual = p ? pickProgressValue(kpi, p) : 0;
              const ratio = p ? progressRatio(kpi, t, actual) : 0;
              const status = classifyStatus(ratio);
              return (
                <tr key={t.id} id={t.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{kpi.name}</div>
                    <div className="text-[11px] text-white/45">
                      {kpi.metricKey} · {kpi.window}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {dept ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5"
                          style={{ background: dept.color }}
                        />
                        <span className="text-white/85">{dept.name}</span>
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/team/${owner.id}`}
                      className="text-white hover:underline"
                    >
                      {owner.name}
                    </Link>
                    <div className="text-[11px] text-white/45">{owner.position}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-numeric text-white">
                    {formatValueFull(t.target, kpi.unit)}
                  </td>
                  <td className="px-4 py-3 text-right font-numeric text-white">
                    {p ? formatValueFull(actual, kpi.unit) : "—"}
                    {p && (
                      <div className="text-[11px] text-white/40">
                        {Math.round(ratio * 100)}%
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${statusBg(status)}`}>
                      <span className="h-1.5 w-1.5 bg-current" />
                      {statusLabel(status)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                  No KPIs match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
