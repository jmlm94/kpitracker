import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Probe Triple Whale auth exchange endpoints. The fact that Bearer auth
 * returned "Invalid iss" (a JWT claim error) suggests the API wants a
 * JWT — likely obtained by exchanging the API key via an auth endpoint.
 */
export async function GET() {
  const apiKey = process.env.TRIPLEWHALE_API_KEY;
  const shopId = process.env.TRIPLEWHALE_SHOP_ID;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "TRIPLEWHALE_API_KEY not set" }, { status: 400 });
  }

  const baseUrl = "https://api.triplewhale.com/api/v2";

  const tests: { name: string; url: string; method: string; headers: Record<string, string>; body?: any }[] = [
    // Common auth exchange patterns
    { name: "auth-api-keys-exchange", url: `${baseUrl}/auth/api-keys/exchange`, method: "POST", headers: { "Content-Type": "application/json" }, body: { apiKey } },
    { name: "auth-token", url: `${baseUrl}/auth/token`, method: "POST", headers: { "Content-Type": "application/json" }, body: { api_key: apiKey, shopDomain: shopId } },
    { name: "auth-login", url: `${baseUrl}/auth/login`, method: "POST", headers: { "Content-Type": "application/json" }, body: { apiKey, shopDomain: shopId } },
    { name: "auth-oauth-token", url: `${baseUrl}/oauth/token`, method: "POST", headers: { "Content-Type": "application/json" }, body: { grant_type: "api_key", api_key: apiKey } },
    { name: "auth-service-token", url: `${baseUrl}/users/get-token`, method: "POST", headers: { "x-api-key": apiKey, "Content-Type": "application/json" }, body: { shopDomain: shopId } },
    { name: "auth-api-key-token", url: `${baseUrl}/auth/api-key-to-token`, method: "POST", headers: { "Content-Type": "application/json" }, body: { apiKey } },
    { name: "service-token", url: `${baseUrl}/willy/get-service-token`, method: "POST", headers: { "x-api-key": apiKey, "Content-Type": "application/json" }, body: { shopId } },
    { name: "signin", url: `${baseUrl}/signin`, method: "POST", headers: { "Content-Type": "application/json" }, body: { apiKey } },
    // Try "chat" endpoint too since TW has the Willy AI
    { name: "willy-answer", url: `${baseUrl}/willy/answer-nlq-question`, method: "POST", headers: { "x-api-key": apiKey, "Content-Type": "application/json" }, body: { shopId, question: "What is my ROAS today?" } },
    { name: "willy-generate", url: `${baseUrl}/willy/generate`, method: "POST", headers: { "x-api-key": apiKey, "Content-Type": "application/json" }, body: { shopId, question: "ROAS" } },
    // Different base
    { name: "v2-sonar-get-sales-attribution", url: `${baseUrl}/sonar/get-sales-attribution-by-order`, method: "POST", headers: { "x-api-key": apiKey, "Content-Type": "application/json" }, body: { shopDomain: shopId, startDate: "2026-04-01", endDate: "2026-04-14" } },
  ];

  const results: any[] = [];
  await Promise.all(
    tests.map(async (t) => {
      try {
        const res = await fetch(t.url, {
          method: t.method,
          headers: t.headers,
          body: t.body ? JSON.stringify(t.body) : undefined,
        });
        const text = await res.text();
        results.push({
          name: t.name,
          url: t.url,
          status: res.status,
          snippet: text.slice(0, 200),
        });
      } catch (e: any) {
        results.push({ name: t.name, url: t.url, error: e?.message });
      }
    }),
  );

  // Sort 2xx first, then 3xx, then rest
  results.sort((a, b) => {
    const sa = a.status ?? 9999;
    const sb = b.status ?? 9999;
    if (sa < 400 && sb >= 400) return -1;
    if (sa >= 400 && sb < 400) return 1;
    return sa - sb;
  });

  return NextResponse.json({ shopId, results });
}
