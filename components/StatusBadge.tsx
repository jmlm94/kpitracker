import { type Status, statusBg, statusLabel } from "@/lib/format";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`chip ${statusBg(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
