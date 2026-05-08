"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { ClipboardCheck, Check } from "lucide-react";
import type { TeamMember } from "@/lib/types";

function currentPeriodKey(): string {
  const d = new Date();
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
 * Compact "Monthly Report" card on team profiles. Links to /fill with the
 * team member pre-selected instead of expanding inline.
 */
export function MonthlyReportForm({ member }: { member: TeamMember }) {
  const { state } = useStore();
  const periodKey = currentPeriodKey();
  const targets = state.targets.filter((t) => t.ownerId === member.id);
  const existing = (state.submissions || []).find(
    (s) => s.ownerId === member.id && s.periodKey === periodKey,
  );

  if (targets.length === 0) return null;

  return (
    <Link
      href={`/fill?user=${member.id}`}
      className="card mt-4 flex items-center gap-4 border-carbinox/40 bg-carbinox/[0.07] p-4 transition hover:bg-carbinox/[0.12]"
    >
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
      {existing ? (
        <span className="chip border-ok/60 bg-ok/10 text-ok">
          <Check size={10} /> Submitted
        </span>
      ) : (
        <span className="chip border-carbinox/60 bg-carbinox/10 text-carbinox">
          Fill now →
        </span>
      )}
    </Link>
  );
}
