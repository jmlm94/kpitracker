import { NextResponse } from "next/server";
import { seedState } from "@/lib/seed";
import { fetchMetric } from "@/lib/connectors";

export const runtime = "nodejs";

/**
 * Daily Vercel cron. Vercel calls GET /api/cron/refresh on the schedule
 * defined in vercel.json (default: 06:00 UTC).
 *
 * In a production setup this would:
 *   1. Load the current AppState from a persistent store (e.g. Vercel KV,
 *      Postgres, or Supabase).
 *   2. Iterate every target and fetch fresh progress from the appropriate
 *      connector.
 *   3. Persist the updated progress and any alert state.
 *
 * For now, it runs the connectors against the seed state and returns the
 * resulting progress so you can confirm the pipeline works.
 */
export async function GET(req: Request) {
  // Vercel sets a cron secret header. If you configure CRON_SECRET, verify it.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const started = Date.now();
  const progress: Record<string, any> = {};

  await Promise.all(
    seedState.targets.map(async (t) => {
      const kpi = seedState.kpis.find((k) => k.id === t.kpiId);
      if (!kpi) return;
      const res = await fetchMetric(kpi, t);
      progress[t.id] = {
        today: res.today,
        last7: res.last7,
        mtd: res.mtd,
        source: res.source,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    ms: Date.now() - started,
    synced: Object.keys(progress).length,
    progress,
  });
}
