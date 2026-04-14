"use client";

import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";

export function Topbar() {
  const { state, setProgress } = useStore();
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState(false);

  async function refresh() {
    setRunning(true);
    try {
      const res = await fetch("/api/sync/all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kpis: state.kpis, targets: state.targets }),
      });
      const data = (await res.json()) as {
        progress: Record<string, { today: number; last7: number; mtd: number; samples: { date: string; value: number }[] }>;
      };
      const now = new Date().toISOString();
      Object.entries(data.progress).forEach(([targetId, p]) => {
        setProgress(targetId, { ...p, targetId, updatedAt: now });
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    } catch {
      // swallow
    } finally {
      setRunning(false);
    }
  }

  const lastUpdated = Object.values(state.progress).reduce<string | undefined>(
    (acc, p) => (!acc || (p.updatedAt && p.updatedAt > acc) ? p.updatedAt : acc),
    undefined,
  );

  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-jet-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <div className="bracket">Command Center</div>
          <div className="mt-1 font-display text-2xl font-extrabold uppercase leading-none tracking-brand text-white">
            Company KPIs — <span className="text-carbinox">{month}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden font-numeric text-[11px] uppercase tracking-brand text-white/50 md:inline">
              Last sync · {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={running}
            className="btn-primary disabled:opacity-50"
          >
            {flash ? (
              <CheckCircle2 size={14} />
            ) : (
              <RefreshCw size={14} className={running ? "animate-spin" : ""} />
            )}
            {running ? "Syncing…" : flash ? "Synced" : "Sync now"}
          </button>
        </div>
      </div>
    </header>
  );
}
