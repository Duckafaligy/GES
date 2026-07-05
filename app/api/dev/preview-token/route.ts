import { NextRequest, NextResponse } from "next/server";
import { isDev } from "@/lib/devAuth";
import { findClientBySlug } from "@/lib/clients";
import { signToken, PREVIEW_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

// Dev-only: mint a preview token for any client so the dashboard can show a live
// thumbnail (and the dev can view a static preview without the client's code).
export async function GET(req: NextRequest) {
  if (!isDev(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });

  const client = await findClientBySlug(slug);
  if (!client) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const token = signToken("preview", slug, PREVIEW_TTL_MS);
  return NextResponse.json({ token, url: `/raw/${token}` });
}
