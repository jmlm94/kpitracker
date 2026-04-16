import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const SCOPES = "read_orders,read_products,read_inventory,read_fulfillments,read_analytics";

/**
 * Starts the Shopify OAuth install flow for a Partners / dev-dashboard app.
 *
 * Body: { shop: string, clientId: string, clientSecret: string }
 *   shop          — "carbinox.myshopify.com"
 *   clientId      — the app's Client ID from partners/dev dashboard
 *   clientSecret  — the app's Client Secret
 *
 * Response: { installUrl: string }
 * Side effects: stashes the OAuth state + clientSecret in an httpOnly
 * cookie (10 min TTL) so /api/shopify/callback can complete the handshake
 * without re-asking the client for the secret.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const shop = (body.shop || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  const clientId = (body.clientId || "").trim();
  const clientSecret = (body.clientSecret || "").trim();

  if (!shop || !clientId || !clientSecret) {
    return NextResponse.json(
      { ok: false, error: "Missing shop, clientId, or clientSecret." },
      { status: 400 },
    );
  }
  if (!/\.myshopify\.com$/i.test(shop)) {
    return NextResponse.json(
      { ok: false, error: `Shop must end in .myshopify.com (got "${shop}")` },
      { status: 400 },
    );
  }

  // Build the absolute callback URL. Order of preference:
  //   1. SHOPIFY_REDIRECT_URI env var (explicit override for stable URL)
  //   2. NEXT_PUBLIC_APP_URL env var
  //   3. Vercel's forwarded host headers
  //   4. req.url
  let redirectUri = process.env.SHOPIFY_REDIRECT_URI;
  if (!redirectUri) {
    const baseFromEnv = process.env.NEXT_PUBLIC_APP_URL;
    if (baseFromEnv) {
      redirectUri = `${baseFromEnv.replace(/\/$/, "")}/api/shopify/callback`;
    } else {
      const host =
        req.headers.get("x-forwarded-host") ||
        req.headers.get("host") ||
        new URL(req.url).host;
      const proto = req.headers.get("x-forwarded-proto") || "https";
      redirectUri = `${proto}://${host}/api/shopify/callback`;
    }
  }

  // Random nonce for CSRF protection (and to link this install to the cookie)
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);

  const installUrl =
    `https://${shop}/admin/oauth/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
      state: nonce,
      "grant_options[]": "",
    }).toString();

  // Stash client_id + client_secret + state in a cookie so the callback can
  // finish the handshake without receiving the secret again from the client.
  // httpOnly so browser-side JS can't read it; SameSite=Lax so it survives
  // the Shopify → /callback redirect.
  const payload = JSON.stringify({
    state: nonce,
    clientId,
    clientSecret,
    shop,
  });
  cookies().set("shopify_oauth", payload, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return NextResponse.json({ ok: true, installUrl, redirectUri });
}
