"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import {
  classifyStatus,
  formatValueFull,
  pickProgressValue,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";

export default function KPIsPage() {
  const { state, ready, removeKPI, removeTarget } = useStore();
  if (!ready) return null;

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="bracket">04 — Scoreboard</div>
          <h1 className="section-title mt-1">KPIs & Targets</h1>
          <p className="mt-2 text-sm text-white/50">
            Every tracked metric. To add a new one, use the onboarding wizard.
          </p>
        </div>
        <Link href="/onboarding" className="btn-primary">
          <Plus size={14} /> Add KPI
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-3">KPI</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Actual</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {state.targets.map((t) => {
              const kpi = state.kpis.find((k) => k.id === t.kpiId);
              if (!kpi) return null;
              const p = state.progress[t.id];
              const actual = p ? pickProgressValue(kpi, p) : 0;
              const ratio = p ? progressRatio(kpi, t, actual) : 0;
              const status = classifyStatus(ratio);
              const owner = state.team.find((m) => m.id === t.ownerId);
              const dept = state.departments.find((d) => d.id === owner?.departmentId);
              return (
                <tr key={t.id} id={t.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{kpi.name}</div>
                    <div className="text-xs text-white/50">
                      {kpi.metricKey} · {kpi.window}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/70">{kpi.provider}</td>
                  <td className="px-4 py-3">
                    {owner ? (
                      <Link
                        href={`/team/${owner.id}`}
                        className="text-white hover:underline"
                      >
                        {owner.name}
                      </Link>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                    {dept && (
                      <div className="text-xs text-white/50">{dept.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {formatValueFull(t.target, kpi.unit)}
                    <div className="text-xs text-white/40">
                      {t.period} · {t.periodKey}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {p ? formatValueFull(actual, kpi.unit) : "—"}
                    {p && (
                      <div className="text-xs text-white/40">
                        {Math.round(ratio * 100)}% of goal
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${statusBg(status)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {statusLabel(status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeTarget(t.id)}
                      className="btn-ghost"
                      title="Remove target"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Orphan KPIs with no targets */}
      {state.kpis.some((k) => !state.targets.some((t) => t.kpiId === k.id)) && (
        <div className="mt-8">
          <h2 className="section-title">KPIs with no target</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {state.kpis
              .filter((k) => !state.targets.some((t) => t.kpiId === k.id))
              .map((k) => (
                <div key={k.id} className="card flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-white">{k.name}</div>
                    <div className="text-xs text-white/50">
                      {k.provider} · {k.metricKey}
                    </div>
                  </div>
                  <button onClick={() => removeKPI(k.id)} className="btn-ghost">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
