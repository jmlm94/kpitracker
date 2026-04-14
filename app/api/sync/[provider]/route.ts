import { NextResponse } from "next/server";
import type { KPI, Target } from "@/lib/types";
import { fetchMetric } from "@/lib/connectors";

export const runtime = "nodejs";

/**
 * Sync a single provider (or "all"). The client POSTs its known KPIs +
 * targets; we return updated progress keyed by target id.
 *
 * Body: { kpis: KPI[], targets: Target[] }
 * If the body is missing, we return an empty but OK response so the UI's
 * "Test sync" button still works without any seed data.
 */
export async function POST(
  req: Request,
  { params }: { params: { provider: string } },
) {
  const provider = params.provider;
  let body: { kpis?: KPI[]; targets?: Target[] } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const kpis = body.kpis || [];
  const targets = body.targets || [];

  const filtered = targets.filter((t) => {
    const kpi = kpis.find((k) => k.id === t.kpiId);
    if (!kpi) return false;
    return provider === "all" ? true : kpi.provider === provider;
  });

  const progress: Record<string, any> = {};
  await Promise.all(
    filtered.map(async (t) => {
      const kpi = kpis.find((k) => k.id === t.kpiId)!;
      const res = await fetchMetric(kpi, t);
      progress[t.id] = {
        today: res.today,
        last7: res.last7,
        mtd: res.mtd,
        samples: res.samples,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    provider,
    synced: filtered.length,
    message:
      filtered.length === 0
        ? `No targets using ${provider} — add one in Onboarding to pull live data.`
        : `Synced ${filtered.length} target(s) from ${provider}.`,
    progress,
  });
}
