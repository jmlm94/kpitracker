"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function EmptyOnboarding() {
  return (
    <div className="card crosshair x-pattern mt-2 flex items-center justify-between gap-6 border-carbinox/40 p-6">
      <div>
        <div className="bracket">Setup Required</div>
        <div className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-brand text-white">
          Finish Configuring <span className="text-carbinox">Carbinox</span>
        </div>
        <div className="mt-2 max-w-xl text-sm text-white/60">
          Add departments, team members, KPIs, and targets — then connect your
          data sources. Progress refreshes automatically every morning.
        </div>
      </div>
      <Link href="/onboarding" className="btn-primary shrink-0">
        Start Onboarding <ArrowRight size={14} />
      </Link>
    </div>
  );
}
