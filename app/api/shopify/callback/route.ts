import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * OAuth callback from Shopify. Shopify redirects here with ?code=...&shop=...&state=...
 * after the user approves the install. We exchange the code for a real
 * Admin API access token, then redirect back to /integrations with the
 * token + shop as query params so the browser can stash them in localStorage.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const shop = url.searchParams.get("shop");
  const state = url.searchParams.get("state");
  const origin = url.origin;

  function errorRedirect(message: string) {
    const out = new URL("/integrations", origin);
    out.searchParams.set("shopify_error", message);
    return NextResponse.redirect(out);
  }

  if (!code || !shop || !state) {
    return errorRedirect("Missing code, shop, or state from Shopify callback.");
  }
  if (!/\.myshopify\.com$/i.test(shop)) {
    return errorRedirect(`Unexpected shop parameter: ${shop}`);
  }

  const cookie = cookies().get("shopify_oauth")?.value;
  if (!cookie) {
    return errorRedirect(
      "OAuth cookie missing or expired — start the install again from the Integrations page.",
    );
  }
  let stash: { state: string; clientId: string; clientSecret: string; shop: string };
  try {
    stash = JSON.parse(cookie);
  } catch {
    return errorRedirect("OAuth cookie corrupt — start the install again.");
  }
  if (stash.state !== state) {
    return errorRedirect("State mismatch — possible CSRF or stale install.");
  }

  // Exchange the code for an access token
  try {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: stash.clientId,
        client_secret: stash.clientSecret,
        code,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return errorRedirect(
        `Shopify refused the token exchange (${res.status}): ${text.slice(0, 200)}`,
      );
    }
    const data = (await res.json()) as { access_token?: string; scope?: string };
    const accessToken = data.access_token;
    if (!accessToken) {
      return errorRedirect("No access_token in Shopify response.");
    }

    // Clear the cookie so it can't be reused
    cookies().set("shopify_oauth", "", { path: "/", maxAge: 0 });

    const out = new URL("/integrations", origin);
    out.searchParams.set("shopify_installed", "1");
    out.searchParams.set("shop", shop);
    out.searchParams.set("token", accessToken);
    if (data.scope) out.searchParams.set("scope", data.scope);
    return NextResponse.redirect(out);
  } catch (err: any) {
    return errorRedirect(
      `Network/token exchange error: ${err?.message || "Unknown"}`,
    );
  }
}
