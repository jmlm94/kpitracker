"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Plug,
  Plus,
  Target as TargetIcon,
  Trash2,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";
import type {
  Department,
  KPI,
  Provider,
  Target,
  TeamMember,
  Unit,
} from "@/lib/types";
import { cx } from "@/lib/format";

const steps = [
  { id: 1, label: "Departments", icon: Building2 },
  { id: 2, label: "Team", icon: Users },
  { id: 3, label: "KPIs & Targets", icon: TargetIcon },
  { id: 4, label: "Integrations", icon: Plug },
] as const;

const providerOptions: { value: Provider; label: string }[] = [
  { value: "shopify", label: "Shopify" },
  { value: "triplewhale", label: "Triple Whale" },
  { value: "klaviyo", label: "Klaviyo" },
  { value: "postscript", label: "Postscript" },
  { value: "zendesk", label: "Zendesk" },
  { value: "gsheets", label: "Google Sheets" },
  { value: "manual", label: "Manual entry" },
];

const unitOptions: { value: Unit; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency ($)" },
  { value: "percent", label: "Percent (%)" },
  { value: "ratio", label: "Ratio (x)" },
  { value: "duration_s", label: "Duration (seconds)" },
];

const paletteColors = [
  "#ff6a3d",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#facc15",
  "#22d3ee",
];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    state,
    upsertDepartment,
    removeDepartment,
    upsertTeamMember,
    removeTeamMember,
    upsertKPI,
    removeKPI,
    upsertTarget,
    removeTarget,
    updateIntegration,
    markOnboarded,
  } = useStore();
  const [step, setStep] = useState(1);

  function next() {
    if (step === 4) {
      markOnboarded();
      router.push("/");
    } else {
      setStep((s) => Math.min(4, s + 1));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/" className="btn-ghost">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="text-xs text-white/50">Step {step} of {steps.length}</div>
      </div>

      <div className="mt-5">
        <h1 className="font-display text-2xl font-semibold text-white">
          Welcome to Carbinox KPI Tracker
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">
          Let's get your org set up. You can always edit everything later from
          the Team, Departments, KPIs, and Integrations pages.
        </p>
      </div>

      {/* Step tracker */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        {steps.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cx(
                "card flex items-center gap-3 p-3 text-left transition",
                active ? "border-accent/50 bg-accent/10" : "",
                done ? "border-ok/30 bg-ok/5" : "",
              )}
            >
              <div
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  active
                    ? "bg-accent text-white"
                    : done
                      ? "bg-ok/20 text-ok"
                      : "bg-white/5 text-white/50",
                )}
              >
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  Step {s.id}
                </div>
                <div className="text-sm font-medium text-white">{s.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {step === 1 && (
          <DepartmentsStep
            state={state}
            upsert={upsertDepartment}
            remove={removeDepartment}
          />
        )}
        {step === 2 && (
          <TeamStep
            state={state}
            upsert={upsertTeamMember}
            remove={removeTeamMember}
          />
        )}
        {step === 3 && (
          <KPIsStep
            state={state}
            upsertKpi={upsertKPI}
            removeKpi={removeKPI}
            upsertTarget={upsertTarget}
            removeTarget={removeTarget}
          />
        )}
        {step === 4 && (
          <IntegrationsStep state={state} updateIntegration={updateIntegration} />
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="btn-ghost disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button onClick={next} className="btn-primary">
          {step === 4 ? "Finish setup" : "Continue"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------ STEP 1 ------------ */

function DepartmentsStep({
  state,
  upsert,
  remove,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsert: (d: Department) => void;
  remove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(paletteColors[0]);

  function add() {
    if (!name.trim()) return;
    upsert({
      id: "dep_" + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      color,
    });
    setName("");
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Departments</h2>
          <p className="text-sm text-white/50">
            Create the teams you want to track. Examples: Advertising, Retention,
            CS, Ops, Creative.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {state.departments.map((d) => (
          <div key={d.id} className="card flex items-center gap-3 p-3">
            <div
              className="h-10 w-10 rounded-lg"
              style={{ background: `linear-gradient(135deg, ${d.color}, transparent)` }}
            />
            <div className="min-w-0 flex-1">
              <input
                defaultValue={d.name}
                onBlur={(e) => upsert({ ...d, name: e.target.value })}
                className="w-full bg-transparent text-sm font-medium text-white outline-none"
              />
              <div className="mt-1 flex items-center gap-1.5">
                {paletteColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => upsert({ ...d, color: c })}
                    style={{ background: c }}
                    className={cx(
                      "h-3.5 w-3.5 rounded-full ring-offset-2 ring-offset-ink-900",
                      d.color === c ? "ring-2 ring-white/60" : "",
                    )}
                  />
                ))}
              </div>
            </div>
            <button onClick={() => remove(d.id)} className="btn-ghost">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-end gap-3">
        <div className="flex-1">
          <label className="label">Department name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Logistics"
            className="input"
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
        </div>
        <div>
          <label className="label">Color</label>
          <div className="flex items-center gap-1.5">
            {paletteColors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={cx(
                  "h-7 w-7 rounded-md",
                  color === c ? "ring-2 ring-white/70" : "",
                )}
              />
            ))}
          </div>
        </div>
        <button onClick={add} className="btn-primary">
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

/* ------------ STEP 2 ------------ */

function TeamStep({
  state,
  upsert,
  remove,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsert: (m: TeamMember) => void;
  remove: (id: string) => void;
}) {
  const [form, setForm] = useState<Partial<TeamMember>>({
    departmentId: state.departments[0]?.id,
  });

  function add() {
    if (!form.name || !form.position || !form.departmentId) return;
    upsert({
      id: "tm_" + Math.random().toString(36).slice(2, 8),
      name: form.name,
      position: form.position,
      departmentId: form.departmentId,
      managerId: form.managerId,
      email: form.email,
    });
    setForm({ departmentId: state.departments[0]?.id });
  }

  return (
    <div className="card p-5">
      <h2 className="section-title">Team members</h2>
      <p className="text-sm text-white/50">
        Add the people whose KPIs you want to track. You can assign a manager so
        underperformance rolls up to their lead.
      </p>

      <div className="mt-5 divide-y divide-white/5 rounded-xl border border-white/5">
        {state.team.map((m) => {
          const dept = state.departments.find((d) => d.id === m.departmentId);
          return (
            <div key={m.id} className="grid grid-cols-12 items-center gap-3 p-3">
              <input
                defaultValue={m.name}
                onBlur={(e) => upsert({ ...m, name: e.target.value })}
                className="input col-span-3"
              />
              <input
                defaultValue={m.position}
                onBlur={(e) => upsert({ ...m, position: e.target.value })}
                className="input col-span-3"
                placeholder="Position"
              />
              <select
                value={m.departmentId}
                onChange={(e) => upsert({ ...m, departmentId: e.target.value })}
                className="input col-span-2"
              >
                {state.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={m.managerId || ""}
                onChange={(e) =>
                  upsert({ ...m, managerId: e.target.value || undefined })
                }
                className="input col-span-3"
              >
                <option value="">No manager</option>
                {state.team
                  .filter((t) => t.id !== m.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
              <button onClick={() => remove(m.id)} className="btn-ghost col-span-1 justify-center">
                <Trash2 size={14} />
              </button>
              <div className="col-span-12 -mt-1 text-[11px] text-white/40">
                {dept?.name}
                {m.email ? ` · ${m.email}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-12 items-end gap-3">
        <div className="col-span-3">
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name || ""}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Simona Saule"
          />
        </div>
        <div className="col-span-3">
          <label className="label">Position</label>
          <input
            className="input"
            value={form.position || ""}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Media Buyer - Meta"
          />
        </div>
        <div className="col-span-2">
          <label className="label">Department</label>
          <select
            className="input"
            value={form.departmentId || ""}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <label className="label">Reports to</label>
          <select
            className="input"
            value={form.managerId || ""}
            onChange={(e) => setForm({ ...form, managerId: e.target.value || undefined })}
          >
            <option value="">—</option>
            {state.team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary col-span-1 justify-center" onClick={add}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------ STEP 3 ------------ */

function KPIsStep({
  state,
  upsertKpi,
  removeKpi,
  upsertTarget,
  removeTarget,
}: {
  state: ReturnType<typeof useStore>["state"];
  upsertKpi: (k: KPI) => void;
  removeKpi: (id: string) => void;
  upsertTarget: (t: Target) => void;
  removeTarget: (id: string) => void;
}) {
  const [kpi, setKpi] = useState<Partial<KPI>>({
    unit: "number",
    direction: "higher_is_better",
    provider: "manual",
    window: "mtd",
  });
  const [target, setTarget] = useState<Partial<Target>>({
    period: "monthly",
    periodKey: new Date().toISOString().slice(0, 7),
  });

  function add() {
    if (!kpi.name || !kpi.metricKey || !target.ownerId || !target.target) return;
    const id = "kpi_" + Math.random().toString(36).slice(2, 8);
    const tid = "t_" + Math.random().toString(36).slice(2, 8);
    upsertKpi({
      id,
      name: kpi.name,
      description: kpi.description,
      metricKey: kpi.metricKey,
      unit: kpi.unit as Unit,
      direction: kpi.direction as KPI["direction"],
      provider: kpi.provider as Provider,
      window: (kpi.window as KPI["window"]) || "mtd",
    });
    upsertTarget({
      id: tid,
      kpiId: id,
      ownerId: target.ownerId,
      target: Number(target.target),
      period: (target.period as Target["period"]) || "monthly",
      periodKey: target.periodKey || new Date().toISOString().slice(0, 7),
    });
    setKpi({
      unit: "number",
      direction: "higher_is_better",
      provider: "manual",
      window: "mtd",
    });
    setTarget({ period: "monthly", periodKey: new Date().toISOString().slice(0, 7) });
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h2 className="section-title">Existing KPIs</h2>
        <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/5">
          {state.kpis.map((k) => {
            const targets = state.targets.filter((t) => t.kpiId === k.id);
            return (
              <div key={k.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{k.name}</div>
                    <div className="text-xs text-white/50">
                      {k.provider} · {k.metricKey} · {k.window} ·{" "}
                      {k.direction === "higher_is_better" ? "↑ better" : "↓ better"}
                    </div>
                  </div>
                  <button onClick={() => removeKpi(k.id)} className="btn-ghost">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {targets.map((t) => {
                    const owner = state.team.find((m) => m.id === t.ownerId);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-sm"
                      >
                        <div>
                          <div className="text-white">
                            Target {t.target}{" "}
                            <span className="text-white/40">
                              · {t.period} · {t.periodKey}
                            </span>
                          </div>
                          <div className="text-xs text-white/50">
                            Owner: {owner?.name || "—"}
                          </div>
                        </div>
                        <button onClick={() => removeTarget(t.id)} className="btn-ghost">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {state.kpis.length === 0 && (
            <div className="p-4 text-sm text-white/50">No KPIs yet — add one below.</div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title">Add a new KPI + target</h2>
        <div className="mt-5 grid grid-cols-12 gap-3">
          <div className="col-span-4">
            <label className="label">KPI name</label>
            <input
              className="input"
              placeholder="e.g. Meta ROAS"
              value={kpi.name || ""}
              onChange={(e) => setKpi({ ...kpi, name: e.target.value })}
            />
          </div>
          <div className="col-span-4">
            <label className="label">Data source</label>
            <select
              className="input"
              value={kpi.provider}
              onChange={(e) => setKpi({ ...kpi, provider: e.target.value as Provider })}
            >
              {providerOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-4">
            <label className="label">Metric key</label>
            <input
              className="input"
              placeholder="e.g. meta.roas"
              value={kpi.metricKey || ""}
              onChange={(e) => setKpi({ ...kpi, metricKey: e.target.value })}
            />
          </div>

          <div className="col-span-3">
            <label className="label">Unit</label>
            <select
              className="input"
              value={kpi.unit}
              onChange={(e) => setKpi({ ...kpi, unit: e.target.value as Unit })}
            >
              {unitOptions.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="label">Direction</label>
            <select
              className="input"
              value={kpi.direction}
              onChange={(e) =>
                setKpi({ ...kpi, direction: e.target.value as KPI["direction"] })
              }
            >
              <option value="higher_is_better">Higher is better</option>
              <option value="lower_is_better">Lower is better</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="label">Window</label>
            <select
              className="input"
              value={kpi.window}
              onChange={(e) =>
                setKpi({ ...kpi, window: e.target.value as KPI["window"] })
              }
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="mtd">Month-to-date</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="col-span-3">
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="Optional"
              value={kpi.description || ""}
              onChange={(e) => setKpi({ ...kpi, description: e.target.value })}
            />
          </div>

          <div className="col-span-4">
            <label className="label">Target value</label>
            <input
              className="input"
              type="number"
              step="any"
              placeholder="1.6"
              value={(target.target as number) ?? ""}
              onChange={(e) =>
                setTarget({ ...target, target: Number(e.target.value) })
              }
            />
          </div>
          <div className="col-span-4">
            <label className="label">Owner</label>
            <select
              className="input"
              value={target.ownerId || ""}
              onChange={(e) => setTarget({ ...target, ownerId: e.target.value })}
            >
              <option value="">Select team member</option>
              {state.team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.position}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Period</label>
            <select
              className="input"
              value={target.period}
              onChange={(e) =>
                setTarget({ ...target, period: e.target.value as Target["period"] })
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Period key</label>
            <input
              className="input"
              placeholder="2026-04"
              value={target.periodKey || ""}
              onChange={(e) => setTarget({ ...target, periodKey: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={add} className="btn-primary">
            <Plus size={14} /> Add KPI + target
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------ STEP 4 ------------ */

function IntegrationsStep({
  state,
  updateIntegration,
}: {
  state: ReturnType<typeof useStore>["state"];
  updateIntegration: (p: string, patch: any) => void;
}) {
  return (
    <div className="card p-5">
      <h2 className="section-title">Connect your data sources</h2>
      <p className="text-sm text-white/50">
        Flip on the sources you want to pull from. Real API credentials are
        stored as environment variables on Vercel — this screen only tracks which
        integrations are active.
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {state.integrations.map((i) => (
          <div key={i.provider} className="card flex items-start gap-3 p-4">
            <div className="mt-0.5 rounded-md bg-white/5 p-2 text-white/70">
              <Plug size={16} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-medium text-white">{i.label}</div>
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
              <div className="mt-1.5 text-xs text-white/50">
                Env vars:{" "}
                {i.envVarsExpected.map((v) => (
                  <span key={v} className="kbd mr-1">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 text-xs text-white/50">
        After finishing, the daily Vercel cron at <span className="kbd">/api/cron/refresh</span> will
        pull new numbers every morning.
      </div>
    </div>
  );
}
