"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { cx } from "@/lib/format";

type StatusResponse = Record<
  string,
  { envReady: boolean; envVarsSet: string[]; envVarsMissing: string[] }
>;

const PROVIDERS = [
  {
    id: "shopify",
    label: "Shopify",
    color: "#96bf48",
    purpose: "Orders, revenue, AOV, returns, fulfillment SLA",
    getKeyUrl: "https://admin.shopify.com/store/YOUR-STORE/settings/apps/development",
    instructions: [
      "Go to Shopify admin → Settings → Apps → Develop apps",
      "Create a custom app (or use the existing one)",
      "Configure Admin API scopes: read_orders, read_products, read_inventory, read_fulfillments, read_analytics",
      "Install the app → copy the Admin API access token (starts with shpat_)",
    ],
    vars: [
      { name: "SHOPIFY_SHOP", placeholder: "carbinox.myshopify.com" },
      { name: "SHOPIFY_ADMIN_TOKEN", placeholder: "shpat_xxxxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    id: "triplewhale",
    label: "Triple Whale",
    color: "#4f46e5",
    purpose: "ROAS, CPA, CTR, spend, revenue by ad channel",
    getKeyUrl: "https://app.triplewhale.com/settings/api",
    instructions: [
      "Log into Triple Whale",
      "Go to Settings → API (or Account → Developer)",
      "Generate an API Key",
    ],
    vars: [
      { name: "TRIPLEWHALE_API_KEY", placeholder: "tw_api_xxxxxxxxxx" },
      { name: "TRIPLEWHALE_SHOP_ID", placeholder: "carbinox.myshopify.com" },
    ],
  },
  {
    id: "klaviyo",
    label: "Klaviyo",
    color: "#d43ab0",
    purpose: "Email revenue, open rate, click rate, flows attribution",
    getKeyUrl: "https://www.klaviyo.com/settings/account/api-keys",
    instructions: [
      "Log into Klaviyo",
      "Go to Settings → API Keys",
      "Create a Private API Key with at least Read access to Campaigns, Flows, Metrics",
    ],
    vars: [{ name: "KLAVIYO_PRIVATE_KEY", placeholder: "pk_xxxxxxxxxxxxxxxx" }],
  },
  {
    id: "postscript",
    label: "Postscript",
    color: "#ff4b4b",
    purpose: "SMS revenue, CTR, opt-out rate",
    getKeyUrl: "https://app.postscript.io/settings/api",
    instructions: [
      "Log into Postscript",
      "Go to Settings → API",
      "Generate an API Key",
    ],
    vars: [{ name: "POSTSCRIPT_API_KEY", placeholder: "ps_xxxxxxxxxxxxxxxx" }],
  },
  {
    id: "zendesk",
    label: "Zendesk",
    color: "#03363d",
    purpose: "First response time, CSAT, resolution rate, ticket volume",
    getKeyUrl: "https://support.zendesk.com/admin/apps-integrations/apis/zendesk-api/settings/tokens/",
    instructions: [
      "Go to Zendesk Admin → Apps and integrations → APIs → Zendesk API",
      "Enable Token access, then Add API Token",
      "Copy the token; also note your subdomain (the part before .zendesk.com)",
    ],
    vars: [
      { name: "ZENDESK_SUBDOMAIN", placeholder: "carbinox" },
      { name: "ZENDESK_EMAIL", placeholder: "admin@carbinox.com" },
      { name: "ZENDESK_API_TOKEN", placeholder: "xxxxxxxxxxxxxxxxxx" },
    ],
  },
  {
    id: "gsheets",
    label: "Google Sheets",
    color: "#0f9d58",
    purpose: "Manual KPIs (creative win rates, content calendar, anything custom)",
    getKeyUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    instructions: [
      "Google Cloud Console → IAM → Service Accounts → Create service account",
      "Grant it the 'Editor' role for the Sheets API",
      "Create a JSON key → copy the client_email and private_key",
      "Share each sheet you want to read with the client_email",
    ],
    vars: [
      { name: "GOOGLE_SHEETS_CLIENT_EMAIL", placeholder: "...@...iam.gserviceaccount.com" },
      { name: "GOOGLE_SHEETS_PRIVATE_KEY", placeholder: "-----BEGIN PRIVATE KEY-----\\n..." },
    ],
  },
] as const;

export default function IntegrationsPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/status");
      const data = await res.json();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedVar(text);
    setTimeout(() => setCopiedVar(null), 1200);
  }

  const connectedCount = status
    ? Object.values(status).filter((s) => s.envReady).length
    : 0;

  return (
    <div>
      <div className="bracket">06 — Data Feeds</div>
      <h1 className="section-title mt-1">Integrations</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/50">
        Credentials are set as Vercel environment variables so connections
        persist forever — no browser storage, no UI clicks, and the daily cron
        always has access.
      </p>

      <div className="mt-6 card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-carbinox" />
          <div>
            <div className="font-heading text-[12px] font-semibold uppercase tracking-brand text-white">
              {connectedCount} / {PROVIDERS.length} integrations connected via Vercel
            </div>
            <div className="text-[11px] text-white/50">
              Status refreshes when you click Refresh below, or after a redeploy.
            </div>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh status
        </button>
      </div>

      {/* Setup instructions */}
      <div className="card crosshair mt-6 p-5">
        <div className="bracket text-carbinox">How to connect</div>
        <ol className="mt-3 space-y-2 text-[13px] text-white/70 list-decimal list-inside">
          <li>
            Get the API key/token from the provider (instructions inside each
            card below).
          </li>
          <li>
            Go to{" "}
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-carbinox hover:underline"
            >
              vercel.com/dashboard
            </a>{" "}
            → your <b className="text-white">kpitracker</b> project →{" "}
            <b className="text-white">Settings → Environment Variables</b>.
          </li>
          <li>
            Add the env vars shown in each card. Environment:{" "}
            <span className="kbd">Production</span> (or all).
          </li>
          <li>
            Go to <b className="text-white">Deployments</b> → latest → ⋯ menu →{" "}
            <b className="text-white">Redeploy</b> (so the new vars take effect).
          </li>
          <li>Come back here and click "Refresh status" — connected providers light up.</li>
        </ol>
      </div>

      {/* Provider cards */}
      <div className="mt-6 space-y-4">
        {PROVIDERS.map((p) => {
          const s = status?.[p.id];
          const connected = s?.envReady;
          return (
            <div key={p.id} className="card relative p-5">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: p.color }}
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-2xl font-extrabold uppercase tracking-brand text-white">
                      {p.label}
                    </h2>
                    {connected ? (
                      <span className="chip border-ok/60 bg-ok/10 text-ok">
                        <CheckCircle2 size={10} /> Connected
                      </span>
                    ) : (
                      <span className="chip border-white/20 bg-white/[0.03] text-white/60">
                        Not connected
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-white/55">{p.purpose}</p>
                </div>
                <a
                  href={p.getKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  <ExternalLink size={13} /> Get key
                </a>
              </div>

              {/* Instructions */}
              <div className="mt-4 card bg-white/[0.02] p-3">
                <div className="bracket">How to get the key(s)</div>
                <ol className="mt-2 space-y-1 text-[12px] text-white/60 list-decimal list-inside">
                  {p.instructions.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
              </div>

              {/* Env vars to set */}
              <div className="mt-4">
                <div className="bracket">Env vars to add in Vercel</div>
                <div className="mt-2 space-y-1.5">
                  {p.vars.map((v) => {
                    const isSet = s?.envVarsSet.includes(v.name);
                    return (
                      <div
                        key={v.name}
                        className="flex flex-wrap items-center gap-2 border border-white/10 bg-jet-900 p-2"
                      >
                        <span
                          className={cx(
                            "h-1.5 w-1.5 rounded-full",
                            isSet ? "bg-ok" : "bg-white/25",
                          )}
                        />
                        <code className="flex-1 font-numeric text-[12px] text-white">
                          {v.name}
                        </code>
                        <code className="hidden font-numeric text-[10px] text-white/35 md:inline">
                          {v.placeholder}
                        </code>
                        <button
                          onClick={() => copy(v.name)}
                          className="text-white/40 hover:text-white"
                          title="Copy env var name"
                        >
                          <Copy size={11} />
                        </button>
                        {isSet ? (
                          <span className="chip border-ok/40 bg-ok/10 text-ok px-1 py-0 text-[9px]">
                            Set
                          </span>
                        ) : (
                          <span className="chip border-white/15 text-white/50 px-1 py-0 text-[9px]">
                            Missing
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {copiedVar && (
                  <div className="mt-1.5 text-[10px] text-ok">
                    Copied "{copiedVar}" to clipboard
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="mt-6 flex items-start gap-2 border border-white/10 bg-white/[0.02] p-3 text-[12px] text-white/60">
        <CircleAlert size={14} className="shrink-0 text-white/40 mt-0.5" />
        <div>
          After adding or changing env vars in Vercel, you must <b className="text-white">redeploy</b>{" "}
          for the new values to take effect. Vercel → Deployments → latest → ⋯ →
          Redeploy.
        </div>
      </div>
    </div>
  );
}
