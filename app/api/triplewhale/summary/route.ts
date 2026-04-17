import { NextResponse } from "next/server";
import { fetchTWSummary } from "@/lib/connectors/triplewhale";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { credentials?: Record<string, string> } = {};
  try {
    body = await req.json();
  } catch {}
  const summary = await fetchTWSummary(body.credentials);
  return NextResponse.json(summary);
}
