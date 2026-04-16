"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import type { Department, TeamMember } from "@/lib/types";
import { cx } from "@/lib/format";
import { Pencil, Plus, Trash2, ChevronDown } from "lucide-react";

/**
 * Org Chart — top-down tree board.
 *
 * Renders the company as a connected reporting hierarchy: CEO at the top,
 * direct reports beneath, then their direct reports, etc. Each box shows
 * the person + a hint of which department they belong to.
 *
 * People with multiple managers appear underneath each manager (with a
 * dashed border on the dupes) so the "shared resource" pattern (e.g.
 * Winder Buznego reporting to three Creative Strategists) is visible.
 *
 * Click any name to rename in place. Click the "+ Add report" tab on any
 * box to add a new direct report. Names + position auto-save on blur.
 */
export default function OrgChartPage() {
  const { state, ready, upsertTeamMember } = useStore();
  if (!ready) return null;

  const ceo = state.team.find((m) => m.id === "tm_jose") || state.team[0];

  return (
    <div>
      <div className="bracket">05 — Org Map</div>
      <h1 className="section-title mt-1">Org Chart</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/50">
        The reporting structure as an interactive board. CEO at the top,
        direct reports underneath. People with multiple managers appear under
        each one (dashed border on duplicates). Click any name to rename it.
      </p>

      <div className="mt-6 flex justify-center overflow-x-auto pb-12">
        <div className="org-tree min-w-fit">
          {ceo && (
            <TreeNode
              person={ceo}
              state={state}
              parentId={null}
              upsertTeamMember={upsertTeamMember}
              path={new Set()}
            />
          )}
        </div>
      </div>

      <div className="mt-8 card p-4">
        <div className="bracket">How to use</div>
        <ul className="mt-2 space-y-1 text-[13px] text-white/60">
          <li>• Each box is a person. Reports hang below their manager.</li>
          <li>• People with multiple managers appear under each — duplicates have a dashed border.</li>
          <li>• Click any name or position to rename. Changes auto-save.</li>
          <li>• Edit the reporting structure (add/change managers) from <a href="/team" className="text-carbinox underline">Team</a> or via the seed.</li>
        </ul>
      </div>

      {/* Inline org-tree CSS — based on standard CSS-only org chart pattern. */}
      <style jsx global>{`
        .org-tree {
          display: inline-block;
        }
        .org-tree ul {
          padding-top: 22px;
          position: relative;
          display: flex;
          gap: 14px;
          list-style: none;
          margin: 0;
        }
        .org-tree li {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 22px 6px 0 6px;
          position: relative;
        }
        .org-tree li::before,
        .org-tree li::after {
          content: "";
          position: absolute;
          top: 0;
          height: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          width: 50%;
        }
        .org-tree li::before {
          left: 0;
          border-right: 1px solid rgba(255, 255, 255, 0.18);
        }
        .org-tree li::after {
          left: 50%;
        }
        /* the only child has no horizontal lines */
        .org-tree li:only-child::before,
        .org-tree li:only-child::after {
          display: none;
        }
        .org-tree li:only-child {
          padding-top: 0;
        }
        .org-tree li:only-child::before,
        .org-tree li:only-child::after {
          border: 0 none;
        }
        /* leftmost / rightmost children: half-line corner */
        .org-tree li:first-child::before,
        .org-tree li:last-child::after {
          border: 0 none;
        }
        .org-tree li:last-child::before {
          border-right: 1px solid rgba(255, 255, 255, 0.18);
        }
        .org-tree li:first-child::after {
          border-left: 1px solid rgba(255, 255, 255, 0.18);
        }
        /* connector from box to children */
        .org-tree .org-node {
          position: relative;
        }
        .org-tree li > div > .org-children-line {
          position: absolute;
          left: 50%;
          bottom: -22px;
          height: 22px;
          width: 1px;
          background: rgba(255, 255, 255, 0.18);
          display: none;
        }
        .org-tree .has-children > .org-children-line {
          display: block;
        }
      `}</style>
    </div>
  );
}

