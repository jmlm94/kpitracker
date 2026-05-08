"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import {
  childDepartments,
  membersOfDepartment,
} from "@/lib/hierarchy";
import { cx, formatValueFull } from "@/lib/format";
import type { Department, MonthlySubmission, TeamMember } from "@/lib/types";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  PenLine,
  RotateCcw,
  Search,
  User,
} from "lucide-react";

const ACTIVE_KEY = "carbinox-kpi-tracker:active_member";

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

export default function FillPage() {
  const { state, ready } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Restore active member from URL param (for /fill?user=tm_xxx) or localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const userParam = params.get("user");
        if (userParam && state.team.some((m) => m.id === userParam)) {
          setActiveId(userParam);
          window.localStorage.setItem(ACTIVE_KEY, userParam);
          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete("user");
          window.history.replaceState({}, "", url.toString());
          return;
        }
        const raw = window.localStorage.getItem(ACTIVE_KEY);
        if (raw) setActiveId(raw);
      }
    } catch {}
  }, [state.team]);

  function logIn(id: string) {
    setActiveId(id);
    try {
      window.localStorage.setItem(ACTIVE_KEY, id);
    } catch {}
  }
  function logOut() {
    setActiveId(null);
    try {
      window.localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }

  if (!ready) return null;

  const activeMember = state.team.find((m) => m.id === activeId);
  const [pinRequired, setPinRequired] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  function handlePick(id: string) {
    const person = state.team.find((m) => m.id === id);
    if (person?.pin) {
      setPendingId(id);
      setPinRequired(true);
      setPinInput("");
      setPinError(false);
    } else {
      logIn(id);
    }
  }
  function verifyPin() {
    const person = state.team.find((m) => m.id === pendingId);
    if (person && pinInput === person.pin) {
      logIn(person.id);
      setPinRequired(false);
      setPendingId(null);
    } else {
      setPinError(true);
    }
  }

  return (
    <div>
      <div className="bracket text-carbinox">Self Service</div>
      <h1 className="section-title mt-1 text-carbinox">Fill KPIs Here</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Submit your monthly numbers. Pick your name to log in, fill out your
        KPI form, and hit submit. Your numbers update the dashboard
        immediately.
      </p>

      {pinRequired && (
        <div className="card crosshair mt-6 border-carbinox/40 bg-carbinox/[0.05] p-6">
          <div className="bracket text-carbinox">Enter your PIN</div>
          <p className="mt-2 text-sm text-white/60">
            {state.team.find((m) => m.id === pendingId)?.name} has a PIN set. Enter it to continue.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={(e) => e.key === "Enter" && verifyPin()}
              placeholder="PIN"
              className="input w-32 text-center font-numeric text-lg tracking-widest"
              autoFocus
            />
            <button onClick={verifyPin} className="btn-primary">Verify</button>
            <button
              onClick={() => { setPinRequired(false); setPendingId(null); }}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
          {pinError && (
            <div className="mt-2 text-sm text-bad">Wrong PIN. Try again.</div>
          )}
        </div>
      )}

      {!activeMember && !pinRequired ? (
        <NamePicker team={state.team} departments={state.departments} onPick={handlePick} />
      ) : activeMember ? (
        <FillForm member={activeMember} onLogOut={logOut} />
      ) : null}
    </div>
  );
}

