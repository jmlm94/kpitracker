import React from "react";

/**
 * Carbinox wordmark. The reference logo features a stylized "X" at the end
 * with two angular cuts, echoing the brand's shape system (squares
 * deconstructed with diagonals). Delivered as inline SVG so it scales
 * cleanly and stays monochrome.
 */
export function Logo({ size = 130, color = "#f8f8f8" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={(size * 22) / 130}
      viewBox="0 0 260 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Carbinox"
    >
      <g fill={color}>
        {/* CARBINO — condensed industrial sans */}
        <text
          x="0"
          y="32"
          fontFamily="Morganite, Impact, sans-serif"
          fontWeight="800"
          fontSize="40"
          letterSpacing="1.5"
        >
          CARBINO
        </text>
        {/* Angular X — built from two beveled blades */}
        <g transform="translate(208, 4)">
          <polygon points="0,0 10,0 30,18 30,24 20,36 10,36 0,18" />
          <polygon points="30,0 20,0 0,18 0,24 10,36 20,36 30,18" fill={color} opacity="0" />
          {/* Cleaner version: use two parallelograms crossing */}
          <g>
            <polygon points="0,2 8,2 34,34 26,34" />
            <polygon points="34,2 26,2 0,34 8,34" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * The X-isotype — used as a compact mark in sidebars, avatars, and favicons.
 */
export function LogoMark({ size = 28, color = "#f8c808", bg = "#050505" }: {
  size?: number;
  color?: string;
  bg?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="0" y="0" width="40" height="40" fill={bg} stroke={color} strokeWidth="1.5" />
      <g fill={color}>
        <polygon points="6,8 13,8 34,32 27,32" />
        <polygon points="34,8 27,8 6,32 13,32" />
      </g>
    </svg>
  );
}

export function Wordmark({ color = "#f8f8f8" }: { color?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={26} color="#f8c808" bg="transparent" />
      <div className="leading-none">
        <div
          className="font-display text-[22px] font-extrabold uppercase tracking-brand"
          style={{ color }}
        >
          CARBINOX
        </div>
        <div className="mt-0.5 font-heading text-[9px] font-semibold uppercase tracking-brand text-white/45">
          KPI Command
        </div>
      </div>
    </div>
  );
}
