import { initials } from "@/lib/format";

export function Avatar({
  name,
  size = 32,
  color = "#ff6a3d",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, size * 0.38),
    background: `linear-gradient(135deg, ${color}33, ${color}11)`,
    borderColor: `${color}55`,
    color: "#fff",
  };
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full border font-semibold"
    >
      {initials(name)}
    </div>
  );
}