function NamePicker({
  team,
  departments,
  onPick,
}: {
  team: TeamMember[];
  departments: Department[];
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = query
    ? team.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.position.toLowerCase().includes(query.toLowerCase()),
      )
    : team;

  return (
    <div className="card crosshair mt-6 border-carbinox/40 bg-carbinox/[0.05] p-6">
      <div className="flex items-center gap-3">
        <div className="bg-carbinox p-2 text-jet-950">
          <LogIn size={18} />
        </div>
        <div>
          <div className="font-heading text-[12px] font-semibold uppercase tracking-brand text-carbinox">
            Step 1 — Find your name
          </div>
          <div className="text-[12px] text-white/60">
            Click your name below to log in. We'll remember you on this device.
          </div>
        </div>
      </div>

      <div className="mt-4 relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your name…"
          className="input w-full pl-9"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((m) => {
          const dept = departments.find((d) => d.id === m.departmentId);
          return (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              className="group flex items-center gap-3 border border-white/10 bg-jet-900 p-3 text-left transition hover:border-carbinox hover:bg-carbinox/5"
            >
              <Avatar
                name={m.name}
                size={36}
                color={dept?.color}
                avatarUrl={m.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                  {m.name}
                </div>
                <div className="truncate text-[11px] text-white/50">{m.position}</div>
              </div>
              <ChevronRight
                size={14}
                className="text-white/30 group-hover:text-carbinox"
              />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full p-6 text-center text-sm text-white/50">
            No matches.
          </div>
        )}
      </div>
    </div>
  );
}

function FillForm({
  member,
  onLogOut,
}: {
  member: TeamMember;
  onLogOut: () => void;
}) {
  const { state, upsertSubmission } = useStore();
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const [flash, setFlash] = useState(false);

  const dept = state.departments.find((d) => d.id === member.departmentId);
  const targets = state.targets.filter((t) => t.ownerId === member.id);

  const existing = useMemo(
    () =>
      (state.submissions || []).find(
        (s) => s.ownerId === member.id && s.periodKey === periodKey,
      ),
    [state.submissions, member.id, periodKey],
  );

  const initial = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const t of targets) out[t.id] = existing?.values[t.id] ?? 0;
    return out;
  }, [targets, existing]);

  const DRAFT_KEY = `carbinox-kpi-draft:${member.id}:${periodKey}`;
  const [draft, setDraft] = useState<Record<string, number>>(initial);
  const [notes, setNotes] = useState(existing?.notes || "");

  // Re-seed draft only when the (member, period) changes or when a new
  // submission was just persisted (existing.submittedAt). Without this
  // gate the effect re-fired on every keystroke and reset what the user
  // had just typed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.values) setDraft(parsed.values);
        if (parsed.notes) setNotes(parsed.notes);
        return;
      }
    } catch {}
    setDraft(initial);
    setNotes(existing?.notes || "");
  }, [DRAFT_KEY, existing?.submittedAt]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ values: draft, notes }));
      } catch {}
    }, 5000);
    return () => clearInterval(timer);
  }, [DRAFT_KEY, draft, notes]);

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(initial) ||
    notes !== (existing?.notes || "");
  const filledCount = Object.values(draft).filter((v) => v !== 0 && v !== null).length;
  const totalKpis = targets.length;

  // Group KPIs by department
  const targetsByDept = useMemo(() => {
    const groups = new Map<string, typeof targets>();
    for (const t of targets) {
      const key = t.departmentId || "__unassigned__";
      const list = groups.get(key) || [];
      list.push(t);
      groups.set(key, list);
    }
    return groups;
  }, [targets]);

  function update(id: string, value: number) {
    setDraft((d) => ({ ...d, [id]: value }));
  }
  function save() {
    // Round values to clean precision before storing (#5)
    const cleanValues: Record<string, number> = {};
    for (const [tid, val] of Object.entries(draft)) {
      const t = targets.find((x) => x.id === tid);
      const kpi = t ? state.kpis.find((k) => k.id === t.kpiId) : null;
      cleanValues[tid] = kpi
        ? Math.round(val * 10000) / 10000 // 4 decimal max, avoids float32 artifacts
        : val;
    }
    const sub: MonthlySubmission = {
      id:
        existing?.id ||
        `sub_${member.id}_${periodKey}_${Date.now().toString(36)}`,
      ownerId: member.id,
      periodKey,
      submittedAt: new Date().toISOString(),
      values: cleanValues,
      notes: notes.trim() || undefined,
    };
    upsertSubmission(sub);
    // Clear the draft since it's been submitted
    try { window.localStorage.removeItem(DRAFT_KEY); } catch {}
    setFlash(true);
    setTimeout(() => setFlash(false), 2500);
  }

  return (
    <div>
      {/* Logged in as */}
      <div className="card crosshair mt-6 flex flex-wrap items-center gap-4 border-carbinox/40 bg-carbinox/[0.05] p-4">
        <Avatar
          name={member.name}
          size={48}
          color={dept?.color}
          avatarUrl={member.avatarUrl}
        />
        <div className="flex-1">
          <div className="bracket text-carbinox">Logged in as</div>
          <div className="mt-0.5 font-display text-xl font-extrabold uppercase tracking-brand text-white">
            {member.name}
          </div>
          <div className="text-[12px] text-white/60">{member.position}</div>
        </div>
        <button onClick={onLogOut} className="btn-ghost">
          <LogOut size={13} /> Switch user
        </button>
      </div>

      {/* Period switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="bracket">Reporting period</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPeriodKey((k) => shiftPeriod(k, -1))}
            className="btn-ghost py-1 text-xs"
          >
            ← Previous
          </button>
          <div className="px-3 font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
            {periodLabel(periodKey)}
          </div>
          <button
            onClick={() => setPeriodKey((k) => shiftPeriod(k, +1))}
            disabled={periodKey >= currentPeriodKey()}
            className="btn-ghost py-1 text-xs disabled:opacity-40"
          >
            Next →
          </button>
        </div>
        {periodKey !== currentPeriodKey() && (
          <button
            onClick={() => setPeriodKey(currentPeriodKey())}
            className="btn-ghost py-1 text-xs"
          >
            This month
          </button>
        )}
        {existing && (
          <span className="ml-auto chip border-ok/60 bg-ok/10 text-ok">
            <Check size={10} /> Submitted{" "}
            {new Date(existing.submittedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* KPI form, grouped by department */}
      <div className="mt-4 space-y-6">
        {targets.length === 0 && (
          <div className="card p-8 text-center text-sm text-white/50">
            You don't own any KPIs yet. Talk to your manager.
          </div>
        )}
        {Array.from(targetsByDept.entries()).map(([deptId, list]) => {
          const d =
            deptId === "__unassigned__"
              ? null
              : state.departments.find((x) => x.id === deptId);
          return (
            <div key={deptId} className="card p-5">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <span
                  className="h-2 w-2"
                  style={{ background: d?.color || "#888" }}
                />
                <span className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                  {d?.name || "Other"}
                </span>
                <span className="font-numeric text-[10px] text-white/40">
                  ({list.length})
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {list.map((t) => {
                  const kpi = state.kpis.find((k) => k.id === t.kpiId);
                  if (!kpi) return null;
                  const value = draft[t.id] ?? 0;
                  return (
                    <div
                      key={t.id}
                      className="grid grid-cols-12 items-center gap-2 border border-white/10 bg-jet-900 p-3"
                    >
                      <div className="col-span-7 min-w-0">
                        <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                          {kpi.name}
                        </div>
                        {kpi.description && (
                          <div className="mt-0.5 line-clamp-2 text-[10px] text-white/45">
                            {kpi.description}
                          </div>
                        )}
                        <div className="mt-1 text-[10px] text-white/55">
                          Target: {formatValueFull(t.target, kpi.unit)}
                          {kpi.direction === "lower_is_better"
                            ? " · ↓ lower is better"
                            : " · ↑ higher is better"}
                        </div>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => update(t.id, Number(e.target.value))}
                        className="input col-span-3 px-1.5 py-1.5 text-right font-numeric text-[14px]"
                        placeholder="0"
                      />
                      <div className="col-span-2 text-right text-[10px] text-white/45">
                        {kpi.unit === "currency"
                          ? "USD"
                          : kpi.unit === "percent"
                            ? "%"
                            : kpi.unit === "ratio"
                              ? "x"
                              : kpi.unit === "duration_s"
                                ? "sec"
                                : "#"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {targets.length > 0 && (
        <div className="card mt-6 p-5">
          <div className="bracket">Notes (optional)</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Context, blockers, wins, asks for next month…"
            className="input mt-2 w-full resize-none text-sm"
          />
        </div>
      )}

      {/* Submit */}
      {targets.length > 0 && (
        <div className="sticky bottom-0 mt-6 border-t border-carbinox/30 bg-jet-950/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="text-[12px] text-white/55">
              {existing
                ? `Last submitted ${new Date(existing.submittedAt).toLocaleString()}`
                : "Not submitted yet"}
              {filledCount === 0 && !existing && (
                <span className="ml-2 text-warn">Fill at least 1 KPI to submit</span>
              )}
              {filledCount > 0 && (
                <span className="ml-2 text-white/40">{filledCount}/{totalKpis} filled</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {flash && (
                <span className="chip border-ok/60 bg-ok/10 text-ok">
                  <Check size={10} /> Saved!
                </span>
              )}
              {dirty && !flash && (
                <span className="chip border-carbinox/60 bg-carbinox/10 text-carbinox">
                  Unsaved changes
                </span>
              )}
              {!dirty && !flash && existing && (
                <span className="chip border-ok/40 bg-ok/5 text-ok">
                  <Check size={10} /> Up to date
                </span>
              )}
              <button
                onClick={() => {
                  if (confirm("Clear all values back to 0?")) {
                    const zeroed: Record<string, number> = {};
                    for (const t of targets) zeroed[t.id] = 0;
                    setDraft(zeroed);
                    setNotes("");
                  }
                }}
                className="btn-ghost"
              >
                <RotateCcw size={12} /> Reset
              </button>
              <button
                onClick={save}
                disabled={!dirty && !!existing}
                className="btn-primary disabled:opacity-40"
              >
                <Check size={14} />
                {existing ? "Update report" : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
