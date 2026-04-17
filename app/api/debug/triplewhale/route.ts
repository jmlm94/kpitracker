import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Focused probe: the /attribution/get-orders-with-journeys-v2 endpoint
 * exists (we got 403 instead of 404). Try every auth + body variation
 * to find the combo that returns 200.
 */
export async function GET() {
  const apiKey = process.env.TRIPLEWHALE_API_KEY;
  const shopId = process.env.TRIPLEWHALE_SHOP_ID;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "TRIPLEWHALE_API_KEY not set" }, { status: 400 });
  }

  const baseUrl = "https://api.triplewhale.com/api/v2";

  const bodies: { label: string; body: any }[] = [
    { label: "shopDomain+dates", body: { shopDomain: shopId, startDate: "2026-04-01", endDate: "2026-04-14" } },
    { label: "shop_domain+dates", body: { shop_domain: shopId, start_date: "2026-04-01", end_date: "2026-04-14" } },
    { label: "shopId+startDate", body: { shopId, startDate: "2026-04-01", endDate: "2026-04-14" } },
    { label: "just shopDomain", body: { shopDomain: shopId } },
    { label: "empty", body: {} },
  ];

  const authHeaders: { label: string; headers: Record<string, string> }[] = [
    { label: "x-api-key", headers: { "x-api-key": apiKey } },
    { label: "Bearer", headers: { Authorization: `Bearer ${apiKey}` } },
    { label: "api-key", headers: { "api-key": apiKey } },
    { label: "Authorization-raw", headers: { Authorization: apiKey } },
    { label: "x-tw-api-key", headers: { "x-tw-api-key": apiKey } },
  ];

  const endpoints = [
    "/attribution/get-orders-with-journeys-v2",
    "/attribution/get-orders-with-journeys",
    "/sonar/get-sales-attribution-by-order",
    "/attribution/stats",
    "/summary-page/get-summary-page",
    "/tw-metrics/metrics-data",
  ];

  type Result = { endpoint: string; auth: string; body: string; status: number | null; error?: string; snippet?: string };
  const results: Result[] = [];

  for (const ep of endpoints) {
    for (const a of authHeaders) {
      for (const b of bodies) {
        try {
          const res = await fetch(`${baseUrl}${ep}`, {
            method: "POST",
            headers: { ...a.headers, "Content-Type": "application/json" },
            body: JSON.stringify(b.body),
          });
          const text = await res.text();
          // Only record interesting results (not 404)
          if (res.status !== 404) {
            results.push({
              endpoint: ep,
              auth: a.label,
              body: b.label,
              status: res.status,
              snippet: text.slice(0, 200),
            });
          }
        } catch (e: any) {
          results.push({
            endpoint: ep,
            auth: a.label,
            body: b.label,
            status: null,
            error: e?.message,
          });
        }
      }
    }
  }

  // Sort by status ascending (200s first)
  results.sort((a, b) => (a.status ?? 9999) - (b.status ?? 9999));

  return NextResponse.json({
    shopId,
    apiKeyLength: apiKey.length,
    totalTests: endpoints.length * authHeaders.length * bodies.length,
    interestingResults: results.length,
    results,
  });
}
