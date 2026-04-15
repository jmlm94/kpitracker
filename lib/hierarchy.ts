import type { AppState, Department, Target, TeamMember } from "./types";
import { classifyStatus, pickProgressValue, progressRatio } from "./format";

/** Every department a person belongs to (primary first, then additional). */
export function memberDepartmentIds(person: TeamMember): string[] {
  return [person.departmentId, ...(person.additionalDepartmentIds || [])].filter(
    (v, i, a) => v && a.indexOf(v) === i,
  );
}

/** Members of a department — includes anyone for whom this dept is primary or additional. */
export function membersOfDepartment(
  state: AppState,
  departmentId: string,
): TeamMember[] {
  return state.team.filter((m) => memberDepartmentIds(m).includes(departmentId));
}

/** Returns every descendant department id (inclusive of the root). */
export function descendantDepartmentIds(state: AppState, rootId: string): string[] {
  const out = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const d of state.departments) {
      if (d.parentId && out.has(d.parentId) && !out.has(d.id)) {
        out.add(d.id);
        added = true;
      }
    }
  }
  return [...out];
}

/** Top-level (Main) departments. */
export function rootDepartments(state: AppState): Department[] {
  return state.departments.filter((d) => d.kind === "main");
}

export function childDepartments(state: AppState, parentId: string): Department[] {
  return state.departments.filter(
    (d) => d.kind === "sub" && d.parentId === parentId,
  );
}

/** Sub-departments that have no parent assigned yet. */
export function unassignedSubs(state: AppState): Department[] {
  return state.departments.filter(
    (d) => d.kind === "sub" && !d.parentId,
  );
}

/** All targets owned by people assigned (primarily or additionally) to this dept or descendants. */
export function targetsForDepartment(state: AppState, departmentId: string): Target[] {
  const depIds = new Set(descendantDepartmentIds(state, departmentId));
  const memberIds = new Set(
    state.team
      .filter((t) => memberDepartmentIds(t).some((id) => depIds.has(id)))
      .map((m) => m.id),
  );
  return state.targets.filter((t) => memberIds.has(t.ownerId));
}

export type DepartmentStats = {
  count: number;
  avgRatio: number;
  ahead: number;
  on_track: number;
  at_risk: number;
  off_track: number;
};

export function aggregateDepartmentStats(
  state: AppState,
  departmentId: string,
): DepartmentStats {
  const targets = targetsForDepartment(state, departmentId);
  let sum = 0;
  let ahead = 0;
  let on_track = 0;
  let at_risk = 0;
  let off_track = 0;
  let count = 0;
  for (const t of targets) {
    const kpi = state.kpis.find((k) => k.id === t.kpiId);
    const p = state.progress[t.id];
    if (!kpi || !p) continue;
    const r = progressRatio(kpi, t, pickProgressValue(kpi, p));
    sum += Math.min(1.2, r);
    const s = classifyStatus(r);
    if (s === "ahead") ahead++;
    else if (s === "on_track") on_track++;
    else if (s === "at_risk") at_risk++;
    else off_track++;
    count++;
  }
  return {
    count,
    avgRatio: count ? sum / count : 0,
    ahead,
    on_track,
    at_risk,
    off_track,
  };
}
