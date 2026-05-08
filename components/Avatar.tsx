import { initials } from "@/lib/format";

/** Carbinox-style avatar: shows profile picture if available, initials fallback. */
export function Avatar({
  name,
  size = 32,
  color = "#f8c808",
  avatarUrl,
}: {
  name: string;
  size?: number;
  color?: string;
  avatarUrl?: string;
}) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(10, size * 0.38),
    borderColor: color,
    color,
    background: "#0b0b0b",
    clipPath:
      "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
  };

  if (avatarUrl) {
    return (
      <div style={style} className="shrink-0 overflow-hidden border">
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.innerHTML =
              `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:600">${initials(name)}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center border font-heading font-semibold uppercase tracking-brand"
    >
      {initials(name)}
    </div>
  );
}
