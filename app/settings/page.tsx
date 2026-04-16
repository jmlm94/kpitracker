"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { cx } from "@/lib/format";
import { memberDepartmentIds } from "@/lib/hierarchy";
import { presetsForPosition, type KPIPreset } from "@/lib/presets";
import type {
  Department,
  KPI,
  Provider,
  Target,
  Unit,
} from "@/lib/types";
import {
  Check,
  ChevronDown,
  ChevronRight,
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
        Click on any team member to expand and edit their KPIs. For each KPI
        you set: <b className="text-white">Name · Target · Source</b>. Press{" "}
        <b className="text-white">Save changes</b> when done.
      </p>

      <div className="mt-6 card flex items-end gap-3 p-4">
        <div className="flex-1 max-w-sm">
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

      <div className="mt-6 space-y-2">
        {filtered.map((person) => (
          <PersonRow key={person.id} personId={person.id} />
        ))}
      </div>
    </div>
  );
}

type DraftKPI = {
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

function PersonRow({ personId }: { personId: string }) {
  const {
    state,
    upsertKPI,
    removeKPI,
    upsertTarget,
    removeTarget,
  } = useStore();
  const person = state.team.find((m) => m.id === personId);
  const [open, setOpen] = useState(false);

  if (!person) return null;

  const depts = memberDepartmentIds(person)
    .map((id) => state.departments.find((d) => d.id === id))
    .filter((d): d is Department => !!d);
  const primaryDept = state.departments.find((d) => d.id === person.departmentId);
  const accent = primaryDept?.color || "#f8c808";
  const kpiCount = state.targets.filter((t) => t.ownerId === person.id).length;

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className={cx(
          "flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.02]",
          open ? "border-b border-white/5" : "",
        )}
      >
        {open ? (
          <ChevronDown size={14} className="text-carbinox" />
        ) : (
          <ChevronRight size={14} className="text-white/40" />
        )}
        <Avatar name={person.name} size={36} color={accent} />
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
            {person.name}
          </div>
          <div className="text-[11px] text-white/50">{person.position}</div>
        </div>
        <div className="hidden flex-wrap gap-1 md:flex">
          {depts.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] font-heading font-semibold uppercase tracking-brand"
              style={{
                borderColor: `${d.color}60`,
                borderStyle: d.id === person.departmentId ? "solid" : "dashed",
              }}
            >
              <span className="h-1 w-1" style={{ background: d.color }} />
              {d.name}
            </span>
          ))}
        </div>
        <span className="font-numeric text-[11px] text-white/50">
          {kpiCount} KPI{kpiCount === 1 ? "" : "s"}
        </span>
      </button>

      {open && (
        <PersonKpiEditor
          personId={personId}
          accent={accent}
        />
      )}
    </div>
  );
}

function PersonKpiEditor({
  personId,
  accent,
}: {
  personId: string;
  accent: string;
}) {
  const {
    state,
    upsertKPI,
    removeKPI,
    upsertTarget,
    removeTarget,
  } = useStore();
  const person = state.team.find((m) => m.id === personId);

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
  const [flash, setFlash] = useState(false);

  if (!person) return null;

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const presets = presetsForPosition(person.position);
  const visibleRows = draft.filter((r) => !r.removed);

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
    draft
      .filter((r) => r.removed && r.targetId)
      .forEach((r) => {
        if (r.targetId) removeTarget(r.targetId);
        if (r.kpiId) {
          const others = state.targets.filter(
            (t) => t.kpiId === r.kpiId && t.id !== r.targetId,
          );
          if (others.length === 0) removeKPI(r.kpiId);
        }
      });
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

  return (
    <div className="p-4">
      {/* KPI rows */}
      <div className="space-y-2">
        {visibleRows.length === 0 && (
          <div className="border border-dashed border-white/10 px-3 py-3 text-[12px] text-white/40">
            No KPIs. Use a preset below or add a custom one.
          </div>
        )}
        {draft.map((row, idx) =>
          row.removed ? null : (
            <div
              key={idx}
              className="grid grid-cols-12 items-center gap-1.5 border border-white/10 bg-jet-900 p-2"
            >
              <input
                value={row.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                className="col-span-5 bg-transparent font-heading text-[12px] font-semibold uppercase tracking-brand text-white outline-none"
                placeholder="KPI name"
              />
              <input
                type="number"
                step="any"
                value={row.target}
                onChange={(e) => update(idx, { target: Number(e.target.value) })}
                className="input col-span-2 px-1.5 py-1 text-right font-numeric text-[12px]"
                placeholder="Target"
              />
              <select
                value={row.provider}
                onChange={(e) => update(idx, { provider: e.target.value as Provider })}
                className="input col-span-3 px-1.5 py-1 text-[11px]"
                title="Source"
              >
                {providerOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <select
                value={row.unit}
                onChange={(e) => update(idx, { unit: e.target.value as Unit })}
                className="input col-span-1 px-1 py-1 text-[10px]"
              >
                {unitOptions.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeRow(idx)}
                className="col-span-1 justify-self-end text-white/30 hover:text-bad"
                title="Remove KPI"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ),
        )}
      </div>

      {/* Add controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {presets.length > 0 && (
          <select
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
        {flash && (
          <span className="chip border-ok/60 bg-ok/10 text-ok">
            <Check size={10} /> Saved
          </span>
        )}
        {dirty && (
          <span className="chip border-carbinox/60 bg-carbinox/10 text-carbinox">
            Unsaved
          </span>
        )}
        <button
          onClick={() => setDraft(initial)}
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
