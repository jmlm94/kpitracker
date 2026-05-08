import { type Status, statusLabel } from "@/lib/format";

/** Carbinox status chip — flat solid, no gradients, dense all-caps text. */
export function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    ahead: "border-ok bg-ok/15 text-ok",
    on_track: "border-ok bg-ok/10 text-ok",
    at_risk: "border-warn bg-warn/15 text-warn",
    off_track: "border-bad bg-bad/15 text-bad",
    not_reported: "border-white/20 bg-white/5 text-white/50",
  };
  return (
    <span className={`chip ${map[status]}`}>
      <span className="h-1.5 w-1.5 bg-current" />
      {statusLabel(status)}
    </span>
  );
}
