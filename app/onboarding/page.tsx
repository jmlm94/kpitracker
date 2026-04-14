"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  GripVertical,
  Plug,
  Plus,
  Target as TargetIcon,
  Trash2,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type {
  Department,
  KPI,
  Provider,
  Target,
  TeamMember,
  Unit,
} from "@/lib/types";
import { cx } from "@/lib/format";

const steps = [
  { id: 1, label: "Departments", icon: Building2 },
  { id: 2, label: "Team", icon: Users },
  { id: 3, label: "KPIs & Targets", icon: TargetIcon },
  { id: 4, label: "Integrations", icon: Plug },
] as const;

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
  { value: "duration_s", label: "Duration (seconds)" },
];

const paletteColors = [
  "#ff6a3d",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#facc15",
  "#22d3ee",
];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    state,
    upsertDepartment,
    removeDepartment,
    upsertTeamMember,
    removeTeamMember,
    upsertKPI,
    removeKPI,
    upsertTarget,
    removeTarget,
    updateIntegration,
    markOnboarded,
  } = useStore();
  const [step, setStep] = useState(1);

  function next() {
    if (step === 4) {
      markOnboarded();
      router.push("/");
    } else {
      setStep((s) => Math.min(4, s + 1));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/" className="btn-ghost">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="text-xs text-white/50">Step {step} of {steps.length}</div>
      </div>

      <div className="mt-5">
        <div className="bracket">Onboarding</div>
        <h1 className="section-title mt-1">
          Welcome to <span className="text-carbinox">Carbinox</span> KPI Command
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Let's get the org wired up. You can edit everything later from the
          Team, Departments, KPIs, and Integrations pages.
        </p>
      </div>

      {/* Step tracker */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cx(
                "card flex items-center gap-3 p-3 text-left transition",
                active ? "border-accent/50 bg-accent/10" : "",
                done ? "border-ok/30 bg-ok/5" : "",
              )}
            >
              <div
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  active
                    ? "bg-accent text-white"
                    : done
                      ? "bg-ok/20 text-ok"
                      : "bg-white/5 text-white/50",
                )}
              >
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  Step {s.id}
                </div>
                <div className="text-sm font-medium text-white">{s.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {step === 1 && (
          <DepartmentsStep
            state={state}
            upsert={upsertDepartment}
            remove={removeDepartment}
          />
        )}
        {step === 2 && (
          <TeamStep
            state={state}
            upsert={upsertTeamMember}
            remove={removeTeamMember}
          />
        )}
        {step === 3 && (
          <KPIsStep
            state={state}
            upsertKpi={upsertKPI}
            removeKpi={removeKPI}
            upsertTarget={upsertTarget}
            removeTarget={removeTarget}
          />
        )}
        {step === 4 && (
          <IntegrationsStep state={state} updateIntegration={updateIntegration} />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="btn-ghost disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={next} className="btn-primary">
          {step === 4 ? "Finish setup" : "Continue"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------ STEP 1 ------------ */

function DepartmentsStep({
  state,
  upsert,
  remove,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsert: (d: Department) => void;
  remove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"main" | "sub">("main");
  const [headId, setHeadId] = useState<string>("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const mains = state.departments.filter((d) => d.kind === "main");
  const orphanSubs = state.departments.filter(
    (d) => d.kind === "sub" && !d.parentId,
  );

  // Auto-assign an unused color for new depts
  function nextColor(): string {
    const used = new Set(state.departments.map((d) => d.color));
    const free = paletteColors.find((c) => !used.has(c));
    return free || paletteColors[state.departments.length % paletteColors.length];
  }

  function add() {
    if (!name.trim()) return;
    upsert({
      id: "dep_" + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      color: nextColor(),
      kind: level,
      // A brand-new Sub is unparented — user drags it under a Main to attach.
      parentId: undefined,
      headId: headId || undefined,
    });
    setName("");
    setHeadId("");
    // keep the level sticky so adding several subs in a row is easy
  }

  // DnD handlers ---------------------------------------------------------
  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
  function onDragEnd() {
    setDragId(null);
    setDragOver(null);
  }
  function onDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(targetId);
  }
  function onDropInto(e: React.DragEvent, newParentId: string | undefined) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const dept = state.departments.find((d) => d.id === id);
    if (!dept) return;
    // Only Subs can be reparented
    if (dept.kind !== "sub") {
      setDragOver(null);
      setDragId(null);
      return;
    }
    upsert({ ...dept, parentId: newParentId });
    setDragOver(null);
    setDragId(null);
  }

  // --------------------------------------------------------------------

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h2 className="section-title">Departments</h2>
        <p className="mt-1 text-sm text-white/50">
          Add a department with three things: <b className="text-white">Name</b>,{" "}
          <b className="text-white">Level</b> (Main or Sub), and the{" "}
          <b className="text-white">Head</b> responsible. Drag any Sub onto a
          Main department to place it in the tree.
        </p>
      </div>

      {/* Add form */}
      <div className="card p-5">
        <h3 className="sub-title">Add department</h3>
        <div className="mt-4 grid grid-cols-12 items-end gap-3">
          <div className="col-span-4">
            <label className="label">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Advertising"
              className="input"
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <div className="col-span-3">
            <label className="label">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as "main" | "sub")}
              className="input"
            >
              <option value="main">Main department</option>
              <option value="sub">Sub-department</option>
            </select>
          </div>
          <div className="col-span-4">
            <label className="label">Head (responsible)</label>
            <select
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              className="input"
            >
              <option value="">— None yet</option>
              {state.team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.position}
                </option>
              ))}
            </select>
          </div>
          <button onClick={add} className="btn-primary col-span-1 justify-center">
            <Plus size={14} />
          </button>
        </div>
        {level === "sub" && (
          <p className="mt-3 text-xs text-white/50">
            New sub-departments appear in <b className="text-warn">Unassigned</b>{" "}
            below — drag them onto their parent Main department to attach.
          </p>
        )}
      </div>

      {/* Main departments grid with drop targets */}
      <div className="card p-5">
        <h3 className="sub-title">Your org</h3>
        <p className="mt-1 text-xs text-white/50">
          Drop a sub-department onto a Main department to nest it. Drop it on
          "Unassigned" to detach it.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {mains.map((m) => (
            <MainDeptPanel
              key={m.id}
              dept={m}
              state={state}
              upsert={upsert}
              remove={remove}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDropInto={onDropInto}
              dragId={dragId}
              dragOver={dragOver}
            />
          ))}
        </div>

        {/* Unassigned zone — only subs with parentId undefined that aren't mains themselves... */}
        <UnassignedZone
          state={state}
          upsert={upsert}
          remove={remove}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDropInto={onDropInto}
          dragId={dragId}
          dragOver={dragOver}
        />
      </div>
    </div>
  );
}

