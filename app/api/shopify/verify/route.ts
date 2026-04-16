import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_VERSION = "2024-10";

/**
 * Verifies a Shopify Admin API access token by issuing the simplest possible
 * GraphQL query (the `shop` object). Returns rich diagnostics on failure so
 * the user knows exactly what to fix.
 *
 * Body: { shop: string, token: string }
 */
export async function POST(req: Request) {
  let body: { shop?: string; token?: string } = {};
  try {
    body = await req.json();
  } catch {}

  const shop = (body.shop || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  const token = (body.token || "").trim();

  // Client-side validation
  const problems: string[] = [];
  if (!shop) problems.push("Missing shop domain.");
  if (!token) problems.push("Missing access token.");
  if (shop && !/\.myshopify\.com$/i.test(shop)) {
    problems.push(
      `Shop domain should end in .myshopify.com (got "${shop}"). Use your *.myshopify.com domain, not your custom storefront domain.`,
    );
  }
  if (token && !/^shpat_/.test(token)) {
    problems.push(
      `Token should start with "shpat_" — it looks like you pasted something else. You may have copied the "API key" or "API secret key" instead of the "Admin API access token".`,
    );
  }
  if (problems.length > 0) {
    return NextResponse.json({ ok: false, error: problems.join(" ") }, { status: 400 });
  }

  // Try a minimal GraphQL query: { shop { name currencyCode myshopifyDomain } }
  const url = `https://${shop}/admin/api/${API_VERSION}/graphql.json`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `{ shop { name email myshopifyDomain primaryDomain { host } currencyCode plan { displayName } } }`,
      }),
    });

    if (res.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Shopify rejected the token (401). Most common causes: (1) you pasted the API key or API secret instead of the Admin API access token, (2) the app was never installed, or (3) the token was regenerated and this one is stale. Create a new Admin API access token and try again.",
        },
        { status: 401 },
      );
    }
    if (res.status === 404) {
      return NextResponse.json(
        {
          ok: false,
          error: `Shop "${shop}" not found (404). Double-check the exact *.myshopify.com domain in Shopify admin → Settings → Domains.`,
        },
        { status: 404 },
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Shopify returned ${res.status}: ${text.slice(0, 200)}` },
        { status: res.status },
      );
    }

    const json = await res.json();
    if (json.errors?.length) {
      return NextResponse.json(
        { ok: false, error: `GraphQL error: ${json.errors[0].message}` },
        { status: 400 },
      );
    }

    const data = json.data?.shop;
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Unexpected response — no shop data returned." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      shop: {
        name: data.name,
        email: data.email,
        myshopifyDomain: data.myshopifyDomain,
        primaryDomain: data.primaryDomain?.host,
        currency: data.currencyCode,
        plan: data.plan?.displayName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: `Network or fetch error: ${err?.message || "Unknown"}` },
      { status: 500 },
    );
  }
}
