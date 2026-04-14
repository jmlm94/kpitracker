import React from "react";

export function ProgressRing({
  ratio,
  size = 64,
  stroke = 6,
  label,
  sublabel,
  color,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(1.2, ratio));
  const displayPct = Math.round(clamped * 100);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, clamped) * circumference;

  const auto =
    ratio >= 1.05
      ? "#34d399"
      : ratio >= 0.95
        ? "#34d399"
        : ratio >= 0.8
          ? "#fbbf24"
          : "#f87171";

  const stroke_color = color || auto;

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke_color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="leading-tight">
        <div className="font-display text-xl font-semibold text-white">{displayPct}%</div>
        {label && <div className="text-[11px] uppercase tracking-wider text-white/50">{label}</div>}
        {sublabel && <div className="text-xs text-white/60">{sublabel}</div>}
      </div>
    </div>
  );
}