function MainDeptPanel({
  dept,
  state,
  upsert,
  remove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropInto,
  dragId,
  dragOver,
}: {
  dept: Department;
  state: ReturnType<typeof useStore>["state"];
  upsert: (d: Department) => void;
  remove: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDropInto: (e: React.DragEvent, parentId: string | undefined) => void;
  dragId: string | null;
  dragOver: string | null;
}) {
  const subs = state.departments.filter(
    (d) => d.kind === "sub" && d.parentId === dept.id,
  );
  const isOver = dragOver === dept.id;
  // Only a Sub can be dropped here
  const dragged = dragId ? state.departments.find((d) => d.id === dragId) : null;
  const canAccept = !!dragged && dragged.kind === "sub";

  return (
    <div
      onDragOver={(e) => canAccept && onDragOver(e, dept.id)}
      onDrop={(e) => onDropInto(e, dept.id)}
      className={cx(
        "border bg-white/[0.02] p-3 transition",
        isOver && canAccept ? "border-carbinox bg-carbinox/10" : "border-white/10",
      )}
    >
      <DeptRow
        dept={dept}
        state={state}
        upsert={upsert}
        remove={remove}
        draggable={false}
        isMain
      />
      <div className="mt-2 space-y-1.5 pl-5">
        {subs.map((s) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => onDragStart(e, s.id)}
            onDragEnd={onDragEnd}
            className={cx(
              "transition",
              dragId === s.id ? "opacity-50" : "",
            )}
          >
            <DeptRow
              dept={s}
              state={state}
              upsert={upsert}
              remove={remove}
              draggable
            />
          </div>
        ))}
        {subs.length === 0 && (
          <div className="border border-dashed border-white/10 px-3 py-2 text-[11px] text-white/40">
            No sub-departments. Drop one here.
          </div>
        )}
      </div>
    </div>
  );
}

