import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Reports which integration credentials are configured via Vercel env vars.
 * Never exposes the actual keys — only true/false per provider + which env
 * vars are present so the UI can tell the user what to set.
 */
export async function GET() {
  function check(vars: string[]) {
    const set = vars.filter((v) => !!process.env[v]);
    return {
      envReady: set.length === vars.length,
      envVarsSet: set,
      envVarsMissing: vars.filter((v) => !process.env[v]),
    };
  }

  return NextResponse.json({
    shopify: check(["SHOPIFY_SHOP", "SHOPIFY_ADMIN_TOKEN"]),
    triplewhale: check(["TRIPLEWHALE_API_KEY", "TRIPLEWHALE_SHOP_ID"]),
    klaviyo: check(["KLAVIYO_PRIVATE_KEY"]),
    postscript: check(["POSTSCRIPT_API_KEY"]),
    zendesk: check(["ZENDESK_SUBDOMAIN", "ZENDESK_EMAIL", "ZENDESK_API_TOKEN"]),
    gsheets: check(["GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"]),
  });
}
