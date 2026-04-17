import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Makes a raw call to Triple Whale from the Vercel edge so we can see
 * exactly what status and body TW returns when called from our production
 * IPs. No fancy parsing, just the wire response.
 */
export async function GET() {
  const apiKey = process.env.TRIPLEWHALE_API_KEY;
  const shopId = process.env.TRIPLEWHALE_SHOP_ID;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "TRIPLEWHALE_API_KEY not set" }, { status: 400 });
  }

  const tests: { name: string; url: string; method: "GET" | "POST"; headers?: Record<string, string>; body?: any }[] = [
    {
      name: "users-me-xkey",
      url: "https://api.triplewhale.com/api/v2/users/me",
      method: "GET",
      headers: { "x-api-key": apiKey },
    },
    {
      name: "users-me-bearer",
      url: "https://api.triplewhale.com/api/v2/users/me",
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    },
    {
      name: "summary-page",
      url: "https://api.triplewhale.com/api/v2/summary-page/get-summary-page",
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: {
        shopDomain: shopId,
        startDate: "2026-04-01",
        endDate: "2026-04-14",
      },
    },
    {
      name: "tw-metrics",
      url: "https://api.triplewhale.com/api/v2/tw-metrics/get-metrics-data",
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: {
        shop_domain: shopId,
        period: "day",
        start_date: "2026-04-01",
        end_date: "2026-04-14",
        metrics: ["roas"],
        channels: ["facebook"],
      },
    },
  ];

  const results: Record<string, any> = {};
  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        method: t.method,
        headers: t.headers,
        body: t.body ? JSON.stringify(t.body) : undefined,
      });
      const text = await res.text();
      results[t.name] = {
        status: res.status,
        statusText: res.statusText,
        body: text.slice(0, 400),
      };
    } catch (e: any) {
      results[t.name] = { error: e?.message || "fetch failed" };
    }
  }
  return NextResponse.json({
    shopId,
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.slice(0, 6) + "…",
    tests: results,
  });
}