function UnassignedZone({
  state,
  upsert,
  remove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropInto,
  dragId,
  dragOver,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsert: (d: Department) => void;
  remove: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDropInto: (e: React.DragEvent, parentId: string | undefined) => void;
  dragId: string | null;
  dragOver: string | null;
}) {
  const floaters = state.departments.filter((d) => d.kind === "sub" && !d.parentId);
  const isOver = dragOver === "__zone_unassigned__";
  return (
    <div
      onDragOver={(e) => dragId && onDragOver(e, "__zone_unassigned__")}
      onDrop={(e) => onDropInto(e, undefined)}
      className={cx(
        "mt-4 border border-dashed p-3 transition",
        isOver ? "border-carbinox bg-carbinox/10" : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="bracket">Unassigned</div>
      <p className="mt-1 text-xs text-white/50">
        Drop a sub-department here to detach it from its parent.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {floaters.length === 0 && (
          <span className="text-[11px] text-white/30">Empty — drag here to detach.</span>
        )}
        {floaters.map((s) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => onDragStart(e, s.id)}
            onDragEnd={onDragEnd}
            className={cx(
              "flex items-center gap-2 border border-white/10 bg-jet-800 px-2.5 py-1.5 text-xs",
              dragId === s.id ? "opacity-50" : "",
            )}
          >
            <span className="h-2.5 w-2.5" style={{ background: s.color }} />
            {s.name}
            <button
              onClick={() => remove(s.id)}
              className="ml-2 text-white/40 hover:text-bad"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptRow({
  dept,
  state,
  upsert,
  remove,
  draggable,
  isMain,
}: {
  dept: Department;
  state: ReturnType<typeof useStore>["state"];
  upsert: (d: Department) => void;
  remove: (id: string) => void;
  draggable: boolean;
  isMain?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center gap-2 border px-2.5 py-2",
        isMain
          ? "border-white/10 bg-jet-800"
          : "border-white/10 bg-jet-900 cursor-grab active:cursor-grabbing",
      )}
    >
      {draggable && (
        <GripVertical size={14} className="text-white/30" />
      )}
      <span className="h-4 w-4 shrink-0" style={{ background: dept.color }} />
      <input
        defaultValue={dept.name}
        onBlur={(e) => upsert({ ...dept, name: e.target.value })}
        className="flex-1 bg-transparent text-sm font-heading font-semibold uppercase tracking-brand text-white outline-none"
      />
      <span className="chip border-white/10 text-white/55">
        {isMain ? "Main" : "Sub"}
      </span>
      <select
        value={dept.headId || ""}
        onChange={(e) => upsert({ ...dept, headId: e.target.value || undefined })}
        className="input w-[180px] py-1.5 text-xs"
        title="Head"
      >
        <option value="">No head</option>
        {state.team.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => remove(dept.id)}
        className="text-white/40 hover:text-bad"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function isDescendantOf(
  state: ReturnType<typeof useStore>["state"],
  candidateId: string,
  ancestorId: string,
): boolean {
  let cur = state.departments.find((d) => d.id === candidateId);
  while (cur?.parentId) {
    if (cur.parentId === ancestorId) return true;
    cur = state.departments.find((d) => d.id === cur!.parentId);
  }
  return false;
}

/* ------------ STEP 2 ------------ */

function TeamStep({
  state,
  upsert,
  remove,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsert: (m: TeamMember) => void;
  remove: (id: string) => void;
}) {
  const [form, setForm] = useState<Partial<TeamMember>>({
    departmentId: state.departments[0]?.id,
  });

  function add() {
    if (!form.name || !form.position || !form.departmentId) return;
    upsert({
      id: "tm_" + Math.random().toString(36).slice(2, 8),
      name: form.name,
      position: form.position,
      departmentId: form.departmentId,
      managerId: form.managerId,
      email: form.email,
    });
    setForm({ departmentId: state.departments[0]?.id });
  }

  return (
    <div className="card p-5">
      <h2 className="section-title">Team members</h2>
      <p className="text-sm text-white/50">
        Add the people whose KPIs you want to track. You can assign a manager so
        underperformance rolls up to their lead.
      </p>

      <div className="mt-5 divide-y divide-white/5 rounded-xl border border-white/5">
        {state.team.map((m) => {
          const dept = state.departments.find((d) => d.id === m.departmentId);
          return (
            <div key={m.id} className="grid grid-cols-12 items-center gap-3 p-3">
              <input
                defaultValue={m.name}
                onBlur={(e) => upsert({ ...m, name: e.target.value })}
                className="input col-span-3"
              />
              <input
                defaultValue={m.position}
                onBlur={(e) => upsert({ ...m, position: e.target.value })}
                className="input col-span-3"
                placeholder="Position"
              />
              <select
                value={m.departmentId}
                onChange={(e) => upsert({ ...m, departmentId: e.target.value })}
                className="input col-span-2"
              >
                {state.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={m.managerId || ""}
                onChange={(e) =>
                  upsert({ ...m, managerId: e.target.value || undefined })
                }
                className="input col-span-3"
              >
                <option value="">No manager</option>
                {state.team
                  .filter((t) => t.id !== m.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              <button onClick={() => remove(m.id)} className="btn-ghost col-span-1 justify-center">
                <Trash2 size={14} />
              </button>
              <div className="col-span-12 -mt-1 text-[11px] text-white/40">
                {dept?.name}
                {m.email ? ` · ${m.email}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-12 items-end gap-3">
        <div className="col-span-3">
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Simona Saule"
          />
        </div>
        <div className="col-span-3">
          <label className="label">Position</label>
          <input
            className="input"
            value={form.position || ""}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Media Buyer - Meta"
          />
        </div>
        <div className="col-span-2">
          <label className="label">Department</label>
          <select
            className="input"
            value={form.departmentId || ""}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <label className="label">Reports to</label>
          <select
            className="input"
            value={form.managerId || ""}
            onChange={(e) => setForm({ ...form, managerId: e.target.value || undefined })}
          >
            <option value="">—</option>
            {state.team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary col-span-1 justify-center" onClick={add}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------ STEP 3 ------------ */

function KPIsStep({
  state,
  upsertKpi,
  removeKpi,
  upsertTarget,
  removeTarget,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsertKpi: (k: KPI) => void;
  removeKpi: (id: string) => void;
  upsertTarget: (t: Target) => void;
  removeTarget: (id: string) => void;
}) {
  const [kpi, setKpi] = useState<Partial<KPI>>({
    unit: "number",
    direction: "higher_is_better",
    provider: "manual",
    window: "mtd",
  });
  const [target, setTarget] = useState<Partial<Target>>({
    period: "monthly",
    periodKey: new Date().toISOString().slice(0, 7),
  });

  function add() {
    if (!kpi.name || !kpi.metricKey || !target.ownerId || !target.target) return;
    const id = "kpi_" + Math.random().toString(36).slice(2, 8);
    const tid = "t_" + Math.random().toString(36).slice(2, 8);
    upsertKpi({
      id,
      name: kpi.name,
      description: kpi.description,
      metricKey: kpi.metricKey,
      unit: kpi.unit as Unit,
      direction: kpi.direction as KPI["direction"],
      provider: kpi.provider as Provider,
      window: (kpi.window as KPI["window"]) || "mtd",
    });
    upsertTarget({
      id: tid,
      kpiId: id,
      ownerId: target.ownerId,
      target: Number(target.target),
      period: (target.period as Target["period"]) || "monthly",
      periodKey: target.periodKey || new Date().toISOString().slice(0, 7),
    });
    setKpi({
      unit: "number",
      direction: "higher_is_better",
      provider: "manual",
      window: "mtd",
    });
    setTarget({ period: "monthly", periodKey: new Date().toISOString().slice(0, 7) });
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="section-title">Existing KPIs</h2>
        <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/5">
          {state.kpis.map((k) => {
            const targets = state.targets.filter((t) => t.kpiId === k.id);
            return (
              <div key={k.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{k.name}</div>
                    <div className="text-xs text-white/50">
                      {k.provider} · {k.metricKey} · {k.window} ·{" "}
                      {k.direction === "higher_is_better" ? "↑ better" : "↓ better"}
                    </div>
                  </div>
                  <button onClick={() => removeKpi(k.id)} className="btn-ghost">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {targets.map((t) => {
                    const owner = state.team.find((m) => m.id === t.ownerId);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-sm"
                      >
                        <div>
                          <div className="text-white">
                            Target {t.target}{" "}
                            <span className="text-white/40">
                              · {t.period} · {t.periodKey}
                            </span>
                          </div>
                          <div className="text-xs text-white/50">
                            Owner: {owner?.name || "—"}
                          </div>
                        </div>
                        <button onClick={() => removeTarget(t.id)} className="btn-ghost">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {state.kpis.length === 0 && (
            <div className="p-4 text-sm text-white/50">No KPIs yet — add one below.</div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title">Add a new KPI + target</h2>
        <div className="mt-5 grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <label className="label">KPI name</label>
            <input
              className="input"
              placeholder="e.g. Meta ROAS"
              value={kpi.name || ""}
              onChange={(e) => setKpi({ ...kpi, name: e.target.value })}
            />
          </div>
          <div className="col-span-4">
            <label className="label">Data source</label>
            <select
              className="input"
              value={kpi.provider}
              onChange={(e) => setKpi({ ...kpi, provider: e.target.value as Provider })}
            >
              {providerOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-4">
            <label className="label">Metric key</label>
            <input
              className="input"
              placeholder="e.g. meta.roas"
              value={kpi.metricKey || ""}
              onChange={(e) => setKpi({ ...kpi, metricKey: e.target.value })}
            />
          </div>

          <div className="col-span-3">
            <label className="label">Unit</label>
            <select
              className="input"
              value={kpi.unit}
              onChange={(e) => setKpi({ ...kpi, unit: e.target.value as Unit })}
            >
              {unitOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="label">Direction</label>
            <select
              className="input"
              value={kpi.direction}
              onChange={(e) =>
                setKpi({ ...kpi, direction: e.target.value as KPI["direction"] })
              }
            >
              <option value="higher_is_better">Higher is better</option>
              <option value="lower_is_better">Lower is better</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="label">Window</label>
            <select
              className="input"
              value={kpi.window}
              onChange={(e) =>
                setKpi({ ...kpi, window: e.target.value as KPI["window"] })
              }
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="mtd">Month-to-date</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="Optional"
              value={kpi.description || ""}
              onChange={(e) => setKpi({ ...kpi, description: e.target.value })}
            />
          </div>

          <div className="col-span-4">
            <label className="label">Target value</label>
            <input
              className="input"
              type="number"
              step="any"
              placeholder="1.6"
              value={(target.target as number) ?? ""}
              onChange={(e) =>
                setTarget({ ...target, target: Number(e.target.value) })
              }
            />
          </div>
          <div className="col-span-4">
            <label className="label">Owner</label>
            <select
              className="input"
              value={target.ownerId || ""}
              onChange={(e) => setTarget({ ...target, ownerId: e.target.value })}
            >
              <option value="">Select team member</option>
              {state.team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.position}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Period</label>
            <select
              className="input"
              value={target.period}
              onChange={(e) =>
                setTarget({ ...target, period: e.target.value as Target["period"] })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Period key</label>
            <input
              className="input"
              placeholder="2026-04"
              value={target.periodKey || ""}
              onChange={(e) => setTarget({ ...target, periodKey: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={add} className="btn-primary">
            <Plus size={14} /> Add KPI + target
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------ STEP 4 ------------ */

function IntegrationsStep({
  state,
  updateIntegration,
}: {
  state: ReturnType<typeof useStore>["state"];
  updateIntegration: (p: string, patch: any) => void;
}) {
  return (
    <div className="card p-5">
      <h2 className="section-title">Connect your data sources</h2>
      <p className="text-sm text-white/50">
        Flip on the sources you want to pull from. Real API credentials are
        stored as environment variables on Vercel — this screen only tracks which
        integrations are active.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {state.integrations.map((i) => (
          <div key={i.provider} className="card flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-white/5 p-2 text-white/70">
              <Plug size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-medium text-white">{i.label}</div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={i.connected}
                    onChange={(e) =>
                      updateIntegration(i.provider, { connected: e.target.checked })
                    }
                  />
                  <span className="h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-accent" />
                  <span className="-ml-8 h-4 w-4 translate-x-0.5 rounded-full bg-white transition peer-checked:translate-x-4" />
                </label>
              </div>
              <div className="mt-1.5 text-xs text-white/50">
                Env vars:{" "}
                {i.envVarsExpected.map((v) => (
                  <span key={v} className="kbd mr-1">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 text-xs text-white/50">
        After finishing, the daily Vercel cron at <span className="kbd">/api/cron/refresh</span> will
        pull new numbers every morning.
      </div>
    </div>
  );
}
