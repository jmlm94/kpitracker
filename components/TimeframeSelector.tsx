"use client";

import { cx } from "@/lib/format";
import { TIMEFRAMES, type Timeframe } from "@/lib/timeframe";

export function TimeframeSelector({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
}) {
  return (
    <div className="inline-flex flex-wrap border border-white/10 bg-jet-900 p-0.5">
      {TIMEFRAMES.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cx(
              "px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-brand transition",
              active
                ? "bg-carbinox text-jet-950"
                : "text-white/60 hover:text-white",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
