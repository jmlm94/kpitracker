"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { cx, formatValueFull } from "@/lib/format";
import type { MonthlySubmission, TeamMember } from "@/lib/types";

function currentPeriodKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftPeriod(periodKey: string, delta: number): string {
  const [y, m] = periodKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/**
 * Monthly self-report form. Collapsed by default — clicking the header
 * opens an inline editor showing every KPI the person owns, with a number
 * input for their actual reported value plus an optional notes field.
 *
 * One submission per (owner, periodKey). Submitting again replaces the
 * previous one for the same month.
 */
export function MonthlyReportForm({ member }: { member: TeamMember }) {
  const { state, upsertSubmission } = useStore();
  const [open, setOpen] = useState(false);
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());

  const targets = state.targets.filter((t) => t.ownerId === member.id);

  const existing = useMemo(
    () =>
      (state.submissions || []).find(
        (s) => s.ownerId === member.id && s.periodKey === periodKey,
      ),
    [state.submissions, member.id, periodKey],
  );

  // Build an initial draft from the existing submission, or zeros
  const initial = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const t of targets) out[t.id] = existing?.values[t.id] ?? 0;
    return out;
  }, [targets, existing]);

  const [draft, setDraft] = useState<Record<string, number>>(initial);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [flash, setFlash] = useState(false);

  // Re-seed draft when period or existing changes
  if (
    Object.keys(draft).length !== Object.keys(initial).length ||
    Object.keys(initial).some((k) => !(k in draft))
  ) {
    setDraft(initial);
  }

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    notes !== (existing?.notes || "");

  function update(targetId: string, value: number) {
    setDraft((d) => ({ ...d, [targetId]: value }));
  }

  function save() {
    const submission: MonthlySubmission = {
      id: existing?.id || `sub_${member.id}_${periodKey}_${Date.now().toString(36)}`,
      ownerId: member.id,
      periodKey,
      submittedAt: new Date().toISOString(),
      values: draft,
      notes: notes.trim() || undefined,
    };
    upsertSubmission(submission);
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  }

  if (targets.length === 0) return null;

  return (
    <div className="card mt-4 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.02]"
      >
        {open ? (
          <ChevronDown size={14} className="text-carbinox" />
        ) : (
          <ChevronRight size={14} className="text-white/40" />
        )}
        <div className="flex h-9 w-9 items-center justify-center bg-carbinox/15 text-carbinox">
          <ClipboardCheck size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
            Monthly Report
          </div>
          <div className="text-[11px] text-white/55">
            Submit your numbers for {periodLabel(periodKey)} ·{" "}
            {targets.length} KPI{targets.length === 1 ? "" : "s"}
            {existing && (
              <>
                {" · "}
                <span className="text-ok">
                  Submitted {new Date(existing.submittedAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>
        {existing && (
          <span className="chip border-ok/60 bg-ok/10 text-ok">
            <Check size={10} /> Submitted
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-white/5 p-4">
          {/* Period switcher */}
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setPeriodKey((k) => shiftPeriod(k, -1))}
              className="btn-ghost py-1 text-xs"
            >
              ← Previous
            </button>
            <div className="flex-1 text-center font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
              {periodLabel(periodKey)}
            </div>
            <button
              onClick={() => setPeriodKey((k) => shiftPeriod(k, +1))}
              disabled={periodKey >= currentPeriodKey()}
              className="btn-ghost py-1 text-xs disabled:opacity-40"
            >
              Next →
            </button>
            {periodKey !== currentPeriodKey() && (
              <button
                onClick={() => setPeriodKey(currentPeriodKey())}
                className="btn-ghost py-1 text-xs"
              >
                This month
              </button>
            )}
          </div>

          {/* KPI rows */}
          <div className="space-y-1.5">
            {targets.map((t) => {
              const kpi = state.kpis.find((k) => k.id === t.kpiId);
              if (!kpi) return null;
              const value = draft[t.id] ?? 0;
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-12 items-center gap-2 border border-white/10 bg-jet-900 p-2"
                >
                  <div className="col-span-7 min-w-0">
                    <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                      {kpi.name}
                    </div>
                    <div className="truncate text-[10px] text-white/45">
                      Target: {formatValueFull(t.target, kpi.unit)}
                      {kpi.direction === "lower_is_better" ? " · ↓ lower is better" : " · ↑ higher is better"}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={value}
                    onChange={(e) => update(t.id, Number(e.target.value))}
                    className="input col-span-3 px-1.5 py-1 text-right font-numeric text-[12px]"
                    placeholder="0"
                  />
                  <div className="col-span-2 text-right text-[10px] text-white/45">
                    {(() => {
                      if (kpi.unit === "currency") return "USD";
                      if (kpi.unit === "percent") return "%";
                      if (kpi.unit === "ratio") return "x";
                      if (kpi.unit === "duration_s") return "sec";
                      return "#";
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div className="mt-3">
            <div className="bracket">Notes (optional)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Context, blockers, wins, asks for next month…"
              className="input mt-1.5 w-full resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
            {flash && (
              <span className="chip border-ok/60 bg-ok/10 text-ok">
                <Check size={10} /> Saved
              </span>
            )}
            {dirty && !flash && (
              <span className="chip border-carbinox/60 bg-carbinox/10 text-carbinox">
                Unsaved
              </span>
            )}
            <button
              onClick={() => {
                setDraft(initial);
                setNotes(existing?.notes || "");
              }}
              disabled={!dirty}
              className="btn-ghost disabled:opacity-40"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={save}
              disabled={!dirty}
              className="btn-primary disabled:opacity-40"
            >
              <Check size={12} />
              {existing ? "Update report" : "Submit report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
