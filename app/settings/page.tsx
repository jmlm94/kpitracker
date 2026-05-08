"use client";

import { useMemo, useRef, useState } from "react";
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
  Download,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
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
  const [tab, setTab] = useState<"people" | "library" | "pins">("people");
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
      <div className="bracket">06 — Settings</div>
      <h1 className="section-title mt-1">Settings</h1>
      <p className="mt-2 text-sm text-white/50">
        Manage KPIs per person, edit targets in bulk, and set PINs for self-service login.
      </p>

      {/* Tabs */}
      <div className="mt-6 inline-flex border border-white/10 bg-jet-900 p-0.5">
        {([
          { key: "people", label: "Per Person" },
          { key: "library", label: "KPI Library" },
          { key: "pins", label: "PINs" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              "px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-brand transition",
              tab === t.key
                ? "bg-carbinox text-jet-950"
                : "text-white/60 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "people" && (
        <>
          <div className="mt-4 card flex items-end gap-3 p-4">
            <div className="flex-1 max-w-sm">
              <label className="label">Find a person</label>
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
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

          <div className="mt-4 space-y-2">
            {filtered.map((person) => (
              <PersonRow key={person.id} personId={person.id} />
            ))}
          </div>
        </>
      )}

      {tab === "library" && <KpiLibrary />}
      {tab === "pins" && <PinManager />}

      {/* Danger zone — wipe local state */}
      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const { state, ready, reset, setState } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const data = {
      __version: 1,
      __exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `carbinox-kpi-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        const restoreState = parsed.state || parsed; // accept raw state too
        if (!restoreState.departments || !restoreState.team) {
          alert("That file doesn't look like a valid Carbinox backup.");
          return;
        }
        const ok = confirm(
          `Import this backup?\n\nIt contains:\n• ${restoreState.team?.length || 0} team members\n• ${restoreState.departments?.length || 0} departments\n• ${restoreState.kpis?.length || 0} KPIs\n• ${restoreState.submissions?.length || 0} monthly submissions\n\nThis REPLACES your current data in this browser.`,
        );
        if (!ok) return;
        setState(() => restoreState);
        alert("Backup imported successfully.");
      } catch (err: any) {
        alert(`Couldn't read that file: ${err?.message || "invalid JSON"}`);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function confirmReset() {
    const ok = confirm(
      "Reset to defaults?\n\nThis wipes ALL data in your browser:\n• Every KPI value you've entered\n• Every monthly submission\n• Profile picture uploads\n• PINs you've set\n• Department/team customizations made via the UI\n\nThe seed (people, departments, KPIs, targets) reloads fresh with all values at zero.\n\nThis only affects YOUR browser — other team members on other devices keep their data.\n\nProceed?",
    );
    if (!ok) return;
    try {
      window.localStorage.removeItem("carbinox-kpi-tracker:v1");
      window.localStorage.removeItem("carbinox-kpi-tracker:active_member");
      Object.keys(window.localStorage).forEach((k) => {
        if (k.startsWith("carbinox-kpi-draft:")) {
          window.localStorage.removeItem(k);
        }
      });
    } catch {}
    reset();
    window.location.reload();
  }

  return (
    <>
      <section className="mt-12 card border-carbinox/30 bg-carbinox/5 p-5">
        <div className="bracket text-carbinox">Backup & Restore</div>
        <h2 className="mt-1 font-display text-xl font-extrabold uppercase tracking-brand text-white">
          Export / Import Data
        </h2>
        <p className="mt-2 text-sm text-white/65">
          Your data lives in your browser's local storage — different URLs (production, preview, branch) each have their own separate copy. <b className="text-white">Export</b> a JSON backup before any risky change, then <b className="text-white">Import</b> it on the URL you actually use to put everything back exactly as it was.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={exportData} disabled={!ready} className="btn-primary">
            <Download size={13} /> Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost">
            <Upload size={13} /> Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={importData}
            className="hidden"
          />
        </div>
      </section>

      <section className="mt-6 card border-bad/30 bg-bad/5 p-5">
        <div className="bracket text-bad">Danger Zone</div>
        <h2 className="mt-1 font-display text-xl font-extrabold uppercase tracking-brand text-white">
          Reset to defaults
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Wipes your browser's stored state and reloads the latest seed (people,
          departments, KPIs from the spec — all values at zero). Use this if you
          want to start fresh, or if old data is showing up that you no longer
          want. <b className="text-white">Tip:</b> export a backup first so you can restore later.
        </p>
        <button onClick={confirmReset} className="btn-danger mt-4">
          Reset to defaults
        </button>
      </section>
    </>
  );
}

