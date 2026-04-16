"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AppState,
  Department,
  IntegrationConfig,
  KPI,
  Progress,
  Target,
  TeamMember,
} from "./types";
import { seedState } from "./seed";

const STORAGE_KEY = "carbinox-kpi-tracker:v1";

type StoreValue = {
  state: AppState;
  ready: boolean;
  setState: (updater: (prev: AppState) => AppState) => void;
  reset: () => void;

  // convenience actions
  upsertDepartment: (d: Department) => void;
  removeDepartment: (id: string) => void;
  upsertTeamMember: (m: TeamMember) => void;
  removeTeamMember: (id: string) => void;
  upsertKPI: (k: KPI) => void;
  removeKPI: (id: string) => void;
  upsertTarget: (t: Target) => void;
  removeTarget: (id: string) => void;
  setProgress: (targetId: string, p: Progress) => void;
  updateIntegration: (provider: string, patch: Partial<IntegrationConfig>) => void;
  markOnboarded: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, rawSetState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        // Back-compat: older state didn't have Department.kind. Derive from parentId.
        parsed.departments = parsed.departments.map((d) =>
          (d as any).kind ? d : { ...d, kind: d.parentId ? "sub" : "main" },
        );
        // Back-compat: older state had `managerId` (single). Migrate to managerIds[].
        parsed.team = parsed.team.map((m) => {
          if (m.managerIds || !m.managerId) return m;
          return { ...m, managerIds: [m.managerId] };
        });
        rawSetState(parsed);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, ready]);

  const value = useMemo<StoreValue>(() => {
    const setState = (updater: (prev: AppState) => AppState) =>
      rawSetState((prev) => updater(prev));
    return {
      state,
      ready,
      setState,
      reset: () => rawSetState(seedState),
      upsertDepartment: (d) =>
        setState((s) => {
          const exists = s.departments.some((x) => x.id === d.id);
          const nextDepts = exists
            ? s.departments.map((x) => (x.id === d.id ? d : x))
            : [...s.departments, d];
          // Whenever a head is set, make sure they're a member of this
          // department — otherwise changes in Step 1 wouldn't show up in
          // Step 2 / 3, which confused users.
          let nextTeam = s.team;
          if (d.headId) {
            const person = s.team.find((t) => t.id === d.headId);
            if (person) {
              const current = [
                person.departmentId,
                ...(person.additionalDepartmentIds || []),
              ];
              if (!current.includes(d.id)) {
                const updated = {
                  ...person,
                  additionalDepartmentIds: [
                    ...(person.additionalDepartmentIds || []),
                    d.id,
                  ],
                };
                nextTeam = s.team.map((t) => (t.id === person.id ? updated : t));
              }
            }
          }
          return { ...s, departments: nextDepts, team: nextTeam };
        }),
      removeDepartment: (id) =>
        setState((s) => ({ ...s, departments: s.departments.filter((d) => d.id !== id) })),
      upsertTeamMember: (m) =>
        setState((s) => {
          const exists = s.team.some((x) => x.id === m.id);
          return {
            ...s,
            team: exists ? s.team.map((x) => (x.id === m.id ? m : x)) : [...s.team, m],
          };
        }),
      removeTeamMember: (id) =>
        setState((s) => ({ ...s, team: s.team.filter((m) => m.id !== id) })),
      upsertKPI: (k) =>
        setState((s) => {
          const exists = s.kpis.some((x) => x.id === k.id);
          return {
            ...s,
            kpis: exists ? s.kpis.map((x) => (x.id === k.id ? k : x)) : [...s.kpis, k],
          };
        }),
      removeKPI: (id) =>
        setState((s) => ({
          ...s,
          kpis: s.kpis.filter((k) => k.id !== id),
          targets: s.targets.filter((t) => t.kpiId !== id),
        })),
      upsertTarget: (t) =>
        setState((s) => {
          const exists = s.targets.some((x) => x.id === t.id);
          return {
            ...s,
            targets: exists ? s.targets.map((x) => (x.id === t.id ? t : x)) : [...s.targets, t],
          };
        }),
      removeTarget: (id) =>
        setState((s) => {
          const { [id]: _removed, ...rest } = s.progress;
          return { ...s, targets: s.targets.filter((t) => t.id !== id), progress: rest };
        }),
      setProgress: (targetId, p) =>
        setState((s) => ({ ...s, progress: { ...s.progress, [targetId]: { ...p, targetId } } })),
      updateIntegration: (provider, patch) =>
        setState((s) => ({
          ...s,
          integrations: s.integrations.map((i) =>
            i.provider === provider ? { ...i, ...patch } : i,
          ),
        })),
      markOnboarded: () => setState((s) => ({ ...s, onboarded: true })),
    };
  }, [state, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
