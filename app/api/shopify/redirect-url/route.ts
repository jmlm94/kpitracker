import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Returns the redirect_uri that this deployment will send to Shopify so
 * the user can whitelist the exact matching string in the Shopify dev
 * dashboard.
 */
export async function GET(req: Request) {
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
  return NextResponse.json({ redirectUri });
}
