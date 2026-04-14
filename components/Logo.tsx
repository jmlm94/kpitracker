import React from "react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cx-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff6a3d" />
            <stop offset="1" stopColor="#ff2e63" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="10" fill="#0b0f16" stroke="url(#cx-g)" strokeWidth="1.5" />
        <path
          d="M12 26V14m0 0h10m-10 12h10m5-12v12m0-12 6 6m0 0 -6 6m6-6H23"
          stroke="url(#cx-g)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="leading-tight">
        <div className="font-display text-[15px] font-semibold tracking-tight text-white">
          Carbinox
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          KPI Tracker
        </div>
      </div>
    </div>
  );
}
