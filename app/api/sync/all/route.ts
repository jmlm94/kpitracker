import { NextResponse } from "next/server";
import type { AppState } from "@/lib/types";
import { fetchMetric } from "@/lib/connectors";

export const runtime = "nodejs";

/**
 * "Sync now" endpoint used by the Topbar. The client sends its current
 * state; we refresh every target from its provider and return new progress.
 *
 * Because persistence lives in the browser (localStorage) for MVP, this
 * route is stateless — it just runs the connectors.
 */
export async function POST(req: Request) {
  let body: Partial<AppState> & { credentials?: Record<string, Record<string, string>> } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const kpis = body.kpis || [];
  const targets = body.targets || [];
  const allCreds = body.credentials || {};

  const progress: Record<string, any> = {};
  await Promise.all(
    targets.map(async (t) => {
      const kpi = kpis.find((k) => k.id === t.kpiId);
      if (!kpi) return;
      const creds = allCreds[kpi.provider];
      const res = await fetchMetric(kpi, t, creds);
      progress[t.id] = {
        today: res.today,
        last7: res.last7,
        mtd: res.mtd,
        samples: res.samples,
      };
    }),
  );

  return NextResponse.json({ ok: true, synced: Object.keys(progress).length, progress });
}

// Some clients (the Topbar) call this without a body — support GET too so the
// endpoint doesn't 405 in that case.
export async function GET() {
  return NextResponse.json({
    ok: true,
    synced: 0,
    progress: {},
    message:
      "POST the current kpis+targets to refresh. GET returns an empty payload.",
  });
}