/** Bulk KPI library — group by KPI name, set the target for everyone with that KPI in one click. */
function KpiLibrary() {
  const { state, upsertTarget } = useStore();
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [flash, setFlash] = useState<string | null>(null);

  // Group targets by KPI name (so "Meta ROAS" rolls Simona + Kristaps into one row)
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; unit: Unit; targets: Target[]; targetValue: number; owners: string[] }>();
    for (const t of state.targets) {
      const kpi = state.kpis.find((k) => k.id === t.kpiId);
      if (!kpi) continue;
      const owner = state.team.find((m) => m.id === t.ownerId);
      const group = map.get(kpi.name);
      if (group) {
        group.targets.push(t);
        if (owner) group.owners.push(owner.name);
      } else {
        map.set(kpi.name, {
          name: kpi.name,
          unit: kpi.unit,
          targets: [t],
          targetValue: t.target,
          owners: owner ? [owner.name] : [],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.kpis, state.targets, state.team]);

  function applyAll(name: string, value: number) {
    const group = groups.find((g) => g.name === name);
    if (!group) return;
    for (const t of group.targets) {
      upsertTarget({ ...t, target: value });
    }
    setFlash(name);
    setTimeout(() => setFlash(null), 1500);
    setDrafts((d) => {
      const next = { ...d };
      delete next[name];
      return next;
    });
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-white/55">
        Each row groups every team member that owns this KPI. Set a new target
        and click <b className="text-white">Apply to all</b> — it updates everyone in one click.
      </p>
      <div className="mt-4 overflow-x-auto border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-3 py-2">KPI</th>
              <th className="px-3 py-2">Owners</th>
              <th className="px-3 py-2 text-right">Current target</th>
              <th className="px-3 py-2 text-right">New target</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {groups.map((g) => {
              const allSame = g.targets.every((t) => t.target === g.targets[0].target);
              const draft = drafts[g.name];
              const dirty = draft !== undefined && draft !== g.targetValue;
              return (
                <tr key={g.name} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-white">{g.name}</div>
                    <div className="text-[11px] text-white/40">{g.targets.length} owner{g.targets.length === 1 ? "" : "s"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-white/60">
                    {g.owners.slice(0, 3).join(", ")}
                    {g.owners.length > 3 && ` +${g.owners.length - 3} more`}
                  </td>
                  <td className="px-3 py-2.5 text-right font-numeric text-white">
                    {allSame
                      ? g.targets[0].target
                      : `Mixed (${Math.min(...g.targets.map((t) => t.target))}–${Math.max(...g.targets.map((t) => t.target))})`}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      step="any"
                      value={draft ?? g.targetValue}
                      onChange={(e) => setDrafts((d) => ({ ...d, [g.name]: Number(e.target.value) }))}
                      className="input w-24 text-right font-numeric text-[12px]"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      disabled={!dirty}
                      onClick={() => applyAll(g.name, draft!)}
                      className="btn-primary py-1 disabled:opacity-40"
                    >
                      {flash === g.name ? "Saved" : "Apply to all"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** PIN manager — set/clear a PIN per team member to gate /fill access. */
function PinManager() {
  const { state, upsertTeamMember } = useStore();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function setPin(memberId: string, pin: string) {
    const member = state.team.find((m) => m.id === memberId);
    if (!member) return;
    upsertTeamMember({ ...member, pin: pin || undefined });
    setDrafts((d) => {
      const next = { ...d };
      delete next[memberId];
      return next;
    });
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-white/55">
        Set a 4-6 digit PIN for each team member. They'll be prompted for it when
        they pick their name on the <b className="text-carbinox">Fill KPIs Here</b> page.
        Leave blank to allow open access.
      </p>
      <div className="mt-4 space-y-1.5">
        {state.team.map((m) => {
          const dept = state.departments.find((d) => d.id === m.departmentId);
          const draft = drafts[m.id];
          const current = m.pin || "";
          const dirty = draft !== undefined && draft !== current;
          return (
            <div key={m.id} className="card flex items-center gap-3 p-3">
              <Avatar name={m.name} size={32} color={dept?.color} avatarUrl={m.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                  {m.name}
                </div>
                <div className="truncate text-[11px] text-white/45">{m.position}</div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder={current ? "•••" : "Set PIN"}
                value={draft ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                className="input w-32 text-center font-numeric tracking-widest"
              />
              <button
                onClick={() => setPin(m.id, draft ?? "")}
                disabled={!dirty}
                className="btn-primary py-1 disabled:opacity-40"
              >
                Save
              </button>
              {current && (
                <button
                  onClick={() => upsertTeamMember({ ...m, pin: undefined })}
                  className="btn-ghost py-1"
                  title="Clear PIN"
                >
                  Clear
                </button>
              )}
            </div>
          );
        })}
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
  /** Department this KPI is logged against (for multi-hat people) */
  departmentId?: string;
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
        departmentId: t.departmentId,
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
        departmentId: base?.departmentId,
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
      // Default to the person's primary department; user can change in the row.
      departmentId: person?.departmentId,
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
          departmentId: r.departmentId,
          target: Number(r.target) || 0,
          period: "monthly",
          periodKey: new Date().toISOString().slice(0, 7),
        });
      });
    setFlash(true);
    setTimeout(() => setFlash(false), 1600);
  }

  // Group draft rows by department for the per-person view. The list of
  // departments to render is the union of (a) the person's memberships and
  // (b) any departments referenced by their existing KPIs (so a KPI tagged
  // to a dept they're no longer in still appears).
  const personDepts = memberDepartmentIds(person)
    .map((id) => state.departments.find((d) => d.id === id))
    .filter((d): d is Department => !!d);
  const visibleRowsWithIdx = draft
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => !row.removed);
  const groupKeys = Array.from(
    new Set([
      ...personDepts.map((d) => d.id),
      ...visibleRowsWithIdx.map(({ row }) => row.departmentId).filter((x): x is string => !!x),
    ]),
  );
  // Add an "Unassigned" bucket if some rows don't have a dept
  if (visibleRowsWithIdx.some(({ row }) => !row.departmentId)) {
    groupKeys.push("__unassigned__");
  }

  return (
    <div className="p-4">
      {/* KPI rows grouped by department */}
      <div className="space-y-4">
        {visibleRowsWithIdx.length === 0 && (
          <div className="border border-dashed border-white/10 px-3 py-3 text-[12px] text-white/40">
            No KPIs. Use a preset below or add a custom one.
          </div>
        )}
        {groupKeys.map((deptId) => {
          const dept = state.departments.find((d) => d.id === deptId);
          const groupRows = visibleRowsWithIdx.filter(
            ({ row }) =>
              (deptId === "__unassigned__" && !row.departmentId) ||
              row.departmentId === deptId,
          );
          if (groupRows.length === 0) return null;
          const label = dept?.name || "Unassigned";
          const color = dept?.color || "#6b6b6b";
          return (
            <div key={deptId}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2" style={{ background: color }} />
                <span className="font-heading text-[10px] font-semibold uppercase tracking-brand text-white/70">
                  {label}
                </span>
                <span className="font-numeric text-[10px] text-white/35">
                  ({groupRows.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {groupRows.map(({ row, idx }) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center gap-1.5 border border-white/10 bg-jet-900 p-2"
                  >
                    <input
                      value={row.name}
                      onChange={(e) => update(idx, { name: e.target.value })}
                      className="col-span-4 bg-transparent font-heading text-[12px] font-semibold uppercase tracking-brand text-white outline-none"
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
                      onChange={(e) =>
                        update(idx, { provider: e.target.value as Provider })
                      }
                      className="input col-span-2 px-1.5 py-1 text-[11px]"
                      title="Source"
                    >
                      {providerOptions.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={row.departmentId || ""}
                      onChange={(e) =>
                        update(idx, { departmentId: e.target.value || undefined })
                      }
                      className="input col-span-2 px-1.5 py-1 text-[11px]"
                      title="Department"
                    >
                      <option value="">— Dept —</option>
                      {personDepts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
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
                ))}
              </div>
            </div>
          );
        })}
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
