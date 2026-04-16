"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Eye,
  EyeOff,
  Plug,
  RefreshCw,
  Save,
  ShoppingBag,
} from "lucide-react";
import { cx } from "@/lib/format";

const SHOPIFY_SCOPES = [
  "read_orders",
  "read_products",
  "read_inventory",
  "read_fulfillments",
  "read_analytics",
];

export default function IntegrationsPage() {
  const { state, ready, updateIntegration, setProgress } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  if (!ready) return null;

  async function testSync(provider: string) {
    setBusy(provider);
    try {
      const integration = state.integrations.find((i) => i.provider === provider);
      const res = await fetch(`/api/sync/${provider}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kpis: state.kpis,
          targets: state.targets,
          credentials: integration?.credentials,
        }),
      });
      const data = await res.json();
      const now = new Date().toISOString();
      if (data?.progress) {
        Object.entries<any>(data.progress).forEach(([tid, p]) => {
          setProgress(tid, { ...p, targetId: tid, updatedAt: now });
        });
      }
      updateIntegration(provider, {
        lastSyncAt: now,
        lastSyncStatus: data?.ok ? "ok" : "error",
        lastSyncMessage: data?.message || (data?.ok ? "Synced" : "Sync failed"),
      });
    } catch (e: any) {
      updateIntegration(provider, {
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "error",
        lastSyncMessage: e?.message || "Network error",
      });
    } finally {
      setBusy(null);
    }
  }

  const shopify = state.integrations.find((i) => i.provider === "shopify");

  return (
    <div>
      <div className="bracket">06 — Data Feeds</div>
      <h1 className="section-title mt-1">Integrations</h1>
      <p className="mt-2 text-sm text-white/50">
        Connect Carbinox's data sources. Enter credentials below or set
        environment variables in Vercel for production.
      </p>

      {/* Shopify — featured card with full setup flow */}
      {shopify && (
        <ShopifyCard
          integration={shopify}
          updateIntegration={updateIntegration}
          testSync={() => testSync("shopify")}
          busy={busy === "shopify"}
        />
      )}

      {/* Other integrations — standard cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.integrations
          .filter((i) => i.provider !== "shopify")
          .map((i) => {
            const ok = i.lastSyncStatus === "ok";
            const err = i.lastSyncStatus === "error";
            return (
              <div key={i.provider} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cx(
                        "p-2",
                        i.connected
                          ? "bg-carbinox/15 text-carbinox"
                          : "bg-white/5 text-white/60",
                      )}
                    >
                      <Plug size={18} />
                    </div>
                    <div>
                      <div className="font-display text-lg font-semibold text-white">
                        {i.label}
                      </div>
                      <div className="text-xs text-white/50">
                        {i.connected ? "Active" : "Not connected"}
                        {i.lastSyncAt && (
                          <>
                            {" · Last sync "}
                            {new Date(i.lastSyncAt).toLocaleString()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Toggle
                    checked={i.connected}
                    onChange={(v) => updateIntegration(i.provider, { connected: v })}
                  />
                </div>

                <div className="mt-4">
                  <div className="bracket">Required env vars</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {i.envVarsExpected.map((v) => (
                      <span key={v} className="kbd">{v}</span>
                    ))}
                  </div>
                </div>

                {i.lastSyncMessage && (
                  <SyncMessage ok={ok} err={err} message={i.lastSyncMessage} />
                )}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="btn-ghost"
                    onClick={() => testSync(i.provider)}
                    disabled={busy === i.provider}
                  >
                    <RefreshCw
                      size={13}
                      className={busy === i.provider ? "animate-spin" : ""}
                    />
                    {busy === i.provider ? "Testing…" : "Test sync"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function ShopifyCard({
  integration,
  updateIntegration,
  testSync,
  busy,
}: {
  integration: NonNullable<ReturnType<typeof useStore>["state"]["integrations"][0]>;
  updateIntegration: (provider: string, patch: any) => void;
  testSync: () => void;
  busy: boolean;
}) {
  const creds = integration.credentials || {};
  const [shop, setShop] = useState(creds.SHOPIFY_SHOP || "");
  const [token, setToken] = useState(creds.SHOPIFY_ADMIN_TOKEN || "");
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);

  const ok = integration.lastSyncStatus === "ok";
  const err = integration.lastSyncStatus === "error";
  const hasCredentials = !!(shop && token);
  const dirty =
    shop !== (creds.SHOPIFY_SHOP || "") ||
    token !== (creds.SHOPIFY_ADMIN_TOKEN || "");

  function saveCredentials() {
    updateIntegration("shopify", {
      connected: true,
      credentials: {
        SHOPIFY_SHOP: shop.trim(),
        SHOPIFY_ADMIN_TOKEN: token.trim(),
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="card mt-6 p-6">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] bg-[#96bf48]"
      />
      <div className="flex items-start gap-4">
        <div className="bg-[#96bf48]/15 p-3 text-[#96bf48]">
          <ShoppingBag size={22} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-brand text-white">
              Shopify
            </h2>
            {integration.connected && hasCredentials && (
              <span className="chip border-ok/60 bg-ok/10 text-ok">
                <CheckCircle2 size={10} /> Connected
              </span>
            )}
            {saved && (
              <span className="chip border-ok/60 bg-ok/10 text-ok">
                <Save size={10} /> Saved
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/55">
            Pulls order revenue, AOV, order count, fulfillment SLA, and
            checkout data from the Shopify Admin API (GraphQL).
          </p>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="mt-6 card bg-white/[0.02] p-4">
        <div className="bracket">How to connect</div>
        <ol className="mt-2 space-y-1.5 text-[13px] text-white/65 list-decimal list-inside">
          <li>
            Go to <b className="text-white">Shopify Admin → Settings → Apps → Develop apps</b>
          </li>
          <li>
            Click <b className="text-white">Create an app</b> → name it "Carbinox KPI Tracker"
          </li>
          <li>
            Under <b className="text-white">Configure Admin API scopes</b>, enable:
            <div className="mt-1 flex flex-wrap gap-1">
              {SHOPIFY_SCOPES.map((s) => (
                <span key={s} className="kbd">{s}</span>
              ))}
            </div>
          </li>
          <li>
            Click <b className="text-white">Install app</b> → copy the{" "}
            <b className="text-white">Admin API access token</b>
          </li>
          <li>Paste your shop domain and token below, then press <b className="text-white">Save</b></li>
        </ol>
      </div>

      {/* Credential form */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="label">Shop domain</label>
          <input
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="carbinox.myshopify.com"
            className="input"
          />
          <div className="mt-1 text-[10px] text-white/40">
            Your *.myshopify.com domain (not your custom domain)
          </div>
        </div>
        <div>
          <label className="label">Admin API access token</label>
          <div className="relative">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              type={showToken ? "text" : "password"}
              className="input pr-10"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              type="button"
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="mt-1 text-[10px] text-white/40">
            Starts with shpat_ — stored in your browser only
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={saveCredentials}
          disabled={!hasCredentials || (!dirty && !saved)}
          className="btn-primary disabled:opacity-40"
        >
          <Save size={13} />
          {dirty ? "Save credentials" : "Saved"}
        </button>
        <button
          onClick={testSync}
          disabled={busy || !hasCredentials}
          className="btn-ghost disabled:opacity-40"
        >
          <RefreshCw size={13} className={busy ? "animate-spin" : ""} />
          {busy ? "Syncing…" : "Test sync"}
        </button>
        {!hasCredentials && (
          <span className="text-[12px] text-white/40">
            Enter both fields above to enable sync
          </span>
        )}
      </div>

      {integration.lastSyncMessage && (
        <div className="mt-4">
          <SyncMessage ok={ok} err={err} message={integration.lastSyncMessage} />
        </div>
      )}

      {/* What data Shopify provides */}
      <div className="mt-6 border-t border-white/5 pt-4">
        <div className="bracket">Available metrics</div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
          {[
            { name: "Total Revenue", key: "orders.total_sales", status: "live" },
            { name: "AOV", key: "orders.aov", status: "live" },
            { name: "Order Count", key: "orders.count", status: "live" },
            { name: "Fulfillment SLA", key: "fulfillment.sla", status: "live" },
            { name: "Checkout Completion", key: "checkout.completion", status: "live" },
            { name: "Conversion Rate", key: "site.conversion_rate", status: "soon" },
          ].map((m) => (
            <div
              key={m.key}
              className="flex items-center gap-2 border border-white/10 bg-white/[0.02] p-2 text-[11px]"
            >
              <span
                className={cx(
                  "h-1.5 w-1.5 rounded-full",
                  m.status === "live" ? "bg-ok" : "bg-warn",
                )}
              />
              <span className="text-white">{m.name}</span>
              {m.status === "soon" && (
                <span className="chip border-warn/30 bg-warn/10 text-warn px-1 py-0 text-[8px]">
                  Soon
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SyncMessage({
  ok,
  err,
  message,
}: {
  ok: boolean;
  err: boolean;
  message: string;
}) {
  return (
    <div
      className={cx(
        "flex items-start gap-2 border p-2.5 text-xs",
        ok && "border-ok/20 bg-ok/10 text-ok",
        err && "border-bad/20 bg-bad/10 text-bad",
        !ok && !err && "border-white/10 bg-white/[0.02] text-white/60",
      )}
    >
      {ok ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
      {message}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-carbinox" />
      <span className="-ml-8 h-4 w-4 translate-x-0.5 rounded-full bg-white transition peer-checked:translate-x-4" />
    </label>
  );
}
