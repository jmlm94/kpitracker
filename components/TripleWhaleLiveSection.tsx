"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  CheckCircle2,
  CircleAlert,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { Timeframe } from "@/lib/timeframe";

type ChannelRow = {
  channel: string;
  label: string;
  roas: number;
  spend: number;
  revenue: number;
  cpa: number;
  ctr: number;
};

type TWSummary = {
  source: "live" | "simulated";
  note?: string;
  windows: Record<string, ChannelRow[]>;
};

const WINDOW_TABS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7d", label: "7 Days" },
  { key: "last_14d", label: "14 Days" },
  { key: "last_30d", label: "30 Days" },
] as const;

export function TripleWhaleLiveSection({ timeframe: _ }: { timeframe: Timeframe }) {
  const { state } = useStore();
  const tw = state.integrations.find((i) => i.provider === "triplewhale");
  const [summary, setSummary] = useState<TWSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("last_7d");

  const hasCreds = !!tw?.credentials?.TRIPLEWHALE_API_KEY;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/triplewhale/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentials: tw?.credentials }),
      });
      const data = (await res.json()) as TWSummary;
      setSummary(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notConnected = summary && summary.source !== "live" && !hasCreds;

  if (notConnected) {
    return (
      <section className="mt-10">
        <div className="bracket">Triple Whale — Not Connected</div>
        <div className="card mt-2 flex items-center gap-4 p-5">
          <div className="bg-[#4f46e5]/15 p-3 text-[#4f46e5]">
            <Zap size={22} />
          </div>
          <div className="flex-1">
            <div className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
              Connect Triple Whale to see ad performance here
            </div>
            <div className="mt-1 text-[12px] text-white/50">
              ROAS, spend, revenue, CPA, and CTR across Meta, Google, TikTok,
              Snap, and AppLovin.
            </div>
          </div>
          <a href="/integrations" className="btn-primary">
            Connect
          </a>
        </div>
      </section>
    );
  }

  const rows = summary?.windows[tab] || [];

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="bracket text-[#4f46e5]">Triple Whale — Live</div>
          <h2 className="section-title mt-1">Ad Performance</h2>
          <p className="mt-1 text-sm text-white/50">
            Channel-level advertising metrics from Triple Whale
            {summary?.source === "simulated" && (
              <span className="ml-2 text-warn">(simulated fallback)</span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-ghost"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Time-window tabs */}
      <div className="mt-4 inline-flex border border-white/10 bg-jet-900 p-0.5">
        {WINDOW_TABS.map((w) => (
          <button
            key={w.key}
            onClick={() => setTab(w.key)}
            className={`px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-brand transition ${
              tab === w.key
                ? "bg-[#4f46e5] text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Channel table */}
      {summary && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-2 text-left font-heading text-[10px] uppercase tracking-brand text-white/50">
                  Channel
                </th>
                <th className="px-4 py-2 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                  ROAS
                </th>
                <th className="px-4 py-2 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                  Spend
                </th>
                <th className="px-4 py-2 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                  Revenue
                </th>
                <th className="px-4 py-2 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                  CPA
                </th>
                <th className="px-4 py-2 text-right font-heading text-[10px] uppercase tracking-brand text-white/50">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isBlended = r.channel === "all";
                return (
                  <tr
                    key={r.channel}
                    className={`border-b border-white/5 ${
                      isBlended ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`font-heading text-[12px] font-semibold uppercase tracking-brand ${
                          isBlended ? "text-carbinox" : "text-white"
                        }`}
                      >
                        {r.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-numeric text-white">
                      {r.roas.toFixed(2)}x
                    </td>
                    <td className="px-4 py-3 text-right font-numeric text-white">
                      ${r.spend.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-numeric text-white">
                      ${r.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-numeric text-white">
                      ${r.cpa.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-numeric text-white">
                      {r.ctr.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
        {summary?.source === "live" ? (
          <>
            <CheckCircle2 size={12} className="text-ok" />
            Pulled live from Triple Whale
          </>
        ) : (
          <>
            <CircleAlert size={12} className="text-warn" />
            {summary?.note || "Showing simulated data"}
          </>
        )}
      </div>
    </section>
  );
}
