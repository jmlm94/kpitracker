"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function EmptyOnboarding() {
  return (
    <div className="card mt-2 flex items-center justify-between gap-6 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-accent/15 p-3 text-accent">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="font-display text-lg font-semibold text-white">
            Finish setting up Carbinox
          </div>
          <div className="mt-1 max-w-xl text-sm text-white/60">
            Add your departments, team members, KPIs, and targets — then connect
            your data sources. Once connected, progress refreshes automatically
            every morning.
          </div>
        </div>
      </div>
      <Link href="/onboarding" className="btn-primary shrink-0">
        Start onboarding <ArrowRight size={14} />
      </Link>
    </div>
  );
}
