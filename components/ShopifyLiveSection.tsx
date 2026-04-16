"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useStore } from "@/lib/store";
import { formatValue, formatValueFull } from "@/lib/format";
import { rangeFor, type Timeframe } from "@/lib/timeframe";
import {
  CheckCircle2,
  CircleAlert,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  Receipt,
} from "lucide-react";

type Summary = {
  source: "live" | "simulated";
  note?: string;
  dateRange: { start: string; end: string; days: number };
  samples: {
    date: string;
    revenue: number;
    orders: number;
    fulfillmentsWithinSLA: number;
    paidOrders: number;
  }[];
  totals: {
    revenue: number;
    orders: number;
    aov: number;
    fulfillmentSLAPct: number;
    paidRatioPct: number;
  };
};

export function ShopifyLiveSection({ timeframe }: { timeframe: Timeframe }) {
  const { state } = useStore();
  const shopify = state.integrations.find((i) => i.provider === "shopify");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected =
    shopify?.connected &&
    !!shopify?.credentials?.SHOPIFY_SHOP &&
    !!shopify?.credentials?.SHOPIFY_ADMIN_TOKEN;

  async function load() {
    if (!connected) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [start, end] = rangeFor(timeframe);
      const res = await fetch("/api/shopify/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: shopify?.credentials,
          start,
          end,
        }),
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
  }, [timeframe, connected]);

  if (!connected) {
    return (
      <section className="mt-10">
        <div className="bracket">Shopify — Not Connected</div>
        <div className="card mt-2 flex items-center gap-4 p-5">
          <div className="bg-[#96bf48]/15 p-3 text-[#96bf48]">
            <ShoppingBag size={22} />
          </div>
          <div className="flex-1">
            <div className="font-heading text-[13px] font-semibold uppercase tracking-brand text-white">
              Connect Shopify to see live data here
            </div>
            <div className="mt-1 text-[12px] text-white/50">
              Revenue, AOV, order count, fulfillment SLA, and more will appear
              once credentials are saved.
            </div>
          </div>
          <a href="/integrations" className="btn-primary">
            Connect
          </a>
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
            Pulled directly from the Shopify Admin API
            {summary?.dateRange && (
              <>
                {" · "}
                {summary.dateRange.start} → {summary.dateRange.end}
              </>
            )}
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
          {/* Metric tiles */}
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <MetricTile
              label="Revenue"
              value={`$${formatValue(summary.totals.revenue, "currency").replace("$", "")}`}
              hint={`${summary.dateRange.days} days`}
              icon={<DollarSign size={16} />}
              accent="#96bf48"
            />
            <MetricTile
              label="Orders"
              value={summary.totals.orders.toLocaleString()}
              hint={`${Math.round(summary.totals.orders / Math.max(1, summary.dateRange.days))} / day avg`}
              icon={<ShoppingBag size={16} />}
              accent="#f8c808"
            />
            <MetricTile
              label="AOV"
              value={`$${Math.round(summary.totals.aov).toLocaleString()}`}
              hint="Revenue ÷ Orders"
              icon={<Receipt size={16} />}
              accent="#10a0f8"
            />
            <MetricTile
              label="Fulfillment SLA"
              value={`${summary.totals.fulfillmentSLAPct}%`}
              hint="Within 24h of order"
              icon={<Truck size={16} />}
              accent={summary.totals.fulfillmentSLAPct >= 95 ? "#48f088" : "#f8c808"}
            />
            <MetricTile
              label="Paid Ratio"
              value={`${summary.totals.paidRatioPct}%`}
              hint="Checkout proxy"
              icon={<Package size={16} />}
              accent="#f06020"
            />
          </div>

          {/* Revenue sparkline */}
          <div className="mt-4 card p-5">
            <div className="flex items-center justify-between">
              <div className="bracket text-[#96bf48]">Daily Revenue</div>
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
                    formatter={(v: number) => [
                      `$${v.toLocaleString()}`,
                      "Revenue",
                    ]}
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

          {/* Orders sparkline */}
          <div className="mt-4 card p-5">
            <div className="flex items-center justify-between">
              <div className="bracket">Daily Orders</div>
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
                Pulled live from {shopify?.credentials?.SHOPIFY_SHOP}
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

function MetricTile({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="card relative p-4">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent || "#f8c808" }}
      />
      <div className="flex items-center justify-between">
        <div className="bracket">{label}</div>
        <div className="border border-white/10 bg-white/[0.02] p-1.5 text-white/70">
          {icon}
        </div>
      </div>
      <div className="mt-2 font-numeric text-2xl font-bold text-white">
        {value}
      </div>
      {hint && (
        <div className="mt-1 font-heading text-[10px] uppercase tracking-brand text-white/50">
          {hint}
        </div>
      )}
    </div>
  );
}
