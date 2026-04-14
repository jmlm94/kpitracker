"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import type { Department, TeamMember } from "@/lib/types";
import { childDepartments } from "@/lib/hierarchy";
import { cx } from "@/lib/format";
import { GripVertical, Plus, Trash2, Pencil, Check } from "lucide-react";

/**
 * Org Chart — single-source-of-truth visual view.
 *
 * Every drag-and-drop and inline edit calls through the same store that
 * every other page reads from, so changes here propagate to Departments,
 * Team, KPIs, and the Dashboard immediately.
 *
 *  - Drag a Person chip to another sub-department (or a main dept that
 *    has no subs) → updates their `departmentId`.
 *  - Drag a Sub-department onto another Main → updates its `parentId`.
 *  - Click a name to rename it in place.
 *  - "+ Add person" button inside any sub-dept creates a new empty member.
 */
export default function OrgChartPage() {
  const { state, ready, upsertDepartment, upsertTeamMember, removeTeamMember } =
    useStore();

  // Drag state is keyed to the kind of thing being dragged, because the
  // valid drop targets differ.
  const [drag, setDrag] = useState<
    | { kind: "person"; id: string }
    | { kind: "sub"; id: string }
    | null
  >(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const mains = useMemo(
    () => state?.departments.filter((d) => d.kind === "main") ?? [],
    [state?.departments],
  );
  const ceo = state?.team.find((m) => m.id === "tm_jose") ?? state?.team[0];

  if (!ready || !state) return null;

  function handlePersonDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `person:${id}`);
    setDrag({ kind: "person", id });
  }
  function handleSubDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `sub:${id}`);
    setDrag({ kind: "sub", id });
  }
  function handleDragEnd() {
    setDrag(null);
    setDragOver(null);
  }
  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(targetId);
  }
  function handleDropPerson(e: React.DragEvent, newDeptId: string) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const [kind, id] = raw.split(":");
    if (kind !== "person") return;
    const person = state.team.find((m) => m.id === id);
    if (!person) return;
    upsertTeamMember({ ...person, departmentId: newDeptId });
    handleDragEnd();
  }
  function handleDropSub(e: React.DragEvent, newParentId: string) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const [kind, id] = raw.split(":");
    if (kind !== "sub") return;
    const sub = state.departments.find((d) => d.id === id);
    if (!sub || sub.kind !== "sub") return;
    if (sub.parentId === newParentId) {
      handleDragEnd();
      return;
    }
    upsertDepartment({ ...sub, parentId: newParentId });
    handleDragEnd();
  }

  function addPerson(departmentId: string) {
    const id = "tm_" + Math.random().toString(36).slice(2, 8);
    upsertTeamMember({
      id,
      name: "New Team Member",
      position: "Position",
      departmentId,
    });
  }

  return (
    <div>
      <div className="bracket">06 — Org Map</div>
      <h1 className="section-title mt-1">Org Chart</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/50">
        The full Carbinox structure in one view. Drag people between
        departments, drag sub-departments between parents, and click any
        name to rename it. Every change saves instantly and is reflected
        across the entire app.
      </p>

      {/* CEO at the top */}
      {ceo && (
        <div className="mt-8 flex justify-center">
          <PersonNode
            person={ceo}
            accentColor="#f8c808"
            onRename={(name) => upsertTeamMember({ ...ceo, name })}
            onRenamePosition={(position) =>
              upsertTeamMember({ ...ceo, position })
            }
            draggable={false}
            highlight
          />
        </div>
      )}

      {/* Organization grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {mains.map((main) => (
          <MainColumn
            key={main.id}
            main={main}
            state={state}
            drag={drag}
            dragOver={dragOver}
            onPersonDragStart={handlePersonDragStart}
            onSubDragStart={handleSubDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDropPerson={handleDropPerson}
            onDropSub={handleDropSub}
            addPerson={addPerson}
            upsertDepartment={upsertDepartment}
            upsertTeamMember={upsertTeamMember}
            removeTeamMember={removeTeamMember}
          />
        ))}
      </div>

      <div className="mt-8 card p-4">
        <div className="bracket">How to use</div>
        <ul className="mt-2 space-y-1 text-[13px] text-white/60">
          <li>• Drag any person chip onto another department to reassign them.</li>
          <li>• Drag a sub-department header onto a different Main department to re-parent it.</li>
          <li>• Click a name or position to edit it. Press <span className="kbd">Enter</span> or click away to save.</li>
          <li>• Use <span className="kbd">+ Add person</span> to hire into any team. Changes propagate everywhere.</li>
        </ul>
      </div>
    </div>
  );
}

function MainColumn(props: {
  main: Department;
  state: ReturnType<typeof useStore>["state"];
  drag: { kind: "person" | "sub"; id: string } | null;
  dragOver: string | null;
  onPersonDragStart: (e: React.DragEvent, id: string) => void;
  onSubDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDropPerson: (e: React.DragEvent, deptId: string) => void;
  onDropSub: (e: React.DragEvent, parentId: string) => void;
  addPerson: (deptId: string) => void;
  upsertDepartment: (d: Department) => void;
  upsertTeamMember: (m: TeamMember) => void;
  removeTeamMember: (id: string) => void;
}) {
  const {
    main,
    state,
    drag,
    dragOver,
    onPersonDragStart,
    onSubDragStart,
    onDragEnd,
    onDragOver,
    onDropPerson,
    onDropSub,
    addPerson,
    upsertDepartment,
    upsertTeamMember,
    removeTeamMember,
  } = props;

  const subs = childDepartments(state, main.id);
  const direct = state.team.filter((t) => t.departmentId === main.id);
  const head = state.team.find((m) => m.id === main.headId);

  // Accept a sub drop on the Main's header
  const subDropTarget = `sub-target-${main.id}`;
  const personDropTarget = `person-target-${main.id}`;

  const isSubOver = dragOver === subDropTarget && drag?.kind === "sub";
  const isPersonOver = dragOver === personDropTarget && drag?.kind === "person";

  return (
    <div className="card flex flex-col p-4">
      {/* Header — accepts sub drops */}
      <div
        onDragOver={(e) => drag?.kind === "sub" && onDragOver(e, subDropTarget)}
        onDrop={(e) => onDropSub(e, main.id)}
        className={cx(
          "flex items-center gap-3 border-l-4 pl-3 py-2 transition",
          isSubOver
            ? "border-carbinox bg-carbinox/10"
            : "border-transparent",
        )}
        style={{ borderLeftColor: isSubOver ? undefined : main.color }}
      >
        <div
          className="h-3 w-3 shrink-0"
          style={{ background: main.color }}
        />
        <InlineText
          value={main.name}
          onChange={(name) => upsertDepartment({ ...main, name })}
          className="font-display text-2xl font-extrabold uppercase leading-none tracking-brand text-white"
        />
        <span className="chip ml-auto border-white/10 text-white/55">Main</span>
      </div>

      {/* Head of main dept */}
      {head && (
        <div className="mt-3 border border-white/10 bg-white/[0.03] p-2">
          <div className="bracket">Head</div>
          <div className="mt-1">
            <PersonNode
              person={head}
              accentColor={main.color}
              onRename={(name) => upsertTeamMember({ ...head, name })}
              onRenamePosition={(position) => upsertTeamMember({ ...head, position })}
              onRemove={() => removeTeamMember(head.id)}
              draggable
              onDragStart={(e) => onPersonDragStart(e, head.id)}
              onDragEnd={onDragEnd}
            />
          </div>
        </div>
      )}

      {/* Direct reports (people whose departmentId == main) */}
      {direct.length > 0 && (
        <div
          onDragOver={(e) => drag?.kind === "person" && onDragOver(e, personDropTarget)}
          onDrop={(e) => onDropPerson(e, main.id)}
          className={cx(
            "mt-3 border p-2 transition",
            isPersonOver
              ? "border-carbinox bg-carbinox/10"
              : "border-white/10 bg-white/[0.02]",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="bracket">Direct team</div>
            <button
              onClick={() => addPerson(main.id)}
              className="text-[10px] font-heading uppercase tracking-brand text-white/50 hover:text-carbinox"
            >
              + Add
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {direct
              .filter((m) => m.id !== head?.id)
              .map((m) => (
                <PersonNode
                  key={m.id}
                  person={m}
                  accentColor={main.color}
                  onRename={(name) => upsertTeamMember({ ...m, name })}
                  onRenamePosition={(position) => upsertTeamMember({ ...m, position })}
                  onRemove={() => removeTeamMember(m.id)}
                  draggable
                  onDragStart={(e) => onPersonDragStart(e, m.id)}
                  onDragEnd={onDragEnd}
                />
              ))}
          </div>
        </div>
      )}

      {/* Sub-departments */}
      <div className="mt-3 flex flex-col gap-2">
        {subs.map((sub) => (
          <SubCard
            key={sub.id}
            sub={sub}
            main={main}
            state={state}
            drag={drag}
            dragOver={dragOver}
            onPersonDragStart={onPersonDragStart}
            onSubDragStart={onSubDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDropPerson={onDropPerson}
            addPerson={addPerson}
            upsertDepartment={upsertDepartment}
            upsertTeamMember={upsertTeamMember}
            removeTeamMember={removeTeamMember}
          />
        ))}
        {subs.length === 0 && !head && direct.length === 0 && (
          <div
            onDragOver={(e) => drag && onDragOver(e, personDropTarget)}
            onDrop={(e) =>
              drag?.kind === "person" ? onDropPerson(e, main.id) : undefined
            }
            className={cx(
              "border border-dashed px-3 py-6 text-center text-[11px] transition",
              isPersonOver
                ? "border-carbinox bg-carbinox/10 text-carbinox"
                : "border-white/10 text-white/40",
            )}
          >
            Empty — drop people or sub-departments here.
          </div>
        )}
      </div>
    </div>
  );
}

function SubCard(props: {
  sub: Department;
  main: Department;
  state: ReturnType<typeof useStore>["state"];
  drag: { kind: "person" | "sub"; id: string } | null;
  dragOver: string | null;
  onPersonDragStart: (e: React.DragEvent, id: string) => void;
  onSubDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDropPerson: (e: React.DragEvent, deptId: string) => void;
  addPerson: (deptId: string) => void;
  upsertDepartment: (d: Department) => void;
  upsertTeamMember: (m: TeamMember) => void;
  removeTeamMember: (id: string) => void;
}) {
  const {
    sub,
    main,
    state,
    drag,
    dragOver,
    onPersonDragStart,
    onSubDragStart,
    onDragEnd,
    onDragOver,
    onDropPerson,
    addPerson,
    upsertDepartment,
    upsertTeamMember,
    removeTeamMember,
  } = props;

  const members = state.team.filter((t) => t.departmentId === sub.id);
  const head = state.team.find((m) => m.id === sub.headId);

  const dropTarget = `person-target-${sub.id}`;
  const isOver = dragOver === dropTarget && drag?.kind === "person";

  return (
    <div
      onDragOver={(e) => drag?.kind === "person" && onDragOver(e, dropTarget)}
      onDrop={(e) => onDropPerson(e, sub.id)}
      className={cx(
        "border bg-white/[0.02] p-3 transition",
        isOver ? "border-carbinox bg-carbinox/10" : "border-white/10",
      )}
    >
      {/* Sub header (draggable to reparent) */}
      <div
        draggable
        onDragStart={(e) => onSubDragStart(e, sub.id)}
        onDragEnd={onDragEnd}
        className="flex cursor-grab items-center gap-2 active:cursor-grabbing"
        style={{ borderLeft: `3px solid ${sub.color}`, paddingLeft: 8 }}
      >
        <GripVertical size={14} className="text-white/30" />
        <InlineText
          value={sub.name}
          onChange={(name) => upsertDepartment({ ...sub, name })}
          className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white"
        />
        <span className="chip ml-auto border-white/10 text-white/55">Sub</span>
      </div>

      {/* Head of sub */}
      {head && (
        <div className="mt-2">
          <div className="bracket">Head</div>
          <div className="mt-1">
            <PersonNode
              person={head}
              accentColor={sub.color}
              onRename={(name) => upsertTeamMember({ ...head, name })}
              onRenamePosition={(position) => upsertTeamMember({ ...head, position })}
              onRemove={() => removeTeamMember(head.id)}
              draggable
              onDragStart={(e) => onPersonDragStart(e, head.id)}
              onDragEnd={onDragEnd}
            />
          </div>
        </div>
      )}

      {/* Members */}
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <div className="bracket">Team</div>
          <button
            onClick={() => addPerson(sub.id)}
            className="text-[10px] font-heading uppercase tracking-brand text-white/50 hover:text-carbinox"
            title="Add person"
          >
            + Add
          </button>
        </div>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {members
            .filter((m) => m.id !== head?.id)
            .map((m) => (
              <PersonNode
                key={m.id}
                person={m}
                accentColor={sub.color}
                onRename={(name) => upsertTeamMember({ ...m, name })}
                onRenamePosition={(position) => upsertTeamMember({ ...m, position })}
                onRemove={() => removeTeamMember(m.id)}
                draggable
                onDragStart={(e) => onPersonDragStart(e, m.id)}
                onDragEnd={onDragEnd}
              />
            ))}
          {members.length === 0 && (
            <div className="border border-dashed border-white/10 px-2 py-2 text-[10px] text-white/30">
              No members. Drop someone here, or click + Add.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonNode({
  person,
  accentColor,
  onRename,
  onRenamePosition,
  onRemove,
  draggable,
  onDragStart,
  onDragEnd,
  highlight,
}: {
  person: TeamMember;
  accentColor: string;
  onRename: (name: string) => void;
  onRenamePosition: (position: string) => void;
  onRemove?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cx(
        "flex items-center gap-2.5 border px-2.5 py-2 transition",
        highlight
          ? "border-carbinox bg-carbinox/5"
          : "border-white/10 bg-jet-900",
        draggable ? "cursor-grab active:cursor-grabbing" : "",
      )}
    >
      {draggable && <GripVertical size={13} className="text-white/30" />}
      <Avatar name={person.name} size={28} color={accentColor} />
      <div className="min-w-0 flex-1">
        <InlineText
          value={person.name}
          onChange={onRename}
          className="block w-full truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white"
        />
        <InlineText
          value={person.position}
          onChange={onRenamePosition}
          className="block w-full truncate text-[10px] text-white/50"
        />
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove ${person.name} from the org?`)) onRemove();
          }}
          className="text-white/30 hover:text-bad"
          title="Remove"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function InlineText({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Keep draft in sync if the outer value changes
  if (!editing && draft !== value) {
    setDraft(value);
  }

  function save() {
    if (draft.trim() && draft !== value) onChange(draft.trim());
    else setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex items-center gap-1"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className={cx(
            "w-full border border-carbinox/60 bg-jet-900 px-1.5 py-0.5 text-inherit outline-none",
            className,
          )}
        />
        <button
          type="submit"
          className="text-carbinox hover:text-carbinox-light"
          aria-label="Save"
        >
          <Check size={12} />
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cx(
        "group/edit inline-flex items-center gap-1 text-left hover:text-carbinox",
        className,
      )}
      title="Click to edit"
    >
      {value}
      <Pencil size={10} className="opacity-0 transition group-hover/edit:opacity-70" />
    </button>
  );
}
