"use client";

import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function Topbar() {
  const { state } = useStore();
  const [savedFlash, setSavedFlash] = useState(false);
  const firstPassRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (firstPassRef.current) {
      firstPassRef.current = false;
      return;
    }
    setSavedFlash(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSavedFlash(false), 1400);
  }, [state]);

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
          {savedFlash && (
            <span className="chip border-ok/60 bg-ok/10 text-ok">
              <Save size={10} /> Saved
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
