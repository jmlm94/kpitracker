import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Broad endpoint discovery for the Triple Whale API. Tries many paths +
 * auth variations so we can pinpoint the one(s) that work.
 */
export async function GET() {
  const apiKey = process.env.TRIPLEWHALE_API_KEY;
  const shopId = process.env.TRIPLEWHALE_SHOP_ID;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "TRIPLEWHALE_API_KEY not set" }, { status: 400 });
  }

  const commonHeadersXKey = { "x-api-key": apiKey, "Content-Type": "application/json" };

  type Test = {
    name: string;
    url: string;
    method: "GET" | "POST";
    headers?: Record<string, string>;
    body?: any;
  };

  const tests: Test[] = [
    // v1 users
    { name: "v1-users-me",       url: "https://api.triplewhale.com/api/v1/users/me",        method: "GET", headers: commonHeadersXKey },
    // v2 users
    { name: "v2-users-me",       url: "https://api.triplewhale.com/api/v2/users/me",        method: "GET", headers: commonHeadersXKey },
    // no /api prefix
    { name: "v1-no-api-me",      url: "https://api.triplewhale.com/v1/users/me",            method: "GET", headers: commonHeadersXKey },
    { name: "v2-no-api-me",      url: "https://api.triplewhale.com/v2/users/me",            method: "GET", headers: commonHeadersXKey },
    // Attribution
    { name: "v2-attribution",    url: "https://api.triplewhale.com/api/v2/attribution/get-orders-with-journeys-v2", method: "POST", headers: commonHeadersXKey, body: { shopDomain: shopId } },
    // Sonar
    { name: "v2-sonar-metrics",  url: "https://api.triplewhale.com/api/v2/sonar/get-metrics", method: "POST", headers: commonHeadersXKey, body: { shopDomain: shopId } },
    // Metrics
    { name: "v2-metrics-data",   url: "https://api.triplewhale.com/api/v2/metrics/get-metrics-data", method: "POST", headers: commonHeadersXKey, body: { shop_domain: shopId } },
    // Willy (AI)
    { name: "v2-willy-question", url: "https://api.triplewhale.com/api/v2/willy/question", method: "POST", headers: commonHeadersXKey, body: { shopId, question: "What is my ROAS?" } },
    // Summary variations
    { name: "v2-summary-hyphen", url: "https://api.triplewhale.com/api/v2/summary/get-summary", method: "POST", headers: commonHeadersXKey, body: { shopDomain: shopId } },
    { name: "v2-reports",        url: "https://api.triplewhale.com/api/v2/reports",         method: "GET", headers: commonHeadersXKey },
    // Root discovery
    { name: "root-api",          url: "https://api.triplewhale.com/api",                    method: "GET", headers: commonHeadersXKey },
    { name: "root-api-v2",       url: "https://api.triplewhale.com/api/v2",                 method: "GET", headers: commonHeadersXKey },
    // Different host
    { name: "alt-host-developers",url:"https://developers.triplewhale.com/api/v2/users/me", method: "GET", headers: commonHeadersXKey },
    // Health/status probes
    { name: "health",            url: "https://api.triplewhale.com/health",                 method: "GET", headers: commonHeadersXKey },
    { name: "status",            url: "https://api.triplewhale.com/status",                 method: "GET", headers: commonHeadersXKey },
  ];

  const results: Record<string, any> = {};
  await Promise.all(
    tests.map(async (t) => {
      try {
        const res = await fetch(t.url, {
          method: t.method,
          headers: t.headers,
          body: t.body ? JSON.stringify(t.body) : undefined,
        });
        const text = await res.text();
        results[t.name] = {
          url: t.url,
          status: res.status,
          body: text.slice(0, 250),
        };
      } catch (e: any) {
        results[t.name] = { url: t.url, error: e?.message || "fetch failed" };
      }
    }),
  );

  return NextResponse.json({
    shopId,
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.slice(0, 6) + "…",
    tests: results,
  });
}
