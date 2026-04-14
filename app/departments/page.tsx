"use client";

import { useStore } from "@/lib/store";
import { DepartmentCard } from "@/components/DepartmentCard";

export default function DepartmentsPage() {
  const { state, ready } = useStore();
  if (!ready) return null;
  return (
    <div>
      <div className="bracket">02 — The Machine</div>
      <h1 className="section-title mt-1">Departments</h1>
      <p className="mt-2 text-sm text-white/50">
        Every team at Carbinox, with live progress toward this month's targets.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.departments.map((d) => (
          <DepartmentCard key={d.id} department={d} state={state} />
        ))}
      </div>
    </div>
  );
}
