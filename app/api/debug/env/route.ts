import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Minimal debug endpoint. Reports which expected environment variables are
 * present on the server WITHOUT exposing their values. Use this to figure
 * out if Vercel's env var config is actually reaching the running code.
 */
export async function GET() {
  const vars = [
    "SHOPIFY_SHOP",
    "SHOPIFY_ADMIN_TOKEN",
    "TRIPLEWHALE_API_KEY",
    "TRIPLEWHALE_SHOP_ID",
    "KLAVIYO_PRIVATE_KEY",
    "POSTSCRIPT_API_KEY",
    "ZENDESK_SUBDOMAIN",
    "ZENDESK_EMAIL",
    "ZENDESK_API_TOKEN",
    "GOOGLE_SHEETS_CLIENT_EMAIL",
    "GOOGLE_SHEETS_PRIVATE_KEY",
    "VERCEL",
    "VERCEL_ENV",
    "VERCEL_URL",
    "VERCEL_GIT_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_REF",
  ];
  const result: Record<string, { present: boolean; length?: number; preview?: string }> = {};
  for (const v of vars) {
    const val = process.env[v];
    if (val) {
      // Safe preview: show VERCEL_* plain (they're not secret), mask the rest
      const isSafe = v.startsWith("VERCEL");
      result[v] = {
        present: true,
        length: val.length,
        preview: isSafe ? val : undefined,
      };
    } else {
      result[v] = { present: false };
    }
  }
  return NextResponse.json(result);
}
