"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { CheckCircle2, CircleAlert, Plug, RefreshCw } from "lucide-react";
import { cx } from "@/lib/format";

export default function IntegrationsPage() {
  const { state, ready, updateIntegration, setProgress } = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  if (!ready) return null;

  async function testSync(provider: string) {
    setBusy(provider);
    try {
      const res = await fetch(`/api/sync/${provider}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kpis: state.kpis, targets: state.targets }),
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

  return (
    <div>
      <h1 className="section-title">Integrations</h1>
      <p className="text-sm text-white/50">
        Connect Carbinox's data sources. Credentials live in Vercel environment
        variables. Toggle what's active and trigger a test sync anytime.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.integrations.map((i) => {
          const ok = i.lastSyncStatus === "ok";
          const err = i.lastSyncStatus === "error";
          return (
            <div key={i.provider} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cx(
                      "rounded-lg p-2",
                      i.connected ? "bg-accent/15 text-accent" : "bg-white/5 text-white/60",
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
                          {" · "}
                          Last sync {new Date(i.lastSyncAt).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={i.connected}
                    onChange={(e) =>
                      updateIntegration(i.provider, { connected: e.target.checked })
                    }
                  />
                  <span className="h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-accent" />
                  <span className="-ml-8 h-4 w-4 translate-x-0.5 rounded-full bg-white transition peer-checked:translate-x-4" />
                </label>
              </div>

              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wider text-white/40">
                  Required environment variables
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {i.envVarsExpected.map((v) => (
                    <span key={v} className="kbd">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {i.lastSyncMessage && (
                <div
                  className={cx(
                    "mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs",
                    ok && "border-ok/20 bg-ok/10 text-ok",
                    err && "border-bad/20 bg-bad/10 text-bad",
                    !ok && !err && "border-white/10 bg-white/[0.02] text-white/60",
                  )}
                >
                  {ok ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                  {i.lastSyncMessage}
                </div>
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
