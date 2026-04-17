"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useStore } from "@/lib/store";
import { formatValue } from "@/lib/format";
import type { Timeframe } from "@/lib/timeframe";
import {
  CheckCircle2,
  CircleAlert,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

type Summary = {
  source: "live" | "simulated";
  note?: string;
  dateRange: { start: string; end: string; days: number };
  samples: {
    date: string;
    revenue: number;
    orders: number;
    returns: number;
    sessions: number;
    fulfillmentsWithinSLA: number;
    paidOrders: number;
  }[];
  windows: Record<
    string,
    {
      revenue: number;
      orders: number;
      returns: number;
      aov: number;
      conversionRate: number | null;
    }
  >;
};

const WINDOW_COLUMNS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7d", label: "7 Days" },
  { key: "last_14d", label: "14 Days" },
  { key: "last_30d", label: "30 Days" },
] as const;

const METRIC_ROWS = [
  { key: "revenue", label: "Revenue", kind: "currency" as const },
  { key: "orders", label: "Orders", kind: "number" as const },
  { key: "aov", label: "AOV", kind: "currency" as const },
  { key: "returns", label: "Returns", kind: "number" as const },
  { key: "conversionRate", label: "Conversion Rate", kind: "percent" as const },
];

export function ShopifyLiveSection({ timeframe: _ }: { timeframe: Timeframe }) {
  const { state } = useStore();
  const shopify = state.integrations.find((i) => i.provider === "shopify");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasClientCreds =
    !!shopify?.credentials?.SHOPIFY_SHOP &&
    !!shopify?.credentials?.SHOPIFY_ADMIN_TOKEN;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shopify/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentials: shopify?.credentials }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Summary;
      setSummary(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load Shopify summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLive = summary?.source === "live";
  // Show the "Connect" prompt only if we've loaded AND got simulated data AND
  // have no client creds (= no env vars + no localStorage creds)
  const notConnected = summary && !isLive && !hasClientCreds;

  if (notConnected) {
    return (
      <section className="mt-10">
        <div className="bracket">Shopify — Not Connected</div>
        <div className="card mt-2 flex items-center gap-4 p-5">
          <div className="bg-[#96bf48]/15 p-3 text-[#96bf48]">
            <ShoppingBag size={22} />
          </div>
          <div className="flex-1">
            <div className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
              Connect Shopify via Vercel env vars
            </div>
            <div className="mt-1 text-[12px] text-white/50">
              Set <span className="kbd">SHOPIFY_SHOP</span> and{" "}
              <span className="kbd">SHOPIFY_ADMIN_TOKEN</span> in Vercel →
              Settings → Environment Variables, then redeploy.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="bracket text-[#96bf48]">Shopify — Live</div>
          <h2 className="section-title mt-1">Store Metrics</h2>
          <p className="mt-1 text-sm text-white/50">
            Pulled directly from the Shopify Admin API · compared across time
            windows
            {summary?.source === "simulated" && (
              <span className="ml-2 text-warn">(simulated fallback)</span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="btn-ghost"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 border border-bad/30 bg-bad/10 p-3 text-xs text-bad">
          <CircleAlert size={14} /> {error}
        </div>
      )}

      {summary && (
        <>
          {/* Metric × Timeframe matrix */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 border-b border-white/10 bg-jet-900 px-4 py-2 text-left font-heading text-[10px] uppercase tracking-brand text-white/50">
                    Metric
                  </th>
                  {WINDOW_COLUMNS.map((w) => (
                    <th
                      key={w.key}
                      className="border-b border-white/10 bg-jet-900 px-4 py-2 text-right font-heading text-[10px] uppercase tracking-brand text-white/50"
                    >
                      {w.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRIC_ROWS.map((m, i) => {
                  const isLast = i === METRIC_ROWS.length - 1;
                  return (
                    <tr key={m.key}>
                      <td
                        className={`sticky left-0 z-10 bg-jet-900 px-4 py-3 font-heading text-[12px] font-semibold uppercase tracking-brand text-white ${
                          isLast ? "" : "border-b border-white/5"
                        }`}
                      >
                        {m.label}
                      </td>
                      {WINDOW_COLUMNS.map((w) => {
                        const win = summary.windows[w.key];
                        const value = win ? (win as any)[m.key] : null;
                        return (
                          <td
                            key={w.key}
                            className={`px-4 py-3 text-right font-numeric text-base text-white ${
                              isLast ? "" : "border-b border-white/5"
                            }`}
                          >
                            {formatMetric(value, m.kind)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Daily revenue chart */}
          <div className="mt-4 card p-5">
            <div className="flex items-center justify-between">
              <div className="bracket text-[#96bf48]">Daily Revenue · Last 30 Days</div>
              <div className="font-numeric text-[11px] text-white/50">
                Peak: $
                {Math.max(...summary.samples.map((s) => s.revenue)).toLocaleString()}
              </div>
            </div>
            <div className="mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.samples}>
                  <defs>
                    <linearGradient id="rev-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#96bf48" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#96bf48" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <Tooltip
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                    cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#96bf48"
                    strokeWidth={1.8}
                    fill="url(#rev-g)"
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily orders chart */}
          <div className="mt-4 card p-5">
            <div className="flex items-center justify-between">
              <div className="bracket">Daily Orders · Last 30 Days</div>
              <div className="font-numeric text-[11px] text-white/50">
                Peak:{" "}
                {Math.max(...summary.samples.map((s) => s.orders)).toLocaleString()}
              </div>
            </div>
            <div className="mt-2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.samples}>
                  <defs>
                    <linearGradient id="ord-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f8c808" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f8c808" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString(), "Orders"]}
                    cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#f8c808"
                    strokeWidth={1.8}
                    fill="url(#ord-g)"
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
            {summary.source === "live" ? (
              <>
                <CheckCircle2 size={12} className="text-ok" />
                Pulled live from Shopify · 30 days of history
              </>
            ) : (
              <>
                <CircleAlert size={12} className="text-warn" />
                {summary.note}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function formatMetric(
  value: number | null | undefined,
  kind: "currency" | "number" | "percent",
): string {
  if (value === null || value === undefined) return "—";
  if (kind === "currency") {
    if (value === 0) return "$0";
    return `$${formatValue(value, "currency").replace("$", "")}`;
  }
  if (kind === "percent") return `${value.toFixed(2)}%`;
  return value.toLocaleString();
}
