"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { cx } from "@/lib/format";
import { presetsForPosition, type KPIPreset } from "@/lib/presets";
import type {
  KPI,
  Provider,
  Target,
  Unit,
} from "@/lib/types";
import {
  Check,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";

const providerOptions: { value: Provider; label: string }[] = [
  { value: "shopify", label: "Shopify" },
  { value: "triplewhale", label: "Triple Whale" },
  { value: "klaviyo", label: "Klaviyo" },
  { value: "postscript", label: "Postscript" },
  { value: "zendesk", label: "Zendesk" },
  { value: "gsheets", label: "Google Sheets" },
  { value: "manual", label: "Manual entry" },
];

const unitOptions: { value: Unit; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency ($)" },
  { value: "percent", label: "Percent (%)" },
  { value: "ratio", label: "Ratio (x)" },
  { value: "duration_s", label: "Duration (s)" },
];

/**
 * Per-person KPI editor. Each card works like a draft — local edits stay on
 * the card until "Save changes" is pressed, which commits them all at once
 * through the store. Dirty cards show an "Unsaved" chip; the Save button is
 * disabled until there's something to save.
 */
export default function SettingsPage() {
  const { state, ready } = useStore();
  const [query, setQuery] = useState("");
  if (!ready) return null;

  const filtered = query
    ? state.team.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.position.toLowerCase().includes(query.toLowerCase()),
      )
    : state.team;

  return (
    <div>
      <div className="bracket">07 — Settings</div>
      <h1 className="section-title mt-1">Settings</h1>
      <p className="mt-2 text-sm text-white/50">
        Edit each team member's KPIs. For every KPI you can set:{" "}
        <b className="text-white">Name · Metric · Target · Source</b>. Press{" "}
        <b className="text-white">Save changes</b> on a card to commit.
      </p>

      <div className="mt-6 card flex items-end gap-3 p-4">
        <div className="flex-1">
          <label className="label">Find a person</label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Simona"
              className="input pl-7 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="font-heading text-[11px] uppercase tracking-brand text-white/50">
          {filtered.length} people
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filtered.map((person) => (
          <PersonKpiEditor key={person.id} personId={person.id} />
        ))}
      </div>
    </div>
  );
}

type DraftKPI = {
  /** Existing ids if editing; blank for new ones (generated at save time) */
  kpiId?: string;
  targetId?: string;
  name: string;
  metricKey: string;
  unit: Unit;
  direction: KPI["direction"];
  provider: Provider;
  window: KPI["window"];
  target: number;
  description?: string;
  removed?: boolean;
};

