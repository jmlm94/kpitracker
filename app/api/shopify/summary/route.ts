import { NextResponse } from "next/server";
import { fetchShopifySummary } from "@/lib/connectors/shopify";

export const runtime = "nodejs";

/**
 * Summary endpoint for the Dashboard "Shopify Live" section. Takes a date
 * range and credentials, returns one-pass aggregated metrics plus daily
 * samples. If credentials are missing, returns simulated data.
 *
 * Body: { credentials?: Record<string,string>, start: "YYYY-MM-DD", end: "YYYY-MM-DD" }
 */
export async function POST(req: Request) {
  let body: { credentials?: Record<string, string>; start?: string; end?: string } = {};
  try {
    body = await req.json();
  } catch {}

  // Always fetch 30 days so the matrix can slice today/yesterday/7d/14d/30d.
  const end = body.end || new Date().toISOString().slice(0, 10);
  const start = (() => {
    const d = new Date(end);
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  })();

  const summary = await fetchShopifySummary(body.credentials, start, end);
  return NextResponse.json(summary);
}
