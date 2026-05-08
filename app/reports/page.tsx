"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import {
  classifyStatus,
  cx,
  formatValueFull,
  progressRatio,
  statusBg,
  statusLabel,
} from "@/lib/format";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock,
  Download,
  Filter,
} from "lucide-react";

function periodLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function currentPeriodKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Reports page — read-only review of every monthly self-report.
 * Defaults to the current month, with filters by department + person.
 * Each card shows: who, when, every reported value vs. its target, and any
 * notes the team member added.
 */
export default function ReportsPage() {
  const { state, ready } = useStore();
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [personFilter, setPersonFilter] = useState<string>("");

  if (!ready) return null;

  const submissions = state.submissions || [];

  // Available periods (every period with at least one submission, plus current)
  const allPeriods = Array.from(
    new Set([currentPeriodKey(), ...submissions.map((s) => s.periodKey)]),
  ).sort((a, b) => b.localeCompare(a));

  const filtered = submissions
    .filter((s) => s.periodKey === periodKey)
    .filter((s) => {
      if (personFilter && s.ownerId !== personFilter) return false;
      if (deptFilter) {
        const owner = state.team.find((m) => m.id === s.ownerId);
        if (!owner) return false;
        const memberDepts = [
          owner.departmentId,
          ...(owner.additionalDepartmentIds || []),
        ];
        if (!memberDepts.includes(deptFilter)) return false;
      }
      return true;
    })
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  // Submission status by team member for this period
  const targets = state.targets;
  const submitted = new Set(
    submissions.filter((s) => s.periodKey === periodKey).map((s) => s.ownerId),
  );
  const expected = state.team.filter(
    (m) => targets.some((t) => t.ownerId === m.id),
  );
  const submittedCount = expected.filter((m) => submitted.has(m.id)).length;

  // Deadline = 5th of the month after the reporting period
  const [py, pm] = periodKey.split("-").map(Number);
  const deadlineDate = new Date(py, pm, 5); // (pm) is 0-indexed for next month
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysToDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / 86400000);
  const isPastDeadline = today > deadlineDate;

  function copyReminder(memberName: string) {
    const url = typeof window !== "undefined" ? window.location.origin + "/fill" : "";
    const text = `Hi ${memberName.split(" ")[0]} — quick reminder to submit your KPIs for ${periodLabel(periodKey)}. Deadline: ${deadlineDate.toLocaleDateString()}.${url ? `\nFill them out here: ${url}` : ""}`;
    navigator.clipboard.writeText(text).then(() => {
      alert(`Reminder for ${memberName} copied to clipboard. Paste into Slack/email.`);
    });
  }

  function exportCSV() {
    const rows: string[][] = [];
    rows.push(["Person", "Department", "Position", "KPI", "Target", "Reported", "Status", "Notes"]);
    const submissionsForPeriod = submissions.filter((s) => s.periodKey === periodKey);
    for (const sub of submissionsForPeriod) {
      const owner = state.team.find((m) => m.id === sub.ownerId);
      const dept = state.departments.find((d) => d.id === owner?.departmentId);
      const ownedTargets = state.targets.filter((t) => t.ownerId === sub.ownerId);
      for (const t of ownedTargets) {
        const kpi = state.kpis.find((k) => k.id === t.kpiId);
        if (!kpi) continue;
        const reported = sub.values[t.id];
        const ratio = reported !== undefined ? progressRatio(kpi, t, reported) : 0;
        const status = reported ? statusLabel(classifyStatus(ratio)) : "Not reported";
        rows.push([
          owner?.name || "",
          dept?.name || "",
          owner?.position || "",
          kpi.name,
          String(t.target),
          reported !== undefined ? String(reported) : "",
          status,
          sub.notes || "",
        ]);
      }
    }
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbinox-kpis-${periodKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="bracket">07 — Monthly Reports</div>
      <h1 className="section-title mt-1">Reports</h1>
      <p className="mt-2 text-sm text-white/50">
        Self-reported monthly numbers from each team member. Switch months to
        scroll back through history. Use this in 1:1s.
      </p>

      {/* Deadline banner */}
      <div
        className={cx(
          "mt-4 card flex flex-wrap items-center gap-3 p-3",
          isPastDeadline ? "border-bad/40 bg-bad/5" : daysToDeadline <= 3 ? "border-warn/40 bg-warn/5" : "border-white/10",
        )}
      >
        <CalendarClock
          size={16}
          className={isPastDeadline ? "text-bad" : daysToDeadline <= 3 ? "text-warn" : "text-carbinox"}
        />
        <div className="flex-1 text-[12px]">
          <span className="font-heading font-semibold uppercase tracking-brand text-white">
            Deadline · {periodLabel(periodKey)} reports
          </span>
          <span className="ml-2 text-white/55">
            {deadlineDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}{" "}
            {isPastDeadline
              ? `· ${Math.abs(daysToDeadline)} day${Math.abs(daysToDeadline) === 1 ? "" : "s"} overdue`
              : daysToDeadline === 0
                ? "· due today"
                : `· ${daysToDeadline} day${daysToDeadline === 1 ? "" : "s"} remaining`}
          </span>
        </div>
        <button onClick={exportCSV} className="btn-ghost py-1">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Period + filter bar */}
      <div className="card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Period</label>
          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            className="input py-1.5 text-xs"
          >
            {allPeriods.map((p) => (
              <option key={p} value={p}>
                {periodLabel(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="label">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input py-1.5 text-xs"
          >
            <option value="">All</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.kind === "sub" ? "  → " : ""}
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="label">Team member</label>
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="input py-1.5 text-xs"
          >
            <option value="">All</option>
            {state.team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto font-numeric text-[12px] text-white/55">
          <span className="text-white">{submittedCount}</span>
          <span className="text-white/40"> / {expected.length}</span> reports submitted
        </div>
      </div>

      {/* Status grid (who has / hasn't submitted) */}
      <section className="mt-6">
        <div className="bracket">Status — {periodLabel(periodKey)}</div>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {expected.map((m) => {
            const sub = submissions.find(
              (s) => s.ownerId === m.id && s.periodKey === periodKey,
            );
            const dept = state.departments.find((d) => d.id === m.departmentId);
            return (
              <div
                key={m.id}
                className={cx(
                  "card flex items-center gap-3 p-3",
                  sub ? "" : "border-warn/30",
                )}
              >
                <Link href={`/team/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={m.name} color={dept?.color} size={32} avatarUrl={m.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
                      {m.name}
                    </div>
                    <div className="truncate text-[11px] text-white/50">{dept?.name}</div>
                  </div>
                </Link>
                {sub ? (
                  <span className="chip border-ok/60 bg-ok/10 text-ok">
                    <CheckCircle2 size={10} /> Submitted
                  </span>
                ) : (
                  <>
                    <span className="chip border-warn/60 bg-warn/10 text-warn">
                      <Clock size={10} /> Pending
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        copyReminder(m.name);
                      }}
                      className="text-white/40 hover:text-carbinox"
                      title="Copy reminder text to clipboard"
                    >
                      <Bell size={13} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Submitted reports */}
      <section className="mt-10">
        <div className="bracket">Submitted Reports</div>
        {filtered.length === 0 && (
          <div className="card mt-2 p-6 text-center text-sm text-white/50">
            No submissions match the current filters.
          </div>
        )}
        <div className="mt-3 space-y-4">
          {filtered.map((sub) => (
            <SubmissionCard key={sub.id} submissionId={sub.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({ submissionId }: { submissionId: string }) {
  const { state, removeSubmission } = useStore();
  const sub = (state.submissions || []).find((s) => s.id === submissionId);
  if (!sub) return null;
  const member = state.team.find((m) => m.id === sub.ownerId);
  const dept = state.departments.find((d) => d.id === member?.departmentId);
  const accent = dept?.color || "#f8c808";

  const ownedTargets = state.targets.filter((t) => t.ownerId === sub.ownerId);

  return (
    <div className="card relative p-5">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
      />
      <div className="flex items-start gap-4">
        <Avatar name={member?.name || "?"} size={44} color={accent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Link
              href={`/team/${member?.id}`}
              className="font-display text-xl font-extrabold uppercase tracking-brand text-white hover:text-carbinox"
            >
              {member?.name || "Unknown"}
            </Link>
            <span className="chip border-ok/60 bg-ok/10 text-ok">
              <CheckCircle2 size={10} /> Submitted
            </span>
          </div>
          <div className="mt-1 text-[12px] text-white/55">
            {member?.position} · {dept?.name}
            {" · "}
            <span className="text-white/40">
              {new Date(sub.submittedAt).toLocaleString()}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete ${member?.name}'s report for this month?`)) {
              removeSubmission(sub.id);
            }
          }}
          className="text-white/30 hover:text-bad"
          title="Delete submission"
        >
          ✕
        </button>
      </div>

      {/* Reported values vs targets */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-2 py-1.5 font-heading text-[10px] uppercase tracking-brand text-white/50">
                KPI
              </th>
              <th className="px-2 py-1.5 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                Target
              </th>
              <th className="px-2 py-1.5 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                Reported
              </th>
              <th className="px-2 py-1.5 font-heading text-[10px] uppercase tracking-brand text-white/50">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {ownedTargets.map((t) => {
              const kpi = state.kpis.find((k) => k.id === t.kpiId);
              if (!kpi) return null;
              const reported = sub.values[t.id];
              const ratio = reported !== undefined ? progressRatio(kpi, t, reported) : 0;
              const status = classifyStatus(ratio);
              const hasValue = reported !== undefined && reported !== 0;
              return (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="px-2 py-2 text-white">{kpi.name}</td>
                  <td className="px-2 py-2 text-right font-numeric text-white/80">
                    {formatValueFull(t.target, kpi.unit)}
                  </td>
                  <td className="px-2 py-2 text-right font-numeric text-white">
                    {hasValue ? formatValueFull(reported, kpi.unit) : "—"}
                    {hasValue && (
                      <div className="text-[10px] text-white/45">
                        {Math.round(ratio * 100)}% of goal
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {hasValue ? (
                      <span className={`chip ${statusBg(status)}`}>
                        {statusLabel(status)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/30">Not reported</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sub.notes && (
        <div className="mt-4 border border-white/10 bg-white/[0.02] p-3">
          <div className="bracket">Notes</div>
          <div className="mt-1.5 whitespace-pre-wrap text-[13px] text-white/75">
            {sub.notes}
          </div>
        </div>
      )}
    </div>
  );
}