function PersonKpiEditor({ personId }: { personId: string }) {
  const {
    state,
    upsertKPI,
    removeKPI,
    upsertTarget,
    removeTarget,
  } = useStore();
  const person = state.team.find((m) => m.id === personId);
  const primaryDept = state.departments.find(
    (d) => d.id === person?.departmentId,
  );

  // Derive initial draft from current state
  const initial = useMemo<DraftKPI[]>(() => {
    if (!person) return [];
    const out: DraftKPI[] = [];
    for (const t of state.targets) {
      if (t.ownerId !== person.id) continue;
      const k = state.kpis.find((x) => x.id === t.kpiId);
      if (!k) continue;
      out.push({
        kpiId: k.id,
        targetId: t.id,
        name: k.name,
        metricKey: k.metricKey,
        unit: k.unit,
        direction: k.direction,
        provider: k.provider,
        window: k.window,
        target: t.target,
        description: k.description,
      });
    }
    return out;
  }, [state.kpis, state.targets, person?.id]);

  const [draft, setDraft] = useState<DraftKPI[]>(initial);
  const [revision, setRevision] = useState(0); // used to reset draft

  // When the underlying state changes (e.g. someone else adds a KPI),
  // re-seed the draft but only if we haven't diverged yet.
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  // Reset draft when initial changes and draft hasn't been edited
  if (!dirty && initial.length !== draft.length) {
    // length mismatch after a save or external change → sync
    setDraft(initial);
  }

  if (!person) return null;

  const presets = presetsForPosition(person.position);

  function update(index: number, patch: Partial<DraftKPI>) {
    setDraft((d) => d.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeRow(index: number) {
    setDraft((d) => d.map((r, i) => (i === index ? { ...r, removed: true } : r)));
  }
  function addRow(base?: Partial<DraftKPI>) {
    setDraft((d) => [
      ...d,
      {
        name: base?.name || "New KPI",
        metricKey: base?.metricKey || "custom." + Math.random().toString(36).slice(2, 8),
        unit: base?.unit || "number",
        direction: base?.direction || "higher_is_better",
        provider: base?.provider || "manual",
        window: base?.window || "mtd",
        target: base?.target ?? 100,
        description: base?.description,
      },
    ]);
  }
  function addFromPreset(p: KPIPreset) {
    addRow({
      name: p.name,
      metricKey: p.metricKey,
      unit: p.unit,
      direction: p.direction,
      provider: p.provider,
      window: p.window,
      target: p.target,
      description: p.description,
    });
  }

  function save() {
    if (!person) return;
    // 1. Remove rows that were marked removed (matching real kpi/target ids)
    draft
      .filter((r) => r.removed && r.targetId)
      .forEach((r) => {
        if (r.targetId) removeTarget(r.targetId);
        if (r.kpiId) {
          const otherTargets = state.targets.filter(
            (t) => t.kpiId === r.kpiId && t.id !== r.targetId,
          );
          if (otherTargets.length === 0) removeKPI(r.kpiId);
        }
      });
    // 2. Upsert the remaining rows (create or update)
    draft
      .filter((r) => !r.removed)
      .forEach((r) => {
        const kpiId = r.kpiId || "kpi_" + Math.random().toString(36).slice(2, 8);
        const targetId = r.targetId || "t_" + Math.random().toString(36).slice(2, 8);
        upsertKPI({
          id: kpiId,
          name: r.name,
          description: r.description,
          unit: r.unit,
          direction: r.direction,
          provider: r.provider,
          metricKey: r.metricKey,
          window: r.window,
        });
        upsertTarget({
          id: targetId,
          kpiId,
          ownerId: person.id,
          target: Number(r.target) || 0,
          period: "monthly",
          periodKey: new Date().toISOString().slice(0, 7),
        });
      });
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  }

  function resetDraft() {
    setDraft(initial);
    setRevision((r) => r + 1);
  }

  const [flash, setFlash] = useState(false);
  const accent = primaryDept?.color || "#f8c808";
  const visibleRows = draft.filter((r) => !r.removed);

  return (
    <div className="card relative p-4">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
      />
      <div className="flex items-start gap-3">
        <Avatar name={person.name} size={40} color={accent} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-extrabold uppercase leading-none tracking-brand text-white">
            {person.name}
          </div>
          <div className="mt-1 text-[12px] text-white/55">{person.position}</div>
        </div>
        {dirty && (
          <span className="chip border-carbinox/60 bg-carbinox/10 text-carbinox">
            Unsaved
          </span>
        )}
        {flash && (
          <span className="chip border-ok/60 bg-ok/10 text-ok">
            <Check size={10} /> Saved
          </span>
        )}
      </div>

      {/* KPI rows */}
      <div className="mt-4 space-y-2">
        {visibleRows.length === 0 && (
          <div className="border border-dashed border-white/10 px-3 py-3 text-[12px] text-white/40">
            No KPIs. Add one from the presets below or click "Custom KPI".
          </div>
        )}
        {draft.map((row, idx) =>
          row.removed ? null : (
            <KpiRowEditor
              key={idx}
              row={row}
              onChange={(patch) => update(idx, patch)}
              onRemove={() => removeRow(idx)}
            />
          ),
        )}
      </div>

      {/* Add controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
        {presets.length > 0 && (
          <select
            key={revision}
            defaultValue=""
            onChange={(e) => {
              const idx = Number(e.target.value);
              if (!Number.isFinite(idx) || idx < 0) return;
              addFromPreset(presets[idx]);
              e.currentTarget.value = "";
            }}
            className="input w-auto py-1.5 text-xs"
          >
            <option value="">+ Add suggested KPI…</option>
            {presets.map((p, i) => (
              <option key={p.name + p.metricKey} value={i}>
                {p.name} · target {p.target}
              </option>
            ))}
          </select>
        )}
        <button onClick={() => addRow()} className="btn-ghost">
          <Plus size={12} /> Custom KPI
        </button>
      </div>

      {/* Save / Reset */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
        <button
          onClick={resetDraft}
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
          <Check size={12} /> Save changes
        </button>
      </div>
    </div>
  );
}

function KpiRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: DraftKPI;
  onChange: (patch: Partial<DraftKPI>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-1.5 border border-white/10 bg-jet-900 p-2">
      <input
        value={row.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="col-span-4 bg-transparent font-heading text-[12px] font-semibold uppercase tracking-brand text-white outline-none"
        placeholder="KPI name"
      />
      <input
        value={row.metricKey}
        onChange={(e) => onChange({ metricKey: e.target.value })}
        className="input col-span-3 px-1.5 py-1 font-numeric text-[11px]"
        placeholder="metric.key"
        title="Metric (the exact field name in the data source)"
      />
      <input
        type="number"
        step="any"
        value={row.target}
        onChange={(e) => onChange({ target: Number(e.target.value) })}
        className="input col-span-2 px-1.5 py-1 text-right font-numeric text-[12px]"
        placeholder="Target"
      />
      <select
        value={row.provider}
        onChange={(e) => onChange({ provider: e.target.value as Provider })}
        className="input col-span-2 px-1.5 py-1 text-[11px]"
        title="Source — where to measure it"
      >
        {providerOptions.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <button
        onClick={onRemove}
        className="col-span-1 justify-self-end text-white/30 hover:text-bad"
        title="Remove KPI"
      >
        <Trash2 size={12} />
      </button>
      {/* Second row: unit + direction + window */}
      <div className="col-span-12 mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
        <span className="bracket">Unit</span>
        <select
          value={row.unit}
          onChange={(e) => onChange({ unit: e.target.value as Unit })}
          className="bg-transparent text-white/70 outline-none"
        >
          {unitOptions.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
        <span className="bracket ml-2">Direction</span>
        <select
          value={row.direction}
          onChange={(e) =>
            onChange({ direction: e.target.value as KPI["direction"] })
          }
          className="bg-transparent text-white/70 outline-none"
        >
          <option value="higher_is_better">↑ Higher is better</option>
          <option value="lower_is_better">↓ Lower is better</option>
        </select>
        <span className="bracket ml-2">Window</span>
        <select
          value={row.window}
          onChange={(e) => onChange({ window: e.target.value as KPI["window"] })}
          className="bg-transparent text-white/70 outline-none"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="mtd">Month-to-date</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>
    </div>
  );
}
