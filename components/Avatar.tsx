import { initials } from "@/lib/format";

/** Carbinox-style avatar: hard-edged square with a corner notch. */
export function Avatar({
  name,
  size = 32,
  color = "#f8c808",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(10, size * 0.38),
    borderColor: color,
    color,
    background: "#0b0b0b",
    // angled corner clip — Carbinox shape-system aesthetic
    clipPath:
      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
  };
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center border font-heading font-semibold uppercase tracking-brand"
    >
      {initials(name)}
    </div>
  );
}
