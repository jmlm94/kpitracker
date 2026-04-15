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
import { Avatar } from "@/components/Avatar";
import { presetsForPosition, type KPIPreset } from "@/lib/presets";
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

/**
 * Team grid step — one card per person showing their roles. Each card
 * supports inline name / position editing, multi-department membership
 * (primary + additional with chips), manager assignment, and removal.
 * A trailing "+ New team member" tile creates an empty card you can fill in.
 */
function TeamStep({
  state,
  upsert,
  remove,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsert: (m: TeamMember) => void;
  remove: (id: string) => void;
}) {
  function addEmpty() {
    upsert({
      id: "tm_" + Math.random().toString(36).slice(2, 8),
      name: "New Team Member",
      position: "Position / Role",
      departmentId: state.departments[0]?.id,
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="section-title">Team members</h2>
        <p className="mt-1 text-sm text-white/50">
          One card per person. Confirm each name and role here. People with more
          than one role get multiple department chips — click <b className="text-white">+ Add</b> to
          give them a second hat.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.team.map((m) => (
          <PersonCard key={m.id} person={m} state={state} upsert={upsert} remove={remove} />
        ))}
        {/* Add new tile */}
        <button
          onClick={addEmpty}
          className="card flex min-h-[200px] flex-col items-center justify-center gap-2 border-dashed text-white/50 transition hover:border-carbinox hover:text-carbinox"
        >
          <Plus size={20} />
          <span className="font-heading text-[12px] font-semibold uppercase tracking-brand">
            New Team Member
          </span>
        </button>
      </div>
    </div>
  );
}

function PersonCard({
  person,
  state,
  upsert,
  remove,
}: {
  person: TeamMember;
  state: ReturnType<typeof useStore>["state"];
  upsert: (m: TeamMember) => void;
  remove: (id: string) => void;
}) {
  const primaryDept = state.departments.find((d) => d.id === person.departmentId);
  const additional = (person.additionalDepartmentIds || [])
    .map((id) => state.departments.find((d) => d.id === id))
    .filter((d): d is Department => !!d);
  const accent = primaryDept?.color || "#f8c808";
  const allDepts = [primaryDept, ...additional].filter((d): d is Department => !!d);

  // Possible departments the user could add (everything they're not already in)
  const memberInIds = new Set(allDepts.map((d) => d.id));
  const addable = state.departments.filter((d) => !memberInIds.has(d.id));

  const [showAddDept, setShowAddDept] = useState(false);

  return (
    <div className="card relative p-4">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
      />
      <div className="flex items-start gap-3">
        <Avatar name={person.name || "?"} size={44} color={accent} />
        <div className="min-w-0 flex-1">
          <input
            defaultValue={person.name}
            onBlur={(e) => upsert({ ...person, name: e.target.value })}
            placeholder="First Last"
            className="w-full bg-transparent font-display text-xl font-extrabold uppercase leading-none tracking-brand text-white outline-none placeholder:text-white/30"
          />
          <input
            defaultValue={person.position}
            onBlur={(e) => upsert({ ...person, position: e.target.value })}
            placeholder="Role / position"
            className="mt-1 w-full bg-transparent text-[12px] text-white/60 outline-none placeholder:text-white/30"
          />
        </div>
        <button
          onClick={() => {
            if (confirm(`Remove ${person.name} from the org?`)) remove(person.id);
          }}
          className="text-white/30 hover:text-bad"
          title="Remove person"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Roles / dept chips */}
      <div className="mt-4">
        <div className="bracket">Roles ({allDepts.length})</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allDepts.map((d, idx) => {
            const isPrimary = idx === 0;
            return (
              <span
                key={d.id}
                className={cx(
                  "inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-heading font-semibold uppercase tracking-brand",
                  isPrimary ? "" : "border-dashed",
                )}
                style={{
                  borderColor: d.color,
                  color: "#fff",
                  background: `${d.color}10`,
                }}
              >
                <span className="h-1.5 w-1.5" style={{ background: d.color }} />
                {d.name}
                {isPrimary && (
                  <span className="font-numeric text-[9px] text-carbinox">★ primary</span>
                )}
                {!isPrimary && (
                  <button
                    onClick={() =>
                      upsert({
                        ...person,
                        additionalDepartmentIds: (person.additionalDepartmentIds || []).filter(
                          (id) => id !== d.id,
                        ),
                      })
                    }
                    className="text-white/40 hover:text-bad"
                    title="Remove this role"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
          {addable.length > 0 && !showAddDept && (
            <button
              onClick={() => setShowAddDept(true)}
              className="inline-flex items-center gap-1 border border-dashed border-white/20 bg-white/[0.02] px-2 py-1 text-[11px] font-heading font-semibold uppercase tracking-brand text-white/60 hover:border-carbinox hover:text-carbinox"
            >
              <Plus size={10} /> Add role
            </button>
          )}
          {showAddDept && addable.length > 0 && (
            <select
              autoFocus
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                upsert({
                  ...person,
                  additionalDepartmentIds: [
                    ...(person.additionalDepartmentIds || []),
                    id,
                  ],
                });
                setShowAddDept(false);
              }}
              onBlur={() => setShowAddDept(false)}
              className="input w-auto py-1 text-xs"
            >
              <option value="">Pick a department…</option>
              {addable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Primary dept selector + manager */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <label className="label">Primary dept</label>
          <select
            value={person.departmentId}
            onChange={(e) => {
              const newPrimary = e.target.value;
              const additionals = (person.additionalDepartmentIds || []).filter(
                (id) => id !== newPrimary,
              );
              // If the old primary isn't yet in additionals (and isn't the same), keep it as additional
              const keepOld =
                person.departmentId &&
                person.departmentId !== newPrimary &&
                !additionals.includes(person.departmentId);
              const next = keepOld
                ? [person.departmentId, ...additionals]
                : additionals;
              upsert({
                ...person,
                departmentId: newPrimary,
                additionalDepartmentIds: next.length ? next : undefined,
              });
            }}
            className="input py-1.5 text-xs"
          >
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Reports to</label>
          <select
            value={person.managerId || ""}
            onChange={(e) =>
              upsert({ ...person, managerId: e.target.value || undefined })
            }
            className="input py-1.5 text-xs"
          >
            <option value="">No manager</option>
            {state.team
              .filter((t) => t.id !== person.id)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ------------ STEP 3 ------------ */

/**
 * KPIs grid step — one card per person, listing every KPI they own with
 * inline editing of Name · Unit · Target · Source. New KPIs can be added
 * from a "Suggested for this role" preset list (auto-derived from the
 * person's position) or from scratch.
 */
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
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h2 className="section-title">KPIs by person</h2>
        <p className="mt-1 text-sm text-white/50">
          Confirm the KPIs each team member owns. Each KPI has{" "}
          <b className="text-white">Name · Unit · Target · Source</b>. Pre-seeded
          KPIs are already filled in based on each role — keep them, edit them,
          or add new ones from the <b className="text-white">Suggested</b> menu
          per card.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {state.team.map((person) => (
          <KPIPersonCard
            key={person.id}
            person={person}
            state={state}
            upsertKpi={upsertKpi}
            removeKpi={removeKpi}
            upsertTarget={upsertTarget}
            removeTarget={removeTarget}
          />
        ))}
      </div>
    </div>
  );
}

function KPIPersonCard({
  person,
  state,
  upsertKpi,
  removeKpi,
  upsertTarget,
  removeTarget,
}: {
  person: TeamMember;
  state: ReturnType<typeof useStore>["state"];
  upsertKpi: (k: KPI) => void;
  removeKpi: (id: string) => void;
  upsertTarget: (t: Target) => void;
  removeTarget: (id: string) => void;
}) {
  const primaryDept = state.departments.find((d) => d.id === person.departmentId);
  const accent = primaryDept?.color || "#f8c808";
  const additional = (person.additionalDepartmentIds || [])
    .map((id) => state.departments.find((d) => d.id === id))
    .filter((d): d is Department => !!d);
  const allDepts = [primaryDept, ...additional].filter((d): d is Department => !!d);

  // Targets owned by this person
  const ownedTargets = state.targets.filter((t) => t.ownerId === person.id);
  const presets = presetsForPosition(person.position);

  function addCustomKPI() {
    const kpiId = "kpi_" + Math.random().toString(36).slice(2, 8);
    const tid = "t_" + Math.random().toString(36).slice(2, 8);
    upsertKpi({
      id: kpiId,
      name: "New KPI",
      unit: "number",
      direction: "higher_is_better",
      provider: "manual",
      metricKey: "custom." + kpiId,
      window: "mtd",
    });
    upsertTarget({
      id: tid,
      kpiId,
      ownerId: person.id,
      target: 100,
      period: "monthly",
      periodKey: new Date().toISOString().slice(0, 7),
    });
  }

  function addFromPreset(p: KPIPreset) {
    const kpiId = "kpi_" + Math.random().toString(36).slice(2, 8);
    const tid = "t_" + Math.random().toString(36).slice(2, 8);
    upsertKpi({
      id: kpiId,
      name: p.name,
      description: p.description,
      unit: p.unit,
      direction: p.direction,
      provider: p.provider,
      metricKey: p.metricKey,
      window: p.window,
    });
    upsertTarget({
      id: tid,
      kpiId,
      ownerId: person.id,
      target: p.target,
      period: "monthly",
      periodKey: new Date().toISOString().slice(0, 7),
    });
  }

  return (
    <div className="card relative p-4">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
      />

      {/* Person header */}
      <div className="flex items-start gap-3">
        <Avatar name={person.name} size={40} color={accent} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-extrabold uppercase leading-none tracking-brand text-white">
            {person.name}
          </div>
          <div className="mt-1 text-[12px] text-white/55">{person.position}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {allDepts.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] font-heading font-semibold uppercase tracking-brand"
                style={{ borderColor: `${d.color}80`, color: "#fff" }}
              >
                <span className="h-1 w-1" style={{ background: d.color }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* KPI rows */}
      <div className="mt-4 space-y-2">
        {ownedTargets.length === 0 && (
          <div className="border border-dashed border-white/10 px-3 py-3 text-[12px] text-white/40">
            No KPIs yet. Use a preset below or add a custom one.
          </div>
        )}
        {ownedTargets.map((t) => {
          const k = state.kpis.find((x) => x.id === t.kpiId);
          if (!k) return null;
          return (
            <KPIRow
              key={t.id}
              kpi={k}
              target={t}
              upsertKpi={upsertKpi}
              upsertTarget={upsertTarget}
              onRemove={() => {
                removeTarget(t.id);
                // If this KPI has no other targets, remove the KPI definition too
                const others = state.targets.filter(
                  (other) => other.kpiId === k.id && other.id !== t.id,
                );
                if (others.length === 0) removeKpi(k.id);
              }}
            />
          );
        })}
      </div>

      {/* Add KPI controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
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
            title="Suggested KPIs based on this person's position"
          >
            <option value="">+ Add suggested KPI…</option>
            {presets
              .filter(
                // hide presets that are already attached to this person
                (p) =>
                  !ownedTargets.some((t) => {
                    const k = state.kpis.find((x) => x.id === t.kpiId);
                    return k?.metricKey === p.metricKey && k?.name === p.name;
                  }),
              )
              .map((p, i) => (
                <option key={p.name + p.metricKey} value={presets.indexOf(p)}>
                  {p.name} · target {p.target}
                </option>
              ))}
          </select>
        )}
        <button onClick={addCustomKPI} className="btn-ghost">
          <Plus size={12} /> Custom KPI
        </button>
      </div>
    </div>
  );
}

function KPIRow({
  kpi,
  target,
  upsertKpi,
  upsertTarget,
  onRemove,
}: {
  kpi: KPI;
  target: Target;
  upsertKpi: (k: KPI) => void;
  upsertTarget: (t: Target) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-1.5 border border-white/10 bg-jet-900 p-2">
      <input
        defaultValue={kpi.name}
        onBlur={(e) => upsertKpi({ ...kpi, name: e.target.value })}
        className="col-span-4 bg-transparent font-heading text-[12px] font-semibold uppercase tracking-brand text-white outline-none"
        placeholder="KPI name"
      />
      <select
        value={kpi.unit}
        onChange={(e) => upsertKpi({ ...kpi, unit: e.target.value as Unit })}
        className="input col-span-2 px-1.5 py-1 text-[11px]"
      >
        {unitOptions.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="any"
        defaultValue={target.target}
        onBlur={(e) =>
          upsertTarget({ ...target, target: Number(e.target.value) })
        }
        className="input col-span-2 px-1.5 py-1 text-right font-numeric text-[12px]"
        placeholder="Target"
      />
      <select
        value={kpi.provider}
        onChange={(e) => upsertKpi({ ...kpi, provider: e.target.value as Provider })}
        className="input col-span-3 px-1.5 py-1 text-[11px]"
        title="Where to measure it"
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
      {/* Second row: direction + window + metric key, dimmer */}
      <div className="col-span-12 mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
        <span className="bracket">Direction</span>
        <select
          value={kpi.direction}
          onChange={(e) =>
            upsertKpi({ ...kpi, direction: e.target.value as KPI["direction"] })
          }
          className="bg-transparent text-white/70 outline-none"
        >
          <option value="higher_is_better">↑ Higher is better</option>
          <option value="lower_is_better">↓ Lower is better</option>
        </select>
        <span className="bracket ml-2">Window</span>
        <select
          value={kpi.window}
          onChange={(e) =>
            upsertKpi({ ...kpi, window: e.target.value as KPI["window"] })
          }
          className="bg-transparent text-white/70 outline-none"
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="mtd">Month-to-date</option>
          <option value="30d">Last 30 days</option>
        </select>
        <span className="bracket ml-2">Metric key</span>
        <input
          defaultValue={kpi.metricKey}
          onBlur={(e) => upsertKpi({ ...kpi, metricKey: e.target.value })}
          className="min-w-0 flex-1 bg-transparent font-numeric text-white/70 outline-none"
        />
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