function TreeNode({
  person,
  state,
  parentId,
  upsertTeamMember,
  path,
}: {
  person: TeamMember;
  state: ReturnType<typeof useStore>["state"];
  /** id of the parent rendering this node (for dedupe / dashed border on dupes) */
  parentId: string | null;
  upsertTeamMember: (m: TeamMember) => void;
  /** Visited set to prevent infinite recursion */
  path: Set<string>;
}) {
  // direct reports of this person (anyone with this person in their managerIds)
  const reports = useMemo(
    () =>
      state.team.filter((m) => {
        const mids = m.managerIds || (m.managerId ? [m.managerId] : []);
        return mids.includes(person.id);
      }),
    [state.team, person.id],
  );

  const dept = state.departments.find((d) => d.id === person.departmentId);
  const accent = dept?.color || "#f8c808";
  const managers = person.managerIds || (person.managerId ? [person.managerId] : []);
  const isShared = managers.length > 1;
  // If this isn't the parent we're rendering under, show as dashed dupe
  const isDuplicate = parentId !== null && managers[0] !== parentId && isShared;

  // Prevent cycles
  const nextPath = new Set(path);
  nextPath.add(person.id);
  const safeReports = reports.filter((r) => !path.has(r.id));

  const node = (
    <div
      className={cx(
        "org-node relative flex w-[220px] items-start gap-2 border bg-jet-900 px-3 py-2.5 text-left transition",
        isDuplicate
          ? "border-dashed border-white/25"
          : "border-white/15",
      )}
      style={{
        borderLeftColor: accent,
        borderLeftWidth: 3,
      }}
    >
      <Avatar name={person.name} size={32} color={accent} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <InlineEdit
            value={person.name}
            onSave={(v) => upsertTeamMember({ ...person, name: v })}
            className="block max-w-full truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white"
          />
          {isShared && (
            <span
              className="chip border-carbinox/40 bg-carbinox/10 text-carbinox px-1 py-0 text-[8px]"
              title={`Reports to ${managers.length} managers`}
            >
              ×{managers.length}
            </span>
          )}
        </div>
        <InlineEdit
          value={person.position}
          onSave={(v) => upsertTeamMember({ ...person, position: v })}
          className="block w-full truncate text-[10px] text-white/55"
        />
        {dept && (
          <div className="mt-0.5 flex items-center gap-1 text-[9px] uppercase tracking-brand text-white/40">
            <span className="h-1 w-1" style={{ background: dept.color }} />
            {dept.name}
          </div>
        )}
      </div>
      {/* line down to children */}
      <span
        className={cx("org-children-line", safeReports.length > 0 && "always")}
      />
    </div>
  );

  if (safeReports.length === 0) {
    return (
      <div className="org-leaf">
        {node}
      </div>
    );
  }

  // Custom wrapper for the connecting line down
  return (
    <div className="org-branch flex flex-col items-center">
      <div className="has-children relative">{node}
        <span className="absolute left-1/2 top-full h-[22px] w-px -translate-x-1/2 bg-white/20" aria-hidden />
      </div>
      <ul>
        {safeReports.map((r) => (
          <li key={r.id + ":" + person.id}>
            <TreeNode
              person={r}
              state={state}
              parentId={person.id}
              upsertTeamMember={upsertTeamMember}
              path={nextPath}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function InlineEdit({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (next: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing && draft !== value) setDraft(value);

  function commit() {
    if (draft.trim() && draft !== value) onSave(draft.trim());
    else setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cx(
          "w-full border border-carbinox/60 bg-jet-900 px-1 outline-none",
          className,
        )}
      />
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cx("group inline-flex items-center gap-1 text-left hover:text-carbinox", className)}
      title="Click to edit"
    >
      {value}
      <Pencil size={9} className="opacity-0 transition group-hover:opacity-60" />
    </button>
  );
}
